// config/index.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  google: {
    projectId: process.env.GCP_TRANSLATION_PROJECT_ID,
    keyFilename: process.env.GCP_TRANSLATION_KEY_FILE || null, // For local development
    credentials: process.env.GCP_TRANSLATION_CREDENTIALS ? JSON.parse(process.env.GCP_TRANSLATION_CREDENTIALS) : null
  },
  whatsapp: {
    webhookVerifyToken: process.env.WHATSAPP_VOICE_TRANSLATE_VERIFY_TOKEN,
    accessToken: process.env.WHATSAPP_VOICE_TRANSLATE_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_VOICE_TRANSLATE_PHONE_ID
  },
  redis: {
    url: process.env.VOICE_TRANSLATE_REDIS_URL || 'redis://localhost:6379'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: {
      filename: process.env.LOG_FILE || './logs/app.log',
      maxsize: 10000000, // 10MB
      maxFiles: 5
    }
  }
};