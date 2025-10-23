// utils/helpers/audio-processing-pipeline.js
const speechToTextService = require('../../services/google/speech-to-text');
const translationService = require('../../services/google/translation');
const textToSpeechService = require('../../services/google/text-to-speech');
const AudioProcessor = require('./audio-processing');
const languageDetector = require('./language-detection');
const { logger, logProcessingTime, incrementTranslation } = require('./performance-monitor');
const translationQueue = require('../processing/translation-queue');

class AudioProcessingPipeline {
  constructor() {
    this.pipelineSteps = [];
  }

  /**
   * Complete audio processing pipeline: Speech-to-Text -> Translation -> Text-to-Speech
   * @param {Buffer} audioBuffer - The input audio buffer
   * @param {string} targetLanguage - Target language for translation
   * @param {string} sourceLanguage - Source language (optional, auto-detect if not provided)
   * @returns {Promise<Object>} - Complete processing result
   */
  async processAudioTranslation(audioBuffer, targetLanguage, sourceLanguage = null) {
    try {
      const startTime = Date.now();
      logger.info(`Starting audio translation pipeline: ${sourceLanguage || 'auto'} -> ${targetLanguage}`);
      
      // Step 1: Preprocess audio for optimal STT performance
      logger.info('Step 1: Preprocessing audio');
      const processedAudio = await AudioProcessor.preprocessForSTT(audioBuffer);
      
      // Step 2: Convert speech to text
      logger.info('Step 2: Converting speech to text');
      let transcriptionResult;
      
      if (sourceLanguage) {
        transcriptionResult = await speechToTextService.transcribeAudio(processedAudio, this.convertToBCP47(sourceLanguage));
      } else {
        transcriptionResult = await speechToTextService.transcribeWithLanguageDetection(processedAudio);
        sourceLanguage = transcriptionResult.detectedLanguage || transcriptionResult.languageCode.split('-')[0];
      }
      
      const transcribedText = transcriptionResult.transcription;
      logger.info(`Transcribed text: ${transcribedText.substring(0, 50)}...`);
      
      // Step 3: Translate the text
      logger.info(`Step 3: Translating text to ${targetLanguage}`);
      const translationResult = await translationService.translateText(
        transcribedText, 
        targetLanguage, 
        sourceLanguage
      );
      
      const translatedText = translationResult.translatedText;
      logger.info(`Translated text: ${translatedText.substring(0, 50)}...`);
      
      // Step 4: Convert translated text back to speech
      logger.info(`Step 4: Converting translated text to speech`);
      const ttsResult = await textToSpeechService.synthesizeText(
        translatedText, 
        this.convertToBCP47(targetLanguage)
      );
      
      // Calculate and log total processing time
      const totalProcessingTime = Date.now() - startTime;
      logProcessingTime('end-to-end-pipeline', totalProcessingTime);
      
      logger.info(`Audio translation pipeline completed in ${totalProcessingTime}ms`);
      
      // Increment translation counter
      incrementTranslation();
      
      // Return complete result
      return {
        originalAudio: audioBuffer,
        processedAudio: processedAudio,
        transcription: {
          text: transcribedText,
          language: sourceLanguage,
          confidence: transcriptionResult.confidence,
          processingTime: transcriptionResult.processingTime
        },
        translation: {
          originalText: translationResult.originalText,
          translatedText: translatedText,
          sourceLanguage: translationResult.sourceLanguage,
          targetLanguage: translationResult.targetLanguage,
          processingTime: translationResult.processingTime
        },
        tts: {
          audioContent: ttsResult.audioContent,
          language: targetLanguage,
          processingTime: ttsResult.processingTime
        },
        totalProcessingTime: totalProcessingTime,
        pipelineCompleted: true
      };
    } catch (error) {
      logger.error('Audio processing pipeline error:', error);
      throw new Error(`Audio Processing Pipeline Error: ${error.message}`);
    }
  }

