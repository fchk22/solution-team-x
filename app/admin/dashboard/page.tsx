// app/admin/dashboard/page.tsx
'use client'; 

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth'; 

export default function AdminDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalyticsAndProtect() {
      try {
        // 🔒 1. Production Route Protection Layer
        // Retrieve the current client session token from your Supabase auth instance
        const { data: { session } } = await supabase.auth.getSession();
        
        // If no user session is discovered, immediately kick the user back to the main route
        if (!session) {
          router.push('/');
          return;
        }

        // 💡 OPTIONAL ADVANCED ROLE CHECK:
        // If you want to lock this down to only your own personal account, uncomment below:
        // if (session.user.email !== 'your-admin-email@example.com') {
        //   router.push('/');
        //   return;
        // }

        // 📊 2. Secure Data Retrieval
        // Now that the session is verified, execute the analytics query fetch row loop
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type, card_id, session_id');

        if (error) {
          setErrorMessage(error.message);
        } else if (data) {
          setEvents(data);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to sync database data stream.');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalyticsAndProtect();
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto font-sans text-slate-500 font-bold animate-pulse">
        🔄 Verifying permissions and loading live metrics...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-8 max-w-5xl mx-auto font-sans">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl font-bold">
          ⚠️ Error loading analytics data: {errorMessage}
        </div>
      </div>
    );
  }

  // 📊 BULLETPROOF METRICS PARSING
  // 1. Calculate Unique Visitors using session_id lookups with an anonymous fallback string
  const uniqueSessions = new Set(
    events.map(e => e.session_id || 'anonymous_session')
  );
  
  // 2. Resilient Visitor Counter Fallback Layer:
  const totalPageViews = uniqueSessions.size > 0 && events.some(e => e.session_id)
    ? uniqueSessions.size 
    : events.filter(e => e.event_type === 'page_view').length || events.length;
  
  // 3. Count explicit application outbound click counters
  const totalApplyClicks = events.filter(e => e.event_type === 'click_apply').length;

  // 4. Count frequencies to find which cards are mostly asked/clicked
  const cardQueryCounts: Record<string, number> = {};
  const cardApplyCounts: Record<string, number> = {};

  events.forEach(event => {
    if (!event.card_id) return;
    
    if (event.event_type === 'ai_card_query') {
      cardQueryCounts[event.card_id] = (cardQueryCounts[event.card_id] || 0) + 1;
    }
    if (event.event_type === 'click_apply') {
      cardApplyCounts[event.card_id] = (cardApplyCounts[event.card_id] || 0) + 1;
    }
  });

  // Sort objects into descending arrays for ranking leaderboards
  const topAskedCards = Object.entries(cardQueryCounts).sort((a, b) => b[1] - a[1]);
  const topClickedCards = Object.entries(cardApplyCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans text-slate-800 bg-slate-50 min-h-screen rounded-2xl border border-slate-100">
      <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-2">
        <span>📊</span> Analytics Dashboard
      </h1>
      
      {/* Metrics Summary Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Unique Visitors</p>
          <p className="text-4xl font-black text-indigo-600 mt-1">{totalPageViews}</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Application Link Clicks</p>
          <p className="text-4xl font-black text-emerald-600 mt-1">{totalApplyClicks}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leaderboard Block: Mostly Asked Cards */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-1.5">
            <span>🔥</span> Most Answered / Queried Cards
          </h2>
          {topAskedCards.length > 0 ? (
            <ul className="space-y-2.5">
              {topAskedCards.slice(0, 5).map(([cardId, count], index) => (
                <li key={cardId} className="flex justify-between items-center border-b border-slate-100 pb-2 text-xs font-medium">
                  <span className="text-slate-700">{index + 1}. <code className="bg-slate-50 border px-1.5 py-0.5 rounded text-amber-600 font-bold font-mono">{cardId}</code></span>
                  <span className="bg-amber-50 text-amber-700 font-black px-2 py-0.5 rounded-full text-[10px]">{count} queries</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 font-medium py-2">No query data collected yet.</p>
          )}
        </div>

        {/* Leaderboard Block: Mostly Clicked Cards */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-1.5">
            <span>📈</span> Top Converted Cards (Apply Buttons)
          </h2>
          {topClickedCards.length > 0 ? (
            <ul className="space-y-2.5">
              {topClickedCards.slice(0, 5).map(([cardId, count], index) => (
                <li key={cardId} className="flex justify-between items-center border-b border-slate-100 pb-2 text-xs font-medium">
                  <span className="text-slate-700">{index + 1}. <code className="bg-slate-50 border px-1.5 py-0.5 rounded text-emerald-600 font-bold font-mono">{cardId}</code></span>
                  <span className="bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded-full text-[10px]">{count} clicks</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 font-medium py-2">No application link clicks tracked yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}