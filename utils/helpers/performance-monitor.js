// utils/helpers/performance-monitor.js
const winston = require('winston');

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'whatsapp-voice-translation' },
  transports: [
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: './logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// In-memory metrics store
const metrics = {
  requests: 0,
  translations: 0,
  errors: 0,
  processingTimes: [],
  timestamp: new Date().toISOString()
};

/**
 * Logs processing time for performance monitoring
 * @param {string} operation - The operation being measured
 * @param {number} timeMs - Time taken in milliseconds
 */
const logProcessingTime = (operation, timeMs) => {
  logger.info(`Operation ${operation} took ${timeMs}ms`);
  if (operation === 'translation') {
    metrics.processingTimes.push(timeMs);
    // Keep only the last 100 measurements
    if (metrics.processingTimes.length > 100) {
      metrics.processingTimes.shift();
    }
  }
};

/**
 * Gets current metrics
 * @returns {Object} Current metrics
 */
const getMetrics = () => {
  // Calculate average processing time
  const avgProcessingTime = metrics.processingTimes.length 
    ? metrics.processingTimes.reduce((a, b) => a + b, 0) / metrics.processingTimes.length 
    : 0;
  
  return {
    ...metrics,
    avgProcessingTime: parseFloat(avgProcessingTime.toFixed(2)),
    timestamp: new Date().toISOString()
  };
};

/**
 * Increments request counter
 */
const incrementRequest = () => {
  metrics.requests++;
};

/**
 * Increments translation counter
 */
const incrementTranslation = () => {
  metrics.translations++;
};

/**
 * Increments error counter
 */
const incrementError = () => {
  metrics.errors++;
};

module.exports = {
  logger,
  logProcessingTime,
  getMetrics,
  incrementRequest,
  incrementTranslation,
  incrementError
};