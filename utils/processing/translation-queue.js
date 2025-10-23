// utils/processing/translation-queue.js
const Queue = require('bull');
const config = require('../../config');
const { logger } = require('../helpers/performance-monitor');

class TranslationQueue {
  constructor() {
    // Initialize Bull queue for translation tasks
    this.translationQueue = new Queue('translation tasks', config.redis.url);
    
    // Initialize Bull queue for audio processing tasks
    this.audioQueue = new Queue('audio processing tasks', config.redis.url);
    
    this.setupQueueProcessors();
    this.setupQueueEvents();
  }

  setupQueueProcessors() {
    // Process translation jobs
    this.translationQueue.process('translate', async (job) => {
      logger.info(`Processing translation job: ${job.id}`);
      
      const { text, sourceLanguage, targetLanguage } = job.data;
      
      // This will be replaced with actual Google Translation API call
      // For now, we'll simulate the translation
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      // In a real implementation, we would call the Google Translation API here
      const translatedText = `Translated: ${text} (from ${sourceLanguage} to ${targetLanguage})`;
      
      logger.info(`Completed translation job: ${job.id}`);
      
      return { translatedText, sourceLanguage, targetLanguage };
    });

    // Process audio jobs
    this.audioQueue.process('process-audio', async (job) => {
      logger.info(`Processing audio job: ${job.id}`);
      
      const { audioBuffer, mimeType } = job.data;
      
      // This will be replaced with actual Google Speech-to-Text API call
      // For now, we'll simulate the audio processing
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      // In a real implementation, we would call the Google Speech-to-Text API here
      const transcribedText = 'Simulated transcription of the audio content.';
      
      logger.info(`Completed audio job: ${job.id}`);
      
      return { transcribedText, audioBuffer, mimeType };
    });
  }

  setupQueueEvents() {
    // Log queue events
    this.translationQueue.on('completed', (job) => {
      logger.info(`Translation job ${job.id} completed`);
    });

    this.translationQueue.on('failed', (job, err) => {
      logger.error(`Translation job ${job.id} failed:`, err);
    });

    this.audioQueue.on('completed', (job) => {
      logger.info(`Audio job ${job.id} completed`);
    });

    this.audioQueue.on('failed', (job, err) => {
      logger.error(`Audio job ${job.id} failed:`, err);
    });
  }

  // Add a translation job to the queue
  async addTranslationJob(text, sourceLanguage, targetLanguage) {
    try {
      const job = await this.translationQueue.add(
        'translate',
        { text, sourceLanguage, targetLanguage },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          timeout: 30000
        }
      );
      
      logger.info(`Added translation job to queue: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('Error adding translation job:', error);
      throw error;
    }
  }

  // Add an audio processing job to the queue
  async addAudioJob(audioBuffer, mimeType) {
    try {
      const job = await this.audioQueue.add(
        'process-audio',
        { audioBuffer, mimeType },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          timeout: 60000
        }
      );
      
      logger.info(`Added audio job to queue: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('Error adding audio job:', error);
      throw error;
    }
  }

  // Get queue statistics
  async getQueueStats() {
    const translationWaiting = await this.translationQueue.getWaitingCount();
    const translationActive = await this.translationQueue.getActiveCount();
    const translationCompleted = await this.translationQueue.getCompletedCount();
    const translationFailed = await this.translationQueue.getFailedCount();
    
    const audioWaiting = await this.audioQueue.getWaitingCount();
    const audioActive = await this.audioQueue.getActiveCount();
    const audioCompleted = await this.audioQueue.getCompletedCount();
    const audioFailed = await this.audioQueue.getFailedCount();
    
    return {
      translation: {
        waiting: translationWaiting,
        active: translationActive,
        completed: translationCompleted,
        failed: translationFailed
      },
      audio: {
        waiting: audioWaiting,
        active: audioActive,
        completed: audioCompleted,
        failed: audioFailed
      }
    };
  }

  // Close the queues and Redis connections
  async close() {
    await this.translationQueue.close();
    await this.audioQueue.close();
  }
}

// Create a singleton instance
const translationQueue = new TranslationQueue();

module.exports = translationQueue;