// public/script.js

const chatBox = document.getElementById('chatBox');
const userMessageInput = document.getElementById('userMessage');

function addMessage(sender, text) {
    const container = document.createElement('div');
    container.classList.add('message-container', `${sender}-message`);

    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.textContent = text;
    
    container.appendChild(bubble);
    chatBox.appendChild(container);

    // Auto-scroll to the bottom for the newest message
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const message = userMessageInput.value.trim();
    
    // Stop if the user clicked send with no text
    if (!message) return;

    // 1. Display user message immediately 
    addMessage('user', message);
    userMessageInput.value = ''; 

    // 2. Add a "thinking..." indicator to signal processing
    const thinkingMessage = document.createElement('div');
    thinkingMessage.id = 'typing-indicator';
    thinkingMessage.classList.add('message-container', 'bot-message');
    thinkingMessage.innerHTML = '<div class="bubble">...thinking...</div>';
    chatBox.appendChild(thinkingMessage);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // Prepare the payload for the Node.js server
        const payload = {
            message: message,
        };
        
        // 3. Send the message to your Node.js server
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // 4. Remove the thinking indicator
        thinkingMessage.remove();

        // 5. Handle server errors (e.g., 500 error from the Node.js server)
        if (!response.ok) {
            const errorData = await response.json();
            addMessage('bot', `ERROR: ${errorData.error}`);
            console.error('Server error response:', errorData);
            return;
        }

        // 6. Get the successful bot response
        const data = await response.json();
        addMessage('bot', data.reply);

    } catch (error) {
        // 7. Handle network errors (e.g., Ngrok closed, Ollama service is down)
        thinkingMessage.remove();
        addMessage('bot', `FATAL ERROR: Could not communicate with the server. (Check Ollama/Network)`);
        console.error('Network or client-side error:', error);
    }
}

// Allow sending by pressing Enter key instead of clicking the button
userMessageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});