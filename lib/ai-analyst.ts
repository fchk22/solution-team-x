import OpenAI from "openai";

const router = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Solution Team X Admin",
  },
});

export async function getSmartCreditResponse(userQuery: string, context: any, isVIP: boolean = false, preferredLang: string = 'en') {
  const targetModel = isVIP 
    ? "deepseek/deepseek-v4-pro" 
    : "deepseek/deepseek-chat-v3.1";

  // 1. DEFINE responseLanguage HERE
  const langMap: Record<string, string> = {
    en: "English",
    zh: "Traditional Chinese (Hong Kong)",
    cn: "Simplified Chinese"
  };

  // This ensures the variable is available for the rest of the function
  const responseLanguage = langMap[preferredLang] || "English";

  console.log(`🤖 AI Processing | Tier: ${isVIP ? 'VIP' : 'Basic'} | Model: ${targetModel}`);

  const { card, globalRules, userProfile } = context;

  try {
    const response = await router.chat.completions.create({
      model: targetModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a warm human, professional Reward Analyst specializing in the Hong Kong credit card market. Your expertise is in calculating exact rebate yields based on complex tiered structures, and the welcome offers of credit cards.

          STRICT OPERATIONAL RULES:
          1. CURRENCY: All calculations must be in HKD. Never use "RM".
          2. STEP-BY-STEP CALCULATION: You must show math for Tier 1 (Bonus) and Tier 2 (Basic) separately.
          3. NO IMAGINATION: Use only the provided DATABASE CONTEXT.
          4. LANGUAGE: Always respond and generate suggestions in the SAME LANGUAGE used by the user in their question (English, Traditional Chinese, or Simplified Chinese).

          TONE & STYLE:
          - Be conversational and helpful. 
          - NEVER mention internal or robotic terms like "DATABASE CONTEXT", "JSON", "USER PROFILE", or "GLOBAL RULES".
          - Do not start sentences with "Based on the database..." or "According to the context provided...".
          - Instead, start naturally like "For this card...", "Actually, you can...", or "Great news regarding..."

          STRICT LANGUAGE RULE:
          - You MUST respond entirely in ${responseLanguage}.

          DYNAMIC SUGGESTIONS ENGINE:
          - Generate 1 "Smart Follow-up" questions based on the user's current query.
          - These questions should help the user explore:
            a) Specific merchant rules (e.g., "Does this apply to Apple Store?")
            b) Comparison with a similar card.
            c) How to maximize the specific reward mentioned (e.g., "How to reach the $10k cap faster?").

          STRICT JSON OUTPUT FORMAT:
          { 
            "answer": "Direct answer text.\n\n Brief core logic.", 
            "reason": "\n* Calculation steps...", 
            "alternative": "Disclaimer text...",
            "suggestions": ["Smart Follow-up Question 1?", "Smart Follow-up Question 2?"],
            "recommend_application": true
          }`
        },
        {
          role: "user",
          content: `DATABASE CONTEXT: ${JSON.stringify(card)}
          GLOBAL RULES: ${JSON.stringify(globalRules)}
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
    // ... fallback remains the same
    throw error;
  }
}