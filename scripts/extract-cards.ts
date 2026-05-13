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

// Verify all keys are present
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

// 2. Initialize Clients
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Bounty Board",
  }
});

// Use the standard Firecrawl constructor
const firecrawl = new Firecrawl({ apiKey: FIRECRAWL_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
        // 1. Force a longer wait for Citibank's slow JS rendering
        waitFor: 5000, 
        
        // 2. Automagically remove cookie banners, footers, and nav menus
        onlyMainContent: true,

        // 3. Actions: Mimic a human to trigger "Lazy Loading" of cards
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'scroll', direction: 'down', amount: 1500 }, // Scroll to reveal the cards
          { type: 'wait', milliseconds: 1000 }
        ],

        // 4. Manual exclusion of legal/footer junk that confuses the AI
        excludeTags: [
          'nav', 
          'footer', 
          '.cookie-consent', 
          '#legal-disclaimer', 
          '.privacy-policy',
          'script',
          'style'
        ]
      });

      // Older SDKs put the data inside a 'data' property
      const markdown = scrapeResult.markdown || scrapeResult.data?.markdown;

      if (!markdown) {
        console.warn(`⚠️ No content found for ${source.bank_name}. Skipping AI...`);
        continue;
      }

      console.log(`🤖 Using Gemini (via OpenRouter) to extract cards for ${source.bank_name}...`);

      // 5. OpenRouter AI Logic
      const prompt = `
        Extract HK credit card details from the text below. 
        Return ONLY a JSON array of objects.
        Schema: [{ "card_name": string, "welcome_offer": string, "rebate_dining": string, "rebate_online": string, "rebate_general": string, "expiry_date": string or null }]
        Text: ${markdown}
      `;

      const response = await openai.chat.completions.create({
        model: "deepseek/deepseek-chat",
        //model: "deepseek/deepseek-v4-pro",
        //model: "meta-llama/llama-3.3-70b-instruct",
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
      // Handle case where AI wraps the array in an object like { "cards": [...] }
      const cards = Array.isArray(extractedData) ? extractedData : (extractedData.cards || extractedData.items || []);

      if (cards.length === 0) {
        console.log(`ℹ️ No cards detected for ${source.bank_name}.`);
        continue;
      }

      // 6. Upsert to Supabase
      const { error: upsertError } = await supabase
        .from('credit_cards')
        .upsert(
          cards.map((c: any) => ({
            bank_name: source.bank_name,
            card_name: c.card_name,
            welcome_offer: c.welcome_offer,
            rebate_dining: c.rebate_dining,
            rebate_online: c.rebate_online,
            rebate_general: c.rebate_general,
            expiry_date: c.expiry_date,
            is_verified: false,
            last_scraped_at: new Date().toISOString()
          })),
          { onConflict: 'card_name' }
        );

      if (upsertError) throw upsertError;
      console.log(`✅ Success: Updated ${cards.length} cards for ${source.bank_name}`);

    } catch (err) {
      console.error(`❌ Error processing ${source.bank_name}:`, err);
    }
  }

  console.log("\n✨ Extraction cycle finished.");
}

runExtraction().catch((error) => {
  console.error("💀 Fatal Script Error:", error);
});