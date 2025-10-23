// utils/helpers/language-detection.js
const { Translate } = require('@google-cloud/translate').v2;

class LanguageDetection {
  constructor() {
    // Initialize Google Translation client for language detection
    this.translateClient = new Translate();
  }

  /**
   * Detect the language of the given text
   * @param {string} text - The text to analyze
   * @returns {Promise<Object>} - Detected language information
   */
  async detectLanguage(text) {
    try {
      // Use Google Translation API to detect language
      const [detection] = await this.translateClient.detect(text);
      
      // If multiple detections are returned, use the first one
      const result = Array.isArray(detection) ? detection[0] : detection;
      
      return {
        language: result.language,
        confidence: result.confidence || null,
        inputText: text
      };
    } catch (error) {
      console.error('Language detection error:', error);
      throw error;
    }
  }

  /**
   * Detect language with fallback mechanism
   * @param {string} text - The text to analyze
   * @returns {Promise<Object>} - Detected language information
   */
  async detectLanguageWithFallback(text) {
    try {
      // Attempt primary language detection
      return await this.detectLanguage(text);
    } catch (primaryError) {
      // If primary detection fails, use a fallback method
      console.warn('Primary language detection failed, trying fallback method');
      
      // Fallback: simple heuristic-based detection for common languages
      const detectedLang = this.fallbackLanguageDetection(text);
      
      return {
        language: detectedLang,
        confidence: null, // Confidence not available for fallback
        inputText: text
      };
    }
  }

  /**
   * Simple fallback language detection based on character patterns and common words
   * @param {string} text - The text to analyze
   * @returns {string} - Detected language code (e.g., 'en', 'es', 'fr')
   */
  fallbackLanguageDetection(text) {
    // Convert to lowercase for analysis
    const lowerText = text.toLowerCase();
    
    // Common words for different languages (first few characters for efficiency)
    const languagePatterns = {
      'en': ['the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this'],
      'es': ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no'],
      'fr': ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
      'de': ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'],
      'it': ['il', 'di', 'che', 'e', 'la', 'a', 'per', 'un', 'in', 'è'],
      'pt': ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para'],
      'ru': [/^[а-я]/], // Cyrillic characters
      'ar': [/^[ا-ي]/],  // Arabic characters
      'hi': [/^[ऄ-ॣ]/],  // Devanagari characters
      'zh': [/^[一-龯]/], // Chinese characters
      'ja': [/^[ぁ-ヿー]/, /^[一-龯]/] // Hiragana/Katakana or Kanji
    };

    // Count occurrences of language-specific patterns
    const scores = {};
    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      scores[lang] = 0;
      
      for (const pattern of patterns) {
        if (typeof pattern === 'string') {
          // Check for common words
          if (lowerText.includes(pattern)) {
            scores[lang]++;
          }
        } else if (pattern instanceof RegExp) {
          // Check for character patterns
          if (pattern.test(lowerText)) {
            scores[lang] += 5; // Higher weight for character patterns
          }
        }
      }
    }

    // Find the language with the highest score
    let detectedLang = 'en'; // Default to English
    let maxScore = 0;
    
    for (const [lang, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }

  /**
   * Get supported languages for translation
   * @returns {Promise<Array>} - List of supported language codes
   */
  async getSupportedLanguages(targetLanguage = 'en') {
    try {
      const [languages] = await this.translateClient.getLanguages({ target: targetLanguage });
      
      return languages.map(lang => ({
        code: lang.code,
        name: lang.name
      }));
    } catch (error) {
      console.error('Error getting supported languages:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const languageDetector = new LanguageDetection();
module.exports = languageDetector;