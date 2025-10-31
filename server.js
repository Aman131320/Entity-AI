// server.js (Focus on lines 36-60 inside app.post('/api/chat', ...))

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    const MAX_RETRIES = 3;
    let response;
    
    // --- START: Retry Loop ---
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash", 
                contents: message,
                config: {
                    maxOutputTokens: 150, 
                    temperature: 0.7,
                },
            });

            // If the request succeeds, break the loop
            if (response && response.text) {
                break;
            }

        } catch (error) {
            console.error(`Attempt ${attempt} failed.`);
            
            // Check for the 503 UNAVAILABLE error
            if (error.status === 503 && attempt < MAX_RETRIES) {
                const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`Model overloaded (503). Retrying in ${waitTime / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                // Throw other errors (400, 403, 404, etc.) immediately
                throw error; 
            }
        }
    }
    // --- END: Retry Loop ---


    try {
        const replyText = response.text.trim(); // Use the response from the successful attempt

        if (!replyText) {
            console.warn('AI generated an empty response after all retries.');
            return res.status(500).json({ error: "AI generated an empty response after all retries." });
        }

        console.log('Gemini API final response:', replyText);
        res.json({ reply: replyText });

    } catch (error) {
        console.error('Final Error after retries:', error);
        
        let errorMessage = "AI Service Error. The model is currently unavailable.";
        if (error.message && error.message.includes('API key')) {
            errorMessage = "Authentication failed. Check if your GEMINI_API_KEY is correct.";
        }
        
        res.status(500).json({ error: errorMessage });
    }
});