'use client';

import { X } from 'lucide-react';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: string | null;
}

export default function ContextModal({ isOpen, onClose, context }: ContextModalProps) {
  if (!isOpen || !context) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-bg-muted border border-border rounded-lg p-6 text-text-primary shadow-2xl animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold mb-3">Retrieved Context</h3>
        <div className="max-h-[60vh] overflow-auto bg-bg-base rounded p-3 border border-border scrollbar-hide">
          <pre className="text-sm text-text-muted whitespace-pre-wrap font-mono">
            {context}
          </pre>
        </div>
      </div>
    </div>
  );
}