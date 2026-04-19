"use server";

import { getCardExpertContext } from "@/lib/supabaseServer";
import { getSmartCreditResponse } from "@/lib/ai-analyst";
import { analyzePdfContent } from "@/lib/ai-analyst"; // Make sure this import matches your file name

export async function askCardExpert(userQuestion: string, isVIP: boolean = false) {
  try {
    const lowerQ = userQuestion.toLowerCase();
    let cardQuery = "Red";

    // 1. Refined Routing Logic
    if (lowerQ.includes("iphone") || lowerQ.includes("apple") || lowerQ.includes("mac")) {
      cardQuery = "Premier";
    } else if (lowerQ.includes("everymile") || lowerQ.includes("miles")) {
      cardQuery = "EveryMile";
    } else if (lowerQ.includes("signature")) {
      cardQuery = "Signature";
    }

    // 2. Fetch context from Supabase (using your fixed Admin client)
    const context = await getCardExpertContext(cardQuery);
    if (!context || !context.card) {
      return { success: false, error: `Could not find data for ${cardQuery} card.` };
    }

    // 3. Get AI Response (JSON string)
    const rawAiJson = await getSmartCreditResponse(userQuestion, context, isVIP);
    
    // 4. Parse JSON to ensure result.answer exists for page.tsx
    const parsed = JSON.parse(rawAiJson);

    return {
      success: true,
      answer: parsed.answer,
      reason: parsed.reason,
      alternative: parsed.alternative,
      // This combines them for the UI to display easily
      fullResponse: `${parsed.answer}\n\nREASON: ${parsed.reason}\n\nALT: ${parsed.alternative}`
    };

  } catch (error: any) {
    console.error("Action Error:", error.message);
    return { success: false, error: error.message || "Failed to get expert advice." };
  }
}

export async function uploadAndAnalyzeAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Call the analysis logic we defined in ai-analyst.ts
    const analysisResult = await analyzePdfContent(buffer);

    return { 
      success: true, 
      data: analysisResult 
    };
  } catch (error: any) {
    console.error("Upload Error:", error.message);
    return { 
      success: false, 
      error: error.message || "Failed to analyze document" 
    };
  }
}