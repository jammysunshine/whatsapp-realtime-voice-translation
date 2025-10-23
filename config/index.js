// config/index.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  google: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || null,
    credentials: process.env.GOOGLE_CLOUD_CREDENTIALS ? JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS) : null
  },
  whatsapp: {
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
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