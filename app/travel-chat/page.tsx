// app/travel-chat/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Compass, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function TravelChatDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      
      // Fetch messages using the correct 'content' column from your table
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (msgs) setMessages(msgs)
      setLoading(false)
    }
    init()
  }, [])

  const getDisplayName = (msg: any) => {
    // Uses your database column 'user_id' to identify the sender
    if (msg.user_id === user?.id) return "You"
    return msg.sender_name || "User"
  }

  const formatTimestamp = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()
    const dateLabel = isToday ? "Today" : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    
    return `${dateLabel} ${time}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-rose-500/10 p-4 rounded-3xl border border-rose-500/20 mb-6 text-rose-400 animate-pulse">
          <Compass className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black mb-2">Travel Chat Room Hub</h1>
        <Loader2 className="w-6 h-6 animate-spin text-rose-500 mt-4" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {messages.map((msg) => (
          // Uses your database column 'user_id' for layout alignment
          <div key={msg.id} className={`flex flex-col mb-6 ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-bold text-slate-300">
                {getDisplayName(msg)}
              </span>
              <span className="text-[10px] text-slate-500">
                {formatTimestamp(msg.created_at)}
              </span>
            </div>
            {/* Uses your database column 'content' to display the text */}
            <div className={`p-4 rounded-2xl max-w-[85%] ${
              msg.user_id === user?.id 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-900 border border-slate-800 text-slate-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}