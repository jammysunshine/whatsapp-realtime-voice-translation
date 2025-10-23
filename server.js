const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');

require('dotenv').config();

const { logger } = require('./utils/helpers/performance-monitor');
const monitoring = require('./utils/helpers/monitoring');
const translationQueue = require('./utils/processing/translation-queue');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());
app.use(cors());

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Note: No static files needed as this is a pure webhook integration
// All functionality is through WhatsApp Business API webhooks

// Import routes
const webhookRoutes = require('./routes/webhook');

// Use routes
app.use('/webhook', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Metrics endpoint (Prometheus format)
app.get('/metrics', async (req, res) => {
  try {
    res.setHeader('Content-Type', monitoring.register.contentType);
    const metrics = await monitoring.getMetrics();
    res.status(200).send(metrics);
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Enhanced system status endpoint
app.get('/status', async (req, res) => {
  try {
    const queueStats = await translationQueue.getQueueStats();
    const systemStats = logger.getMetrics();
    
    res.status(200).json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      stats: {
        ...systemStats,
        queue: queueStats
      }
    });
  } catch (error) {
    logger.error('Error getting system status:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Enhanced metrics dashboard endpoint
app.get('/dashboard', async (req, res) => {
  try {
    const metrics = await monitoring.getMetricsForDashboard();
    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Error getting dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to get dashboard metrics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Periodically update queue length metrics
setInterval(async () => {
  try {
    const queueStats = await translationQueue.getQueueStats();
    monitoring.setQueueLength('translation', queueStats.translation.waiting);
    monitoring.setQueueLength('audio', queueStats.audio.waiting);
  } catch (error) {
    // Silently fail, don't spam logs for metrics
  }
}, 5000); // Update every 5 seconds

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Webhook available at /webhook`);
  
  // Log initial queue status
  setTimeout(async () => {
    try {
      const stats = await translationQueue.getQueueStats();
      logger.info('Queue status:', stats);
    } catch (err) {
      logger.error('Error getting queue stats:', err.message);
      logger.warn('Queue system may not be available - check Redis connection');
    }
  }, 2000); // Delay slightly to allow Redis connection to establish

  logger.info(`WhatsApp Translation Service running on port ${PORT}`);
  logger.info(`Webhook endpoint available at /webhook`);
  logger.info(`Configure your WhatsApp Business API webhook to point to your server's /webhook endpoint`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await translationQueue.close();
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await translationQueue.close();
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = { app, server };