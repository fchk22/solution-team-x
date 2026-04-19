import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components and Server Actions.
 * @param useAdmin If true, uses the Service Role Key to bypass RLS policies.
 */
export async function createClient(useAdmin = false) {
  const cookieStore = await cookies();

  // Use Service Role Key for administrative/expert tasks, otherwise use the Public Anon Key
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
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

/**
 * Enhanced fetcher to get Card Info + Global HSBC Rules.
 * This function bypasses RLS to ensure the AI always has the latest data.
 */
export async function getCardExpertContext(cardSearchName: string) {
  // Use admin mode (true) to ensure we see the data even if RLS is on
  const supabase = await createClient(true);

  // 1. Fetch the specific card using a fuzzy search (ilike with % wildcards)
  const { data: card, error: cardError } = await supabase
    .from('credit_cards')
    .select('*')
    .ilike('card_name', `%${cardSearchName}%`)
    .maybeSingle();

  if (cardError) {
    console.error('❌ Supabase Query Error:', cardError.message);
    return null;
  }

  // 2. Diagnostic Check: If no card found, log what's actually in the DB
  if (!card) {
    console.warn(`⚠️ No card found matching "${cardSearchName}".`);
    
    // This helper log helps you see if there's a typo in the table or column
    const { data: existingCards } = await supabase.from('credit_cards').select('card_name').limit(5);
    if (existingCards) {
      console.log("Current cards in your DB are:", existingCards.map(c => c.card_name));
    }
    return null; 
  }

  // 3. Fetch Global Rules (RYC categories, Expiry rules, etc.)
  // We use the contains filter to pull HSBC-specific logic stored in JSONB
  const { data: globalRules, error: rulesError } = await supabase
    .from('global_credit_card_rules')
    .select('*')
    .contains('logic_json', { metadata: { bank: 'HSBC' } });

  if (rulesError) {
    console.error('⚠️ Global Rules Fetch Error:', rulesError.message);
  }

  // 4. Return the consolidated "Expert Context"
  return {
    card,
    globalRules: globalRules || [],
    timestamp: new Date().toISOString()
  };
}