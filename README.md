# WhatsApp Real-Time Voice Translation

A real-time voice translation system that integrates with WhatsApp to provide instant language translation for voice messages.

## Overview

This system receives voice messages from WhatsApp, converts them to text using Google Cloud Speech-to-Text, translates the text to multiple languages using Google Cloud Translation API, and sends the translated response back to the user via WhatsApp.

## Features

- Real-time voice message processing
- Automatic speech recognition (ASR)
- Multi-language translation
- WhatsApp Business API integration
- WebSocket support for real-time communication
- Performance monitoring
- Audio quality enhancement

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

1. Start the server:
```bash
npm run dev
```

or for production:
```bash
npm start
```

2. Configure your WhatsApp webhook to point to your server's `/webhook` endpoint.

## Architecture

The system consists of the following components:
- Express.js server for handling webhooks
- WebSocket server for real-time communication
- Google Cloud Speech-to-Text service
- Google Cloud Translation service
- Google Cloud Text-to-Speech service
- WhatsApp Business API integration
- Audio processing pipeline

## API Endpoints

- `GET /webhook` - Webhook verification
- `POST /webhook` - Receive WhatsApp messages
- `GET /health` - Health check
- `GET /metrics` - Performance metrics

## Technologies Used

- Node.js/Express.js
- Google Cloud Speech-to-Text API
- Google Cloud Translation API
- Google Cloud Text-to-Speech API
- WebSocket
- Redis
- Bull Queue
- FFmpeg for audio processing
- Winston for logging

## License

ISC