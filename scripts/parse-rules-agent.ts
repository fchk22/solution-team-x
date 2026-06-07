// scripts/parse-rules-agent.ts
import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';

// 1. Ensure environment variables are loaded if running this script directly
dotenv.config({ path: '.env.local' });

const { GEMINI_API_KEY } = process.env;

// 2. 🛡️ Guard Statement: Verify the key is structurally present at runtime
if (!GEMINI_API_KEY) {
  throw new Error("🚨 Critical Error: Missing GEMINI_API_KEY inside your environment settings.");
}

// 3. ✨ Extract into a clean, guaranteed string primitive to satisfy strict mode
const verifiedGeminiKey: string = GEMINI_API_KEY;

// 4. 🚀 Instantiate the official SDK with a bulletproof string type
const ai = new GoogleGenAI({ apiKey: verifiedGeminiKey });

// The deterministic JSON schema structure Gemini must conform to
const CardRulesSchema = {
  type: Type.OBJECT,
  properties: {
    base_rebate_pct: { type: Type.NUMBER, description: "Baseline cash back rate percentage (e.g., 0.4)" },
    dining_rebate_pct: { type: Type.NUMBER, description: "Dining multiplier rebate percentage (e.g., 4.0). Return null if not mentioned." },
    online_rebate_pct: { type: Type.NUMBER, description: "Online shopping rebate percentage (e.g., 6.0). Return null if not mentioned." },
    overseas_rebate_pct: { type: Type.NUMBER, description: "Overseas transaction rebate percentage. Return null if not mentioned." },
    online_spend_cap_hkd: { type: Type.NUMBER, description: "Monthly shopping spend cap limit. Return -1 if uncapped or unlimited." },
    dining_spend_cap_hkd: { type: Type.NUMBER, description: "Monthly dining spend cap limit. Return -1 if uncapped or unlimited." },
  },
  required: ["base_rebate_pct"],
};

export async function extractStructuredRules(rawText: string) {
  console.log("🧠 Transmitting raw layout string to Gemini Structured Engine...");
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Light, ultra-fast structural parsing model
    contents: `Analyze this raw bank page text payload and extract the credit card spending rules accurately: \n\n${rawText}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: CardRulesSchema,
      systemInstruction: "You are a professional credit card fine-print auditor in Hong Kong. Isolate marketing hype and capture baseline reward numbers. Extract variables cleanly."
    }
  });

  return JSON.parse(response.text);
}