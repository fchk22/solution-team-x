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
    // 1. GET USER PROFILE
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

    // 2. DYNAMIC DATABASE SEARCH
    const context = await getCardExpertContext(userQuestion || "");
    
    if (!context || !context.cards || context.cards.length === 0) {
      return { 
        success: false, 
        error: "I couldn't find any specific credit cards in our database matching your request." 
      };
    }

    // 3. GET AI RESPONSE
    const augmentedContext = { ...context, userProfile };
    const rawAiJson = await getSmartCreditResponse(
      userQuestion, 
      augmentedContext, 
      isVIP, 
      preferredLang
    );
    
    // 4. PARSE AI RESPONSE
    const parsed = JSON.parse(rawAiJson || "{}");
    const aiAnswer = (parsed.answer || "").toLowerCase();
    const aiChoice = (parsed.card_name_recommendation || "").toLowerCase();
    const dbCards = context.cards;

    // 5. STRATEGIC CARD MATCHING (The Fix for BEA Goal vs UnionPay)
    let primaryCard;

    // Strategy A: Unique Product Keywords
    // We check for these first so "BEA Goal" beats a generic "BEA" match.
    const uniqueProductKeywords = ["goal", "everymile", "red", "motion", "chill", "pulse", "premier", "signature"];
    
    for (const keyword of uniqueProductKeywords) {
      if (aiAnswer.includes(keyword) || aiChoice.includes(keyword)) {
        primaryCard = dbCards.find(c => c.card_name.toLowerCase().includes(keyword));
        if (primaryCard) break; 
      }
    }

    // Strategy B: Full Name Match
    if (!primaryCard) {
      primaryCard = dbCards
        .sort((a, b) => b.card_name.length - a.card_name.length)
        .find(card => {
          const name = card.card_name.toLowerCase();
          return aiAnswer.includes(name) || aiChoice.includes(name);
        });
    }

    // Strategy C: Bank-Level Fallback (e.g., any BEA card if "BEA" is mentioned)
    if (!primaryCard && aiAnswer.includes("bea")) {
      primaryCard = dbCards.find(c => 
        (c.bank_name || "").toLowerCase().includes("bea") || 
        c.card_name.toLowerCase().includes("bea")
      );
    }

    // FINAL FALLBACK: Default to the first card in the search results
    const finalCard = primaryCard || dbCards[0];
    
    // Debugging: Log this in your terminal to verify the match
    console.log(`✅ AI Recommended Link: ${finalCard.card_name}`);

    // 6. BUTTON VISIBILITY LOGIC
    // Force button to show if the AI explicitly recommends or mentions application
    const showButton = parsed.recommend_application || 
                       aiAnswer.includes("recommend") || 
                       aiAnswer.includes("apply") ||
                       aiAnswer.includes("best option");

    // 7. LOCALIZATION
    let displayName = { bank: finalCard.bank_name || 'Bank', card: finalCard.card_name || 'Card' };
    if (preferredLang !== 'en') {
      const suffix = preferredLang === 'zh' ? '_zh' : '_cn';
      displayName.bank = finalCard[`bank_name${suffix}`] || finalCard.bank_name;
      displayName.card = finalCard[`card_name${suffix}`] || finalCard.card_name;
    }

    // 8. FINAL RETURN
    return {
      success: true,
      answer: parsed.answer || "Analyzed.",
      reason: parsed.reason || "",
      alternative: parsed.alternative || "",
      suggestions: parsed.suggestions || [], 
      applicationUrl: (showButton && finalCard.application_url) ? finalCard.application_url : null,
      bankName: displayName.bank,
      cardName: displayName.card,
      fullResponse: `${parsed.answer}\n\n**Reasoning:** ${parsed.reason}`
    };

  } catch (error: any) {
    console.error("Action Error:", error.message);
    return { success: false, error: "The AI analyst encountered an error." };
  }
}