// routes/webhook.js
const express = require('express');
const axios = require('axios');
const config = require('../config');
const monitoring = require('../utils/helpers/monitoring');

const router = express.Router();

// Webhook verification endpoint
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === config.whatsapp.webhookVerifyToken) {
      console.log('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden: Invalid verification token');
    }
  } else {
    res.status(400).send('Bad Request: Missing parameters');
  }
});

// Webhook message receiving endpoint
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const body = req.body;

  try {
    // Check if the payload contains entry array
    if (body.entry) {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.value?.messages) {
              for (const message of change.value.messages) {
                // Process each message
                await processMessage(message, change.value);
              }
            }
          }
        }
      }
    }

    // Record metrics
    monitoring.observeApiResponseTime('POST', '/webhook', (Date.now() - startTime) / 1000);
    
    // Respond with success to acknowledge the message
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error processing message:', error);
    monitoring.incrementErrorCounter('webhook_error', 'whatsapp');
    monitoring.observeApiResponseTime('POST', '/webhook', (Date.now() - startTime) / 1000);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * Process an incoming message
 * @param {Object} message - The message object from WhatsApp
 * @param {Object} context - The context of the message
 */
async function processMessage(message, context) {
  console.log('Processing message:', message);

  // Handle different message types
  switch (message.type) {
    case 'audio':
      // Process audio message (voice note)
      monitoring.incrementTranslationCounter('whatsapp_audio', 'unknown', context.recipient?.language || 'unknown');
      await handleAudioMessage(message, context);
      break;
    case 'text':
      // Process text message
      monitoring.incrementTranslationCounter('whatsapp_text', 'unknown', context.recipient?.language || 'unknown');
      await handleTextMessage(message, context);
      break;
    default:
      console.log(`Unsupported message type: ${message.type}`);
      monitoring.incrementErrorCounter('unsupported_message_type', 'whatsapp');
  }
}

/**
 * Handle audio messages (voice notes)
 * @param {Object} message - The audio message object
 * @param {Object} context - The context of the message
 */
async function handleAudioMessage(message, context) {
  try {
    console.log('Handling audio message:', message);
    
    // TODO: Implement audio processing logic
    // 1. Download the audio file from WhatsApp
    // 2. Convert speech to text using Google STT
    // 3. Translate the text
    // 4. Send the translated text back via WhatsApp
  } catch (error) {
    console.error('Error handling audio message:', error);
  }
}

/**
 * Handle text messages
 * @param {Object} message - The text message object
 * @param {Object} context - The context of the message
 */
async function handleTextMessage(message, context) {
  try {
    console.log('Handling text message:', message);
    
    // TODO: Implement text translation logic
    // 1. Translate the text
    // 2. Send the translated text back via WhatsApp
  } catch (error) {
    console.error('Error handling text message:', error);
  }
}

module.exports = router;