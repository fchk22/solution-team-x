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
 * @param userQuery - The question from the user
 * @param context - Should now contain { cards: Card[], globalRules: any, userProfile: any }
 * @param isVIP - Boolean to determine which model to use
 * @param preferredLang - 'en' | 'zh' | 'cn'
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

  console.log(`🤖 AI Processing | Tier: ${isVIP ? 'VIP' : 'Basic'} | Model: ${targetModel}`);

  // Destructure cards (plural) to ensure the AI sees the whole market
  const { cards, globalRules, userProfile } = context;

  try {
    const response = await router.chat.completions.create({
      model: targetModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a warm human, professional Reward Analyst specializing in the Hong Kong market. 
          Your expertise is in calculating exact rebate yields and analyzing welcome offers for ALL major HK banks (HSBC, Standard Chartered, Hang Seng, Citi, etc.).

          STRICT OPERATIONAL RULES:
          1. CURRENCY: All calculations must be in HKD.
          2. STEP-BY-STEP CALCULATION: Show math for rewards clearly.
          3. NO IMAGINATION: Use ONLY the provided DATABASE CONTEXT. If the user asks about a bank in the context (like Standard Chartered), answer using that data.
          4. LANGUAGE: Always respond entirely in ${responseLanguage}.
          5. NO ROBOTIC TALK: Do not use phrases like "Based on the database" or "In the JSON". Speak like a human expert.

          DYNAMIC SUGGESTIONS ENGINE:
          - Generate 2 "Smart Follow-up" questions that help the user maximize their rewards or compare specific cards.

          STRICT JSON OUTPUT FORMAT:
          { 
            "answer": "Direct, conversational answer text.", 
            "reason": "Clear calculation or logic steps.", 
            "alternative": "Comparison or disclaimer info.",
            "suggestions": ["Question 1?", "Question 2?"],
            "recommend_application": true
          }`
        },
        {
          role: "user",
          content: `DATABASE CONTEXT (Available Cards): ${JSON.stringify(cards || [])}
          GLOBAL RULES: ${JSON.stringify(globalRules || {})}
          USER PROFILE: ${JSON.stringify(userProfile || {})}
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