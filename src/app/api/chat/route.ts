import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as natural from 'natural';

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

// Define the shape of the request body we expect
interface ChatApiRequest {
    question: string;
    documentContent: string;
    history: { role: 'user' | 'assistant'; content: string }[];
}

export async function POST(req: NextRequest) {
    try {
        const { question, documentContent, history }: ChatApiRequest = await req.json();

        if (!question || !documentContent) {
            return NextResponse.json({ error: 'Question and document content are required' }, { status: 400 });
        }

        // ===================================================================
        // SERVER-SIDE RAG LOGIC (TF-IDF)
        // ===================================================================
        const chunks = documentContent.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 10);
        if (chunks.length === 0) {
            return NextResponse.json({ error: 'No processable chunks found in document.' }, { status: 400 });
        }

        const tfidf = new natural.TfIdf();
        chunks.forEach(chunk => tfidf.addDocument(chunk));

        const topN = 3;
        const chunkScores: { index: number; score: number }[] = [];
        tfidf.tfidfs(question, (index, score) => {
            chunkScores.push({ index, score });
        });
        
        const relevantChunks = chunkScores
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, topN)
            .map(item => chunks[item.index]);

        let context = relevantChunks.join('\n\n---\n\n');
        
        if (context.trim() === "") {
            const keywordChunks = chunks.filter(chunk => question.toLowerCase().split(/\s+/).some(keyword => chunk.toLowerCase().includes(keyword))).slice(0, topN);
            context = keywordChunks.join('\n\n---\n\n');
            if (context.trim() === "") {
                context = chunks.slice(0, 2).join('\n\n---\n\n');
            }
        }
        // ===================================================================

        const formattedHistory = (history || []).map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
        
        // Your final prompt logic remains the same
        const personaAndRules = `You are Vektorize... (etc.)`;
        const historySection = formattedHistory ? `--- CHAT HISTORY:\n${formattedHistory}` : "";
        const prompt = `${personaAndRules}\n\n---\nNow, follow the rules...\n\nCONTEXT:\n${context}\n${historySection}\n---\n\nUSER QUESTION: ${question}\n\nASSISTANT ANSWER:`;

        const aiResponse = await generateResponse(prompt);

        // Also return the context we used, so the client can display it in the modal
        return NextResponse.json({ response: aiResponse, context: context });

    } catch (error) {
        console.error("Error in chat API route:", error);
        return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }
}