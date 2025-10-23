// services/user-preferences.js
const Redis = require('ioredis');
const config = require('../config');
const { logger } = require('../utils/helpers/performance-monitor');

class UserPreferencesService {
  constructor() {
    this.redis = new Redis(config.redis.url);
  }

  /**
   * Set user's language preferences
   * @param {string} userId - WhatsApp user ID
   * @param {Object} preferences - User preferences object
   * @returns {Promise<boolean>} - Success status
   */
  async setPreferences(userId, preferences) {
    try {
      const key = `user:${userId}:preferences`;
      await this.redis.hset(key, preferences);
      await this.redis.expire(key, 86400 * 7); // 7 days expiration
      
      logger.info(`Set preferences for user ${userId}:`, preferences);
      return true;
    } catch (error) {
      logger.error('Error setting user preferences:', error);
      return false;
    }
  }

  /**
   * Get user's language preferences
   * @param {string} userId - WhatsApp user ID
   * @returns {Promise<Object>} - User preferences object
   */
  async getPreferences(userId) {
    try {
      const key = `user:${userId}:preferences`;
      const preferences = await this.redis.hgetall(key);
      
      // Set default preferences if none exist
      if (Object.keys(preferences).length === 0) {
        return {
          sourceLanguage: 'auto',
          targetLanguages: ['en'], // Default to English
          responseMode: 'text' // 'text', 'voice', or 'both'
        };
      }
      
      return preferences;
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      return {
        sourceLanguage: 'auto',
        targetLanguages: ['en'],
        responseMode: 'text'
      };
    }
  }

  /**
   * Set user's source language
   * @param {string} userId - WhatsApp user ID
   * @param {string} language - Source language code
   * @returns {Promise<boolean>} - Success status
   */
  async setSourceLanguage(userId, language) {
    try {
      const key = `user:${userId}:preferences`;
      await this.redis.hset(key, 'sourceLanguage', language);
      await this.redis.expire(key, 86400 * 7); // 7 days expiration
      
      logger.info(`Set source language for user ${userId}: ${language}`);
      return true;
    } catch (error) {
      logger.error('Error setting source language:', error);
      return false;
    }
  }

  /**
   * Set user's target languages
   * @param {string} userId - WhatsApp user ID
   * @param {Array<string>} languages - Target language codes
   * @returns {Promise<boolean>} - Success status
   */
  async setTargetLanguages(userId, languages) {
    try {
      const key = `user:${userId}:preferences`;
      await this.redis.hset(key, 'targetLanguages', languages.join(','));
      await this.redis.expire(key, 86400 * 7); // 7 days expiration
      
      logger.info(`Set target languages for user ${userId}:`, languages);
      return true;
    } catch (error) {
      logger.error('Error setting target languages:', error);
      return false;
    }
  }

  /**
   * Set user's response mode (text, voice, or both)
   * @param {string} userId - WhatsApp user ID
   * @param {string} mode - Response mode ('text', 'voice', 'both')
   * @returns {Promise<boolean>} - Success status
   */
  async setResponseMode(userId, mode) {
    try {
      if (!['text', 'voice', 'both'].includes(mode)) {
        throw new Error('Invalid response mode. Use text, voice, or both');
      }
      
      const key = `user:${userId}:preferences`;
      await this.redis.hset(key, 'responseMode', mode);
      await this.redis.expire(key, 86400 * 7); // 7 days expiration
      
      logger.info(`Set response mode for user ${userId}: ${mode}`);
      return true;
    } catch (error) {
      logger.error('Error setting response mode:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const userPreferencesService = new UserPreferencesService();
module.exports = userPreferencesService;