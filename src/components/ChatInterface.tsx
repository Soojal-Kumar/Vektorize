'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Bot, Sparkles, HelpCircle } from 'lucide-react';
import ContextModal from './ContextModal';
import { AppDocument } from '@/app/page';
// THE FIX IS HERE: Use a namespace import
import * as natural from 'natural';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  context?: string;
}

interface ChatInterfaceProps {
  documents: AppDocument[];
}

export default function ChatInterface({ documents }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);

  useEffect(() => { setMessages([]); }, [documents]);

  const openContextModal = (context: string) => {
    setSelectedContext(context);
    setIsModalOpen(true);
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const documentChunks = useCallback(() => {
    if (documents.length === 0) return [];
    const combinedContent = documents.map(doc => doc.content).join('\n\n');
    return combinedContent.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 10);
  }, [documents]);

  const sendQuery = async (question: string) => {
    if (!question.trim() || documents.length === 0 || isLoading) return;
    setIsLoading(true);

    const userMessage: Message = { id: Date.now().toString(), content: question, role: 'user' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    try {
      const chunks = documentChunks();
      if (chunks.length === 0) throw new Error("No document content available to search.");

      // THE FIX IS HERE: Access Tfidf from the imported namespace
      const tfidf = new natural.TfIdf();
      chunks.forEach(chunk => {
        tfidf.addDocument(chunk);
      });

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
        const questionKeywords = question.toLowerCase().split(/\s+/);
        const keywordChunks = chunks.filter(chunk => 
            questionKeywords.some(keyword => chunk.toLowerCase().includes(keyword))
        ).slice(0, topN);
        
        context = keywordChunks.join('\n\n---\n\n');

        if (context.trim() === "") {
            context = chunks.slice(0, 2).join('\n\n---\n\n');
        }
      }
      
      userMessage.context = context;

      const historyToInclude = newMessages.slice(-6, -1);
      const formattedHistory = historyToInclude.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
      
      const personaAndRules = `You are Vektorize... (rest of your prompt)`; // Your prompt logic here

      const historySection = formattedHistory ? `---
      CHAT HISTORY:
      ${formattedHistory}` : "";

      const prompt = `${personaAndRules}

      ---
      Now, follow the rules and examples above to respond to the current user.

      CONTEXT:
      ${context}
      ${historySection}
      ---
      
      USER QUESTION: ${question}

      ASSISTANT ANSWER:`;

      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      const data = await res.json();
      const assistantMessage: Message = { id: Date.now().toString() + 'ai', content: data.response, role: 'assistant' };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat submission:', error);
      const errorMessage: Message = { id: Date.now().toString() + 'err', content: 'Sorry, an error occurred. Please try again.', role: 'assistant' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendQuery(input); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuery(input); } };

  return (
    // ... The entire JSX part of the component is exactly the same
    <>
      <div className="flex flex-col h-full bg-bg-muted">
          <div className="flex-1 overflow-auto p-6 space-y-8 scrollbar-hide">
              {/* ... All JSX here is the same ... */}
          </div>
          <div className="border-t border-border p-4 bg-bg-muted">
              {/* ... Form is the same ... */}
          </div>
      </div>
      <ContextModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        context={selectedContext}
      />
    </>
  );
}