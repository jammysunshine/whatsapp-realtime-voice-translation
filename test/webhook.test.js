const request = require('supertest');
const express = require('express');

// Mock config at the top before other imports
jest.mock('../config', () => ({
  whatsapp: {
    webhookVerifyToken: 'test_verify_token'
  }
}));

const { app } = require('../server'); // Use the main server app
const userPreferencesService = require('../services/user-preferences');
const whatsappService = require('../services/whatsapp/whatsapp-api');
const { logger } = require('../utils/helpers/performance-monitor');

// Mock the WhatsApp service to avoid actual API calls during testing
jest.mock('../services/whatsapp/whatsapp-api', () => ({
  sendTextMessage: jest.fn().mockResolvedValue({ messages: [{ id: 'mock_msg_id' }] }),
  sendVoiceMessage: jest.fn().mockResolvedValue({ messages: [{ id: 'mock_voice_msg_id' }] }),
  downloadMedia: jest.fn().mockResolvedValue(Buffer.from('mock audio data'))
}));

// Mock the user preferences service to avoid Redis connection issues
jest.mock('../services/user-preferences', () => ({
  getPreferences: jest.fn().mockResolvedValue({
    sourceLanguage: 'auto',
    targetLanguages: 'es,fr',
    responseMode: 'text'
  }),
  setTargetLanguages: jest.fn().mockResolvedValue(true),
  setSourceLanguage: jest.fn().mockResolvedValue(true),
  setResponseMode: jest.fn().mockResolvedValue(true),
  redis: {
    del: jest.fn(),
    hset: jest.fn(),
    hgetall: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../utils/helpers/audio-processing-pipeline', () => ({
  processAudioTranslationMulti: jest.fn().mockResolvedValue([
    {
      transcription: { text: 'Hello world', language: 'en' },
      translation: { translatedText: 'Hola mundo', targetLanguage: 'es' },
      tts: { audioContent: Buffer.from('mock audio') }
    }
  ])
}));

describe('Webhook Route Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Webhook Verification (GET)', () => {
    test('should verify webhook successfully with correct token', async () => {
      // Mock the config to return a specific verify token for testing
      jest.mock('../config', () => ({
        whatsapp: {
          webhookVerifyToken: 'test_verify_token'
        }
      }));

      // Need to restructure to ensure config is properly mocked before import
      const response = await request(app)
        .get('/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'test_verify_token',  // Use the value from config
          'hub.challenge': 'test_challenge'
        });
      
      expect(response.status).toBe(200);
      expect(response.text).toBe('test_challenge');
    });

    test('should return 403 for invalid verification token', async () => {
      const response = await request(app)
        .get('/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'invalid_token',
          'hub.challenge': 'test_challenge'
        });
      
      expect(response.status).toBe(403);
      expect(response.text).toBe('Forbidden: Invalid verification token');
    });

    test('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/webhook');
      
      expect(response.status).toBe(400);
      expect(response.text).toBe('Bad Request: Missing parameters');
    });
  });

  describe('Webhook Message Processing (POST)', () => {
    test('should handle POST request successfully', async () => {
      const mockPayload = {
        entry: [{
          changes: [{
            value: {
              contacts: [{ wa_id: 'test_user' }],
              messages: [{
                from: 'test_user',
                type: 'text',
                text: { body: 'Hello' }
              }]
            }
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook')
        .send(mockPayload)
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    test('should handle audio messages correctly', async () => {
      const mockAudioPayload = {
        entry: [{
          changes: [{
            value: {
              contacts: [{ wa_id: 'test_user_id' }],
              messages: [{
                type: 'audio',
                audio: { id: 'test_audio_id' },
                from: 'test_user_id'
              }]
            }
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook')
        .send(mockAudioPayload)
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(200);
      expect(whatsappService.downloadMedia).toHaveBeenCalledWith('test_audio_id');
    });
  });
});

describe('User Preference Service Tests', () => {
  const testUserId = 'test_user_123';
  
  beforeEach(async () => {
    // Clear any existing preferences for the test user
    await userPreferencesService.redis.del(`user:${testUserId}:preferences`);
  });

  afterEach(async () => {
    // Clean up after each test
    await userPreferencesService.redis.del(`user:${testUserId}:preferences`);
  });

  test('should set and get user preferences correctly', async () => {
    const preferences = {
      sourceLanguage: 'en',
      targetLanguages: ['es', 'fr'],
      responseMode: 'both'
    };

    const setResult = await userPreferencesService.setPreferences(testUserId, preferences);
    expect(setResult).toBe(true);

    const getPreferences = await userPreferencesService.getPreferences(testUserId);
    expect(getPreferences.sourceLanguage).toBe('en');
    expect(getPreferences.targetLanguages).toBe('es,fr'); // Stored as comma-separated string
    expect(getPreferences.responseMode).toBe('both');
  });

  test('should return default preferences for new users', async () => {
    const getPreferences = await userPreferencesService.getPreferences('nonexistent_user');
    expect(getPreferences.sourceLanguage).toBe('auto');
    expect(getPreferences.targetLanguages).toBe('en');
    expect(getPreferences.responseMode).toBe('text');
  });

  test('should set source language independently', async () => {
    const setResult = await userPreferencesService.setSourceLanguage(testUserId, 'es');
    expect(setResult).toBe(true);

    const getPreferences = await userPreferencesService.getPreferences(testUserId);
    expect(getPreferences.sourceLanguage).toBe('es');
  });

  test('should set target languages independently', async () => {
    const setResult = await userPreferencesService.setTargetLanguages(testUserId, ['es', 'fr', 'de']);
    expect(setResult).toBe(true);

    const getPreferences = await userPreferencesService.getPreferences(testUserId);
    expect(getPreferences.targetLanguages).toBe('es,fr,de');
  });

  test('should set response mode independently', async () => {
    const setResult = await userPreferencesService.setResponseMode(testUserId, 'voice');
    expect(setResult).toBe(true);

    const getPreferences = await userPreferencesService.getPreferences(testUserId);
    expect(getPreferences.responseMode).toBe('voice');
  });

  test('should reject invalid response mode', async () => {
    await expect(userPreferencesService.setResponseMode(testUserId, 'invalid_mode'))
      .rejects.toThrow('Invalid response mode');
  });
});

describe('Command Processing Tests', () => {
  test('should process !lang command correctly', async () => {
    const mockPayload = {
      entry: [{
        changes: [{
          value: {
            contacts: [{ wa_id: 'test_user_id' }],
            messages: [{
              type: 'text',
              text: { body: '!lang es fr' },
              from: 'test_user_id'
            }]
          }
        }]
      }]
    };

    const response = await request(app)
      .post('/webhook')
      .send(mockPayload)
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(200);
    // Check that sendTextMessage was called with the correct response
    expect(whatsappService.sendTextMessage).toHaveBeenCalledWith(
      'test_user_id',
      'Target languages set to: es, fr'
    );
  });

  test('should process !help command correctly', async () => {
    const mockPayload = {
      entry: [{
        changes: [{
          value: {
            contacts: [{ wa_id: 'test_user_id' }],
            messages: [{
              type: 'text',
              text: { body: '!help' },
              from: 'test_user_id'
            }]
          }
        }]
      }]
    };

    const response = await request(app)
      .post('/webhook')
      .send(mockPayload)
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(200);
    // Check that sendTextMessage was called (help message would be sent)
    expect(whatsappService.sendTextMessage).toHaveBeenCalled();
  });

  test('should process !srclang command correctly', async () => {
    const mockPayload = {
      entry: [{
        changes: [{
          value: {
            contacts: [{ wa_id: 'test_user_id' }],
            messages: [{
              type: 'text',
              text: { body: '!srclang en' },
              from: 'test_user_id'
            }]
          }
        }]
      }]
    };

    const response = await request(app)
      .post('/webhook')
      .send(mockPayload)
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(200);
  });

  test('should process !response command correctly', async () => {
    const mockPayload = {
      entry: [{
        changes: [{
          value: {
            contacts: [{ wa_id: 'test_user_id' }],
            messages: [{
              type: 'text',
              text: { body: '!response both' },
              from: 'test_user_id'
            }]
          }
        }]
      }]
    };

    const response = await request(app)
      .post('/webhook')
      .send(mockPayload)
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(200);
  });
});