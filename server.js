const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const webhookRoutes = require('./routes/webhook');
const translateRoutes = require('./routes/translate');

// Use routes
app.use('/webhook', webhookRoutes);
app.use('/api', translateRoutes);

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

// WebSocket server for real-time communication
const wss = new WebSocket.Server({ server, path: '/ws' });

// Track WebSocket connections
wss.on('connection', (ws, req) => {
  // Update active connections metric
  monitoring.setActiveConnections(wss.clients.size);
  logger.info(`New WebSocket connection from ${req.socket.remoteAddress}. Active connections: ${wss.clients.size}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'Connected to WhatsApp Voice Translation Service'
  }));
  
  ws.on('message', async (message) => {
    const startTime = Date.now();
    
    try {
      const data = JSON.parse(message);
      logger.info(`Received WebSocket message:`, data.type);
      
      // Handle different types of messages
      switch (data.type) {
        case 'status_request':
          // Send current status back to client
          const queueStats = await translationQueue.getQueueStats();
          ws.send(JSON.stringify({
            type: 'status_update',
            message: 'System operational',
            queueStats: queueStats,
            timestamp: new Date().toISOString()
          }));
          
          // Record API response time
          monitoring.observeApiResponseTime('WEBSOCKET', 'status_request', (Date.now() - startTime) / 1000);
          break;
          
        case 'translation_request':
          // Record translation request metric
          monitoring.incrementTranslationCounter('text', data.sourceLanguage, data.targetLanguage);
          
          // Process translation request
          try {
            // Add to queue for processing
            const job = await translationQueue.addTranslationJob(
              data.text,
              data.sourceLanguage,
              data.targetLanguage
            );
            
            // Set queue length metric
            const queueStats = await translationQueue.getQueueStats();
            monitoring.setQueueLength('translation', queueStats.translation.waiting);
            
            // Send acknowledgment
            ws.send(JSON.stringify({
              type: 'job_submitted',
              jobId: job.id,
              message: 'Translation job submitted'
            }));
            
            // Listen for job completion
            const jobStartTime = Date.now();
            job.finished().then(result => {
              // Record duration metric
              monitoring.observeTranslationDuration('text', (Date.now() - jobStartTime) / 1000);
              
              ws.send(JSON.stringify({
                type: 'translation_result',
                jobId: job.id,
                result: result,
                timestamp: new Date().toISOString()
              }));
            }).catch(error => {
              monitoring.incrementErrorCounter('translation_error', 'queue');
              ws.send(JSON.stringify({
                type: 'translation_error',
                jobId: job.id,
                error: error.message,
                timestamp: new Date().toISOString()
              }));
            });
          } catch (error) {
            logger.error('Error processing translation request:', error);
            monitoring.incrementErrorCounter('translation_error', 'processing');
            ws.send(JSON.stringify({
              type: 'error',
              message: error.message
            }));
          }
          
          // Record API response time
          monitoring.observeApiResponseTime('WEBSOCKET', 'translation_request', (Date.now() - startTime) / 1000);
          break;
          
        case 'audio_translation_request':
          // Record translation request metric
          monitoring.incrementTranslationCounter('audio', data.sourceLanguage, data.targetLanguage);
          
          // Process audio translation request
          try {
            // Add audio processing job to queue
            const job = await translationQueue.addAudioJob(
              data.audioBuffer, 
              data.mimeType
            );
            
            // Set queue length metric
            const queueStats = await translationQueue.getQueueStats();
            monitoring.setQueueLength('audio', queueStats.audio.waiting);
            
            // Send acknowledgment
            ws.send(JSON.stringify({
              type: 'job_submitted',
              jobId: job.id,
              message: 'Audio translation job submitted'
            }));
            
            // Listen for job completion
            const jobStartTime = Date.now();
            job.finished().then(async result => {
              // Record duration metric
              monitoring.observeTranslationDuration('audio', (Date.now() - jobStartTime) / 1000);
              
              // Now translate the transcription
              const translationService = require('./services/google/translation');
              const translation = await translationService.translateText(
                result.transcribedText,
                data.targetLanguage,
                data.sourceLanguage
              );
              
              // Convert to speech
              const textToSpeechService = require('./services/google/text-to-speech');
              const ttsResult = await textToSpeechService.synthesizeText(
                translation.translatedText,
                translation.targetLanguage
              );
              
              ws.send(JSON.stringify({
                type: 'audio_translation_result',
                jobId: job.id,
                result: {
                  transcription: result.transcribedText,
                  translation: translation.translatedText,
                  ttsAudio: ttsResult.audioContent.toString('base64'),
                  sourceLanguage: translation.sourceLanguage,
                  targetLanguage: translation.targetLanguage
                },
                timestamp: new Date().toISOString()
              }));
            }).catch(error => {
              monitoring.incrementErrorCounter('audio_translation_error', 'queue');
              ws.send(JSON.stringify({
                type: 'audio_translation_error',
                jobId: job.id,
                error: error.message,
                timestamp: new Date().toISOString()
              }));
            });
          } catch (error) {
            logger.error('Error processing audio translation request:', error);
            monitoring.incrementErrorCounter('audio_translation_error', 'processing');
            ws.send(JSON.stringify({
              type: 'error',
              message: error.message
            }));
          }
          
          // Record API response time
          monitoring.observeApiResponseTime('WEBSOCKET', 'audio_translation_request', (Date.now() - startTime) / 1000);
          break;
          
        default:
          logger.warn(`Unknown WebSocket message type: ${data.type}`);
          monitoring.incrementErrorCounter('unknown_message_type', 'websocket');
          ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${data.type}`
          }));
      }
    } catch (error) {
      logger.error('Error parsing WebSocket message:', error);
      monitoring.incrementErrorCounter('websocket_parse_error', 'websocket');
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    // Update active connections metric
    monitoring.setActiveConnections(wss.clients.size - 1); // -1 because the client is about to disconnect
    logger.info(`WebSocket connection closed. Active connections: ${wss.clients.size - 1}`);
  });
  
  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
    monitoring.incrementErrorCounter('websocket_error', 'connection');
  });
});

// Update metrics when WebSocket connections change
wss.on('connection', () => {
  monitoring.setActiveConnections(wss.clients.size);
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
  logger.info(`WebSocket server initialized at /ws`);
  logger.info(`API available at /api`);
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

module.exports = { app, server, wss };