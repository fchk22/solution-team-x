import OpenAI from "openai";

const router = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Solution Team X Admin",
  },
});

/**
 * AI Analyst for Credit Card Rewards
 */
export async function getSmartCreditResponse(
  userQuery: string, 
  context: any, 
  isVIP: boolean = false, 
  preferredLang: string = 'en'
) {
  const targetModel = isVIP 
    ? "deepseek/deepseek-v4-pro" 
    : "deepseek/deepseek-chat-v3.1";

  const langMap: Record<string, string> = {
    en: "English",
    zh: "Traditional Chinese (Hong Kong)",
    cn: "Simplified Chinese"
  };

  const responseLanguage = langMap[preferredLang] || "English";

  // Destructure context - summary comes from your refined supabaseServer.ts
  const { cards, globalRules, userProfile, summary } = context;

  // 1. DATA PREPARATION (The Fix for Missing Income/Bank Info)
  // We explicitly map the annual_income_requirement column so the AI sees it.
  const formattedCards = (cards || []).map((c: any, i: number) => (
    `[CARD ${i + 1}]
     Bank: ${c.bank_name}
     Name: ${c.card_name}
     Annual Income Requirement: ${c.annual_income_requirement || 'Not specified/Varies'}
     Welcome Offer: ${c.welcome_offer || 'N/A'}
     Special Promos: ${JSON.stringify(c.special_promos || {})}
     URL: ${c.application_url || 'N/A'}`
  )).join('\n\n');

  console.log(`🤖 AI Processing | Tier: ${isVIP ? 'VIP' : 'Basic'} | Model: ${targetModel}`);

  try {
    const response = await router.chat.completions.create({
      model: targetModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a human-like, professional Credit Card Reward Analyst in Hong Kong.
          
          CRITICAL CONTEXT:
          ${summary || "Multiple banks are currently available in the database."}
          
          STRICT OPERATIONAL RULES:
          1. DATA ADHERENCE: Use the provided DATASET. If a bank (HSBC, Standard Chartered, BEA, etc.) is in the dataset, you MUST acknowledge its data. Never claim a card is missing if it appears in the list below.
          2. ELIGIBILITY: Always reference the "Annual Income Requirement" when advising if a user qualifies.
          3. CALCULATION: Use HKD. Show clear math for rebates (e.g., 4% of $10,000 = $400).
          4. TONE: Speak like a helpful, grounded peer. Avoid technical jargon like "JSON" or "Database".
          5. LANGUAGE: Respond entirely in ${responseLanguage}.
          6. MATCHING: If recommending a card, set "recommend_application" to true and "card_name_recommendation" to the exact card name.

          JSON OUTPUT FORMAT:
          { 
            "answer": "Direct, helpful answer.", 
            "reason": "Calculation or eligibility logic.", 
            "alternative": "Comparison or minor disclaimer.",
            "suggestions": ["Follow-up 1?", "Follow-up 2?"],
            "card_name_recommendation": "Exact Card Name",
            "recommend_application": true
          }`
        },
        {
          role: "user",
          content: `
          USER PROFILE: ${JSON.stringify(userProfile || {})}
          GLOBAL RULES: ${JSON.stringify(globalRules || {})}
          
          DATASET (Available Cards):
          ${formattedCards}

          USER QUESTION: "${userQuery}"`
        }
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty AI response.");
    
    return content; 
  } catch (error: any) {
    console.error("❌ AI Error:", error.message);
    throw error;
  }
}