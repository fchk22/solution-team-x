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

export async function analyzePdfContent(fileBuffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      console.error("❌ PDF Parsing Error:", errData.parserError);
      reject(new Error("Failed to parse PDF document."));
    });

    pdfParser.on("pdfParser_dataReady", async () => {
      try {
        const rawText = pdfParser.getRawTextContent();

        // Fix spatial fragmentation: Collapses multiple spaces and tabs into single spaces
        const cleanedText = rawText ? rawText.replace(/\s\s+/g, ' ').trim() : "";

        console.log("--- CLEANED PDF TEXT PREVIEW ---");
        console.log(cleanedText.substring(0, 1000)); 
        console.log("-------------------------------");

        if (cleanedText.length < 50) {
          throw new Error("Extracted text is too short for analysis.");
        }

        console.log("🤖 Sending structured text to OpenRouter AI...");

        const response = await router.chat.completions.create({
          model: "openrouter/auto",
          messages: [
            {
              role: "system",
              content: `You are a specialist in parsing fragmented Hong Kong banking documents. 
              The text you receive is often broken or has characters spaced out. 
              Reconstruct words to identify the card name and its specific reward rates. 
              Respond ONLY in valid JSON.`
            },
            {
              role: "user",
              content: `Analyze this text for:
              1. Card Name (look for "HSBC Red", "Visa Signature", "Premier", etc.)
              2. Reward rates (Online, Dining, Supermarket, Other)
              3. Welcome offer summary.

              TEXT:
              ${cleanedText.substring(0, 15000)}

              Return exactly this JSON structure:
              {
                "card_name": "Full card name found",
                "rates": { "online": number, "dining": number, "supermarket": number, "other": number },
                "welcome_offer": "Summary text"
              }`
            }
          ],
          response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        const result = JSON.parse(content || "{}");
        
        console.log("✅ AI Analysis Result:", result);
        resolve(result);

      } catch (err) {
        console.error("❌ AI Processing Error:", err);
        resolve({
          card_name: "N/A",
          rates: { online: 0, dining: 0, supermarket: 0, other: 0 },
          welcome_offer: "Analysis failed."
        });
      }
    });

    pdfParser.parseBuffer(fileBuffer);
  });
}

export { analyzePdfContent as analyzeLocalBankData };