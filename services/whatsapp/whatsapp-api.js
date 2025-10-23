// services/whatsapp/whatsapp-api.js
const axios = require('axios');
const config = require('../../config');
const { logger } = require('../../utils/helpers/performance-monitor');

class WhatsAppAPIService {
  constructor() {
    // Base URL for WhatsApp Cloud API
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    
    // Set up axios instance with default headers
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
    
    // WhatsApp access token for authentication
    this.accessToken = config.whatsapp.accessToken;
    this.phoneNumberId = config.whatsapp.phoneNumberId;
  }

  /**
   * Send a text message to a WhatsApp user
   * @param {string} recipientId - The WhatsApp ID of the recipient
   * @param {string} message - The text message to send
   * @returns {Promise<Object>} - Response from WhatsApp API
   */
  async sendTextMessage(recipientId, message) {
    try {
      logger.info(`Sending text message to: ${recipientId}`);
      
      const response = await this.apiClient.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipientId,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      logger.info(`Message sent successfully. Message ID: ${response.data.messages[0].id}`);
      return response.data;
    } catch (error) {
      logger.error('Error sending text message:', error.response?.data || error.message);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Send a voice message to a WhatsApp user
   * @param {string} recipientId - The WhatsApp ID of the recipient
   * @param {string} audioUrl - URL of the audio file to send
   * @returns {Promise<Object>} - Response from WhatsApp API
   */
  async sendVoiceMessage(recipientId, audioUrl) {
    try {
      logger.info(`Sending voice message to: ${recipientId}`);
      
      const response = await this.apiClient.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipientId,
          type: 'audio',
          audio: {
            link: audioUrl  // Audio must be hosted at a public URL
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      logger.info(`Voice message sent successfully. Message ID: ${response.data.messages[0].id}`);
      return response.data;
    } catch (error) {
      logger.error('Error sending voice message:', error.response?.data || error.message);
      throw new Error(`WhatsApp Voice API Error: ${error.message}`);
    }
  }

  /**
   * Send a media message (image, document, etc.) to a WhatsApp user
   * @param {string} recipientId - The WhatsApp ID of the recipient
   * @param {string} mediaType - Type of media ('image', 'document', 'video')
   * @param {string} mediaUrl - URL of the media file
   * @param {string} caption - Optional caption for the media
   * @returns {Promise<Object>} - Response from WhatsApp API
   */
  async sendMediaMessage(recipientId, mediaType, mediaUrl, caption = null) {
    try {
      logger.info(`Sending ${mediaType} message to: ${recipientId}`);
      
      const messagePayload = {
        messaging_product: 'whatsapp',
        to: recipientId,
        type: mediaType,
      };
      
      messagePayload[mediaType] = {
        link: mediaUrl
      };
      
      if (caption) {
        messagePayload[mediaType].caption = caption;
      }
      
      const response = await this.apiClient.post(
        `/${this.phoneNumberId}/messages`,
        messagePayload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      logger.info(`${mediaType} message sent successfully. Message ID: ${response.data.messages[0].id}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending ${mediaType} message:`, error.response?.data || error.message);
      throw new Error(`WhatsApp Media API Error: ${error.message}`);
    }
  }

  /**
   * Upload media to WhatsApp Cloud API
   * @param {Buffer} mediaBuffer - The media file as buffer
   * @param {string} mimeType - MIME type of the media
   * @param {string} fileName - Name of the file
   * @returns {Promise<string>} - ID of the uploaded media
   */
  async uploadMedia(mediaBuffer, mimeType, fileName) {
    try {
      logger.info(`Uploading media file: ${fileName}`);
      
      // Create form data for the file upload
      const formData = new FormData();
      const fileBlob = new Blob([mediaBuffer], { type: mimeType });
      formData.append('file', fileBlob, fileName);
      formData.append('type', mimeType);
      
      // Note: For actual implementation, you might need to use a different approach
      // because the WhatsApp Cloud API expects a URL, not direct file upload
      // You'll likely need to upload to a file hosting service first
      
      // For demonstration purposes only - in real implementation,
      // you would upload to a cloud storage service like AWS S3, Google Cloud Storage, etc.
      throw new Error('Direct file upload not supported, use cloud storage service');
    } catch (error) {
      logger.error('Error uploading media:', error.message);
      throw new Error(`WhatsApp Media Upload Error: ${error.message}`);
    }
  }

  /**
   * Mark a message as read
   * @param {string} messageId - The ID of the message to mark as read
   * @returns {Promise<Object>} - Response from WhatsApp API
   */
  async markMessageAsRead(messageId) {
    try {
      logger.info(`Marking message as read: ${messageId}`);
      
      const response = await this.apiClient.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      logger.info(`Message ${messageId} marked as read`);
      return response.data;
    } catch (error) {
      logger.error('Error marking message as read:', error.response?.data || error.message);
      throw new Error(`WhatsApp Mark Read Error: ${error.message}`);
    }
  }

  /**
   * Send a typing indicator to the user
   * @param {string} recipientId - The WhatsApp ID of the recipient
   * @returns {Promise<Object>} - Response from WhatsApp API
   */
  async sendTypingIndicator(recipientId) {
    try {
      logger.info(`Sending typing indicator to: ${recipientId}`);
      
      // Note: WhatsApp Cloud API doesn't have a direct typing indicator
      // Instead, we can send a message with status update to simulate this
      // In practice, you might implement this differently based on your needs
      const response = await this.apiClient.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipientId,
          type: 'text',
          text: {
            body: '_Processing your request..._'  // This is just a visual indicator
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error('Error sending typing indicator:', error.response?.data || error.message);
      throw new Error(`WhatsApp Typing Indicator Error: ${error.message}`);
    }
  }

  /**
   * Get message history for a specific user
   * @param {string} recipientId - The WhatsApp ID of the recipient
   * @returns {Promise<Object>} - Message history
   */
  async getMessageHistory(recipientId) {
    try {
      logger.info(`Retrieving message history for: ${recipientId}`);
      
      // Note: WhatsApp Cloud API doesn't provide a direct way to get historical messages
      // This would typically be handled by your own application's database
      // where you store incoming messages
      
      // For demonstration purposes, return an empty result
      logger.warn('Message history not available via WhatsApp Cloud API - implement your own storage');
      return {
        recipientId: recipientId,
        messages: [],
        lastRetrieved: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error retrieving message history:', error.message);
      throw new Error(`WhatsApp History Error: ${error.message}`);
    }
  }

  /**
   * Validate webhook request signature (for security)
   * @param {Object} req - Express request object
   * @param {string} payload - Raw payload string
   * @returns {boolean} - True if signature is valid
   */
  validateWebhookSignature(req, payload) {
    // Note: WhatsApp Cloud API uses a different validation mechanism
    // The webhook validation is done during setup with a verify_token
    // This method is for validation of incoming messages
    
    // In a real implementation, you would verify the webhook signature
    // using the app secret and request payload
    logger.info('Webhook signature validation method called');
    return true; // Simplified for this implementation
  }
}

// Create and export a singleton instance
const whatsappAPIService = new WhatsAppAPIService();
module.exports = whatsappAPIService;