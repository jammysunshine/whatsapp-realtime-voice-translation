const audioProcessingPipeline = require('../utils/helpers/audio-processing-pipeline');
const speechToTextService = require('../services/google/speech-to-text');
const translationService = require('../services/google/translation');
const textToSpeechService = require('../services/google/text-to-speech');

// Mock the services to avoid external API calls
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

describe('Audio Processing Pipeline Tests', () => {
  const mockAudioBuffer = Buffer.from('mock audio data');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should process audio translation for single language', async () => {
    const result = await audioProcessingPipeline.processAudioTranslation(
      mockAudioBuffer,
      'es'
    );

    expect(result).toHaveProperty('transcription');
    expect(result).toHaveProperty('translation');
    expect(result).toHaveProperty('tts');
    expect(result.transcription.text).toBe('Hello world');
    expect(result.translation.targetLanguage).toBe('es');
  });

  test('should process audio translation with multi-language support', async () => {
    const targetLanguages = ['es', 'fr', 'de'];
    const results = await audioProcessingPipeline.processAudioTranslationMulti(
      mockAudioBuffer,
      targetLanguages
    );

    expect(results).toHaveLength(3); // One for each target language
    results.forEach((result, index) => {
      expect(result).toHaveProperty('transcription');
      expect(result).toHaveProperty('translation');
      expect(result).toHaveProperty('tts');
      expect(result.translation.targetLanguage).toBe(targetLanguages[index]);
    });

    // Verify that the STT service was called only once (for transcription)
    expect(speechToTextService.transcribeWithLanguageDetection).toHaveBeenCalledTimes(1);
    
    // Verify that the translation service was called for each target language
    expect(translationService.translateText).toHaveBeenCalledTimes(3);
  });

  test('should handle source language specification in multi-language processing', async () => {
    const targetLanguages = ['es', 'fr'];
    const results = await audioProcessingPipeline.processAudioTranslationMulti(
      mockAudioBuffer,
      targetLanguages,
      'en'
    );

    expect(results).toHaveLength(2);
    expect(speechToTextService.transcribeAudio).toHaveBeenCalledWith(
      mockAudioBuffer,
      'en-US'  // Should convert 'en' to 'en-US'
    );
  });

  test('should handle errors gracefully in multi-language processing', async () => {
    // Mock an error in the translation service
    translationService.translateText.mockRejectedValueOnce(new Error('Translation API error'));

    await expect(
      audioProcessingPipeline.processAudioTranslationMulti(
        mockAudioBuffer,
        ['es']
      )
    ).rejects.toThrow('Audio Processing Pipeline Error');
  });

  test('should convert language codes to BCP-47 format correctly', async () => {
    // Test the convertToBCP47 method
    const bcp47Result = audioProcessingPipeline.convertToBCP47('es');
    expect(bcp47Result).toBe('es-ES');
  });
});