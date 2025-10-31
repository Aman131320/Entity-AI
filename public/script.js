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

    // Scroll to the bottom to show the newest message
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const message = userMessageInput.value.trim();
    if (!message) return;

    // 1. Display user message immediately
    addMessage('user', message);
    userMessageInput.value = ''; // Clear input

    // 2. Add a "typing..." indicator
    const thinkingMessage = document.createElement('div');
    thinkingMessage.id = 'typing-indicator';
    thinkingMessage.classList.add('message-container', 'bot-message');
    thinkingMessage.innerHTML = '<div class="bubble">...thinking...</div>';
    chatBox.appendChild(thinkingMessage);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // 3. Send the message to your Node.js server
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        // 4. Remove the thinking indicator
        thinkingMessage.remove();

        if (!response.ok) {
            // Handle errors returned by your server.js (status 400 or 500)
            const errorData = await response.json();
            addMessage('bot', `ERROR: ${errorData.error}`);
            console.error('Server error response:', errorData);
            return;
        }

        // 5. Get the successful bot response
        const data = await response.json();
        addMessage('bot', data.reply);

    } catch (error) {
        // 6. Handle network errors (e.g., server is down)
        thinkingMessage.remove();
        addMessage('bot', `FATAL ERROR: Could not communicate with the Node.js server.`);
        console.error('Network or client-side error:', error);
    }
}

// Optional: Allow sending by pressing Enter key
userMessageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});