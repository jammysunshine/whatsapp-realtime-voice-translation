# WhatsApp Voice Bot - Real-time Language Translation Project Prompt

## Project Goal

Create a Node.js-based WhatsApp Business API integration that functions as a real-time language translation bot using only free or generously free-tier services. The bot will receive voice messages (voice notes) from WhatsApp users, convert them to text using Speech-to-Text (STT) services in real-time, translate the text to multiple target languages (English, Arabic, Hindi, Spanish, French, Portuguese) with minimal latency, and respond with the translations via WhatsApp within seconds of receiving the voice message - all while operating within free tier limitations.

## Core Features

1. **Real-time WhatsApp Webhook Integration**: Receive messages (specifically voice notes) from WhatsApp via webhooks with immediate processing using free-tier compatible solutions
2. **Real-time Voice Note Processing**: Download and process incoming voice notes using STT services with optimized performance within free tier limitations
3. **Automatic Language Detection**: Identify the language of the incoming voice note using advanced language identification algorithms with free-tier services
4. **Real-time Multi-Language Translation**: Translate the transcribed text to English, Arabic, Hindi, Spanish, French, and Portuguese with minimal latency using free-tier translation APIs
5. **Real-time WhatsApp Response**: Send back translations formatted appropriately for WhatsApp with sub-second response times using only free-tier WhatsApp Business API
6. **Real-time Webhook Validation**: Implement proper webhook validation to secure the endpoint with minimal latency impact using free-tier compatible security measures
7. **Real-time Media Handling**: Efficiently download, process, and clean up media files with streaming capabilities using free-tier storage and bandwidth
8. **Real-time Performance Monitoring**: Track processing times, latency, and system health with live metrics using free-tier monitoring tools
9. **Concurrent Voice Processing**: Handle multiple simultaneous voice notes from different users without blocking within free-tier concurrency limits
10. **Real-time Error Recovery**: Graceful degradation when services are unavailable with fallback options using only free-tier redundant services

## Architectural Decisions

### Backend (Node.js/Express Server with WebSocket Integration)
* **Framework**: Express.js for creating the webhook endpoint with WebSocket support for real-time updates
* **Performance**: Use async/await patterns and promise-based operations for non-blocking execution
* **Security**: All WhatsApp Business API keys and tokens stored securely in environment variables with encryption
* **Service Structure**:
    * `/webhook` (GET/POST) - Handles WhatsApp webhook validation and message processing
    * `/api/translate` (POST) - Processes voice notes and returns translations
    * `/health` (GET) - Real-time health monitoring endpoint
    * `/metrics` (GET) - Performance metrics endpoint
* **Configuration**: Implement a configuration module (e.g., `lib/config.js`) with environment-specific settings for different performance tiers
* **WhatsApp Integration**: Use WhatsApp Business API for sending/receiving messages with connection pooling
* **STT Integration**: Integrate with Google Cloud Speech-to-Text API with streaming recognition for real-time processing
* **Translation**: Integrate with Google Cloud Translation API with batch processing capabilities

### Real-time Processing Architecture
* **Message Queues**: Implement Redis or RabbitMQ for handling concurrent voice note processing
* **Streaming Processing**: Use streaming APIs for continuous audio processing without waiting for full download
* **Caching Layer**: Implement Redis for caching frequent translations and language detection results
* **Load Balancing**: Support horizontal scaling to handle high volume of concurrent requests
* **Connection Pooling**: Efficient management of API connections to prevent rate limiting issues

### WhatsApp Business API Integration (Real-time Optimized)
* **Webhook Setup**: Configure webhooks with optimized response times under 500ms
* **Message Processing**: Parse different message types (voice notes, text, etc.) with priority queuing
* **Media Download**: Streaming download of voice note files from WhatsApp's media servers
* **Response Formatting**: Optimize response formatting for minimal processing time
* **Real-time Status Updates**: Send typing indicators and read receipts immediately

### Cloud Services (Optimized for Speed)
* **STT**: Google Cloud Speech-to-Text API with streaming recognition (Speech API streaming) for real-time transcription
* **Translation**: Google Cloud Translation API with batch and streaming capabilities
* **Real-time Analytics**: Implement monitoring with Prometheus/Grafana for performance metrics
* **Caching**: Redis for temporary storage of frequently accessed data

## Technology Stack (Free-Tier Compliant)

