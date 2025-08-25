'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, LoaderCircle } from 'lucide-react';

interface DocumentUploadProps {
  onFileProcessed: (name: string, content: string) => void;
}

export default function DocumentUpload({ onFileProcessed }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      let content = '';
      if (file.type === 'application/pdf') {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error('Failed to process PDF file on the server.');
        }
        const data = await res.json();
        content = data.text;
      } else if (file.type === 'text/plain') {
        content = await file.text();
      } else {
        throw new Error('Invalid file type. Please upload a PDF or TXT file.');
      }
      
      onFileProcessed(file.name, content);

    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEvents = (e: React.DragEvent, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 group
          ${isDragging ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50 hover:bg-bg-muted'}`}
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragOver={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <LoaderCircle className="mx-auto h-10 w-10 text-text-muted animate-spin" />
            <p className="mt-2 text-sm text-text-muted">Processing...</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-text-muted transition-colors group-hover:text-accent" />
            <p className="mt-2 text-sm text-text-muted">
              <span className="font-semibold text-accent">Click or drag a file</span>
            </p>
            <p className="text-xs text-text-muted/70">.pdf or .txt files</p>
          </>
        )}
      </div>
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".pdf,.txt" 
        className="hidden" 
        onChange={handleFileSelect}
        disabled={isLoading}
      />

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}