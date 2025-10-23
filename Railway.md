# Railway Deployment Configuration

This project is ready for deployment to Railway, a cloud platform that offers a generous free tier suitable for this WhatsApp translation service.

## Deployment Steps:

1. **Sign up for Railway** at https://railway.app
2. **Install Railway CLI** (if you want to deploy from terminal):
   ```bash
   npm install -g @railway/cli
   ```
3. **Deploy from GitHub**:
   - Connect your GitHub repository to Railway
   - Railway will automatically detect this as a Node.js app
   - Add your environment variables in the Railway dashboard

## Environment Variables Required:

```
GOOGLE_CLOUD_PROJECT_ID=your-google-project-id
GOOGLE_CLOUD_KEY_FILE=your-service-account-json-string
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
REDIS_URL=your-redis-url # Railway provides Redis addon
PORT=your-port # Railway sets this automatically
```

## Railway Configuration:

The server is already configured to work with Railway:
- Uses PORT environment variable
- Uses external Redis service (which Railway provides)
- Properly handles environment variables
- Health check available at /health
- Metrics available at /metrics and /dashboard

## Important Notes:

- Make sure your Google Cloud service account key is properly encoded if stored as an environment variable
- The webhook URL will be: https://your-app-name-production.up.railway.app/webhook
- WhatsApp requires HTTPS for webhooks, which Railway provides
- Add Redis as an addon in Railway for the queue system to work