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
    
    // 1. Get the audio media ID from the message
    const mediaId = message.audio.id;
    const recipientId = context.contacts[0].wa_id;
    
    // 2. Download the audio file from WhatsApp
    const whatsappService = require('../services/whatsapp/whatsapp-api');
    const audioUrl = `https://graph.facebook.com/v18.0/${mediaId}/`;
    
    // Note: In a real implementation, you'd need to download the media using the access token
    // For now, we'll simulate the process with a placeholder
    console.log(`Downloading audio from WhatsApp with ID: ${mediaId}`);
    
    // 3. Download the audio from WhatsApp
    const audioBuffer = await whatsappService.downloadMedia(mediaId);
    console.log(`Downloaded audio, size: ${audioBuffer.length} bytes`);
    
    // 4. Process the audio through our translation pipeline
    const audioProcessingPipeline = require('../utils/helpers/audio-processing-pipeline');
    
    // Determine target language - could be based on user preferences or context
    // For now, default to English or try to detect from context
    let targetLanguage = 'en'; // default
    
    // If the context contains language preference, use that
    // This would come from user settings or previous interactions
    if (context.language) {
      targetLanguage = context.language;
    }
    
    const result = await audioProcessingPipeline.processAudioTranslation(
      audioBuffer,
      targetLanguage
    );
    
    // 5. Send the translated text back via WhatsApp
    await whatsappService.sendTextMessage(
      recipientId, 
      `Original (auto-detected as ${result.transcription.language}): ${result.transcription.text}\n\nTranslation to ${targetLanguage}: ${result.translation.translatedText}`
    );
    
    console.log(`Sent translation to ${recipientId}: ${result.translation.translatedText}`);
    
  } catch (error) {
    console.error('Error handling audio message:', error);
    // Optionally send an error message back to the user
    const recipientId = context.contacts[0].wa_id;
    const whatsappService = require('../services/whatsapp/whatsapp-api');
    try {
      await whatsappService.sendTextMessage(recipientId, 'Sorry, there was an error processing your voice message.');
    } catch (sendError) {
      console.error('Error sending error message to user:', sendError);
    }
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
    
    const text = message.text.body;
    const recipientId = context.contacts[0].wa_id;
    const whatsappService = require('../services/whatsapp/whatsapp-api');
    const translationService = require('../services/google/translation');
    
    // Determine target language - could be based on user preferences or context
    let targetLanguage = 'en'; // default
    
    // If the context contains language preference, use that
    if (context.language) {
      targetLanguage = context.language;
    }
    
    // Translate the text
    const result = await translationService.translateWithSourceDetection(text, targetLanguage);
    
    // Send the translated text back via WhatsApp
    await whatsappService.sendTextMessage(
      recipientId, 
      `Original (auto-detected as ${result.sourceLanguage}): ${result.originalText}\n\nTranslation to ${targetLanguage}: ${result.translatedText}`
    );
    
    console.log(`Sent text translation to ${recipientId}: ${result.translatedText}`);
  } catch (error) {
    console.error('Error handling text message:', error);
    // Optionally send an error message back to the user
    const recipientId = context.contacts[0].wa_id;
    const whatsappService = require('../services/whatsapp/whatsapp-api');
    try {
      await whatsappService.sendTextMessage(recipientId, 'Sorry, there was an error processing your message.');
    } catch (sendError) {
      console.error('Error sending error message to user:', sendError);
    }
  }
}

module.exports = router;