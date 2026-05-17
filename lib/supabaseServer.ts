import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient(useAdmin = false) {
  const cookieStore = await cookies();
  const supabaseKey = useAdmin
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: any) { cookieStore.set({ name, value: "", ...options }); },
      },
    }
  );
}

export async function getCardExpertContext(searchQuery: string) {
  const supabase = await createClient(true);

  // 1. COMPREHENSIVE BANK & KEYWORD DETECTION
  const clean = (searchQuery || "").replace(/[?(){}[\]\\]/g, "").toLowerCase().trim();
  
  const bankMap = [
    { id: 'hsbc', terms: ['hsbc', 'hongkong bank', '滙豐', '匯豐'] },
    { id: 'scb', terms: ['standard', 'chartered', 'scb', '渣打', 'smart card', 'cathay'] },
    { id: 'boc', terms: ['boc', 'bank of china', '中銀', '中國銀行'] },
    { id: 'citi', terms: ['citi', 'citibank', '花旗'] },
    { id: 'hangseng', terms: ['hang seng', 'hsb', '恒生', '恆生'] },
    { id: 'bea', terms: ['bea', 'east asia', '東亞', 'goal'] },
    { id: 'dbs', terms: ['dbs', '星展'] },
    { id: 'ae', terms: ['ae', 'amex', 'american express', '美國運通'] },
    { id: 'mox', terms: ['mox'] },
    { id: 'za', terms: ['za bank', '眾安'] }
  ];

  const detectedBankIds = bankMap
    .filter(bank => bank.terms.some(term => clean.includes(term)))
    .map(bank => bank.id);

  // 2. DYNAMIC QUERY CONSTRUCTION
  let query = supabase.from('credit_cards').select('*').eq('is_verified', true);
  const orConditions: string[] = [];

  // Add specific bank filters
  if (detectedBankIds.length > 0) {
    detectedBankIds.forEach(id => {
      if (id === 'scb') orConditions.push(`bank_name.ilike.%standard%,bank_name.ilike.%scb%`);
      else if (id === 'boc') orConditions.push(`bank_name.ilike.%boc%,bank_name.ilike.%bank of china%`);
      else if (id === 'citi') orConditions.push(`bank_name.ilike.%citi%`);
      else orConditions.push(`bank_name.ilike.%${id}%`);
    });
  }

  // Add product name keyword search (e.g., "macbook", "red", "miles")
  const words = clean.split(/\s+/).filter(w => w.length > 3 && !['compare', 'with', 'card'].includes(w));
  if (words.length > 0) {
    const lastWord = words[words.length - 1];
    orConditions.push(`card_name.ilike.%${lastWord}%`);
  }

  if (orConditions.length > 0) {
    query = query.or(orConditions.join(','));
  }

  // 3. FETCH DATA (Limit 30 for thorough comparison)
  const { data: cards, error: cardError } = await query.limit(30);
  let finalCards = cards || [];

  // 4. SMART FALLBACK (If specific results are too thin)
  if (finalCards.length < 5) {
    const { data: recentCards } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('is_verified', true)
      .order('last_scraped_at', { ascending: false })
      .limit(15);
    
    // Deduplicate results
    const merged = [...finalCards, ...(recentCards || [])];
    finalCards = Array.from(new Map(merged.map(c => [c.card_name, c])).values());
  }

  // 5. SUMMARY FOR AI
  const distinctBanks = [...new Set(finalCards.map(c => c.bank_name))].filter(Boolean);
  const contextSummary = `Database loaded ${finalCards.length} cards from: ${distinctBanks.join(', ')}.`;

  console.log(`📡 [Context] ${contextSummary}`);

  return { 
    cards: finalCards,
    summary: contextSummary 
  };
}