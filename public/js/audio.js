// public/js/audio.js
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
        this.audioContext = null;
        this.analyser = null;
        this.javascriptNode = null;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.recordBtn = document.getElementById('record-btn');
        this.statusText = document.getElementById('status-text');
    }

    setupEventListeners() {
        // Record button events
        this.recordBtn.addEventListener('mousedown', () => this.startRecording());
        this.recordBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        
        // Stop recording when mouse/touch is released anywhere on the page
        document.addEventListener('mouseup', () => this.stopRecording());
        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording();
        });
    }

    async startRecording() {
        try {
            this.statusText.textContent = 'Recording...';
            this.recordBtn.classList.add('recording');
            
            // Get audio stream from microphone
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create media recorder
            this.mediaRecorder = new MediaRecorder(this.stream);
            
            // Collect audio data chunks
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            // When recording stops, process the audio
            this.mediaRecorder.onstop = () => {
                this.processAudio();
            };
            
            // Start recording
            this.audioChunks = [];
            this.mediaRecorder.start();
            this.isRecording = true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.statusText.textContent = 'Microphone access denied';
            this.recordBtn.classList.remove('recording');
        }
    }

    stopRecording() {
        if (this.isRecording && this.mediaRecorder && this.stream) {
            this.mediaRecorder.stop();
            
            // Stop all tracks in the stream
            this.stream.getTracks().forEach(track => track.stop());
            
            this.isRecording = false;
            this.recordBtn.classList.remove('recording');
        }
    }

    async processAudio() {
        if (this.audioChunks.length === 0) {
            this.statusText.textContent = 'No audio recorded';
            return;
        }

        this.statusText.textContent = 'Processing audio...';
        
        // Create a blob from the audio chunks
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Convert blob to ArrayBuffer for sending
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        // Send the audio to the server for processing
        await this.sendAudioForTranslation(arrayBuffer, audioBlob.type);
    }

    async sendAudioForTranslation(audioData, mimeType) {
        try {
            // Prepare form data
            const formData = new FormData();
            const audioFile = new File([audioData], 'recording.webm', { type: mimeType });
            formData.append('audio', audioFile);
            
            // Get selected languages
            const sourceLanguage = document.getElementById('source-language').value;
            const targetLanguage = document.getElementById('target-language').value;
            
            // Add language information
            formData.append('sourceLanguage', sourceLanguage);
            formData.append('targetLanguage', targetLanguage);
            
            // Send to server
            const response = await fetch('/api/translate', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                this.displayTranslation(result);
                this.statusText.textContent = 'Translation complete';
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error sending audio for translation:', error);
            this.statusText.textContent = 'Translation failed';
        }
    }

    displayTranslation(result) {
        const chatMessages = document.getElementById('chat-messages');
        
        // Add original message
        const originalMessage = document.createElement('div');
        originalMessage.className = 'message outgoing';
        originalMessage.innerHTML = `
            <p>${result.originalText}</p>
            <span class="timestamp">${new Date().toLocaleTimeString()}</span>
        `;
        
        // Add translated message
        const translatedMessage = document.createElement('div');
        translatedMessage.className = 'message incoming';
        translatedMessage.innerHTML = `
            <p>${result.translatedText}</p>
            <span class="timestamp">${new Date().toLocaleTimeString()}</span>
        `;
        
        chatMessages.appendChild(originalMessage);
        chatMessages.appendChild(translatedMessage);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Initialize the audio recorder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.audioRecorder = new AudioRecorder();
});