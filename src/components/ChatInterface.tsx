'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, HelpCircle } from 'lucide-react';
import ContextModal from './ContextModal';
import { AppDocument } from '@/app/page';

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

  useEffect(() => {
    setMessages([]);
  }, [documents]);

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

  const sendQuery = async (question: string) => {
    if (!question.trim() || documents.length === 0 || isLoading) return;
    setIsLoading(true);

    const combinedContent = documents.map(doc => `--- START OF ${doc.name} ---\n${doc.content}\n--- END OF ${doc.name} ---`).join('\n\n');
    const chunks = combinedContent.split('\n').filter(chunk => chunk.trim() !== '');
    const questionKeywords = question.toLowerCase().split(/\s+/);
    const relevantChunks = chunks.filter(chunk => questionKeywords.some(keyword => chunk.toLowerCase().includes(keyword)));
    let context = relevantChunks.join('\n\n');
    if (relevantChunks.length === 0) { context = combinedContent; }
    
    const userMessage: Message = { id: Date.now().toString(), content: question, role: 'user', context: context };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');


    try {
      const historyToInclude = newMessages.slice(-6, -1);
      const formattedHistory = historyToInclude.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');

      // ===================================================================
      // START OF THE "FEW-SHOT" PROMPT
      // ===================================================================

      const personaAndRules = `You are Vektorize, a helpful AI assistant. You have two modes of operation:

      1.  **Conversational Mode:** For simple greetings or questions about yourself (e.g., "hello", "who are you?", "hi"). In this mode, be friendly and brief.
      2.  **Research Mode:** For any other question that asks for information. In this mode, you are a strict research assistant and MUST follow these rules:
          - Your answer MUST be derived exclusively from the "CONTEXT" section.
          - If the answer is not in the "CONTEXT", you MUST reply with the exact phrase: "The provided documents do not contain information on this topic."

      Here are examples of how you must respond:

      **Example 1: A Greeting**
      CONTEXT: [Some document text about science...]
      USER QUESTION: hey what's up
      ASSISTANT ANSWER: Hello! I'm ready to help you with your documents. How can I assist you?

      **Example 2: A Question Not in the Context**
      CONTEXT: [Some document text about science...]
      USER QUESTION: what is the capital of France?
      ASSISTANT ANSWER: The provided documents do not contain information on this topic.

      **Example 3: A Question That IS in the Context**
      CONTEXT: The sky is blue because of Rayleigh scattering.
      USER QUESTION: why is the sky blue?
      ASSISTANT ANSWER: The sky is blue because of Rayleigh scattering.
      `;

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
    <>
      <div className="flex flex-col h-full bg-bg-muted">
        <div className="flex-1 overflow-auto p-6 space-y-8 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-text-muted">
              <Sparkles className="h-12 w-12 mb-4" />
              <h2 className="text-2xl font-semibold text-text-primary">Chat with your Knowledge Base</h2>
              <p className="mt-2 max-w-sm">Upload documents to start asking questions.</p>
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} className={`flex items-start gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-accent' : 'bg-bg-base'}`}>
                  {message.role === 'user' ? <User className="h-5 w-5 text-accent-foreground" /> : <Bot className="h-5 w-5 text-accent" />}
                </div>
                {message.role === 'user' ? (
                  <button 
                    onClick={() => message.context && openContextModal(message.context)}
                    className="group relative max-w-xl rounded-lg p-3 text-sm text-left shadow-md bg-accent text-accent-foreground"
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className="absolute -bottom-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <HelpCircle className="h-4 w-4 text-accent-foreground bg-accent rounded-full"/>
                    </div>
                  </button>
                ) : (
                  <div className="max-w-xl rounded-lg p-3 text-sm shadow-md bg-bg-base text-text-primary">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-bg-base flex items-center justify-center flex-shrink-0"><Bot className="h-5 w-5 text-accent" /></div>
              <div className="max-w-xl rounded-lg p-3 text-sm bg-bg-base text-text-primary flex items-center">
                <div className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 bg-text-muted rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 bg-text-muted rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 bg-text-muted rounded-full animate-pulse"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-border p-4 bg-bg-muted">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={documents.length > 0 ? "Ask a question..." : "Please upload a document first"}
              className="w-full border border-border rounded-lg p-3 pr-12 bg-bg-base text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent max-h-32 scrollbar-hide"
              rows={1} disabled={documents.length === 0 || isLoading}
            />
            <button
              type="submit" disabled={documents.length === 0 || isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-accent text-accent-foreground rounded-md p-1.5 disabled:bg-bg-base disabled:text-text-muted transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
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