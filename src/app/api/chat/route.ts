import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client with your secret API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

async function generateResponse(prompt: string): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating response from Gemini:', error);
        throw new Error('Failed to generate response from AI');
    }
}

export async function POST(req: NextRequest) {
    try {
        // Get the prompt from the client's request body
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }
        
        // Call the Gemini API securely on the server
        const aiResponse = await generateResponse(prompt);

        // Send the AI's response back to the client
        return NextResponse.json({ response: aiResponse });

    } catch (error) {
        console.error("Error in chat API route:", error);
        return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }
}