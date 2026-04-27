"use server";

import { getCardExpertContext } from "@/lib/supabaseServer";
import { getSmartCreditResponse } from "@/lib/ai-analyst";
import { supabase } from "@/lib/auth"; 

/**
 * @param userQuestion - The question from the chat input
 * @param isVIP - Boolean for model tiering
 * @param preferredLang - The UI language from the frontend ('en', 'zh', 'cn')
 */
export async function askCardExpert(
  userQuestion: string, 
  isVIP: boolean = false, 
  preferredLang: string = 'en'
) {
  try {
    const lowerQ = userQuestion.toLowerCase();
    
    // 1. GET USER SESSION & PROFILE
    const { data: { session } } = await supabase.auth.getSession();
    let userProfile = null;

    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('income, residency_status, primary_spend, occupation, primary_bank, preferred_language')
        .eq('id', session.user.id)
        .maybeSingle();
      userProfile = profile;
    }

    // 2. ROUTING / SEARCH LOGIC
    let cardQuery = "Red"; 

    if (lowerQ.includes("iphone") || lowerQ.includes("apple") || lowerQ.includes("mac") || lowerQ.includes("premier")) {
      cardQuery = "Premier";
    } else if (lowerQ.includes("everymile") || lowerQ.includes("miles") || lowerQ.includes("travel")) {
      cardQuery = "EveryMile";
    } else if (lowerQ.includes("signature") || lowerQ.includes("dining")) {
      cardQuery = "Signature";
    } else if (lowerQ.includes("gold")) {
      cardQuery = "Gold";
    }

    // 3. FETCH DATA FROM SUPABASE
    const context = await getCardExpertContext(cardQuery);
    
    if (!context || !context.card) {
      return { success: false, error: `Could not find data for ${cardQuery} logic.` };
    }

    // 4. AUGMENT CONTEXT WITH USER DATA
    const augmentedContext = {
      ...context,
      userProfile: userProfile 
    };

    // 5. GET AI RESPONSE (Passing the language and tier)
    const rawAiJson = await getSmartCreditResponse(
      userQuestion, 
      augmentedContext, 
      isVIP, 
      preferredLang
    );
    
    // 6. PARSE JSON FROM AI
    const parsed = JSON.parse(rawAiJson);

    const card = context.card;
    let displayName = { bank: '', card: '' };

    // Select the correct localized strings
    if (preferredLang === 'zh') {
      displayName.bank = card.bank_name_zh || card.bank_name;
      displayName.card = card.card_name_zh || card.card_name;
    } else if (preferredLang === 'cn') {
      displayName.bank = card.bank_name_cn || card.bank_name;
      displayName.card = card.card_name_cn || card.card_name;
    } else {
      displayName.bank = card.bank_name || 'Bank';
      displayName.card = card.card_name || 'Card';
    }

    // 7. FINAL RETURN OBJECT
    return {
      success: true,
      answer: parsed.answer,
      reason: parsed.reason,
      alternative: parsed.alternative,
      suggestions: parsed.suggestions || [], 
      applicationUrl: parsed.recommend_application ? context.card.application_url : null,
      //bankName: context.card?.bank_name || '', // Add this
      //cardName: context.card?.card_name || '',  // Add this
      bankName: displayName.bank, // Sent as a single string to frontend
      cardName: displayName.card, // Sent as a single string to frontend
      fullResponse: `${parsed.answer}\n\n**Reasoning:** ${parsed.reason}\n\n**Pro-Tip:** ${parsed.alternative}`
    };

  } catch (error: any) {
    console.error("Action Error:", error.message);
    return { success: false, error: error.message || "Failed to get expert advice." };
  }
}