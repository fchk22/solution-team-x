// scripts/extract-cards.ts
import { firecrawl as FirecrawlApp } from '@mendable/firecrawl-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 1. Force load from .env.local
dotenv.config({ path: '.env.local' });

async function runExtraction() {
  console.log(`\n📅 Starting Daily Extraction: ${new Date().toLocaleString('en-HK')}`);

  // 2. DEBUGGER: This will reveal exactly what Node.js sees in process.env
  const keysToCheck = [
    'FIRECRAWL_API_KEY',
    'GEMINI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  console.log("--- Environment Variable Audit ---");
  let missingAny = false;
  
  keysToCheck.forEach(key => {
    const value = process.env[key];
    if (value && value.trim() !== "") {
      console.log(`${key}: ✅ Found (Starts with: ${value.substring(0, 4)}...)`);
    } else {
      console.log(`${key}: ❌ MISSING`);
      missingAny = true;
    }
  });
  console.log("----------------------------------\n");

  if (missingAny) {
    console.error("❌ Extraction stopped: One or more keys are undefined in .env.local.");
    return;
  }

  // 3. Initialize Clients
  // We use ! to tell TS we've already verified these aren't null
  // @ts-ignore
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const supabase = createClient(
    process.env.SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("🚀 Clients initialized. Fetching source URLs from Supabase...");

  // 4. Fetch source URLs
  const { data: sources, error: sourceError } = await supabase
    .from('source_urls')
    .select('*')
    .eq('is_active', true);

  if (sourceError || !sources) {
    console.error("❌ Error fetching sources:", sourceError);
    return;
  }

  if (sources.length === 0) {
    console.log("ℹ️ No active source URLs found in the database.");
    return;
  }

  for (const source of sources) {
    try {
      console.log(`\n🔍 Scraping: ${source.bank_name} (${source.url})`);

      // @ts-ignore - Bypass SDK version-specific type checks
      const scrapeResult = await firecrawl.scrape({
        url: source.url,
        formats: ['markdown']
      }) as any;

      const markdown = scrapeResult.markdown || scrapeResult.data?.markdown;

      if (!markdown) {
        console.warn(`⚠️ No content returned for ${source.bank_name}. Skipping AI step.`);
        continue;
      }

      console.log(`🤖 Analyzing ${source.bank_name} content with Gemini...`);

      // 5. Gemini AI Extraction
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
        Extract HK credit card offers from this markdown text. Return ONLY a JSON array.
        Include card_name, welcome_offer, rebate_dining, rebate_online, rebate_general, and expiry_date.
        If a value is missing, use null.
        Text: ${markdown}
      `;

      const result = await model.generateContent(prompt);
      const rawJson = result.response.text();
      
      // Clean potential markdown code blocks if AI included them
      const cleanJson = rawJson.replace(/```json|```/g, "").trim();
      const cardData = JSON.parse(cleanJson);
      const cardsArray = Array.isArray(cardData) ? cardData : (cardData.cards || []);

      if (cardsArray.length === 0) {
        console.log(`ℹ️ No cards extracted for ${source.bank_name}.`);
        continue;
      }

      // 6. Supabase Upsert
      const { error: upsertError } = await supabase
        .from('credit_cards')
        .upsert(
          cardsArray.map((card: any) => ({
            bank_name: source.bank_name,
            card_name: card.card_name,
            welcome_offer: card.welcome_offer,
            rebate_dining: card.rebate_dining,
            rebate_online: card.rebate_online,
            rebate_general: card.rebate_general,
            expiry_date: card.expiry_date,
            is_verified: false, // For manual review in the UI
            last_scraped_at: new Date().toISOString()
          })),
          { onConflict: 'card_name' }
        );

      if (upsertError) throw upsertError;
      console.log(`✅ Success: Updated ${cardsArray.length} cards for ${source.bank_name}`);

    } catch (err) {
      console.error(`❌ Error processing ${source.bank_name}:`, err);
    }
  }
  
  console.log("\n✨ Daily extraction cycle complete.");
}

// Kick off the script
runExtraction().catch((err) => {
  console.error("💀 Fatal Script Error:", err);
});