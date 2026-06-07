import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Initializes a secure Supabase client instance bound to Next.js server headers and cookies.
 * Supports bypassing standard Row-Level Security (RLS) policies when explicitly invoked with `useAdmin = true`.
 */
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
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The set method can be safely ignored if invoked inside an un-awaited Server Component context
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The remove method can be safely ignored if invoked inside an un-awaited Server Component context
          }
        },
      },
    }
  );
}

/**
 * Fetches relevant credit card rules to serve as factual context injection for the AI Chat interface.
 * Uses intelligent cross-lingual mapping to extract structured rules directly from 'credit_card_rules'.
 * * @param searchQuery The raw string query submitted by the end user in the chat view.
 */
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

  // Multi-lingual token vocabulary map matching Hong Kong banking entities
  const bankMap = [
    { id: 'hsbc', terms: ['hsbc', 'hongkong bank', '滙豐', '匯豐', 'red'] },
    { id: 'scb', terms: ['standard', 'chartered', 'scb', '渣打', 'smart card', 'cathay'] },
    { id: 'boc', terms: ['boc', 'bank of china', '中銀', '中國銀行'] },
    { id: 'citi', terms: ['citi', 'citibank', '花旗'] },
    { id: 'hangseng', terms: ['hang seng', 'hsb', '恒生', '恆生', 'mmpower'] },
    { id: 'bea', terms: ['bea', 'east asia', '東亞', 'goal'] },
    { id: 'dbs', terms: ['dbs', '星展'] },
    { id: 'ae', terms: ['ae', 'amex', 'american express', '美國運通'] },
    { id: 'mox', terms: ['mox'] },
    { id: 'za', terms: ['za bank', '眾安'] }
  ];

  const detectedBankIds = bankMap
    .filter(bank => bank.terms.some(term => clean.includes(term)))
    .map(bank => bank.id);

  // 2. DYNAMIC QUERY CONSTRUCTION TARGETING THE STRUCTURED RULES ARCHITECTURE
  let query = supabase.from('credit_card_rules').select('*');
  const orConditions: string[] = [];

  if (isWelcomeOfferQuery) {
    // Isolate accounts possessing live JSONB welcome promotional configurations
    query = query.not('welcome_offer_details', 'is', null);
  } else {
    // Apply granular, case-insensitive target bank filter strings
    if (detectedBankIds.length > 0) {
      detectedBankIds.forEach(id => {
        if (id === 'scb') {
          orConditions.push(`bank_name.ilike.%standard%,bank_name.ilike.%scb%,bank_name.ilike.%chartered%`);
        } else if (id === 'boc') {
          orConditions.push(`bank_name.ilike.%boc%,bank_name.ilike.%bank of china%`);
        } else if (id === 'citi') {
          orConditions.push(`bank_name.ilike.%citi%`);
        } else if (id === 'hangseng') {
          orConditions.push(`bank_name.ilike.%hang seng%,bank_name.ilike.%hangseng%`);
        } else {
          orConditions.push(`bank_name.ilike.%${id}%`);
        }
      });
    }

    // Isolate core keyword targets out of the phrase array (ignoring standard filler nouns)
    const words = clean.split(/\s+/).filter(w => w.length > 3 && !['compare', 'with', 'card'].includes(w));
    if (words.length > 0) {
      const lastWord = words[words.length - 1];
      // Search cleanly across bilingual product descriptor columns
      orConditions.push(`card_name_en.ilike.%${lastWord}%,card_name_zh.ilike.%${lastWord}%`);
    }

    if (orConditions.length > 0) {
      query = query.or(orConditions.join(','));
    }
  }

  // 3. SECURE INTERACTION DISPATCH (Capped at 30 nodes to preserve optimal processing window)
  const { data: cards, error: cardError } = await query.limit(30);
  if (cardError) {
    console.error("🚨 Supabase rule reading exception caught:", cardError.message);
  }
  let finalCards = cards || [];

  // 4. ROBUST DATA FALLBACK SEEDING
  // If targeted structural lookups return a narrow baseline context (< 5 items), 
  // automatically seed with fresh records processed by the morning cron container.
  if (finalCards.length < 5) {
    let fallbackQuery = supabase.from('credit_card_rules').select('*');

    if (isWelcomeOfferQuery) {
      fallbackQuery = fallbackQuery.not('welcome_offer_details', 'is', null);
    }

    // Pull down records sequenced by the latest scraper execution sync timestamp
    let { data: recentCards } = await fallbackQuery
      .order('last_updated_at', { ascending: false })
      .limit(20);

    // Extreme Fallback: If filtering strictly by welcome details yielded absolutely zero,
    // load general card layouts to guarantee the AI engine receives historical reference parameters.
    if (isWelcomeOfferQuery && (!recentCards || recentCards.length === 0)) {
      const { data: emergencyCards } = await supabase
        .from('credit_card_rules')
        .select('*')
        .order('last_updated_at', { ascending: false })
        .limit(15);
      recentCards = emergencyCards;
    }
    
    // Merge datasets safely and deduplicate by assigning unique map entries keyed to row IDs
    const merged = [...finalCards, ...(recentCards || [])];
    finalCards = Array.from(new Map(merged.map(c => [c.id, c])).values());
  }

  // 5. SUMMATION METADATA REPORTING FOR CHAT INFRASTRUCTURE LOGS
  const distinctBanks = [...new Set(finalCards.map(c => c.bank_name))].filter(Boolean);
  const contextSummary = `Database engine loaded ${finalCards.length} live structured cards from: ${distinctBanks.join(', ')}.`;

  console.log(`📡 [Context Engine] ${contextSummary}`);

  return { 
    cards: finalCards,
    summary: contextSummary 
  };
}