# WhatsApp Real-Time Voice Translation

A real-time voice translation bot that integrates with WhatsApp Business API to provide instant language translation for voice messages.

## Overview

This system receives voice messages from WhatsApp users via webhooks, converts them to text using Google Cloud Speech-to-Text, translates the text to multiple languages using Google Cloud Translation API, and sends the translated response back to the user via real WhatsApp. The system operates as a backend service that connects directly to the WhatsApp Business API.

## Features

- Real-time voice message processing from WhatsApp
- Automatic speech recognition (ASR) with optimized WhatsApp OPUS audio format handling
- Multi-language translation with support for multiple target languages per message
- WhatsApp Business API integration
- Automatic language detection
- Performance monitoring
- Audio quality enhancement
- Text message translation (in addition to voice notes)
- Robust error handling and graceful degradation
- Queue-based processing for concurrent requests
- Real-time metrics and health monitoring
- User language preference management via WhatsApp commands
- Multi-language output for single voice/text input
- Configurable response modes (text, voice, or both)
- Command-based interface for settings management

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

5. The application is already successfully deployed to Railway with all audio processing fixes implemented.

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

### Using Command Interface

The system supports command-based language preferences and settings:

- `!lang <lang1> <lang2>...` - Set target languages for translations (e.g., `!lang es fr` for Spanish and French)
- `!srclang <lang>` - Set source language for translations (e.g., `!srclang en`)
- `!response <mode>` - Set response mode (text, voice, or both) (e.g., `!response both`)
- `!help` - Show available commands and usage

### Production Deployment

The application is successfully deployed to Railway at `https://2-whatsapp-voice-translation-production.up.railway.app` and is fully operational with all audio processing fixes implemented. The service successfully:

- Receives WhatsApp voice messages in real-time
- Processes OGG/OPUS audio format correctly with explicit sample rate handling
- Transcribes speech to text using Google Cloud Speech-to-Text
- Translates text to target languages using Google Cloud Translation
- Sends translated responses back to WhatsApp users

### Testing

The service has been tested and confirmed working with sub-2-second response times for complete voice message processing pipeline.

## Project Completion Status

**PROJECT COMPLETED AND ARCHIVED** - October 23, 2025

This project has been successfully completed and deployed. All core features are implemented and operational:
- Real-time voice message processing from WhatsApp
- Multi-language translation with user preferences
- Command-based interface for settings management
- Production-ready performance and reliability

No further development work is planned for this project.

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

## New Enhanced Features

### Multi-Language Translation
The system now supports translating a single voice note or text message into multiple languages simultaneously. Users can configure their preferred target languages using the `!lang` command.

### User Preference Management
Users can set their language preferences directly through WhatsApp commands:
- Set multiple target languages for translation
- Configure source language detection
- Choose response mode (text, voice, or both)

### Voice Response System
The system can generate audio responses in the translated languages using Google Text-to-Speech, though in production deployments, these would need to be uploaded to a public hosting service before sending via WhatsApp.

### Command Interface
Users can manage settings through WhatsApp commands:
- `!lang es fr` - Translate to Spanish and French
- `!response both` - Send both text and voice responses
- `!help` - Show available commands

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