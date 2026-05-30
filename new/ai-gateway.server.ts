// Server-only helper to call Lovable AI Gateway for transaction extraction.
// Uses Gemini multimodal (handles PDFs + images natively).

export type ExtractedTransaction = {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive number
  type: "debit" | "credit";
  balance?: number | null;
  reference?: string | null;
  category?: string | null;
  vendor?: string | null;
  confidence?: number | null;
};

export type ExtractionResult = {
  bank_name?: string | null;
  account_number?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  opening_balance?: number | null;
  closing_balance?: number | null;
  transactions: ExtractedTransaction[];
};

export { CATEGORIES } from "./categories";
import { CATEGORIES } from "./categories";

const SYSTEM_PROMPT = `You are an expert financial document analyst. Extract every transaction from the attached bank statement.
Return STRICT JSON only matching the requested schema. Rules:
- Dates: ISO format YYYY-MM-DD. Infer year from statement period if ambiguous.
- Amounts: positive numbers, no currency symbols, decimal point.
- type: "debit" for money out (withdrawal/payment), "credit" for money in (deposit/received).
- Include EVERY transaction line, including fees and interest. Do not skip or summarize.
- description: cleaned merchant/payee text from the statement line.
- vendor: normalized short brand/payee name (e.g. "AMAZON PMNT US*XYZ" -> "Amazon"). Null if unclear.
- category: pick ONE from: ${CATEGORIES.join(", ")}.
- confidence: 0.0-1.0 for category/vendor accuracy.
- If the document is not a bank statement, return an empty transactions array.`;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    bank_name: { type: ["string", "null"] },
    account_number: { type: ["string", "null"] },
    period_start: { type: ["string", "null"], description: "YYYY-MM-DD" },
    period_end: { type: ["string", "null"], description: "YYYY-MM-DD" },
    opening_balance: { type: ["number", "null"] },
    closing_balance: { type: ["number", "null"] },
    transactions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          date: { type: "string", description: "YYYY-MM-DD" },
          description: { type: "string" },
          amount: { type: "number" },
          type: { type: "string", enum: ["debit", "credit"] },
          balance: { type: ["number", "null"] },
          reference: { type: ["string", "null"] },
          category: { type: ["string", "null"] },
          vendor: { type: ["string", "null"] },
          confidence: { type: ["number", "null"] },
        },
        required: [
          "date",
          "description",
          "amount",
          "type",
          "balance",
          "reference",
          "category",
          "vendor",
          "confidence",
        ],
      },
    },
  },
  required: [
    "bank_name",
    "account_number",
    "period_start",
    "period_end",
    "opening_balance",
    "closing_balance",
    "transactions",
  ],
} as const;

export async function extractStatement(
  fileBytes: Uint8Array,
  mimeType: string,
  fileName: string,
): Promise<ExtractionResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  // Encode as base64 data URL (chunked to avoid stack overflow on large files)
  const b64 = bytesToBase64(fileBytes);
  const dataUrl = `data:${mimeType};base64,${b64}`;

  const body = {
    model: "google/gemini-2.5-pro",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract all transactions from this bank statement (file: ${fileName}). Return JSON only.`,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "bank_statement_extraction",
        strict: true,
        schema: RESPONSE_SCHEMA,
      },
    },
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "direct-fetch",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached — please retry in a moment.");
    if (res.status === 402)
      throw new Error("AI credits exhausted — add credits in Settings → Workspace → Usage.");
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned no content");

  try {
    return JSON.parse(content) as ExtractionResult;
  } catch {
    throw new Error("AI returned invalid JSON");
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  // btoa is available in the Worker runtime
  return btoa(binary);
}
