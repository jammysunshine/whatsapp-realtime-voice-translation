// services/google/translation.js
const { Translate } = require('@google-cloud/translate').v2;
const GoogleCloudConfig = require('../../config/google-cloud');
const { logger, logProcessingTime } = require('../../utils/helpers/performance-monitor');
const languageDetector = require('../../utils/helpers/language-detection');

class TranslationService {
  constructor() {
    const configOptions = GoogleCloudConfig.getTranslationConfig();
    this.client = new Translate(configOptions);
  }

  /**
   * Translate text from source language to target language
   * @param {string} text - The text to translate
   * @param {string} targetLanguage - Target language code (e.g., 'en', 'es', 'fr')
   * @param {string} sourceLanguage - Source language code (optional, auto-detect if not provided)
   * @returns {Promise<Object>} - Translation result
   */
  async translateText(text, targetLanguage, sourceLanguage = null) {
    try {
      const startTime = Date.now();
      logger.info(`Starting translation: ${sourceLanguage || 'auto'} -> ${targetLanguage}, text length: ${text.length}`);
      
      // Prepare translation request
      const options = {
        from: sourceLanguage,
        to: targetLanguage,
        format: 'text', // Can be 'html' or 'text'
      };
      
      // Perform the translation
      const [translationResult] = await this.client.translate(text, options);
      
      // Calculate and log processing time
      const processingTime = Date.now() - startTime;
      logProcessingTime('translation', processingTime);
      
      logger.info(`Translation completed in ${processingTime}ms`);
      
      // Return structured result
      return {
        originalText: text,
        translatedText: translationResult,
        sourceLanguage: sourceLanguage || this.detectLanguageFromText(text),
        targetLanguage: targetLanguage,
        detectedLanguage: !sourceLanguage,
        processingTime: processingTime
      };
    } catch (error) {
      logger.error('Translation error:', error);
      throw new Error(`Translation Service Error: ${error.message}`);
    }
  }

  /**
   * Translate text with automatic source language detection
   * @param {string} text - The text to translate
   * @param {string} targetLanguage - Target language code
   * @returns {Promise<Object>} - Translation result with detected source language
   */
  async translateWithSourceDetection(text, targetLanguage) {
    try {
      logger.info('Starting translation with source language detection');
      
      // Detect the source language
      const detectionResult = await languageDetector.detectLanguageWithFallback(text);
      const sourceLanguage = detectionResult.language;
      
      logger.info(`Detected source language: ${sourceLanguage} with confidence: ${detectionResult.confidence || 'N/A'}`);
      
      // Perform translation
      return await this.translateText(text, targetLanguage, sourceLanguage);
    } catch (error) {
      logger.error('Error in translation with source detection:', error);
      throw error;
    }
  }

  /**
   * Translate multiple texts in a batch (more efficient for multiple small texts)
   * @param {Array<string>} texts - Array of texts to translate
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceLanguage - Source language code (optional)
   * @returns {Promise<Array>} - Array of translation results
   */
  async batchTranslate(texts, targetLanguage, sourceLanguage = null) {
    try {
      const startTime = Date.now();
      logger.info(`Starting batch translation of ${texts.length} texts to ${targetLanguage}`);
      
      // Perform batch translation
      const [translations] = await this.client.translate(texts, {
        from: sourceLanguage,
        to: targetLanguage
      });
      
      // Calculate and log processing time
      const processingTime = Date.now() - startTime;
      logProcessingTime('batch_translation', processingTime);
      
      logger.info(`Batch translation completed in ${processingTime}ms`);
      
      // Return structured results
      return texts.map((text, index) => ({
        originalText: text,
        translatedText: translations[index],
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        processingTime: processingTime / texts.length // Average per text
      }));
    } catch (error) {
      logger.error('Batch translation error:', error);
      throw new Error(`Batch Translation Service Error: ${error.message}`);
    }
  }

  /**
   * Get supported languages for translation
   * @returns {Promise<Array>} - List of supported language codes
   */
  async getSupportedLanguages(targetLanguage = 'en') {
    try {
      const [languages] = await this.client.getLanguages({ target: targetLanguage });
      
      return languages.map(lang => ({
        code: lang.code,
        name: lang.name
      }));
    } catch (error) {
      logger.error('Error getting supported languages:', error);
      throw new Error(`Get Languages Service Error: ${error.message}`);
    }
  }

  /**
   * Detect language from text (fallback method if language detection service fails)
   * @param {string} text - The text to analyze
   * @returns {string} - Detected language code
   */
  detectLanguageFromText(text) {
    // This is a simple heuristic-based detection as fallback
    // In a real implementation, we would rely more on the languageDetection module
    const lowerText = text.toLowerCase();
    
    // Common words for different languages
    const commonWords = {
      'en': ['the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this'],
      'es': ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no'],
      'fr': ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
      'de': ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'],
      'it': ['il', 'di', 'che', 'e', 'la', 'a', 'per', 'un', 'in', 'è'],
      'pt': ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para'],
      'ru': ['и', 'в', 'не', 'он', 'на', 'я', 'что', 'они'],
      'ar': ['و', 'في', 'على', 'أن', 'لا', 'هذا', 'هذه'],
      'hi': ['के', 'है', 'और', 'में', 'हैं', 'हम', 'तक'],
      'zh': ['是', '在', '了', '有', '和', '人', '这'],
      'ja': ['は', 'を', 'に', 'が', 'の', 'て', 'で', 'と']
    };
    
    let maxMatches = 0;
    let detectedLang = 'en'; // Default to English
    
    for (const [lang, words] of Object.entries(commonWords)) {
      let matches = 0;
      for (const word of words) {
        if (lowerText.includes(word)) {
          matches++;
        }
      }
      
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedLang = lang;
      }
    }
    
    return detectedLang;
  }

  /**
   * Translate text with context awareness for better accuracy
   * @param {string} text - The text to translate
   * @param {string} targetLanguage - Target language code
   * @param {string} context - Context of the conversation (optional)
   * @param {string} sourceLanguage - Source language code (optional)
   * @returns {Promise<Object>} - Translation result with context
   */
  async translateWithContext(text, targetLanguage, context = null, sourceLanguage = null) {
    try {
      logger.info(`Starting translation with context: ${!!context}`);
      
      // If we have context, we can use it to improve translation accuracy
      if (context) {
        // For now, we'll use the basic translation method
        // In a more advanced implementation, we might use context for disambiguation
        const result = await this.translateText(text, targetLanguage, sourceLanguage);
        result.context = context;
        return result;
      } else {
        // If no context provided, use the standard method
        return await this.translateText(text, targetLanguage, sourceLanguage);
      }
    } catch (error) {
      logger.error('Translation with context error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const translationService = new TranslationService();
module.exports = translationService;