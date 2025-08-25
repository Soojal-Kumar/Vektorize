'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, HelpCircle } from 'lucide-react';
import ContextModal from './ContextModal';
import { AppDocument } from '@/app/page';
// REMOVED: No longer need to import 'natural' on the client!

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
  useEffect(() => { /* ... auto-resize logic is the same ... */ }, [input]);

  const sendQuery = async (question: string) => {
    if (!question.trim() || documents.length === 0 || isLoading) return;
    setIsLoading(true);

    const userMessage: Message = { id: Date.now().toString(), content: question, role: 'user' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    try {
      const combinedContent = documents.map(doc => doc.content).join('\n\n');
      const historyToInclude = newMessages.slice(-6, -1).map(msg => ({ role: msg.role, content: msg.content }));

      // The API call now sends the raw data for the server to process
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          documentContent: combinedContent,
          history: historyToInclude
        }),
      });

      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      
      const data = await res.json();
      
      // The server now sends back the context it used, so we can attach it to the message
      userMessage.context = data.context; 
      
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
    // The entire JSX part of this component is exactly the same as before
    <>
      { /* ... */ }
    </>
  );
}