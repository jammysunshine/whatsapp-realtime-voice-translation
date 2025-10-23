// services/google/speech-to-text.js
const speech = require('@google-cloud/speech');
const GoogleCloudConfig = require('../../config/google-cloud');
const { logger, logProcessingTime } = require('../../utils/helpers/performance-monitor');
const AudioProcessor = require('../../utils/helpers/audio-processing');

class SpeechToTextService {
  constructor() {
    const configOptions = GoogleCloudConfig.getSpeechToTextConfig();
    this.client = new speech.SpeechClient(configOptions);
  }

  /**
   * Convert audio to text using Google Cloud Speech-to-Text
   * @param {Buffer} audioBuffer - The audio buffer to transcribe
   * @param {string} languageCode - Language code (e.g., 'en-US', 'es-ES')
   * @returns {Promise<Object>} - Transcription result
   */
  async transcribeAudio(audioBuffer, languageCode = 'en-US') {
    try {
      const startTime = Date.now();
      logger.info(`Starting transcription for audio of size: ${audioBuffer.length} bytes`);
      
      // Preprocess the audio for optimal STT performance
      const processedBuffer = await AudioProcessor.preprocessForSTT(audioBuffer);
      
      // Prepare the audio content in the required format
      const audio = {
        content: processedBuffer.toString('base64'),
      };

      // Configure the request
      // Note: For WEBM/OPUS audio from browsers, we should either:
      // 1. Let Google Cloud detect the sample rate automatically (omit sampleRateHertz)
      // 2. Or convert the audio to LINEAR16 at 16kHz first
      const config = {
        encoding: 'OGG_OPUS', // WhatsApp sends audio as OGG/OPUS
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true,
        // Explicitly handle sample rate for OPUS format
        // For OGG_OPUS files, we can either:
        // 1. Let Google Cloud auto-detect the sample rate by omitting SampleRateHertz (but this sometimes fails)
        // 2. Or explicitly set a standard rate like 16000Hz which works well for most OPUS audio
        // Let's try option 2 as it's more reliable
        sampleRateHertz: 16000, // Standard rate that works well with OPUS audio
      };

      const request = {
        audio: audio,
        config: config,
      };

      let response;
      let transcription;
      
      try {
        // Try synchronous recognition first
        [response] = await this.client.recognize(request);
        transcription = response.results
          .map(result => result.alternatives[0].transcript)
          .join('\n');
      } catch (syncError) {
        // If sync recognition fails because audio is too long, use long-running operation
        if (syncError.message.includes('Sync input too long')) {
          logger.info('Audio too long for sync recognition, using long-running operation');
          response = await this.longRunningRecognize(audio, config);
          transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
        } else {
          throw syncError; // Re-throw if it's a different error
        }
      }

      // Calculate and log processing time
      const processingTime = Date.now() - startTime;
      logProcessingTime('stt', processingTime);
      
      logger.info(`Transcription completed in ${processingTime}ms. Length: ${transcription.length} chars`);
      
      // Return structured result
      return {
        transcription: transcription,
        languageCode: languageCode,
        confidence: response.results[0]?.alternatives[0]?.confidence || null,
        processingTime: processingTime,
        wordCount: transcription.split(/\s+/).length
      };
    } catch (error) {
      logger.error('Speech-to-Text error:', error);
      throw new Error(`STT Service Error: ${error.message}`);
    }
  }

  /**
   * Perform long-running recognition for longer audio files
   * @param {Object} audio - Audio object with content
   * @param {Object} config - Recognition configuration
   * @returns {Promise<Object>} - Recognition response
   */
  async longRunningRecognize(audio, config) {
    // For OGG_OPUS format, make sure we're using the correct configuration
    const finalConfig = {
      ...config,
      encoding: config.encoding || 'OGG_OPUS', // Ensure correct encoding
      // Explicitly set sample rate for OPUS format
      sampleRateHertz: config.sampleRateHertz || 16000, // Standard rate that works well with OPUS audio
    };
    
    const request = {
      audio: audio,
      config: finalConfig,
    };

    // Perform long-running recognition
    const [operation] = await this.client.longRunningRecognize(request);
    const [response] = await operation.promise();
    
    return response;
  }

  /**
   * Stream audio for real-time transcription
   * @param {ReadableStream} audioStream - The audio stream to transcribe
   * @param {string} languageCode - Language code for the audio
   * @param {Function} onResult - Callback for each transcription result
   * @returns {Promise} - Resolves when streaming is complete
   */
  async streamTranscribe(audioStream, languageCode = 'en-US', onResult) {
    return new Promise((resolve, reject) => {
      try {
        const request = {
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: languageCode,
            enableAutomaticPunctuation: true,
            interimResults: true, // Get real-time results
          },
          interimResults: true,
        };

        // Create a stream for the streaming recognition
        const recognizeStream = this.client.streamingRecognize(request)
          .on('error', (err) => {
            logger.error('Streaming recognition error:', err);
            reject(err);
          })
          .on('data', (data) => {
            // Process the streaming results
            if (data.results && data.results[0] && data.results[0].alternatives[0]) {
              const result = {
                transcription: data.results[0].alternatives[0].transcript,
                isFinal: data.results[0].isFinal,
                confidence: data.results[0].alternatives[0].confidence
              };
              
              // Call the callback with the result
              onResult(result);
            }
          })
          .on('end', () => {
            logger.info('Streaming transcription ended');
            resolve();
          });

        // Pipe the audio stream to the recognition stream
        audioStream.pipe(recognizeStream);
      } catch (error) {
        logger.error('Error setting up streaming transcription:', error);
        reject(error);
      }
    });
  }

  /**
   * Detect language of audio and then transcribe
   * @param {Buffer} audioBuffer - The audio buffer to process
   * @returns {Promise<Object>} - Transcription result with detected language
   */
  async transcribeWithLanguageDetection(audioBuffer) {
    try {
      logger.info('Starting transcription with language detection');
      
      // For language detection, we'll use a short sample of the audio
      // In a real implementation, we might use Google's language detection features
      // or a fallback language detection method
      
      // For now, we'll try multiple common languages and see which gives the best result
      const commonLanguages = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'hi-IN', 'ar-SA', 'pt-BR'];
      let bestResult = null;
      let bestConfidence = 0;
      
      // Try transcribing with different languages
      for (const lang of commonLanguages) {
        try {
          const result = await this.transcribeAudio(audioBuffer, lang);
          
          if (result.confidence > bestConfidence) {
            bestConfidence = result.confidence;
            bestResult = { ...result, detectedLanguage: lang };
          }
          
          // If we have a high confidence result, we can return early
          if (bestConfidence > 0.8) {
            break;
          }
        } catch (e) {
          logger.warn(`Language ${lang} failed:`, e.message);
          continue; // Try the next language
        }
      }
      
      if (bestResult) {
        logger.info(`Language detected: ${bestResult.detectedLanguage} with confidence: ${bestConfidence}`);
        return bestResult;
      } else {
        // Fallback: use English
        logger.warn('Could not detect language, using English as fallback');
        return await this.transcribeAudio(audioBuffer, 'en-US');
      }
    } catch (error) {
      logger.error('Error in transcription with language detection:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const speechToTextService = new SpeechToTextService();
module.exports = speechToTextService;