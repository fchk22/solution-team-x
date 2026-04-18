'use server';

import { analyzePdfContent } from './ai-analyst';
import { createClient } from '@supabase/supabase-js';

// --- INITIALIZATION ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ACTION 1: PDF Analysis & Data Ingestion
 */
export async function uploadAndAnalyzeAction(base64File: string) {
  try {
    const buffer = Buffer.from(base64File, 'base64');
    const analysis = await analyzePdfContent(buffer);
    const dateTag = new Date().toISOString().split('T')[0];
    
    const finalCardName = (analysis.card_name && analysis.card_name !== "N/A") 
      ? analysis.card_name 
      : `Unidentified Card (${dateTag})`;

    const { error } = await supabase
      .from('banking_products')
      .upsert({
        card_name: finalCardName,
        bank_name: 'HSBC',
        rebate_details: analysis.rates,
        marketing_info: { 
          welcome: analysis.welcome_offer,
          source: 'PDF Upload'
        },
        last_updated: new Date().toISOString()
      }, { onConflict: 'card_name' });

    if (error) throw new Error(`DB Error: ${error.message}`);
    return { success: true, cardName: finalCardName };
  } catch (err: any) {
    console.error("Server Action Error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * ACTION 2: AI Card Expert (Dynamic Model Selection)
 * UPDATED: Now accepts 'profile' argument from the frontend
 */
export async function askCardExpert(userQuestion: string, profile?: any) {
  try {
    // 1. Logic Gate: Identify if user qualifies for PAID model
    // We check the profile object passed from the frontend state
    const hasProfileInfo = !!(profile && (profile.fullName || profile.income));
    
    // 2. Decide the Model Tier
    // If profile exists and has data, use Llama 3.3 (Paid), else use Nemotron (Free)
    const targetModel = hasProfileInfo 
      ? "meta-llama/llama-3.3-70b-instruct" 
      : "nvidia/nemotron-nano-12b-v2-vl:free";

    console.log(`[Debug] Incoming Profile Data:`, profile ? "Present" : "Missing");
    console.log(`[Debug] Routing request to model: ${targetModel}`);

    // 3. Fetch Card Knowledge
    const { data: cardKnowledge, error: dbError } = await supabase
      .from('credit_cards')
      .select(`
        card_name,
        reward_calculation_rules (rule_name, spend_amount_required, rc_earned),
        card_specific_tiers (category_name, rebate_rate, monthly_spending_limit),
        card_exclusive_perks (perk_type, perk_summary, merchant_scope)
      `);

    if (dbError) throw new Error(`Database Fetch Error: ${dbError.message}`);

    // 4. Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
      },
      body: JSON.stringify({
        "model": targetModel, 
        "messages": [
          {
            "role": "system",
            "content": `You are the "HSBC HK Card Maximizer". 
            USER PROFILE CONTEXT: ${JSON.stringify(profile || {})}
            IMPORTANT: Provide your final answer immediately. Do not explain your reasoning process.
            STRICT RULES:
            1. Respond ONLY in 2-3 short bullet points.
            2. MATCH the language of the user's question (Traditional Chinese or English).
            3. Use the USER PROFILE CONTEXT to tailor your advice if relevant (e.g. residency or income).`
          },
          { 
            "role": "user", 
            "content": `DATA: ${JSON.stringify(cardKnowledge)}\n\nQUESTION: ${userQuestion}` 
          }
        ],
        "max_tokens": 1000, 
        "temperature": 0.1
      })
    });

    const aiData = await response.json();
    const choice = aiData.choices?.[0];
    
    // 5. Extraction Logic
    const finalAnswer = choice?.message?.content || choice?.message?.reasoning;

    if (!finalAnswer) {
      console.error("--- OPENROUTER ERROR DETAIL ---", JSON.stringify(aiData, null, 2));
      throw new Error(aiData.error?.message || "AI returned empty content.");
    }

    return { 
      success: true, 
      answer: finalAnswer,
      tier: hasProfileInfo ? 'PRO' : 'GUEST'
    };

  } catch (err: any) {
    console.error("AI Expert Action Error:", err.message);
    return { success: false, error: err.message };
  }
}