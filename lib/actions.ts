'use server';

import { analyzePdfContent } from './ai-analyst';
import { createClient } from '@supabase/supabase-js';

// --- INITIALIZATION ---
// Using Service Role Key to ensure server-side functions can bypass RLS for data retrieval
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ACTION 1: PDF Analysis & Data Ingestion (Admin Side)
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
        bank_name: 'Generic', // Changed to generic to match your UI update
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
 * ACTION 2: AI Card Expert (Advisor Side)
 */
export async function askCardExpert(userQuestion: string) {
  try {
    // 1. Fetch Structured Knowledge from Supabase
    const { data: cardKnowledge, error: dbError } = await supabase
      .from('credit_cards')
      .select(`
        card_name,
        reward_calculation_rules (rule_name, spend_amount_required, rc_earned),
        card_specific_tiers (category_name, rebate_rate, monthly_spending_limit),
        card_exclusive_perks (perk_type, perk_summary, merchant_scope)
      `);

    if (dbError) {
      console.error("Supabase Database Error:", dbError);
      throw new Error(`Database Error: ${dbError.message}`);
    }

    // 2. Format Context (Cleaned up to save tokens/prevent errors)
    const contextString = cardKnowledge && cardKnowledge.length > 0 
      ? JSON.stringify(cardKnowledge) 
      : "No specific card data available yet. Please use base reward rates.";

    // 3. OpenRouter API Call with Enhanced Debugging
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter for some free models
        "X-Title": "SmartCard Optimizer",       // Helps avoid filtering/rate limits
      },
      body: JSON.stringify({
        // Using a highly reliable free model as the default
        "model": "nvidia/nemotron-nano-9b-v2:free",
        "messages": [
          {
            "role": "system",
            "content": `You are the "SmartCard Optimizer".
            Help users maximize rewards (points/miles) based on this bank data: ${contextString}.
            Rules:
            - If a merchant/category is listed in 'card_specific_tiers', use that rate.
            - Otherwise, fallback to the base rate (usually 1 point per $250).
            - Mention any 'monthly_spending_limit' if relevant to the purchase amount.
            - Be concise and objective.`
          },
          { "role": "user", "content": userQuestion }
        ],
        "temperature": 0.5
      })
    });

    // --- DEBUGGING LOGIC ---
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter Error (Status ${response.status}):`, errorText);
      
      // Informative errors for common codes
      if (response.status === 401) throw new Error("Invalid API Key. Check your .env.local file.");
      if (response.status === 402) throw new Error("Insufficient OpenRouter balance.");
      if (response.status === 429) throw new Error("Rate limit exceeded. Please wait a moment.");
      
      throw new Error(`AI Request Failed: ${response.statusText}`);
    }

    const aiData = await response.json();
    
    // Check if the AI actually returned content
    const answer = aiData.choices?.[0]?.message?.content;
    
    if (!answer) {
      console.error("OpenRouter returned an empty choices array:", aiData);
      throw new Error("The AI returned an empty response. Please try a different model.");
    }

    return { success: true, answer: answer };

  } catch (err: any) {
    // This logs specifically to your local terminal (VS Code)
    console.error("AI Expert Action Failure:", err.message);
    return { success: false, error: err.message };
  }
}