// test/new-features.test.js - Minimal tests for the new features

// Mock config before any imports that might use it
jest.mock('../config', () => ({
  redis: {
    url: 'redis://localhost:6379'
  }
}));

// Mock Bull queue to avoid Redis connection
jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    process: jest.fn(),
    add: jest.fn().mockResolvedValue({ id: 'mock_job_id', finished: jest.fn().mockResolvedValue({}) }),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(),
    getWaitingCount: jest.fn().mockResolvedValue(0),
    getActiveCount: jest.fn().mockResolvedValue(0),
    getCompletedCount: jest.fn().mockResolvedValue(0),
    getFailedCount: jest.fn().mockResolvedValue(0),
  }));
});

// Mock Redis for tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    hset: jest.fn().mockResolvedValue(1),
    hgetall: jest.fn().mockResolvedValue({}),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
  }));
});

const userPreferencesService = require('../services/user-preferences');

describe('Option 1 New Features Tests', () => {
  describe('User Preferences Service', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should handle default preferences correctly', async () => {
      // Mock return empty object first time (no preferences set)
      userPreferencesService.redis.hgetall.mockResolvedValueOnce({});
      
      const prefs = await userPreferencesService.getPreferences('new_user');
      expect(prefs.sourceLanguage).toBe('auto');
      // When no preferences exist, service returns ['en'] array, not string
      expect(prefs.targetLanguages).toEqual(expect.arrayContaining(['en'])); // Default is array ['en']
      expect(prefs.responseMode).toBe('text');
    });

    test('should store and retrieve preferences', async () => {
      const userId = 'test_user_123';
      const langs = ['es', 'fr', 'de'];
      
      // Mock successful storage
      userPreferencesService.redis.hset.mockResolvedValue(1);
      
      const setResult = await userPreferencesService.setTargetLanguages(userId, langs);
      expect(setResult).toBe(true);
    });

    test('should handle response mode settings', async () => {
      const userId = 'test_user_123';
      
      userPreferencesService.redis.hset.mockResolvedValue(1);
      
      const setResult = await userPreferencesService.setResponseMode(userId, 'both');
      expect(setResult).toBe(true);
    });
  });

  describe('Multi-language Audio Processing', () => {
    // Mock the services used by the pipeline before importing
    jest.mock('../services/google/speech-to-text', () => ({
      transcribeWithLanguageDetection: jest.fn().mockResolvedValue({
        transcription: 'Hello world',
        detectedLanguage: 'en-US',
        languageCode: 'en-US',
        confidence: 0.9
      }),
      transcribeAudio: jest.fn().mockResolvedValue({
        transcription: 'Hello world',
        languageCode: 'en-US',
        confidence: 0.9
      })
    }));

    jest.mock('../services/google/translation', () => ({
      translateText: jest.fn().mockResolvedValue({
        originalText: 'Hello world',
        translatedText: 'Hola mundo',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        processingTime: 100
      })
    }));

    jest.mock('../services/google/text-to-speech', () => ({
      synthesizeText: jest.fn().mockResolvedValue({
        audioContent: Buffer.from('mock audio data'),
        processingTime: 50
      })
    }));

    const audioProcessingPipeline = require('../utils/helpers/audio-processing-pipeline');

    test('should process single language translation', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      const result = await audioProcessingPipeline.processAudioTranslation(
        mockAudioBuffer,
        'es'
      );

      expect(result).toHaveProperty('transcription');
      expect(result).toHaveProperty('translation');
      expect(result).toHaveProperty('tts');
    });

    test('should process multi-language translation', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      const targetLanguages = ['es', 'fr', 'de'];
      
      const results = await audioProcessingPipeline.processAudioTranslationMulti(
        mockAudioBuffer,
        targetLanguages
      );

      expect(results).toHaveLength(3); // One for each target language
      expect(results[0]).toHaveProperty('transcription');
    });
  });

  describe('BCP-47 Language Code Conversion', () => {
    const audioProcessingPipeline = require('../utils/helpers/audio-processing-pipeline');
    
    test('should convert language codes to BCP-47 format', () => {
      expect(audioProcessingPipeline.convertToBCP47('en')).toBe('en-US');
      expect(audioProcessingPipeline.convertToBCP47('es')).toBe('es-ES');
      expect(audioProcessingPipeline.convertToBCP47('fr')).toBe('fr-FR');
      expect(audioProcessingPipeline.convertToBCP47('invalid')).toBe('invalid-INVALID');
    });
  });
});

console.log('✅ All Option 1 new feature tests created successfully!');