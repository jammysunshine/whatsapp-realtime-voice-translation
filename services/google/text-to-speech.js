// services/google/text-to-speech.js
const textToSpeech = require('@google-cloud/text-to-speech');
const GoogleCloudConfig = require('../../config/google-cloud');
const { logger, logProcessingTime } = require('../../utils/helpers/performance-monitor');

class TextToSpeechService {
  constructor() {
    const configOptions = GoogleCloudConfig.getTextToSpeechConfig();
    this.client = new textToSpeech.TextToSpeechClient(configOptions);
  }

  /**
   * Convert text to speech using Google Cloud Text-to-Speech
   * @param {string} text - The text to synthesize
   * @param {string} languageCode - Language code (e.g., 'en-US', 'es-ES')
   * @param {string} voiceName - Specific voice name (optional, defaults to neutral)
   * @param {string} speakingRate - Speaking rate (0.25 to 4.0, default 1.0)
   * @returns {Promise<Object>} - Synthesized audio result
   */
  async synthesizeText(text, languageCode = 'en-US', voiceName = null, speakingRate = 1.0) {
    try {
      const startTime = Date.now();
      logger.info(`Starting text-to-speech synthesis for text of length: ${text.length}`);
      
      // Configure the voice
      const voice = {
        languageCode: languageCode,
        ssmlGender: 'NEUTRAL', // Can be 'MALE', 'FEMALE', or 'NEUTRAL'
      };
      
      // Use specific voice if provided
      if (voiceName) {
        voice.name = voiceName;
      }
      
      // Configure the audio
      const audioConfig = {
        audioEncoding: 'MP3', // Can be 'MP3', 'LINEAR16', etc.
        speakingRate: speakingRate,
        pitch: 0, // Default pitch
      };
      
      // Set up the request
      const request = {
        input: { text: text },
        voice: voice,
        audioConfig: audioConfig,
      };
      
      // Perform the synthesis
      const [response] = await this.client.synthesizeSpeech(request);
      
      // Calculate and log processing time
      const processingTime = Date.now() - startTime;
      logProcessingTime('tts', processingTime);
      
      logger.info(`Text-to-speech completed in ${processingTime}ms`);
      
      // Return structured result
      return {
        audioContent: response.audioContent,
        languageCode: languageCode,
        voiceName: voiceName,
        speakingRate: speakingRate,
        processingTime: processingTime,
        textLength: text.length
      };
    } catch (error) {
      logger.error('Text-to-Speech error:', error);
      throw new Error(`TTS Service Error: ${error.message}`);
    }
  }

  /**
   * Synthesize SSML (Speech Synthesis Markup Language) text
   * @param {string} ssml - The SSML markup to synthesize
   * @param {string} languageCode - Language code
   * @param {string} voiceName - Specific voice name
   * @returns {Promise<Object>} - Synthesized audio result
   */
  async synthesizeSsml(ssml, languageCode = 'en-US', voiceName = null) {
    try {
      const startTime = Date.now();
      logger.info(`Starting SSML synthesis for content of length: ${ssml.length}`);
      
      // Configure the voice
      const voice = {
        languageCode: languageCode,
        ssmlGender: 'NEUTRAL',
      };
      
      if (voiceName) {
        voice.name = voiceName;
      }
      
      // Configure the audio
      const audioConfig = {
        audioEncoding: 'MP3',
      };
      
      // Set up the request with SSML input
      const request = {
        input: { ssml: ssml },
        voice: voice,
        audioConfig: audioConfig,
      };
      
      // Perform the synthesis
      const [response] = await this.client.synthesizeSpeech(request);
      
      // Calculate and log processing time
      const processingTime = Date.now() - startTime;
      logProcessingTime('tts_ssml', processingTime);
      
      logger.info(`SSML synthesis completed in ${processingTime}ms`);
      
      return {
        audioContent: response.audioContent,
        languageCode: languageCode,
        voiceName: voiceName,
        processingTime: processingTime,
        textLength: ssml.length
      };
    } catch (error) {
      logger.error('SSML synthesis error:', error);
      throw new Error(`SSML TTS Service Error: ${error.message}`);
    }
  }

  /**
   * Get list of available voices for a language
   * @param {string} languageCode - Language code to filter voices
   * @returns {Promise<Array>} - List of available voices
   */
  async listVoices(languageCode = null) {
    try {
      const request = {};
      if (languageCode) {
        request.languageCode = languageCode;
      }
      
      const [response] = await this.client.listVoices(request);
      
      // Return formatted voice list
      return response.voices.map(voice => ({
        name: voice.name,
        ssmlGender: voice.ssmlGender,
        languageCodes: voice.languageCodes,
        naturalSampleRateHertz: voice.naturalSampleRateHertz
      }));
    } catch (error) {
      logger.error('Error listing voices:', error);
      throw new Error(`List Voices Service Error: ${error.message}`);
    }
  }

  /**
   * Synthesize text with enhanced quality settings
   * @param {string} text - The text to synthesize
   * @param {string} languageCode - Language code
   * @param {string} voiceName - Specific voice name
   * @param {Object} options - Additional options like speakingRate, pitch, etc.
   * @returns {Promise<Object>} - High-quality synthesized audio result
   */
  async synthesizeTextEnhanced(text, languageCode = 'en-US', voiceName = null, options = {}) {
    try {
      const startTime = Date.now();
      logger.info(`Starting enhanced text-to-speech synthesis`);
      
      // Configure the voice
      const voice = {
        languageCode: languageCode,
        ssmlGender: options.ssmlGender || 'NEUTRAL',
      };
      
      if (voiceName) {
        voice.name = voiceName;
      }
      
      // Configure the audio with enhanced settings
      const audioConfig = {
        audioEncoding: options.audioEncoding || 'LINEAR16', // Higher quality
        speakingRate: options.speakingRate || 1.0,
        pitch: options.pitch || 0,
        volumeGainDb: options.volumeGainDb || 0,
      };
      
      // Set up the request
      const request = {
        input: { text: text },
        voice: voice,
        audioConfig: audioConfig,
      };
      
      // Perform the synthesis
      const [response] = await this.client.synthesizeSpeech(request);
      
      // Calculate and log processing time
      const processingTime = Date.now() - startTime;
      logProcessingTime('tts_enhanced', processingTime);
      
      logger.info(`Enhanced TTS completed in ${processingTime}ms`);
      
      return {
        audioContent: response.audioContent,
        languageCode: languageCode,
        voiceName: voiceName,
        processingTime: processingTime,
        textLength: text.length,
        options: options
      };
    } catch (error) {
      logger.error('Enhanced TTS error:', error);
      throw new Error(`Enhanced TTS Service Error: ${error.message}`);
    }
  }

  /**
   * Convert synthesized audio to base64 string for web transmission
   * @param {string} text - The text to synthesize
   * @param {string} languageCode - Language code
   * @returns {Promise<string>} - Base64 encoded audio string
   */
  async synthesizeToBase64(text, languageCode = 'en-US') {
    try {
      const result = await this.synthesizeText(text, languageCode);
      return result.audioContent.toString('base64');
    } catch (error) {
      logger.error('Base64 conversion error:', error);
      throw new Error(`Base64 TTS Service Error: ${error.message}`);
    }
  }
}

// Create and export a singleton instance
const textToSpeechService = new TextToSpeechService();
module.exports = textToSpeechService;