import { createClient } from '@supabase/supabase-js';
import { syncFromSandbox } from '@/lib/hsbc-sync';
import { revalidatePath } from 'next/cache';
import RebateCalculator from '@/components/RebateCalculator';
// Look for this line at the top of app/cards/page.tsx
import { analyzePdfContent } from '@/lib/ai-analyst'; // Fix the name here

export default async function CardsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: cards } = await supabase
    .from('banking_products')
    .select('*')
    .order('last_updated', { ascending: false });

  async function handleSync() {
  'use server';
  await syncFromSandbox(); // Update this line
  revalidatePath('/cards');
}

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-12 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            SOLUTION TEAM <span className="text-red-600">X</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Reward Engine & Card Analytics</p>
        </div>

        <form action={handleSync}>
          <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-200 flex items-center gap-2">
            <span className="text-lg">↻</span> Sync & Analyze
          </button>
        </form>
      </div>

      {/* Cards Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards?.map((card) => (
          <div key={card.id} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-shadow">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  {card.bank_name}
                </span>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {card.card_name}
                </h2>
              </div>
              <div className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
                ACTIVE
              </div>
            </div>

            {/* AI Rebate Display */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Online</p>
                <p className="text-3xl font-black text-red-600">
                  {card.rebate_details?.rates?.online ?? '0'}%
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Dining</p>
                <p className="text-3xl font-black text-slate-800">
                  {card.rebate_details?.rates?.dining ?? '0'}%
                </p>
              </div>
            </div>

            {/* Interactive Calculator */}
            <RebateCalculator rates={card.rebate_details?.rates} />

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
               <a 
                  href={card.rebate_details?.landing_page} 
                  target="_blank"
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  View official terms →
                </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}