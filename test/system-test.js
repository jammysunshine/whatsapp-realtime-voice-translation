const axios = require('axios');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';

// Test function to verify the system is working
async function runTests() {
  console.log('Starting system tests...\n');
  
  try {
    // Test 1: Health check
    console.log('Test 1: Checking health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log(`✓ Health check: ${healthResponse.data.status}\n`);
    
    // Test 2: Metrics endpoint
    console.log('Test 2: Checking metrics endpoint...');
    const metricsResponse = await axios.get(`${BASE_URL}/metrics`);
    console.log(`✓ Metrics retrieved, timestamp: ${metricsResponse.data.timestamp}\n`);
    
    // Test 3: Status endpoint
    console.log('Test 3: Checking system status endpoint...');
    const statusResponse = await axios.get(`${BASE_URL}/status`);
    console.log(`✓ System status: ${statusResponse.data.status}\n`);
    
    // Test 4: Check if Google services can be imported (simulated)
    console.log('Test 4: Verifying Google Cloud services...');
    const speechToTextService = require('./services/google/speech-to-text');
    const translationService = require('./services/google/translation');
    const textToSpeechService = require('./services/google/text-to-speech');
    console.log('✓ Google Cloud services loaded successfully\n');
    
    // Test 5: Check supported languages
    console.log('Test 5: Checking supported languages...');
    const languagesResponse = await axios.get(`${BASE_URL}/api/languages`);
    console.log(`✓ Retrieved ${languagesResponse.data.languages.length} supported languages\n`);
    
    // Test 6: Check if audio processing pipeline is working
    console.log('Test 6: Verifying audio processing pipeline...');
    const audioProcessingPipeline = require('./utils/helpers/audio-processing-pipeline');
    console.log('✓ Audio Processing Pipeline loaded successfully\n');
    
    // Test 7: Check if queue system is working
    console.log('Test 7: Verifying queue system...');
    const translationQueue = require('./utils/processing/translation-queue');
    const queueStats = await translationQueue.getQueueStats();
    console.log('✓ Queue system operational');
    console.log('  Translation queue - Waiting:', queueStats.translation.waiting, 
                'Active:', queueStats.translation.active,
                'Completed:', queueStats.translation.completed);
    console.log('  Audio queue - Waiting:', queueStats.audio.waiting, 
                'Active:', queueStats.audio.active,
                'Completed:', queueStats.audio.completed, '\n');
    
    console.log('All tests passed! System is ready for use.');
    console.log('\nTo test the full functionality, you can:');
    console.log('- Open http://localhost:3000 in your browser to use the web interface');
    console.log('- Send webhook requests to http://localhost:3000/webhook');
    console.log('- Use the audio translation API at http://localhost:3000/api/translate');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };