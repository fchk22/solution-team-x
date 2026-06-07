// scripts/extract-cards.ts
import Firecrawl from '@mendable/firecrawl-js';
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 1. Load Environment Variables from .env.local
dotenv.config({ path: '.env.local' });

const { 
  FIRECRAWL_API_KEY, 
  OPENROUTER_API_KEY, 
  SUPABASE_URL, 
  SUPABASE_SERVICE_ROLE_KEY 
} = process.env;

// Verify all keys are present at runtime
if (!FIRECRAWL_API_KEY || !OPENROUTER_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: Missing environment variables in .env.local");
  console.log("Check: ", {
    Firecrawl: !!FIRECRAWL_API_KEY,
    OpenRouter: !!OPENROUTER_API_KEY,
    SupabaseURL: !!SUPABASE_URL,
    SupabaseKey: !!SUPABASE_SERVICE_ROLE_KEY
  });
  process.exit(1);
}

// 🛡️ TypeScript Type-Safety Fix: Extract into guaranteed string primitives
const verifiedFirecrawlKey: string = FIRECRAWL_API_KEY;
const verifiedOpenRouterKey: string = OPENROUTER_API_KEY;
const verifiedSupabaseUrl: string = SUPABASE_URL;
const verifiedSupabaseKey: string = SUPABASE_SERVICE_ROLE_KEY;

// 2. Initialize Clients with guaranteed string variables
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: verifiedOpenRouterKey,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Bounty Board",
  }
});

const firecrawl = new Firecrawl({ apiKey: verifiedFirecrawlKey });
const supabase = createClient(verifiedSupabaseUrl, verifiedSupabaseKey);