* **Backend**: Node.js with Express.js (free)
* **Real-time Communication**: WebSocket for real-time status updates (built-in, free)
* **WhatsApp Integration**: WhatsApp Business API (Cloud API) with connection pooling (free tier available)
* **STT Service**: @google-cloud/speech with streaming capabilities (Google Cloud free tier: 60 minutes/month)
* **Translation Service**: @google-cloud/translate with batch processing (Google Cloud free tier: 500,000 characters/month)
* **Message Queuing**: Bull/Queue with Redis for managing concurrent processing (Redis free tier available)
* **Caching**: Redis for response caching and session management (free tier available from multiple providers)
* **Real-time Monitoring**: Custom metrics system with built-in Node.js monitoring (free)
* **Environment Management**: dotenv for environment variable handling (free)
* **Logging**: Winston with real-time logging capabilities and log rotation (free)
* **Deployment Target**: Railway with free tier (500 hours/month) or other free-tier platforms
* **Database**: Redis for caching and session management (free tier available)
* **Media Processing**: FFmpeg-static for audio format conversion if needed (open source, free)

## Free-Tier Mandate Enforcement

All technology choices must operate exclusively within free tier limitations:
* Google Cloud services must stay within monthly free quotas
* Deployment platforms must use free tier resources only
* Third-party services must have generous free tiers that support production usage
* Storage and bandwidth must remain within free tier limits
* API calls must be optimized to stay within free quota restrictions

## Performance Requirements (Free-Tier Constrained)

* **Response Time**: < 3 seconds from voice note receipt to translation response (accounting for free-tier API limitations)
* **Concurrent Users**: Support 20-50 simultaneous voice note processing (within free tier concurrency limits)
* **Throughput**: Process 10-25 voice notes per minute (optimized for free tier quotas)
* **API Latency**: STT API calls < 2 seconds average (considering free tier throttling)
* **Translation Latency**: Translation API calls < 1 second average (optimized for free tier usage)
* **System Utilization**: < 70% CPU under peak load (Railway/Vercel free tier constraints)
* **Memory Usage**: Efficient memory management with proper cleanup (limited by free tier memory allocation)
* **Bandwidth**: Optimized to stay within free tier bandwidth limits
* **Storage**: Temporary file storage optimized for free tier storage limits

## Deliverables

* `server.js` or `app.js` - Main Express.js application with webhook handling and real-time capabilities
* `lib/config.js` - Central configuration module for provider abstraction with performance settings
* `lib/services/whatsapp.js` - WhatsApp Business API service abstraction with connection pooling
* `lib/services/google/SpeechToText.js` - Real-time Google Cloud Speech-to-Text service implementation
* `lib/services/google/Translation.js` - Optimized Google Cloud Translation API implementation
* `lib/services/queue.js` - Message queuing system for concurrent processing
* `routes/webhook.js` - Optimized webhook handling routes
* `utils/mediaHandler.js` - Real-time media file download and processing utilities with streaming
* `utils/responseFormatter.js` - WhatsApp-specific response formatting utilities
* `utils/performanceMonitor.js` - Real-time performance monitoring utilities
* `package.json` and `package-lock.json` - With all necessary Node.js dependencies for real-time processing
* `.env.example` - Example file for environment variables
* `.gitignore` - A file specifically configured to track only source code
* `README.md` - Comprehensive documentation with setup, usage, and performance optimization instructions
* `Dockerfile` - Containerized application for consistent deployment
* `docker-compose.yml` - Multi-service orchestration including Redis

## Constraints & Guidelines (Free-Tier Enforced)

* **Security**: WhatsApp webhook validation must be implemented to verify incoming requests are from WhatsApp with sub-100ms validation time using only free-tier compatible security measures
* **Real-time Media Handling**: Streaming download and processing of media files to minimize latency while staying within free-tier bandwidth limits
* **Environment Variables**: All API keys and sensitive configuration must be stored in environment variables with encryption using free-tier tools only
* **Error Handling**: Implement comprehensive error handling for network issues, API errors, etc. with fallback mechanisms that work within free-tier constraints
* **Rate Limiting**: Implement intelligent rate limiting with dynamic adjustment based on API response times to stay within free-tier quotas
* **Audio Format Support**: Real-time transcoding of various audio formats that may be sent via WhatsApp using free-tier processing power
* **Message Size**: Consider WhatsApp's message size limits when sending responses with optimized formatting to conserve bandwidth within free-tier limits
* **Message Threading**: Ensure responses are sent to the correct conversation thread with proper session management using free-tier storage
* **Privacy Compliance**: Handle user data in compliance with privacy regulations with data encryption using free-tier encryption tools
* **Concurrent Processing**: Implement proper queuing mechanism to handle multiple requests simultaneously without blocking while respecting free-tier concurrency limits
* **Memory Management**: Efficient memory usage with proper cleanup of temporary files and streaming data within free-tier memory allocation
* **Scalability**: Design system architecture to support horizontal scaling using free-tier deployment platforms only
* **Cost Control**: All services must operate exclusively within free-tier limitations with no paid services or premium features

