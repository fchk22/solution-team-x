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

  // 1. CLEAN KEYWORD
  const clean = (searchQuery || "").replace(/[?(){}[\]\\]/g, "").toLowerCase().trim();
  const words = clean.split(' ').filter(w => w.length > 2);
  const target = words.length > 0 ? words[words.length - 1] : "credit";

  // 2. USE A SIMPLER FILTER ARRAY
  // We avoid the complex nested .or() string which is causing the logic tree error.
  // Instead, we search for cards where the keyword appears in the name.
  const { data: cards, error: cardError } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('is_verified', true)
    .ilike('card_name', `%${target}%`) // Single column ilike is very robust
    .limit(10);

  // 3. SECONDARY SEARCH (If name match fails, search the promo text)
  if (!cards || cards.length === 0) {
    const { data: promoCards } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('is_verified', true)
      .filter('special_promos', 'cs', `{"tags": ["${target}"]}`) // Using containment for JSONB
      .limit(5);
    
    if (promoCards && promoCards.length > 0) return { cards: promoCards };
  }

  // 4. ABSOLUTE FALLBACK
  if (cardError || !cards || cards.length === 0) {
    const { data: fallback } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('is_verified', true)
      .order('last_scraped_at', { ascending: false })
      .limit(8);
      
    return { cards: fallback || [] };
  }

  return { cards: cards || [] };
}