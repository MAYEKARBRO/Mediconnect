import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY.trim());
} else {
    console.error("VITE_GEMINI_API_KEY is not set in .env file");
}

// Fallback model list to try in order - updated based on available models for the key
const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];

export const getGeminiResponse = async (prompt: string) => {
    if (!genAI) {
        return "I'm sorry, I cannot respond right now because my brain (API Key) is missing. Please contact the administrator.";
    }

    const errors: string[] = [];

    for (const modelName of MODELS_TO_TRY) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.warn(`Gemini API Error with model ${modelName}:`, error.message);
            errors.push(`[${modelName}]: ${error.message}`);
        }
    }

    console.error("All Gemini models failed.");

    // Debug: Fetch available models
    try {
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${genAI.apiKey}`);
        const data = await listResponse.json();
        if (data.models) {
            const availableModels = data.models.map((m: any) => m.name.replace('models/', ''));
            return `Unable to connect. \nfailed strategies: ${MODELS_TO_TRY.join(', ')}\n\nAVAILABLE MODELS FOR YOUR KEY:\n${availableModels.join('\n')}`;
        }
    } catch (e) {
        console.error("Could not list models", e);
    }

    return `Unable to connect. Debug Info:\n${errors.join('\n')}`;
};
