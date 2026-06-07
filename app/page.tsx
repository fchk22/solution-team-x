// app/page.tsx
import Link from 'next/link'
import { CreditCard, Compass, MessageSquare, Users, ArrowUpRight, ShieldCheck } from 'lucide-react'

export default function SolutionTeamXHub() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      {/* Background ambient glowing decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <main className="max-w-6xl mx-auto px-4 py-16 sm:py-24 relative z-10 flex flex-col items-center justify-center min-h-[90vh]">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-medium text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> SolutionTeamX Platform Engine
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-400">
            SolutionTeamX
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-medium">
            Select an ecosystem workspace below to begin. Switch modules or manage real-time collaborative tasks instantaneously.
          </p>
        </div>

        {/* Dynamic App Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          
          {/* Module 1: AI Credit Card Enquiry (The Existing Project) */}
          <Link href="/card-enquiry" className="group relative block p-6 sm:p-8 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl transition-all hover:-translate-y-1 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-300 rounded-md border border-slate-700">
                Active Module
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-1.5 group-hover:text-indigo-300 transition-colors">
              AI Credit Card Enquiry <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Compare local credit card terms, reward conversion models, and verify promotional cashback calculations instantly through smart interactive streams.
            </p>
          </Link>

          {/* Module 2: Travel Chat (The New Project) */}
          <Link href="/travel-chat" className="group relative block p-6 sm:p-8 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-3xl transition-all hover:-translate-y-1 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/5 rounded-full blur-2xl group-hover:bg-rose-600/10 transition-colors" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-950/50 text-rose-300 rounded-md border border-rose-900/50 animate-pulse">
                New Beta Project
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-1.5 group-hover:text-rose-300 transition-colors">
              Travel Chat Workspace <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Real-time collaboration platform designed for modern group trip management. Authenticate securely, build instantaneous multi-user chatrooms, map out trip details, and stream live image arrays with friends.
            </p>
            
            {/* Quick feature checklist tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full">
                <Users className="w-3 h-3 text-rose-400" /> Multi-user Sync
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full">
                <MessageSquare className="w-3 h-3 text-rose-400" /> Instant Media Share
              </span>
            </div>
          </Link>

        </div>
      </main>

      <footer className="w-full text-center py-6 text-xs text-slate-600 border-t border-slate-900 bg-slate-950">
        &copy; {new Date().getFullYear()} SolutionTeamX. All rights reserved.
      </footer>
    </div>
  )
}