async function runExtraction() {
  console.log(`\n📅 Starting Daily Extraction: ${new Date().toLocaleString('en-HK')}`);

  // 3. Fetch Active Source URLs from Supabase
  const { data: sources, error: sourceError } = await supabase
    .from('source_urls')
    .select('*')
    .eq('is_active', true);

  if (sourceError || !sources) {
    console.error("❌ Database Error (fetching sources):", sourceError);
    return;
  }

  if (sources.length === 0) {
    console.log("ℹ️ No active URLs to scrape.");
    return;
  }

  for (const source of sources) {
    try {
      console.log(`\n🔍 Processing: ${source.bank_name}...`);

      // 4. Scrape the URL using .scrape()
      const scrapeResult: any = await firecrawl.scrape(source.url, {
        formats: ['markdown'],
        // 🛠️ Optimization: Increased waiting window to 8000ms to allow heavily-nested JS components to render fully
        waitFor: 8000, 
        onlyMainContent: true, // Automatically strip cookie banners, headers, and footers

        // Actions: Thorough scrolling to trigger lazy-loaded images, components, or tabular records
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'scroll', direction: 'down', amount: 2000 },
          { type: 'wait', milliseconds: 2000 },
          { type: 'scroll', direction: 'up', amount: 2000 },
          { type: 'wait', milliseconds: 1000 }
        ],

        // Exclude generic legal noise but KEEP main text wrappers
        excludeTags: [
          'nav', 
          'footer', 
          '.cookie-consent', 
          'script',
          'style'
        ]
      });

      const markdown = scrapeResult.markdown || scrapeResult.data?.markdown;

      if (!markdown) {
        console.warn(`⚠️ No content found for ${source.bank_name}. Skipping AI...`);
        continue;
      }

      // 🔍 DEBUG SYSTEM: Prints out a diagnostic slice of scraped text. 
      // If this is empty or missing key metrics, your scraper is hitting an anti-bot or hydration shield.
      console.log(`📝 [Scraper Diagnosis] Retrieved ${markdown.length} markdown characters.`);
      console.log(`--- TEXT PREVIEW FOR ${source.bank_name} ---`);
      console.log(markdown.slice(0, 1200)); 
      console.log(`-----------------------------------------\n`);

      // 🛠️ Optimization: Upgraded target engine model to anthropic/claude-sonnet-4.5 via OpenRouter for industry-leading table extraction accuracy.
      console.log(`🤖 Invoking anthropic/claude-sonnet-4.5 to extract structured metrics for ${source.bank_name}...`);

      // 5. OpenRouter Structured AI Prompt Optimization targeting 'credit_card_rules' schema
      const prompt = `
        Analyze this raw Hong Kong credit card marketing markdown payload and extract clean spending rules metrics.
        
        CRITICAL INSTRUCTIONS:
        1. Isolate marketing text and extract true mathematical percentages/numbers as raw floating-point numbers (e.g. 4.0, 2.0, 0.4). Do not include the '%' symbol.
        2. Identify fine-print monthly caps or limits. For example, if online spending gives 4% up to HKD 12,500, then 'online_spend_cap_hkd' must be 12500. If uncapped, unlimited, or not specified, explicitly return -1.
        3. If a cash back multiplier column (such as dining, online, or overseas) is NOT mentioned anywhere in the text, return null for that field.
        4. DEFAULT REBATE PRINCIPLE: For standard Hong Kong cards, if a general base rebate isn't explicitly defined, use 0.4 as a fallback baseline value.
        5. The 'id' field MUST be a unique snake_case string identifying the specific card (e.g. 'hsbc_red', 'hang_seng_mmpower').
        6. Provide bilingual card names. If the Chinese name is missing, construct it logically or fall back to the English name.
        7. Return ONLY a plain JSON object containing a "cards" array. Do not append markdown code-block wraps (\`\`\`json) outside the structural JSON limits.

        Target Object Properties:
        - "id": string (unique lowercase snake_case identity, e.g. "hsbc_red")
        - "card_name_en": string (English title of the card)
        - "card_name_zh": string (Traditional Chinese title of the card)
        - "base_rebate_pct": number (Baseline default rebate percentage, default to 0.4 if not explicitly shown)
        - "dining_rebate_pct": number or null (Dining multiplier rebate percentage, null if not mentioned)
        - "online_rebate_pct": number or null (Online shopping rebate percentage, null if not mentioned)
        - "overseas_rebate_pct": number or null (Overseas transaction rebate percentage, null if not mentioned)
        - "online_spend_cap_hkd": number (Monthly shopping spend cap limit. Return -1 if uncapped)
        - "dining_spend_cap_hkd": number (Monthly dining spend cap limit. Return -1 if uncapped)
        - "welcome_offer_details": object or null (Any signup promotional details, format as a clean nested key-value sub-JSON object or null)

        Text payload to parse: 
        ${markdown}
      `;

      const response = await openai.chat.completions.create({
        model: "deepseek/deepseek-v4-pro", 
        messages: [
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const rawText = response.choices[0].message.content;
      
      if (!rawText) {
        console.error(`❌ Empty response from AI for ${source.bank_name}`);
        continue;
      }

      const extractedData = JSON.parse(rawText);
      const cards = Array.isArray(extractedData) ? extractedData : (extractedData.cards || extractedData.items || []);

      if (cards.length === 0) {
        console.log(`ℹ️ No cards detected for ${source.bank_name}.`);
        continue;
      }

      console.log(`💾 Committing parameters cleanly to public.credit_card_rules table...`);

      // 6. Upsert to the new verified mathematical table ('credit_card_rules')
      const { error: upsertError } = await supabase
        .from('credit_card_rules')
        .upsert(
          cards.map((c: any) => ({
            id: c.id,
            card_name_en: c.card_name_en,
            card_name_zh: c.card_name_zh,
            bank_name: source.bank_name,
            base_rebate_pct: c.base_rebate_pct ?? 0.4,
            dining_rebate_pct: c.dining_rebate_pct ?? null,
            online_rebate_pct: c.online_rebate_pct ?? null,
            overseas_rebate_pct: c.overseas_rebate_pct ?? null,
            online_spend_cap_hkd: c.online_spend_cap_hkd ?? -1,
            dining_spend_cap_hkd: c.dining_spend_cap_hkd ?? -1,
            welcome_offer_details: c.welcome_offer_details || null,
            last_updated_at: new Date().toISOString()
          })),
          { onConflict: 'id' } // Evaluates matching criteria based on the unique snake_case string identity
        );

      if (upsertError) throw upsertError;
      console.log(`✅ Success: Synchronized ${cards.length} cards for ${source.bank_name} into credit_card_rules.`);

    } catch (err) {
      console.error(`❌ Error processing ${source.bank_name}:`, err);
    }
  }

  console.log("\n✨ Extraction cycle finished.");
}

runExtraction().catch((error) => {
  console.error("💀 Fatal Script Error:", error);
});