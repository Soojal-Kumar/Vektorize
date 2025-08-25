'use client';

import { useState } from 'react';
import { Bot, FileText, X } from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';

export interface AppDocument {
  id: string;
  name: string;
  content: string;
}

export default function Home() {
  const [documents, setDocuments] = useState<AppDocument[]>([]);

  const handleFileProcessed = (name: string, content: string) => {
    const newDoc: AppDocument = {
      id: Date.now().toString(),
      name,
      content,
    };
    setDocuments(prevDocs => [...prevDocs, newDoc]);
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
  };

  return (
    <main className="h-screen flex flex-col bg-bg-base text-text-primary">
      <header className="border-b border-border p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
            <Bot className="text-accent-foreground h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold">Vektorize</h1>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[380px] border-r border-border p-6 flex flex-col gap-6 bg-bg-muted flex-shrink-0">
          <h2 className="font-semibold text-xl">Knowledge Base</h2>
          <DocumentUpload onFileProcessed={handleFileProcessed} />
          {documents.length > 0 && (
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <h3 className="font-semibold text-text-muted">Source Documents</h3>
              <div className="flex flex-col gap-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 pl-3 bg-bg-base rounded-md border border-border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                      <span className="text-sm font-medium truncate" title={doc.name}>
                        {doc.name}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleRemoveDocument(doc.id)}
                      className="p-1 text-text-muted hover:text-text-primary rounded-md transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface documents={documents} />
        </div>
      </div>
    </main>
  );
}