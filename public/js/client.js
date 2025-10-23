// public/js/client.js
class WhatsAppTranslationClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectInterval = 5000; // 5 seconds
        
        this.initializeWebSocket();
        this.setupUI();
    }
    
    initializeWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('Connected to WebSocket server');
                this.isConnected = true;
                document.getElementById('status-text').textContent = 'Connected';
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('Disconnected from WebSocket server');
                this.isConnected = false;
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                document.getElementById('status-text').textContent = 'Connection error';
            };
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
            this.attemptReconnect();
        }
    }
    
    attemptReconnect() {
        if (!this.isConnected) {
            console.log(`Attempting to reconnect in ${this.reconnectInterval / 1000} seconds...`);
            
            setTimeout(() => {
                this.initializeWebSocket();
            }, this.reconnectInterval);
        }
    }
    
    handleWebSocketMessage(data) {
        const chatMessages = document.getElementById('chat-messages');
        
        switch (data.type) {
            case 'translation_result':
                // Add the translated message to the chat
                const messageElement = document.createElement('div');
                messageElement.className = 'message incoming';
                messageElement.innerHTML = `
                    <p>${data.translatedText}</p>
                    <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                `;
                chatMessages.appendChild(messageElement);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                break;
                
            case 'status_update':
                document.getElementById('status-text').textContent = data.message;
                break;
                
            case 'error':
                document.getElementById('status-text').textContent = `Error: ${data.message}`;
                break;
                
            default:
                console.warn('Unknown message type:', data.type);
        }
    }
    
    setupUI() {
        // Add event listener for language selection changes
        const sourceLanguage = document.getElementById('source-language');
        const targetLanguage = document.getElementById('target-language');
        
        sourceLanguage.addEventListener('change', (e) => {
            // You can send language preferences to the server if needed
            console.log('Source language changed to:', e.target.value);
        });
        
        targetLanguage.addEventListener('change', (e) => {
            // You can send language preferences to the server if needed
            console.log('Target language changed to:', e.target.value);
        });
    }
    
    sendMessage(message) {
        if (this.isConnected && this.ws) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
        }
    }
}

// Initialize the client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.translationClient = new WhatsAppTranslationClient();
});