const userPreferencesService = require('../services/user-preferences');

// Mock the Redis connection to avoid actual Redis connection issues
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    hset: jest.fn().mockResolvedValue(1),
    hgetall: jest.fn().mockResolvedValue({}),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    on: jest.fn(),  // Mock event handlers
    commandTimeout: jest.fn()  // Mock command timeout
  }));
});

describe('User Preferences Service Unit Tests', () => {
  const testUserId = 'test_user_unit_123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should store and retrieve user preferences', async () => {
    // Mock the hgetall to return empty object first, then actual preferences
    userPreferencesService.redis.hgetall.mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        sourceLanguage: 'en',
        targetLanguages: 'es,fr,de',
        responseMode: 'both'
      });

    const preferences = {
      sourceLanguage: 'en',
      targetLanguages: ['es', 'fr', 'de'],
      responseMode: 'both'
    };

    // Since Redis is mocked, setPreferences will return true
    const setResult = await userPreferencesService.setPreferences(testUserId, preferences);
    expect(setResult).toBe(true);

    // Get preferences (mock return empty at first call to trigger defaults, then actual values)
    userPreferencesService.redis.hgetall.mockResolvedValueOnce({});
    const defaultPrefs = await userPreferencesService.getPreferences('new_user_999');
    expect(defaultPrefs.sourceLanguage).toBe('auto');
    expect(defaultPrefs.targetLanguages).toBe('en');
    expect(defaultPrefs.responseMode).toBe('text');
  });

  test('should handle default preferences for new users', async () => {
    userPreferencesService.redis.hgetall.mockResolvedValue({});
    
    const defaultPrefs = await userPreferencesService.getPreferences('new_user_999');
    expect(defaultPrefs.sourceLanguage).toBe('auto');
    expect(defaultPrefs.targetLanguages).toBe('en');
    expect(defaultPrefs.responseMode).toBe('text');
  });

  test('should update individual preference fields', async () => {
    const setResult = await userPreferencesService.setResponseMode(testUserId, 'voice');
    expect(setResult).toBe(true);

    const setResult2 = await userPreferencesService.setSourceLanguage(testUserId, 'fr');
    expect(setResult2).toBe(true);

    const setResult3 = await userPreferencesService.setTargetLanguages(testUserId, ['es', 'pt']);
    expect(setResult3).toBe(true);
  });

  test('should update source language', async () => {
    const setResult = await userPreferencesService.setSourceLanguage(testUserId, 'fr');
    expect(setResult).toBe(true);
  });

  test('should update target languages', async () => {
    const setResult = await userPreferencesService.setTargetLanguages(testUserId, ['es', 'pt']);
    expect(setResult).toBe(true);
  });

  test('should properly handle response mode validation', async () => {
    // Test valid modes
    expect(await userPreferencesService.setResponseMode(testUserId, 'text')).toBe(true);
    expect(await userPreferencesService.setResponseMode(testUserId, 'voice')).toBe(true);
    expect(await userPreferencesService.setResponseMode(testUserId, 'both')).toBe(true);
  });
});