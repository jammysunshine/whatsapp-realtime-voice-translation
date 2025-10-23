# WhatsApp Real-Time Voice Translation

A real-time voice translation bot that integrates with WhatsApp Business API to provide instant language translation for voice messages.

## Overview

This system receives voice messages from WhatsApp users via webhooks, converts them to text using Google Cloud Speech-to-Text, translates the text to multiple languages using Google Cloud Translation API, and sends the translated response back to the user via real WhatsApp. The system operates as a backend service that connects directly to the WhatsApp Business API.

## Features

- Real-time voice message processing from WhatsApp
- Automatic speech recognition (ASR)
- Multi-language translation
- WhatsApp Business API integration
- Automatic language detection
- Performance monitoring
- Audio quality enhancement
- Text message translation (in addition to voice notes)

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Google Cloud account with Speech-to-Text, Translation and Text-to-Speech APIs enabled
- WhatsApp Business Account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd whatsapp-realtime-voice-translation
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your Google Cloud and WhatsApp credentials.

## Usage

1. Set up your WhatsApp Business Account and obtain the required credentials (access token, phone number ID)

2. Start the server:
```bash
npm run dev
```

or for production:
```bash
npm start
```

3. Configure your WhatsApp webhook to point to your server's `/webhook` endpoint with the verification token you specify in your environment variables.

4. The system will automatically process incoming voice and text messages from WhatsApp users, translate them, and send responses back to the users.

## Architecture

The system consists of the following components:
- Express.js server for handling WhatsApp webhooks
- Google Cloud Speech-to-Text service
- Google Cloud Translation service
- Google Cloud Text-to-Speech service
- WhatsApp Business API integration
- Audio processing pipeline
- Message queue for handling concurrent requests

## API Endpoints

- `GET /webhook` - Webhook verification
- `POST /webhook` - Receive WhatsApp messages from the WhatsApp Business API
- `GET /health` - Health check
- `GET /metrics` - Performance metrics

## Technologies Used

- Node.js/Express.js
- Google Cloud Speech-to-Text API
- Google Cloud Translation API
- Google Cloud Text-to-Speech API
- WhatsApp Business API
- Redis
- Bull Queue
- FFmpeg for audio processing
- Winston for logging

## Deployment

### Railway (Recommended)

The application is configured for easy deployment to Railway:

1. Sign up at [Railway](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables in the Railway dashboard:
   - `GOOGLE_CLOUD_PROJECT_ID`
   - `GOOGLE_CLOUD_KEY_FILE` (as a JSON string)
   - `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `REDIS_URL`
4. Add a Redis addon through Railway
5. Deploy the application

### Environment Configuration

When deploying to any platform, ensure these environment variables are set:
```
GOOGLE_CLOUD_PROJECT_ID=your-google-project-id
GOOGLE_CLOUD_KEY_FILE=your-service-account-json-string
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
REDIS_URL=your-redis-connection-string
PORT=3000  # Usually set by the platform
```

## License

ISC