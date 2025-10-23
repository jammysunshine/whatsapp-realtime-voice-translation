// routes/translate.js
const express = require('express');
const multer = require('multer');
const router = express.Router();

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const audioProcessingPipeline = require('../utils/helpers/audio-processing-pipeline');
const { logger } = require('../utils/helpers/performance-monitor');
const monitoring = require('../utils/helpers/monitoring');

// Route for audio translation
router.post('/translate', upload.single('audio'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('Received audio translation request');
    
    if (!req.file) {
      monitoring.incrementErrorCounter('api_validation_error', 'audio_translate');
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    // Get language parameters
    const sourceLanguage = req.body.sourceLanguage || null;
    const targetLanguage = req.body.targetLanguage || 'en';
    
    if (!targetLanguage) {
      monitoring.incrementErrorCounter('api_validation_error', 'audio_translate');
      return res.status(400).json({ error: 'Target language is required' });
    }
    
    // Process the audio through the pipeline
    const result = await audioProcessingPipeline.processAudioTranslation(
      req.file.buffer,
      targetLanguage,
      sourceLanguage
    );
    
    // Record metrics
    monitoring.incrementTranslationCounter('api_audio', sourceLanguage, targetLanguage);
    monitoring.observeTranslationDuration('api_audio', result.totalProcessingTime / 1000);
    monitoring.observeApiResponseTime('POST', '/api/translate', (Date.now() - startTime) / 1000);
    
    // Send the result back to the client
    res.status(200).json({
      success: true,
      originalText: result.transcription.text,
      translatedText: result.translation.translatedText,
      sourceLanguage: result.translation.sourceLanguage,
      targetLanguage: result.translation.targetLanguage,
      processingTime: result.totalProcessingTime
    });
    
  } catch (error) {
    logger.error('Translation API error:', error);
    monitoring.incrementErrorCounter('api_error', 'audio_translate');
    monitoring.observeApiResponseTime('POST', '/api/translate', (Date.now() - startTime) / 1000);
    res.status(500).json({ error: error.message });
  }
});

// Route for text translation (if needed)
router.post('/translate-text', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('Received text translation request');
    
    const { text, sourceLanguage, targetLanguage } = req.body;
    
    if (!text || !targetLanguage) {
      monitoring.incrementErrorCounter('api_validation_error', 'text_translate');
      return res.status(400).json({ 
        error: 'Text and target language are required' 
      });
    }
    
    // For text translation, we need to use the translation service directly
    const translationService = require('../services/google/translation');
    
    const result = await translationService.translateText(
      text,
      targetLanguage,
      sourceLanguage
    );
    
    // Record metrics
    monitoring.incrementTranslationCounter('api_text', sourceLanguage, targetLanguage);
    monitoring.observeTranslationDuration('api_text', result.processingTime / 1000);
    monitoring.observeApiResponseTime('POST', '/api/translate-text', (Date.now() - startTime) / 1000);
    
    res.status(200).json({
      success: true,
      originalText: result.originalText,
      translatedText: result.translatedText,
      sourceLanguage: result.sourceLanguage,
      targetLanguage: result.targetLanguage,
      processingTime: result.processingTime
    });
    
  } catch (error) {
    logger.error('Text translation API error:', error);
    monitoring.incrementErrorCounter('api_error', 'text_translate');
    monitoring.observeApiResponseTime('POST', '/api/translate-text', (Date.now() - startTime) / 1000);
    res.status(500).json({ error: error.message });
  }
});

// Route for getting supported languages
router.get('/languages', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const translationService = require('../services/google/translation');
    const languages = await translationService.getSupportedLanguages();
    
    monitoring.observeApiResponseTime('GET', '/api/languages', (Date.now() - startTime) / 1000);
    
    res.status(200).json({
      success: true,
      languages: languages
    });
  } catch (error) {
    logger.error('Get languages API error:', error);
    monitoring.incrementErrorCounter('api_error', 'languages');
    monitoring.observeApiResponseTime('GET', '/api/languages', (Date.now() - startTime) / 1000);
    res.status(500).json({ error: error.message });
  }
});

// Route for getting processing statistics
router.get('/stats', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const stats = await audioProcessingPipeline.getProcessingStats();
    
    monitoring.observeApiResponseTime('GET', '/api/stats', (Date.now() - startTime) / 1000);
    
    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (error) {
    logger.error('Get stats API error:', error);
    monitoring.incrementErrorCounter('api_error', 'stats');
    monitoring.observeApiResponseTime('GET', '/api/stats', (Date.now() - startTime) / 1000);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;