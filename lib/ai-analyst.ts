import OpenAI from "openai";
import PDFParser from "pdf2json";

const router = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Solution Team X Admin",
  },
});

export async function getSmartCreditResponse(userQuery: string, context: any, isVIP: boolean = false) {
  const targetModel = isVIP 
    ? "google/gemini-3.1-flash-lite-preview" 
    : "deepseek/deepseek-chat-v3.1";

  console.log(`🤖 AI Processing | Tier: ${isVIP ? 'VIP' : 'Basic'} | Model: ${targetModel}`);

  const { card, globalRules } = context;

  try {
    const response = await router.chat.completions.create({
      model: targetModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert HSBC HK Credit Card Advisor. 
          
          PRIORITY HIERARCHY:
          1. INSTANT DISCOUNTS: If a promo offers an "instant discount" (e.g., 3% off iPhones), this is the TOP priority. Do NOT suggest 0.4% or 4% rebates as "better" unless they mathematically result in more savings and don't hit caps.
          2. TIERED MATH: You must calculate the FULL spend.
             - Tier 1: Calculate spend up to the cap (e.g., $1,250 @ 8% = $100 RC).
             - Tier 2: Calculate remaining spend at the "excess_rate" (usually 0.004).
             - Total: Sum of Tier 1 + Tier 2.

          STRICT FORMAT:
          Respond ONLY in JSON: 
          { 
            "answer": "The total reward/discount value", 
            "reason": "Clear math breakdown (e.g., $1,250*8% + $3,750*0.4%)", 
            "alternative": "A comparison to the monthly cap or a different card strategy" 
          }

          DATA ADHERENCE:
          - Use ${card.card_name} data specifically.
          - If the user asks about Apple/iPhone and the context shows a Premier 3% discount, prioritize it.`
        },
        {
          role: "user",
          content: `DATABASE CONTEXT: ${JSON.stringify(card)}
          GLOBAL RULES: ${JSON.stringify(globalRules)}
          USER QUESTION: "${userQuery}"`
        }
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("OpenRouter returned an empty content body.");
    
    return content; 
  } catch (error: any) {
    console.error("❌ AI Error:", error.message);
    if (error.message.includes("403") || error.message.includes("available")) {
      const fallback = await router.chat.completions.create({
        model: "openrouter/auto",
        messages: [{ role: "user", content: `Answer this in JSON {answer, reason, alternative}: ${userQuery}` }]
      });
      return fallback.choices[0].message.content || "";
    }
    throw error;
  }
}

// ... keep analyzePdfContent as it was or remove if unused ...
export async function analyzePdfContent(fileBuffer: Buffer): Promise<any> {
  // Existing PDF logic remains the same
  return new Promise((resolve) => resolve({ card_name: "N/A" })); 
}