  /**
   * Process audio using the queue system for better resource management
   * @param {Buffer} audioBuffer - The input audio buffer
   * @param {string} targetLanguage - Target language for translation
   * @param {string} sourceLanguage - Source language (optional)
   * @returns {Promise<Object>} - Processing result via queue
   */
  async processAudioViaQueue(audioBuffer, targetLanguage, sourceLanguage = null) {
    try {
      logger.info(`Adding audio processing job to queue: ${sourceLanguage || 'auto'} -> ${targetLanguage}`);
      
      // Add the job to the queue
      const job = await translationQueue.addAudioJob(audioBuffer, 'buffer');
      
      // Wait for the job to complete
      const result = await job.finished();
      
      // The result from the queue contains only transcription
      // Now we need to translate and convert to speech
      
      const transcribedText = result.transcribedText;
      logger.info(`Got transcription from queue: ${transcribedText.substring(0, 50)}...`);
      
      // Perform translation
      const translationResult = await translationService.translateText(
        transcribedText, 
        targetLanguage, 
        sourceLanguage
      );
      
      // Convert to speech
      const ttsResult = await textToSpeechService.synthesizeText(
        translationResult.translatedText, 
        this.convertToBCP47(targetLanguage)
      );
      
      return {
        transcription: {
          text: transcribedText,
          language: sourceLanguage || 'detected',
        },
        translation: translationResult,
        tts: ttsResult
      };
    } catch (error) {
      logger.error('Queue-based audio processing error:', error);
      throw new Error(`Queue Audio Processing Error: ${error.message}`);
    }
  }

  /**
   * Real-time streaming audio processing pipeline
   * @param {ReadableStream} audioStream - The input audio stream
   * @param {string} targetLanguage - Target language for translation
   * @param {Function} onPartialResult - Callback for partial results during streaming
   * @returns {Promise<Object>} - Final processing result
   */
  async processStreamingAudio(audioStream, targetLanguage, onPartialResult) {
    try {
      logger.info(`Starting streaming audio processing: -> ${targetLanguage}`);
      
      // Array to hold all transcribed text parts
      const allTranscriptions = [];
      
      // Process the audio stream in real-time
      await speechToTextService.streamTranscribe(
        audioStream, 
        this.convertToBCP47(targetLanguage), 
        async (result) => {
          logger.info(`Streaming result: ${result.transcription.substring(0, 30)}...`);
          
          // If this is a final result, translate and convert to speech
          if (result.isFinal) {
            allTranscriptions.push(result.transcription);
            
            // Translate the final segment
            const translationResult = await translationService.translateText(
              result.transcription, 
              targetLanguage
            );
            
            // Convert to speech
            const ttsResult = await textToSpeechService.synthesizeText(
              translationResult.translatedText, 
              this.convertToBCP47(targetLanguage)
            );
            
            // Call the callback with the complete segment result
            if (onPartialResult) {
              onPartialResult({
                original: result.transcription,
                translated: translationResult.translatedText,
                audio: ttsResult.audioContent,
                language: targetLanguage
              });
            }
          } else {
            // For interim results, just call the callback
            if (onPartialResult) {
              onPartialResult({
                original: result.transcription,
                isInterim: true,
                confidence: result.confidence
              });
            }
          }
        }
      );
      
      // Combine all transcriptions for final result
      const fullTranscription = allTranscriptions.join(' ');
      
      return {
        fullTranscription: fullTranscription,
        segments: allTranscriptions,
        targetLanguage: targetLanguage,
        streamingCompleted: true
      };
    } catch (error) {
      logger.error('Streaming audio processing error:', error);
      throw new Error(`Streaming Audio Processing Error: ${error.message}`);
    }
  }

