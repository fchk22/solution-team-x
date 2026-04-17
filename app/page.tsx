'use client'

import { useState, useRef, useEffect } from 'react'
import { askCardExpert } from '@/lib/actions'
import ReactMarkdown from 'react-markdown'
import { Send, Bot, User, CreditCard, Sparkles, ChevronRight, ShieldCheck } from 'lucide-react'

// Define the shape of our chat messages
interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export default function HomePage() {
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the bottom whenever history changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [history, loading])

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || loading) return

    const userMsg = question.trim()
    
    setQuestion('')
    setHistory(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    
    const result = await askCardExpert(userMsg)
    
    if (result.success) {
      setHistory(prev => [...prev, { role: 'ai', content: result.answer }])
    } else {
      setHistory(prev => [...prev, { 
        role: 'ai', 
        content: `**Error:** ${result.error || 'Something went wrong. Please try again.'}` 
      }])
    }
    setLoading(false)
  }

  const suggestions = [
    "Which card should I use for groceries today?",
    "Best card for a $12,000 electronics purchase?",
    "How many miles do I get for transport and streaming?",
    "Is there a benefit to paying bills with a credit card?"
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-100">
              <CreditCard className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none text-slate-800">SmartCard Optimizer</h1>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Universal Rewards Advisor</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            Bank-Neutral Comparison
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="max-w-4xl mx-auto p-6 flex-1 w-full">
        {history.length === 0 && !loading && (
          <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Spending Strategy
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tight text-slate-900">Maximize every <span className="text-indigo-600">Reward Point.</span></h2>
            <p className="text-slate-500 text-lg mb-10 max-w-md mx-auto">
              Your personal advisor for credit card optimization. Get the best rebate on every transaction.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {suggestions.map((s) => (
                <button 
                  key={s}
                  onClick={() => setQuestion(s)}
                  className="group flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl text-left text-sm hover:border-indigo-300 hover:bg-indigo-50/50 transition-all shadow-sm"
                >
                  <span className="font-medium text-slate-700 group-hover:text-indigo-700">{s}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8 pb-40">
          {history.map((chat, index) => (
            <div key={index} className="flex flex-col space-y-8">
              {chat.role === 'user' ? (
                <div className="flex gap-4 items-start justify-end animate-in fade-in slide-in-from-right-4">
                  <div className="bg-slate-800 text-white p-4 rounded-2xl rounded-tr-none shadow-lg max-w-[80%]">
                    <p className="text-sm md:text-base">{chat.content}</p>
                  </div>
                  <div className="bg-slate-200 p-2 rounded-full mt-1">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 items-start animate-in fade-in slide-in-from-left-4">
                  <div className="bg-white border p-2 rounded-full shadow-md mt-1">
                    <Bot className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl rounded-tl-none shadow-sm max-w-[90%]">
                    <div className="prose prose-slate prose-indigo max-w-none text-slate-800">
                      <ReactMarkdown>{chat.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 items-start animate-in fade-in">
              <div className="bg-white border p-2 rounded-full shadow-md mt-1">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-3xl rounded-tl-none shadow-sm min-w-[200px]">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consulting Reward Strategy...</p>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Floating Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent p-6 z-10">
        <form onSubmit={handleAsk} className="max-w-4xl mx-auto relative group">
          <input
            type="text"
            placeholder="Ask a follow-up or a new merchant..."
            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 pr-16 shadow-2xl shadow-slate-200/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800 placeholder:text-slate-400"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl disabled:opacity-30 transition-all shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}