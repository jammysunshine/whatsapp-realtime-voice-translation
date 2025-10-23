// utils/helpers/monitoring.js
const client = require('prom-client');
const { logger } = require('./performance-monitor');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add default metrics
require('prom-client').collectDefaultMetrics({
  register,
  prefix: 'whatsapp_translation_'
});

// Define custom metrics
const translationCounter = new client.Counter({
  name: 'whatsapp_translation_requests_total',
  help: 'Total number of translation requests',
  labelNames: ['type', 'source_language', 'target_language']
});

const translationDuration = new client.Histogram({
  name: 'whatsapp_translation_duration_seconds',
  help: 'Duration of translation requests',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30] // 0.1s, 0.5s, 1s, 2s, 5s, 10s, 30s
});

const apiResponseTime = new client.Histogram({
  name: 'whatsapp_api_response_time_seconds',
  help: 'Response time of API endpoints',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5] // 10ms, 50ms, 100ms, 500ms, 1s, 2s, 5s
});

const activeConnections = new client.Gauge({
  name: 'whatsapp_active_websocket_connections',
  help: 'Number of active WebSocket connections'
});

const queueLength = new client.Gauge({
  name: 'whatsapp_queue_length',
  help: 'Current queue length for processing tasks',
  labelNames: ['queue_type']
});

const errorCounter = new client.Counter({
  name: 'whatsapp_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'source']
});

// Register the metrics
register.registerMetric(translationCounter);
register.registerMetric(translationDuration);
register.registerMetric(apiResponseTime);
register.registerMetric(activeConnections);
register.registerMetric(queueLength);
register.registerMetric(errorCounter);

// Function to increment translation counter
function incrementTranslationCounter(type, sourceLanguage, targetLanguage) {
  translationCounter.inc({
    type: type,
    source_language: sourceLanguage || 'unknown',
    target_language: targetLanguage || 'unknown'
  });
}

// Function to observe translation duration
function observeTranslationDuration(type, duration) {
  translationDuration.observe({ type: type }, duration);
}

// Function to observe API response time
function observeApiResponseTime(method, route, duration) {
  apiResponseTime.observe({
    method: method,
    route: route
  }, duration);
}

// Function to set active WebSocket connections count
function setActiveConnections(count) {
  activeConnections.set(count);
}

// Function to set queue length
function setQueueLength(queueType, length) {
  queueLength.set({ queue_type: queueType }, length);
}

// Function to increment error counter
function incrementErrorCounter(type, source) {
  errorCounter.inc({
    type: type,
    source: source
  });
}

// Function to get metrics in text format for Prometheus endpoint
function getMetrics() {
  return register.metrics();
}

// Function to get metrics for display in dashboard
async function getMetricsForDashboard() {
  const metrics = {
    counters: {},
    histograms: {},
    gauges: {},
    summaries: {}
  };

  // Get all metrics and parse them for dashboard display
  // This would typically involve parsing the Prometheus text format
  // For now, we'll return the raw metrics and a summary
  return {
    timestamp: new Date().toISOString(),
    activeConnections: activeConnections.get() ? activeConnections.get().value : 0,
    totalTranslations: translationCounter.get() ? translationCounter.get().values.reduce((sum, val) => sum + val.value, 0) : 0,
    metricsText: await register.metrics()
  };
}

module.exports = {
  register,
  incrementTranslationCounter,
  observeTranslationDuration,
  observeApiResponseTime,
  setActiveConnections,
  setQueueLength,
  incrementErrorCounter,
  getMetrics,
  getMetricsForDashboard
};