## WhatsApp Business API Specific Requirements (Real-time Optimized)

1. **Real-time Webhook Verification**: Implement optimized GET verification for webhook setup with <50ms response time
2. **Real-time Message Parsing**: Parse incoming message structure according to WhatsApp Business API format with streaming processing
3. **Real-time Media URLs**: Handle media URLs provided by WhatsApp to download voice notes with streaming capability
4. **Real-time Response Structure**: Format responses according to WhatsApp message format specifications with minimal processing
5. **Real-time Message Acknowledgment**: Properly acknowledge receipt of messages instantly to prevent reprocessing
6. **Real-time Status Updates**: Send typing indicators and status updates immediately upon receiving voice notes

## Expected User Flow (Real-time)

1. User sends a voice note to the WhatsApp Business API number
2. WhatsApp sends a webhook notification to the `/webhook` endpoint within 100ms
3. Application immediately sends typing indicator to user
4. Application streams download of the voice note from WhatsApp's media servers
5. Application converts the voice note to text using real-time STT (streaming API)
6. Application simultaneously translates the text to multiple target languages
7. Application sends back the translated text as a message reply to the user within 2 seconds
8. Optional: Application sends original transcription as well with confidence scores
9. Application sends read receipt when processing is complete

## Error Handling Requirements (Real-time)

* Network errors when downloading media with streaming retry mechanisms
* STT service errors or timeouts with fallback algorithms
* Translation API errors or rate limiting with cache fallbacks
* WhatsApp API errors when sending responses with retry queue
* Invalid or corrupted media files with real-time error detection
* Unsupported audio formats with dynamic transcoding
* Webhook validation failures with automatic recovery
* Missing or invalid environment variables with graceful degradation
* Memory overflow during processing with streaming cleanup
* Concurrent processing bottlenecks with dynamic queue management

## Performance Considerations (Real-time Focus)

* Audio processing should be performed using streaming to minimize wait times
* Implement connection pooling for API calls to reduce connection overhead
* Cache frequently used API responses where applicable
* Optimize media file processing with streaming APIs to eliminate full download waits
* Monitor API usage and response times to optimize performance
* Use Redis for caching of frequent translations and language detection results
* Implement health checks with auto-restart mechanisms
* Use compression for data transmission where possible
* Optimize database queries (if any) for minimal latency
* Implement circuit breaker patterns for resilient API calls

## Monitoring & Observability Requirements

* Real-time processing time metrics with sub-second resolution
* API response time monitoring with alerting for degradation
* Concurrent processing capacity monitoring
* Memory and CPU usage tracking with alerting
* Error rate monitoring with automatic escalation
* Throughput metrics with performance trend analysis
* User experience metrics (response time per user)
* Resource utilization monitoring for auto-scaling decisions
* Transaction tracing for debugging performance bottlenecks

## Advanced Features

* **Voice Activity Detection**: Skip silent portions of voice notes to reduce processing time
* **Confidence Scoring**: Include confidence scores with translations for quality indication
* **Conversation Context**: Maintain conversation context for better translation accuracy
* **User Preferences**: Store user language preferences for personalized experience
* **Real-time Status**: Send real-time processing status updates to users
* **Offline Processing**: Queue messages during high load with priority scheduling
* **Adaptive Translation**: Learn user preferences and optimize frequently used translations
* **Multi-modal Output**: Support text and voice response options based on user preference
* **Automatic Language Detection**: Automatically detect the language being spoken to reduce user interaction
* **Latency Optimization**: Implement streaming for real-time processing to reduce delay
* **Audio Quality Enhancement**: Include noise reduction and audio enhancement features
* **Connection Resilience**: Add reconnection logic for network interruptions
* **Caching Mechanism**: Cache frequently translated phrases to improve response time
* **Security Enhancements**: Implement authentication and encryption for secure communications
* **Fallback Mechanisms**: Include fallback options if any Google Cloud service is unavailable
* **WhatsApp-like Interface**: Create a user-friendly interface similar to WhatsApp for easy user experience

## Additional Architectural Considerations

* **Audio Processing Pipeline**: Implement a robust pipeline for audio preprocessing, including noise reduction and format conversion
* **Real-time Performance Monitoring**: Track processing times, latency, and system health with live metrics
* **Concurrent Processing Architecture**: Handle multiple simultaneous voice notes from different users without blocking
* **Error Recovery System**: Implement graceful degradation when services are unavailable with fallback options