  /**
   * Process audio with noise reduction and quality enhancement
   * @param {Buffer} audioBuffer - The input audio buffer
   * @param {string} targetLanguage - Target language for translation
   * @returns {Promise<Object>} - Processing result with enhanced quality
   */
  async processAudioWithEnhancement(audioBuffer, targetLanguage) {
    try {
      logger.info(`Starting enhanced audio processing: -> ${targetLanguage}`);
      
      // Step 1: Apply noise reduction and normalization
      logger.info('Applying audio enhancements');
      let enhancedAudio = await AudioProcessor.reduceNoise(audioBuffer);
      enhancedAudio = await AudioProcessor.normalizeVolume(enhancedAudio);
      
      // Step 2: Detect language automatically
      logger.info('Detecting language from audio');
      const transcriptionResult = await speechToTextService.transcribeWithLanguageDetection(enhancedAudio);
      const sourceLanguage = transcriptionResult.detectedLanguage || transcriptionResult.languageCode.split('-')[0];
      
      // Step 3: Translate with context awareness
      logger.info(`Translating with context awareness: ${sourceLanguage} -> ${targetLanguage}`);
      const translationResult = await translationService.translateWithContext(
        transcriptionResult.transcription,
        targetLanguage,
        null, // No context provided in this case
        sourceLanguage
      );
      
      // Step 4: Convert to speech using enhanced settings
      logger.info('Converting to speech with enhanced quality');
      const ttsResult = await textToSpeechService.synthesizeTextEnhanced(
        translationResult.translatedText,
        this.convertToBCP47(targetLanguage),
        null,
        {
          audioEncoding: 'LINEAR16', // Higher quality
          speakingRate: 0.95, // Slightly slower for clarity
          pitch: 1.2    // Slightly higher pitch for better clarity
        }
      );
      
      return {
        originalAudio: audioBuffer,
        enhancedAudio: enhancedAudio,
        transcription: transcriptionResult,
        translation: translationResult,
        tts: ttsResult,
        enhancedProcessing: true
      };
    } catch (error) {
      logger.error('Enhanced audio processing error:', error);
      throw new Error(`Enhanced Audio Processing Error: ${error.message}`);
    }
  }

  /**
   * Convert language code to BCP-47 format required by Google APIs
   * @param {string} languageCode - Standard language code (e.g., 'en', 'es')
   * @returns {string} - BCP-47 format code (e.g., 'en-US', 'es-ES')
   */
  convertToBCP47(languageCode) {
    // Map simple language codes to BCP-47 format
    const bcp47Map = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'ar': 'ar-XA', // Arabic (Google's generic Arabic)
      'hi': 'hi-IN',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'tr': 'tr-TR'
    };
    
    return bcp47Map[languageCode] || `${languageCode}-${languageCode.toUpperCase()}`;
  }

  /**
   * Batch process multiple audio files
   * @param {Array<Buffer>} audioBuffers - Array of audio buffers to process
   * @param {string} targetLanguage - Target language for translation
   * @param {string} sourceLanguage - Source language (optional)
   * @returns {Promise<Array>} - Array of processing results
   */
  async batchProcessAudio(audioBuffers, targetLanguage, sourceLanguage = null) {
    try {
      logger.info(`Starting batch processing of ${audioBuffers.length} audio files`);
      
      const results = [];
      for (let i = 0; i < audioBuffers.length; i++) {
        logger.info(`Processing audio file ${i + 1} of ${audioBuffers.length}`);
        const result = await this.processAudioTranslation(audioBuffers[i], targetLanguage, sourceLanguage);
        results.push(result);
      }
      
      logger.info(`Batch processing completed for ${audioBuffers.length} files`);
      return results;
    } catch (error) {
      logger.error('Batch audio processing error:', error);
      throw new Error(`Batch Audio Processing Error: ${error.message}`);
    }
  }

  /**
   * Get processing statistics for monitoring
   * @returns {Promise<Object>} - Processing statistics
   */
  async getProcessingStats() {
    const queueStats = await translationQueue.getQueueStats();
    
    return {
      queueStats: queueStats,
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export a singleton instance
const audioProcessingPipeline = new AudioProcessingPipeline();
module.exports = audioProcessingPipeline;