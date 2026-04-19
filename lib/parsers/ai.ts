/**
 * AI fallback parser using Gemini (or Anthropic if configured).
 * Called when structural PDF/XLS parsing yields 0 transactions.
 * If no AI key is configured, returns an empty result gracefully.
 */
import type { ParsedTransaction, ParseResult } from "./types";

const PROMPT = `You are a bank statement parser. Extract all transactions from the provided text.
Return a JSON array of objects with these exact fields:
- date: "YYYY-MM-DD"
- description: string (merchant name, cleaned up)
- amount: number (negative for spending/debit, positive for income/credit)
- currency: "TRY" (unless clearly otherwise)
- rawSource: string (the original line)

Return ONLY the JSON array, no explanation. If no transactions found, return [].`;

function parseJsonFromText(text: string): ParsedTransaction[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found");
  return JSON.parse(match[0]) as ParsedTransaction[];
}

async function parseWithGemini(text: string): Promise<ParseResult> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(
    `${PROMPT}\n\nParse this bank statement:\n\n${text.slice(0, 15000)}`
  );
  const responseText = result.response.text();
  const parsed = parseJsonFromText(responseText);
  const dates = parsed.map((t) => t.date).filter(Boolean).sort();

  return {
    transactions: parsed,
    method: "ai",
    dateFrom: dates[0],
    dateTo: dates[dates.length - 1],
  };
}

async function parseWithAnthropic(text: string): Promise<ParseResult> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: PROMPT,
    messages: [{ role: "user", content: `Parse this bank statement:\n\n${text.slice(0, 15000)}` }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("No text response");
  const parsed = parseJsonFromText(content.text);
  const dates = parsed.map((t) => t.date).filter(Boolean).sort();

  return {
    transactions: parsed,
    method: "ai",
    dateFrom: dates[0],
    dateTo: dates[dates.length - 1],
  };
}

export async function parseWithAI(text: string): Promise<ParseResult> {
  const hasGemini = !!process.env.GOOGLE_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  try {
    if (hasGemini) return await parseWithGemini(text);
    if (hasAnthropic) return await parseWithAnthropic(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI hatası";
    return { transactions: [], method: "ai", error: msg };
  }

  // No AI configured — return empty, non-fatal
  return { transactions: [], method: "ai", error: "AI yapılandırılmamış — işlemler manuel eklenebilir" };
}
