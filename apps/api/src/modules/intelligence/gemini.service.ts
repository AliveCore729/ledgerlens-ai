import { Injectable } from "@nestjs/common";

import { GoogleGenerativeAI } from "@google/generative-ai";

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI | null;
  private cooldownUntil = 0;
  private lastRetriableLogAt = 0;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parseRetryDelayMs(error: unknown) {
    const message = String((error as any)?.message || "");
    const secondsMatch = message.match(/Please retry in\s+([\d.]+)s/i);
    if (secondsMatch) {
      return Math.ceil(Number(secondsMatch[1]) * 1000);
    }

    const retryInfo = (error as any)?.errorDetails?.find?.(
      (detail: any) => detail?.["@type"]?.includes("RetryInfo"),
    );

    const retryDelay = String(retryInfo?.retryDelay || "");
    const retryDelayMatch = retryDelay.match(/(\d+)s/i);
    if (retryDelayMatch) {
      return Number(retryDelayMatch[1]) * 1000;
    }

    return null;
  }

  private isRetriableError(error: unknown) {
    const status = Number((error as any)?.status || 0);
    return status === 429 || status === 503;
  }

  async categorizeTransaction(raw: string) {
    if (!this.genAI) {
      return {
        vendor: "UNKNOWN",
        category: "UNCATEGORIZED",
        subcategory: "UNKNOWN",
        type: "UNKNOWN",
        confidence: 0,
      };
    }

    if (Date.now() < this.cooldownUntil) {
      return {
        vendor: "UNKNOWN",
        category: "UNCATEGORIZED",
        subcategory: "UNKNOWN",
        type: "UNKNOWN",
        confidence: 0,
      };
    }

    const model = this.genAI.getGenerativeModel({
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

    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result =
          await model.generateContent(prompt);

        const response =
          result.response.text();

        return JSON.parse(
          response.replace(/```json|```/g, "").trim(),
        );
      } catch (error) {
        if (!this.isRetriableError(error) || attempt === maxAttempts) {
          if (this.isRetriableError(error)) {
            const cooldownMs = this.parseRetryDelayMs(error) ?? 45_000;
            this.cooldownUntil = Date.now() + cooldownMs;
            if (Date.now() - this.lastRetriableLogAt > 10_000) {
              this.lastRetriableLogAt = Date.now();
              const status = Number((error as any)?.status || 0);
              console.warn(
                `[GeminiService] AI temporarily throttled (status ${status}). Falling back to UNCATEGORIZED for ${Math.ceil(cooldownMs / 1000)}s.`,
              );
            }
          } else {
            console.error(error);
          }

          return {
            vendor: "UNKNOWN",
            category: "UNCATEGORIZED",
            subcategory: "UNKNOWN",
            type: "UNKNOWN",
            confidence: 0,
          };
        }

        const waitMs = this.parseRetryDelayMs(error) ?? attempt * 3000;
        await this.sleep(waitMs);
      }
    }

    return {
      vendor: "UNKNOWN",
      category: "UNCATEGORIZED",
      subcategory: "UNKNOWN",
      type: "UNKNOWN",
      confidence: 0,
    };
  }
}