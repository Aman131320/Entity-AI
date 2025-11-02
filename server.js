// server.js - FINAL STABLE AND FAST CODE (Ollama Integration)

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; 

// --- Fixes for __dirname and __filename in ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- End Fixes ---

const app = express();
const PORT = process.env.PORT || 3000; 
// CHANGE THIS to the smallest model you pulled (e.g., "phi3:mini", "gemma:2b")
const OLLAMA_MODEL = "llama3"; 

// Middleware: Standard JSON limit for text
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to handle chat messages
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    console.log(`Incoming message: ${message}`);

    if (!message) {
        return res.status(400).json({ error: "Message is required." });
    }

    try {
        // --- OLLAMA API CALL (Optimized) ---
        const response = await fetch('http://localhost:11434/api/generate', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL, 
                prompt: message,
                max_tokens: 100,      // Limits answer length for quicker completion
                keep_alive: -1,       // Keeps model loaded in RAM (eliminates startup delay)
                stream: false         
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Ollama HTTP Error: ${response.status}. Full Error: ${errorText.substring(0, 100)}...`);
            return res.status(500).json({ 
                error: `Ollama Model Error: Status ${response.status}. Is model ${OLLAMA_MODEL} pulled and running?`
            });
        }

        const data = await response.json();
        const replyText = data.response ? data.response.trim() : null;

        if (!replyText) {
            return res.status(500).json({ error: "Ollama did not generate a response." });
        }

        console.log('Ollama API final response:', replyText);
        res.json({ reply: replyText });

    } catch (error) {
        // This catches connection issues (ECONNREFUSED) if Ollama is not running
        console.error('Failed to connect to Ollama:', error);
        res.status(500).json({ 
            error: "Connection Refused. Is Ollama running on port 11434?" 
        });
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}. Ready for Ollama.`);
});