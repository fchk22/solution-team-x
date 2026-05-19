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
  
  // Detect cross-lingual welcome offer matching sequences
  const isWelcomeOfferQuery = 
    clean.includes("welcome offer") || 
    clean.includes("迎新獎賞") || 
    clean.includes("迎新奖赏") ||
    clean.includes("迎新優惠") ||
    clean.includes("迎新优惠");

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

  if (isWelcomeOfferQuery) {
    // Look for rows where welcome offers are populated (Not null and not an empty string)
    query = query
      .not('welcome_offer_details', 'is', null)
      .neq('welcome_offer_details', '');
  } else {
    // Normal track: Apply target individual bank filters
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
  }

  // 3. FETCH DATA (Limit 30 for thorough processing analysis)
  const { data: cards, error: cardError } = await query.limit(30);
  let finalCards = cards || [];

  // 4. SMART FALLBACK (Ensure the dataset is deep enough for ranking top-5 alternatives)
  if (finalCards.length < 5) {
    let fallbackQuery = supabase
      .from('credit_cards')
      .select('*')
      .eq('is_verified', true);

    // If it's a welcome offer query, try to keep finding items with welcome notes first
    if (isWelcomeOfferQuery) {
      fallbackQuery = fallbackQuery
        .not('welcome_offer_details', 'is', null)
        .neq('welcome_offer_details', '');
    }

    let { data: recentCards } = await fallbackQuery
      .order('last_scraped_at', { ascending: false })
      .limit(20);

    // Extreme Fallback: If filtering strictly by welcome_offer_details yielded absolutely nothing,
    // load regular cards so the action doesn't return an empty error response
    if (isWelcomeOfferQuery && (!recentCards || recentCards.length === 0)) {
      const { data: emergencyCards } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('is_verified', true)
        .order('last_scraped_at', { ascending: false })
        .limit(15);
      recentCards = emergencyCards;
    }
    
    // Deduplicate results safely by mapping unique card names
    const merged = [...finalCards, ...(recentCards || [])];
    finalCards = Array.from(new Map(merged.map(c => [c.card_name, c])).values());
  }

  // 5. SUMMARY FOR AI ORCHESTRATION
  const distinctBanks = [...new Set(finalCards.map(c => c.bank_name))].filter(Boolean);
  const contextSummary = `Database loaded ${finalCards.length} cards from: ${distinctBanks.join(', ')}.`;

  console.log(`📡 [Context] ${contextSummary}`);

  return { 
    cards: finalCards,
    summary: contextSummary 
  };
}