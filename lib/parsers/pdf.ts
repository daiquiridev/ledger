/**
 * PDF parser — structural first, AI fallback.
 * Uses pdf-parse for text extraction, then regex to find table rows.
 */
import pdfParse from "pdf-parse";
import type { ParsedTransaction, ParseResult } from "./types";

// Date patterns: DD/MM/YYYY or DD.MM.YYYY
const DATE_RE = /(\d{2}[\/\.]\d{2}[\/\.]\d{4})/;
// Amount patterns: -1.234,56 or +12,50 or -1152.15
const AMOUNT_RE = /([+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/;

function normalizeDate(raw: string): string {
  const parts = raw.split(/[\/\.]/);
  return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
}

function parseAmount(raw: string): number {
  const s = raw.trim();
  if (s.includes(",")) {
    return parseFloat(s.replace(/\./g, "").replace(",", "."));
  }
  return parseFloat(s);
}

export async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  let data: { text: string };
  try {
    data = await pdfParse(buffer);
  } catch {
    return { transactions: [], method: "structural", error: "PDF okunamadı" };
  }

  const lines = data.text.split("\n").map((l) => l.trim()).filter(Boolean);
  const transactions: ParsedTransaction[] = [];
  const dates: string[] = [];

  for (const line of lines) {
    const dateMatch = line.match(DATE_RE);
    if (!dateMatch) continue;

    const amountMatch = line.match(new RegExp(AMOUNT_RE.source + "\\s*$"));
    if (!amountMatch) continue;

    const date = normalizeDate(dateMatch[1]);
    const amount = parseAmount(amountMatch[1]);
    if (isNaN(amount)) continue;

    // Description = everything between date and amount
    const desc = line
      .replace(dateMatch[0], "")
      .replace(amountMatch[0], "")
      .replace(/\s+/g, " ")
      .trim();

    if (!desc) continue;

    dates.push(date);
    transactions.push({ date, description: desc, amount, currency: "TRY", rawSource: line });
  }

  dates.sort();

  return {
    transactions,
    method: "structural",
    dateFrom: dates[0],
    dateTo: dates[dates.length - 1],
    error: transactions.length === 0 ? "Yapısal çıkarım başarısız" : undefined,
  };
}
