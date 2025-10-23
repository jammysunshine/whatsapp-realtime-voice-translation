// services/media-uploader.js
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { logger } = require('../utils/helpers/performance-monitor');

class MediaUploader {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.basePublicUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
  }

  /**
   * Save audio buffer to temporary file and return a public URL
   * Note: For actual WhatsApp integration, you need to upload to a public hosting service
   * This implementation stores in a local temp directory, which won't work for real WhatsApp
   * In a production environment, you'd need to upload to a service like S3, etc.
   * @param {Buffer} audioBuffer - The audio buffer to save
   * @param {string} format - Audio format (e.g., 'mp3', 'ogg', 'wav')
   * @returns {Promise<string>} - Public URL for the uploaded media
   */
  async uploadAudio(audioBuffer, format = 'ogg') {
    try {
      // Generate unique filename
      const filename = `${uuidv4()}.${format}`;
      const filepath = path.join(this.tempDir, filename);
      
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });
      
      // Write the audio buffer to file
      await fs.writeFile(filepath, audioBuffer);
      
      // Create public URL (this is a placeholder - won't work in real environment without public hosting)
      const publicUrl = `${this.basePublicUrl}/temp/${filename}`;
      
      logger.info(`Audio saved to: ${filepath}, URL: ${publicUrl}`);
      
      // Set up cleanup after some time (e.g., 1 hour)
      setTimeout(() => {
        this.cleanupFile(filepath);
      }, 3600000); // 1 hour
      
      return publicUrl;
    } catch (error) {
      logger.error('Error uploading audio:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary file
   * @param {string} filepath - Path to the file to delete
   */
  async cleanupFile(filepath) {
    try {
      await fs.unlink(filepath);
      logger.info(`Cleaned up temporary file: ${filepath}`);
    } catch (error) {
      logger.error(`Error cleaning up file ${filepath}:`, error);
    }
  }

  /**
   * Upload and send audio message via WhatsApp
   * @param {Object} whatsappService - WhatsApp API service instance
   * @param {string} recipientId - Recipient's WhatsApp ID
   * @param {Buffer} audioBuffer - The audio buffer to send
   * @param {string} format - Audio format
   * @returns {Promise<Object>} - WhatsApp API response
   */
  async uploadAndSendAudio(whatsappService, recipientId, audioBuffer, format = 'ogg') {
    try {
      // Upload the audio to get a public URL
      const audioUrl = await this.uploadAudio(audioBuffer, format);
      
      // Send the voice message via WhatsApp
      const result = await whatsappService.sendVoiceMessage(recipientId, audioUrl);
      
      return result;
    } catch (error) {
      logger.error('Error uploading and sending audio:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const mediaUploader = new MediaUploader();
module.exports = mediaUploader;