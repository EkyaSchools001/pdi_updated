require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    console.log("Key:", process.env.GEMINI_API_KEY ? "Found" : "Not Found");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    try {
        const result = await model.generateContent("Say 'Hello' back to me if you can hear me.");
        console.log("Success:", result.response.text());
    } catch (err) {
        console.error("Error:", err.message);
    }
}
test();
