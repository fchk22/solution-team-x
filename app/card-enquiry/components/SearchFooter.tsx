'use client'

import React from 'react'
import { Send } from 'lucide-react'

interface SearchFooterProps {
  question: string;
  setQuestion: (text: string) => void;
  activeView: 'INTRO' | 'CHAT';
  lang: string;
  onSendMessage: (text: string) => void;
  t: any;
}

export function SearchFooter({
  question,
  setQuestion,
  activeView,
  lang,
  onSendMessage,
  t
}: SearchFooterProps) {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    onSendMessage(question);
  };

  return (
    <footer className="shrink-0 bg-white border-t p-4 z-[100] pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-2xl mx-auto flex flex-col gap-2.5">
        <form onSubmit={handleSubmit} className="flex gap-2 relative items-center">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={activeView === 'INTRO' ? t.inputPlaceholderIntro : t.inputPlaceholderChat}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!question.trim()}
            className={`absolute right-2 p-2.5 rounded-xl transition-all ${
              question.trim()
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] sm:text-xs text-slate-400 font-medium text-center leading-normal px-4">
          {t.disclaimer}
        </p>
      </div>
    </footer>
  );
}