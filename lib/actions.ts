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
        .eq('id', session.user.id) // Fixed: Added 'id' as the first argument
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

    // 5. THE "ACCURATE MATCHER" (Fixes EveryMile vs Red issue)
    let primaryCard;

    // Strategy A: Direct JSON Recommendation
    // Priority: If the AI explicitly identified a recommendation in the JSON field
    if (aiChoice) {
      primaryCard = dbCards.find(c => 
        c.card_name.toLowerCase().includes(aiChoice) || 
        aiChoice.includes(c.card_name.toLowerCase())
      );
    }

    // Strategy B: Longest Name Scan in AI Text
    // This scans the AI's actual answer text. 
    // We sort by length descending so "HSBC Red Credit Card" matches before "HSBC"
    if (!primaryCard) {
      const sortedByLength = [...dbCards].sort((a, b) => b.card_name.length - a.card_name.length);
      primaryCard = sortedByLength.find(card => 
        aiAnswer.includes(card.card_name.toLowerCase())
      );
    }

    // Strategy C: Common Keyword Fallback
    if (!primaryCard) {
      const uniqueKeywords = ["red", "goal", "smart", "everymile", "simply cash", "cathay", "chill"];
      for (const kw of uniqueKeywords) {
        if (aiAnswer.includes(kw)) {
          primaryCard = dbCards.find(c => c.card_name.toLowerCase().includes(kw));
          if (primaryCard) break;
        }
      }
    }

    // 6. FINAL ASSIGNMENT
    // Only default to context[0] if no mention was found in AI output
    const finalCard = primaryCard || dbCards[0];
    
    console.log(`🎯 Link Resolver: Match found [${finalCard.card_name}] via ${primaryCard ? 'AI content' : 'Default Fallback'}`);

    // 7. BUTTON VISIBILITY LOGIC
    const showButton = parsed.recommend_application === true || 
                       aiAnswer.includes("recommend") || 
                       aiAnswer.includes("apply now") ||
                       aiAnswer.includes("best choice");

    // 8. LOCALIZATION
    let displayName = { bank: finalCard.bank_name || 'Bank', card: finalCard.card_name || 'Card' };
    if (preferredLang !== 'en') {
      const suffix = preferredLang === 'zh' ? '_zh' : '_cn';
      displayName.bank = finalCard[`bank_name${suffix}`] || finalCard.bank_name;
      displayName.card = finalCard[`card_name${suffix}`] || finalCard.card_name;
    }

    // 9. FINAL RETURN
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