// routes/webhook.js
const express = require('express');
const axios = require('axios');
const config = require('../config');
const monitoring = require('../utils/helpers/monitoring');
const userPreferencesService = require('../services/user-preferences');

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
  const recipientId = context.contacts[0].wa_id;
  
  // Handle different message types
  switch (message.type) {
    case 'audio':
      // Process audio message (voice note)
      monitoring.incrementTranslationCounter('whatsapp_audio', 'unknown', context.recipient?.language || 'unknown');
      await handleAudioMessage(message, context);
      break;
    case 'text':
      // Check if this is a command message
      const text = message.text.body;
      if (text.startsWith('!')) {
        await handleCommand(text, recipientId);
      } else {
        // Process regular text message
        monitoring.incrementTranslationCounter('whatsapp_text', 'unknown', context.recipient?.language || 'unknown');
        await handleTextMessage(message, context);
      }
      break;
    default:
      console.log(`Unsupported message type: ${message.type}`);
      monitoring.incrementErrorCounter('unsupported_message_type', 'whatsapp');
  }
}

/**
 * Handle command messages starting with !
 * @param {string} command - The command text
 * @param {string} recipientId - The WhatsApp ID of the recipient
 */
async function handleCommand(command, recipientId) {
  const whatsappService = require('../services/whatsapp/whatsapp-api');
  
  try {
    console.log(`Processing command from ${recipientId}: ${command}`);
    
    // Parse the command
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    
    switch (cmd) {
      case '!lang':
      case '!language':
        // Set target language(s) for translations
        if (parts.length < 2) {
          // Show current language settings
          const currentPrefs = await userPreferencesService.getPreferences(recipientId);
          await whatsappService.sendTextMessage(
            recipientId,
            `Current settings:\nSource: ${currentPrefs.sourceLanguage}\nTargets: ${currentPrefs.targetLanguages.join(', ')}\n\nSend !lang <lang1> <lang2> to set target languages (e.g., "!lang es fr" for Spanish and French)`
          );
          return;
        }
        
        const languages = parts.slice(1).filter(lang => lang.length === 2); // Basic filter for 2-letter language codes
        if (languages.length === 0) {
          await whatsappService.sendTextMessage(
            recipientId,
            'Please provide valid language codes (e.g., "es" for Spanish, "fr" for French). Example: !lang es fr'
          );
          return;
        }
        
        const setResult = await userPreferencesService.setTargetLanguages(recipientId, languages);
        if (setResult) {
          await whatsappService.sendTextMessage(
            recipientId,
            `Target languages set to: ${languages.join(', ')}`
          );
        } else {
          await whatsappService.sendTextMessage(
            recipientId,
            'Error setting language preferences. Please try again.'
          );
        }
        break;
        
      case '!srclang':
        // Set source language for translations
        if (parts.length < 2) {
          await whatsappService.sendTextMessage(
            recipientId,
            'Please specify a source language code. Example: !srclang en'
          );
          return;
        }
        
        const sourceLang = parts[1].toLowerCase();
        if (sourceLang.length !== 2) {
          await whatsappService.sendTextMessage(
            recipientId,
            'Please provide a valid 2-letter language code (e.g., "en", "es", "fr").'
          );
          return;
        }
        
        const sourceSetResult = await userPreferencesService.setSourceLanguage(recipientId, sourceLang);
        if (sourceSetResult) {
          await whatsappService.sendTextMessage(
            recipientId,
            `Source language set to: ${sourceLang}`
          );
        } else {
          await whatsappService.sendTextMessage(
            recipientId,
            'Error setting source language. Please try again.'
          );
        }
        break;
        
      case '!response':
        // Set response mode (text, voice, or both)
        if (parts.length < 2) {
          const currentPrefs = await userPreferencesService.getPreferences(recipientId);
          await whatsappService.sendTextMessage(
            recipientId,
            `Current response mode: ${currentPrefs.responseMode}\n\nAvailable modes: text, voice, both\nExample: !response both`
          );
          return;
        }
        
        const responseMode = parts[1].toLowerCase();
        if (!['text', 'voice', 'both'].includes(responseMode)) {
          await whatsappService.sendTextMessage(
            recipientId,
            'Invalid response mode. Use: text, voice, or both. Example: !response both'
          );
          return;
        }
        
        const responseSetResult = await userPreferencesService.setResponseMode(recipientId, responseMode);
        if (responseSetResult) {
          await whatsappService.sendTextMessage(
            recipientId,
            `Response mode set to: ${responseMode}`
          );
        } else {
          await whatsappService.sendTextMessage(
            recipientId,
            'Error setting response mode. Please try again.'
          );
        }
        break;
        
      case '!help':
        // Show available commands
        await whatsappService.sendTextMessage(
          recipientId,
          `Available commands:\n` +
          `!lang <langs> - Set target languages (e.g., !lang es fr)\n` +
          `!srclang <lang> - Set source language (e.g., !srclang en)\n` +
          `!response <mode> - Set response mode: text, voice, or both\n` +
          `!help - Show this help message`
        );
        break;
        
      default:
        await whatsappService.sendTextMessage(
          recipientId,
          `Unknown command: ${cmd}. Send !help for available commands.`
        );
        break;
    }
  } catch (error) {
    console.error('Error handling command:', error);
    const whatsappService = require('../services/whatsapp/whatsapp-api');
    try {
      await whatsappService.sendTextMessage(recipientId, 'Sorry, there was an error processing your command.');
    } catch (sendError) {
      console.error('Error sending error message to user:', sendError);
    }
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
    
    // Get user preferences
    const userPrefs = await userPreferencesService.getPreferences(recipientId);
    const targetLanguages = userPrefs.targetLanguages ? userPrefs.targetLanguages.split(',') : ['en'];
    
    // Process audio with multiple target languages
    const results = await audioProcessingPipeline.processAudioTranslationMulti(
      audioBuffer,
      targetLanguages.map(lang => lang.trim())
    );
    
    // Get user response preferences (userPrefs already fetched above)
    const responseMode = userPrefs.responseMode || 'text';
    
    // Prepare the text response
    let responseMessage = `Original (auto-detected as ${results[0].transcription.language}): ${results[0].transcription.text}\n\n`;
    
    for (const result of results) {
      responseMessage += `Translation to ${result.translation.targetLanguage.toUpperCase()}: ${result.translation.translatedText}\n\n`;
    }
    
    // Send text response
    await whatsappService.sendTextMessage(recipientId, responseMessage);
    
    // If user wants voice responses, send voice messages too
    if (responseMode === 'voice' || responseMode === 'both') {
      // Import media uploader service
      const mediaUploader = require('../services/media-uploader');
      
      for (const result of results) {
        try {
          // Upload and send the audio response
          await mediaUploader.uploadAndSendAudio(
            whatsappService,
            recipientId,
            result.tts.audioContent, // The audio content from TTS
            'ogg' // WhatsApp typically expects OGG/OPUS format
          );
        } catch (uploadError) {
          console.error(`Error sending voice response for ${result.translation.targetLanguage}:`, uploadError);
          // If voice response fails, send a text notification
          await whatsappService.sendTextMessage(
            recipientId,
            `Audio response in ${result.translation.targetLanguage.toUpperCase()} could not be delivered due to technical issues.`
          );
        }
      }
    }
    
    console.log(`Sent multi-language translation to ${recipientId} with response mode: ${responseMode}`);
    
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
    
    // Get user preferences
    const userPrefs = await userPreferencesService.getPreferences(recipientId);
    const targetLanguages = userPrefs.targetLanguages ? userPrefs.targetLanguages.split(',') : ['en'];
    
    // Translate the text to multiple languages
    const results = [];
    for (const lang of targetLanguages) {
      const result = await translationService.translateWithSourceDetection(text, lang.trim());
      results.push({
        language: lang.trim(),
        result: result
      });
    }
    
    // Get user response preferences (userPrefs already fetched above)
    const responseMode = userPrefs.responseMode || 'text';
    
    // Send the translated text back via WhatsApp
    let responseMessage = `Original (auto-detected as ${results[0].result.sourceLanguage}): ${results[0].result.originalText}\n\n`;
    
    for (const item of results) {
      responseMessage += `Translation to ${item.language.toUpperCase()}: ${item.result.translatedText}\n\n`;
    }
    
    await whatsappService.sendTextMessage(recipientId, responseMessage);
    
    // If user wants voice responses, send voice messages too
    if (responseMode === 'voice' || responseMode === 'both') {
      // For text messages, we need to convert the translated text to speech first
      const textToSpeechService = require('../services/google/text-to-speech');
      const mediaUploader = require('../services/media-uploader');
      
      // Local function to convert language code to BCP-47 format
      const convertToBCP47 = (languageCode) => {
        const bcp47Map = {
          'en': 'en-US',
          'es': 'es-ES',
          'fr': 'fr-FR',
          'de': 'de-DE',
          'it': 'it-IT',
          'pt': 'pt-BR',
          'ru': 'ru-RU',
          'ar': 'ar-XA',
          'hi': 'hi-IN',
          'zh': 'zh-CN',
          'ja': 'ja-JP',
          'ko': 'ko-KR',
          'tr': 'tr-TR'
        };
        
        return bcp47Map[languageCode] || `${languageCode}-${languageCode.toUpperCase()}`;
      };
      
      for (const item of results) {
        try {
          // Convert translated text to speech
          const ttsResult = await textToSpeechService.synthesizeText(
            item.result.translatedText,
            convertToBCP47(item.language)
          );
          
          // Upload and send the audio response
          await mediaUploader.uploadAndSendAudio(
            whatsappService,
            recipientId,
            ttsResult.audioContent, // The audio content from TTS
            'ogg' // WhatsApp typically expects OGG/OPUS format
          );
        } catch (ttsError) {
          console.error(`Error generating voice response for ${item.language}:`, ttsError);
          // If voice response fails, send a text notification
          await whatsappService.sendTextMessage(
            recipientId,
            `Audio response in ${item.language.toUpperCase()} could not be generated due to technical issues.`
          );
        }
      }
    }
    
    console.log(`Sent multi-language text translation to ${recipientId} with response mode: ${responseMode}`);
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