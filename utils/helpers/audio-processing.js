// utils/helpers/audio-processing.js
const ffmpeg = require('fluent-ffmpeg');
const { Readable } = require('stream');

class AudioProcessor {
  /**
   * Convert audio buffer to a specific format
   * @param {Buffer} audioBuffer - The input audio buffer
   * @param {string} format - Target format (e.g., 'mp3', 'wav', 'ogg')
   * @returns {Promise<Buffer>} - The converted audio buffer
   */
  static async convertFormat(audioBuffer, format = 'wav') {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(audioBuffer);
      inputStream.push(null); // EOF
      
      let outputBuffer = Buffer.alloc(0);
      
      ffmpeg(inputStream)
        .toFormat(format)
        .on('error', (err) => {
          reject(new Error(`FFmpeg error: ${err.message}`));
        })
        .on('data', (data) => {
          outputBuffer = Buffer.concat([outputBuffer, data]);
        })
        .on('end', () => {
          resolve(outputBuffer);
        })
        .run();
    });
  }

  /**
   * Reduce noise in the audio buffer
   * @param {Buffer} audioBuffer - The input audio buffer
   * @returns {Promise<Buffer>} - The noise-reduced audio buffer
   */
  static async reduceNoise(audioBuffer) {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(audioBuffer);
      inputStream.push(null); // EOF
      
      let outputBuffer = Buffer.alloc(0);
      
      ffmpeg(inputStream)
        .audioFilters([
          'highpass=f=200',
          'lowpass=f=3000',
          'afftdn=nf=-25dB'
        ])
        .on('error', (err) => {
          reject(new Error(`FFmpeg noise reduction error: ${err.message}`));
        })
        .on('data', (data) => {
          outputBuffer = Buffer.concat([outputBuffer, data]);
        })
        .on('end', () => {
          resolve(outputBuffer);
        })
        .run();
    });
  }

  /**
   * Normalize audio volume
   * @param {Buffer} audioBuffer - The input audio buffer
   * @returns {Promise<Buffer>} - The volume-normalized audio buffer
   */
  static async normalizeVolume(audioBuffer) {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(audioBuffer);
      inputStream.push(null); // EOF
      
      let outputBuffer = Buffer.alloc(0);
      
      ffmpeg(inputStream)
        .audioFilters(['loudnorm'])
        .on('error', (err) => {
          reject(new Error(`FFmpeg volume normalization error: ${err.message}`));
        })
        .on('data', (data) => {
          outputBuffer = Buffer.concat([outputBuffer, data]);
        })
        .on('end', () => {
          resolve(outputBuffer);
        })
        .run();
    });
  }

  /**
   * Get audio information (duration, sample rate, etc.)
   * @param {Buffer} audioBuffer - The input audio buffer
   * @returns {Promise<Object>} - Audio metadata
   */
  static async getAudioInfo(audioBuffer) {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(audioBuffer);
      inputStream.push(null); // EOF
      
      ffmpeg.ffprobe(inputStream, (err, metadata) => {
        if (err) {
          reject(new Error(`FFmpeg probe error: ${err.message}`));
        } else {
          resolve({
            duration: metadata.format.duration,
            sampleRate: metadata.streams.find(stream => stream.codec_type === 'audio')?.sample_rate,
            channels: metadata.streams.find(stream => stream.codec_type === 'audio')?.channels,
            bitRate: metadata.format.bit_rate
          });
        }
      });
    });
  }

  /**
   * Preprocess audio for Google Cloud Speech-to-Text
   * @param {Buffer} audioBuffer - The input audio buffer
   * @returns {Promise<Buffer>} - The preprocessed audio buffer
   */
  static async preprocessForSTT(audioBuffer) {
    // 1. Get audio info to determine if conversion is needed
    const info = await this.getAudioInfo(audioBuffer);
    
    // 2. Normalize volume
    let processedBuffer = await this.normalizeVolume(audioBuffer);
    
    // 3. Reduce noise
    processedBuffer = await this.reduceNoise(processedBuffer);
    
    // 4. Convert to a format optimal for STT (WAV, 16-bit, 16kHz)
    // Google Cloud Speech-to-Text works best with LINEAR16 format
    processedBuffer = await this.convertFormat(processedBuffer, 'wav');
    
    return processedBuffer;
  }

  /**
   * Calculate audio duration from buffer
   * @param {Buffer} audioBuffer - The input audio buffer
   * @returns {Promise<number>} - Duration in seconds
   */
  static async getDuration(audioBuffer) {
    const info = await this.getAudioInfo(audioBuffer);
    return parseFloat(info.duration);
  }
}

module.exports = AudioProcessor;