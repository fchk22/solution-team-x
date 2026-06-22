// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, Compass, MessageSquare, Users, ArrowUpRight, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { signInWithGoogle } from '@/lib/auth';

export default function SolutionTeamXHub() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sync auth state
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      
      {/* Top Right Navigation */}
      <div className="fixed top-6 right-6 z-50">
        {!loading && (
          user ? (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-[10px] text-slate-400 max-w-[100px] truncate hidden sm:block">
                {user.email}
              </span>
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold ring-2 ring-indigo-500/20">
                {user.email?.[0].toUpperCase()}
              </div>
              <button 
                onClick={() => supabase.auth.signOut()} 
                className="text-slate-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle('/travel-chat/create-trip')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-200 transition-all shadow-lg"
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
          )
        )}
      </div>

      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <main className="max-w-6xl mx-auto px-4 py-16 sm:py-24 relative z-10 flex flex-col items-center justify-center min-h-[90vh]">
        <div className="text-center max-w-2xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-medium text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> SolutionTeamX Platform Engine
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-400">
            SolutionTeamX
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-medium mb-6">
            Select an ecosystem workspace below to begin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <Link href="/card-enquiry" className="group relative block p-6 sm:p-8 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl transition-all hover:-translate-y-1 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-300 rounded-md border border-slate-700">Active Module</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-1.5 group-hover:text-indigo-300 transition-colors">
              AI Credit Card Enquiry <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">Compare local credit card terms and verify promotional cashback calculations.</p>
          </Link>

          <button 
            onClick={() => {
              if (user) {
                window.location.href = '/travel-chat/create-trip';
              } else {
                signInWithGoogle('/travel-chat/create-trip');
              }
            }}
            className="group relative block w-full text-left p-6 sm:p-8 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-3xl transition-all hover:-translate-y-1 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/5 rounded-full blur-2xl group-hover:bg-rose-600/10 transition-colors" />
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-950/50 text-rose-300 rounded-md border border-rose-900/50 animate-pulse">New Beta Project</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-1.5 group-hover:text-rose-300 transition-colors">
              Travel Chat Workspace <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">Collaborative trip management. Authenticate, chat, and share media with friends.</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full">
                <Users className="w-3 h-3 text-rose-400" /> Multi-user Sync
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full">
                <MessageSquare className="w-3 h-3 text-rose-400" /> Instant Media Share
              </span>
            </div>
          </button>
        </div>
      </main>

      <footer className="w-full text-center py-6 text-xs text-slate-600 border-t border-slate-900 bg-slate-950">
        &copy; {new Date().getFullYear()} SolutionTeamX. All rights reserved.
      </footer>
    </div>
  );
}