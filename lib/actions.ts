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

    // 3. INJECT STRICT PROMPT INTERCEPTORS
    let finalQuestion = userQuestion;
    const cleanQuestion = (userQuestion || "").toLowerCase().trim();
    
    // --- Interceptor A: Welcome Offer Trigger ---
    const isWelcomeOfferQuery = 
      cleanQuestion.includes("welcome offer") || 
      cleanQuestion.includes("迎新獎賞") || 
      cleanQuestion.includes("迎新奖赏") ||
      cleanQuestion.includes("迎新優惠") ||
      cleanQuestion.includes("迎新优惠");

    // --- Interceptor B: Air Miles / Asia Miles Comparison Trigger ---
    const isAirMilesQuery = 
      cleanQuestion.includes("compare air miles") || 
      cleanQuestion.includes("比較亞洲萬里通") || 
      cleanQuestion.includes("比较亚洲万里通") ||
      cleanQuestion.includes("飛行里數") || 
      cleanQuestion.includes("飞行里程");

    if (isWelcomeOfferQuery) {
      // Force prompt override injection rules directly into the user query frame
      finalQuestion = `
      [CRITICAL DIRECTIVE SYSTEM OVERRIDE]
      The user is asking: "${userQuestion}".
      
      You must evaluate all the cards provided in the context below based on their 'welcome_offer_details' column data.
      Even if the string formatting appears raw or contains structural scraped text elements, interpret and extract their real value.
      
      CRITICAL RANKING METRIC RULES:
      1. Rank exactly the top 5 credit cards from highest value to lowest value based on their welcome application perks.
      2. Priority Matrix: Cash Rebates, Cash Vouchers, and Apple Gift Cards take absolute precedence over points or air miles.
      3. Loyalty Points and Air Miles must be converted to standard comparative valuations (e.g., assume 1 Air Mile = HK$0.10 cash value) to determine mathematical weight.
      4. DO NOT reply stating that the data is missing, incomplete, or contains placeholders. Use the available context creatively and completely to pick the 5 best alternatives.
      5. Output your summary cleanly in the 'answer' JSON property written entirely in the requested language: ${preferredLang === 'zh' ? 'Traditional Chinese (繁體中文)' : preferredLang === 'cn' ? 'Simplified Chinese (简体中文)' : 'English'}.
      `;
    } else if (isAirMilesQuery) {
      // Force mathematical mileage conversion optimization rules into the user query frame
      finalQuestion = `
      [CRITICAL DIRECTIVE SYSTEM OVERRIDE]
      The user wants to find the absolute best options for earning airline rewards: "${userQuestion}".
      
      You must evaluate all the credit cards available in the provided database context specifically focusing on their Asia Miles conversion metrics.
      
      CRITICAL RANKING METRIC RULES:
      1. Mathematically compare the cards by sorting them by the lowest "spending required per mile earned" (HKD per 1 Asia Mile).
      2. Select and rank exactly the top 5 credit cards that offer the highest mileage earning efficiency across standard earning categories (e.g., Local Spending, Overseas Spending, Dining, or Online purchases).
      3. Clearly state the exact mileage rate structure for each of the top 5 cards (e.g., HKD 4 = 1 Mile, or HKD 6 = 1 Mile) so the user sees the explicit value comparison.
      4. Base your entire analysis on data available inside the context parameters. Do not use placeholders or complain about formatting.
      5. Output your formatted comparative breakdown inside the 'answer' JSON property written entirely in the requested language: ${preferredLang === 'zh' ? 'Traditional Chinese (繁體中文)' : preferredLang === 'cn' ? 'Simplified Chinese (简体中文)' : 'English'}.
      `;
    }

    // 4. GET AI RESPONSE
    const augmentedContext = { ...context, userProfile };
    const rawAiJson = await getSmartCreditResponse(
      finalQuestion, 
      augmentedContext, 
      isVIP, 
      preferredLang
    );
    
    // 5. PARSE AI RESPONSE
    const parsed = JSON.parse(rawAiJson || "{}");
    const aiAnswer = (parsed.answer || "").toLowerCase();
    const aiChoice = (parsed.card_name_recommendation || "").toLowerCase();
    const dbCards = context.cards;

    // 6. THE "ACCURATE MATCHER" (Fixes EveryMile vs Red issue)
    let primaryCard;

    // Strategy A: Direct JSON Recommendation
    if (aiChoice) {
      primaryCard = dbCards.find(c => 
        c.card_name.toLowerCase().includes(aiChoice) || 
        aiChoice.includes(c.card_name.toLowerCase())
      );
    }

    // Strategy B: Longest Name Scan in AI Text
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

    // 7. FINAL ASSIGNMENT
    const finalCard = primaryCard || dbCards[0];
    
    console.log(`🎯 Link Resolver: Match found [${finalCard.card_name}] via ${primaryCard ? 'AI content' : 'Default Fallback'}`);

    // 8. BUTTON VISIBILITY LOGIC
    const showButton = parsed.recommend_application === true || 
                       aiAnswer.includes("recommend") || 
                       aiAnswer.includes("apply now") ||
                       aiAnswer.includes("best choice") ||
                       isWelcomeOfferQuery ||
                       isAirMilesQuery; // Force button mapping capability for top Air Miles pick

    // 9. LOCALIZATION
    let displayName = { bank: finalCard.bank_name || 'Bank', card: finalCard.card_name || 'Card' };
    if (preferredLang !== 'en') {
      const suffix = preferredLang === 'zh' ? '_zh' : '_cn';
      displayName.bank = finalCard[`bank_name${suffix}`] || finalCard.bank_name;
      displayName.card = finalCard[`card_name${suffix}`] || finalCard.card_name;
    }

    // 10. FINAL RETURN
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