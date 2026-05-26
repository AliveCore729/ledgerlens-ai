import { Injectable } from "@nestjs/common";

import { GoogleGenerativeAI } from "@google/generative-ai";

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI =
      new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY || "",
      );
  }

  async categorizeTransaction(raw: string) {
    try {
      const model =
        this.genAI.getGenerativeModel({
          model:
            process.env.GEMINI_MODEL ||
            "gemini-2.5-flash",
        });

      const prompt = `
You are a fintech AI assistant.

Analyze this bank transaction:

"${raw}"

Return ONLY valid JSON:

{
  "vendor": "",
  "category": "",
  "subcategory": "",
  "type": "",
  "confidence": 0.0
}
`;

      const result =
        await model.generateContent(prompt);

      const response =
        result.response.text();

      return JSON.parse(
        response.replace(/```json|```/g, "").trim(),
      );
    } catch (error) {
      console.error(error);

      return {
        vendor: "UNKNOWN",
        category: "UNCATEGORIZED",
        subcategory: "UNKNOWN",
        type: "UNKNOWN",
        confidence: 0,
      };
    }
  }
}