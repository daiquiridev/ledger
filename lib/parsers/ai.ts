/**
 * AI fallback parser using Claude API.
 * Called when structural PDF parsing yields 0 transactions.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { ParsedTransaction, ParseResult } from "./types";

const client = new Anthropic();

const SYSTEM = `You are a bank statement parser. Extract all transactions from the provided text.
Return a JSON array of objects with these exact fields:
- date: "YYYY-MM-DD"
- description: string (merchant name, cleaned up)
- amount: number (negative for spending/debit, positive for income/credit)
- currency: "TRY" (unless clearly otherwise)
- rawSource: string (the original line)

Return ONLY the JSON array, no explanation. If no transactions found, return [].`;

export async function parseWithAI(text: string): Promise<ParseResult> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Parse this bank statement and return transactions as JSON:\n\n${text.slice(0, 15000)}`,
      },
    ],
    system: SYSTEM,
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return { transactions: [], method: "ai", error: "AI yanıt vermedi" };
  }

  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found");

    const parsed = JSON.parse(jsonMatch[0]) as ParsedTransaction[];
    const dates = parsed.map((t) => t.date).filter(Boolean).sort();

    return {
      transactions: parsed,
      method: "ai",
      dateFrom: dates[0],
      dateTo: dates[dates.length - 1],
    };
  } catch {
    return { transactions: [], method: "ai", error: "AI çıktısı parse edilemedi" };
  }
}
