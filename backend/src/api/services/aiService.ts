import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface GeneratedQuestion {
    prompt: string;
    type: 'MCQ' | 'MULTI_SELECT' | 'TEXT';
    options: string[];
    correctAnswer: string;
    points: number;
}

export const generateQuestions = async (prompt: string, count: number = 5): Promise<GeneratedQuestion[]> => {
    const systemPrompt = `You are an expert pedagogical assessment builder for Ekya Schools. 
    Generate ${count} high-quality assessment questions based on the following topic or context: "${prompt}".
    
    The questions should be realistic, challenging, and professional. 
    Focus on practical classroom application and educator standards.
    
    Return the response ONLY as a JSON array of objects with the following structure:
    [
        {
            "prompt": "The question text",
            "type": "MCQ", // or "MULTI_SELECT" or "TEXT"
            "options": ["Option A", "Option B", "Option C", "Option D"], // Empty array for TEXT type
            "correctAnswer": "The exact string of the correct option", // For MULTI_SELECT, return a JSON string array like '["Opt1", "Opt2"]'
            "points": 2
        }
    ]
    
    Do not include any markdown formatting wrappers (like \`\`\`json). Just the raw JSON array.`;

    try {
        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        console.log("[AI-SERVICE] Raw Response:", responseText);

        // Robust JSON extraction: look for the first '[' and last ']'
        const start = responseText.indexOf('[');
        const end = responseText.lastIndexOf(']');

        if (start === -1 || end === -1) {
            console.error("[AI-SERVICE] Failed to find JSON array in response");
            throw new Error("AI returned invalid format - no JSON array found");
        }

        const cleanedResponse = responseText.substring(start, end + 1).trim();
        return JSON.parse(cleanedResponse);
    } catch (error: any) {
        console.error("AI Generation Error details:", error);
        throw new Error(error.message || "Failed to generate questions with AI");
    }
};
