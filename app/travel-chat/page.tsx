// app/travel-chat/page.tsx
'use client'

import { Compass, Loader2 } from 'lucide-react'

export default function TravelChatDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-rose-500/10 p-4 rounded-3xl border border-rose-500/20 mb-6 text-rose-400 animate-bounce">
        <Compass className="w-10 h-10" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Travel Chat Room Hub</h1>
      <p className="text-slate-400 text-sm max-w-sm mb-6">
        Establishing initialization channels and preparing real-time Supabase socket clusters...
      </p>
      <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
    </div>
  )
}
