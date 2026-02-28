require('dotenv').config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) {
        console.log("No API Key found in process.env");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                // Only log text generation models
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log("Unexpected response format:", data);
        }
    } catch (err) {
        console.error("Failed to fetch:", err.message);
    }
}

listModels();
