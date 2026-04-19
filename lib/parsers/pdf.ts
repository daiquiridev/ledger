/**
 * PDF structural parser for Garanti / YK bank statements.
 * pdf-parse extracts table columns as separate lines, so we use a
 * sliding-window approach: find a date line, then collect description
 * and amount from the surrounding lines.
 */
import pdfParse from "pdf-parse";
import type { ParsedTransaction, ParseResult } from "./types";

const DATE_RE = /^(\d{2}[\/\.]\d{2}[\/\.]\d{4})$/;
const DATE_INLINE_RE = /(\d{2}[\/\.]\d{2}[\/\.]\d{4})/;
// Matches European (1.234,56) and plain float (-1152.15) amounts
const AMOUNT_RE = /^([+-]?\d{1,3}(?:\.\d{3})*,\d{2}|[+-]?\d+\.\d{2})$/;
const AMOUNT_INLINE_RE = /([+-]?\d{1,3}(?:\.\d{3})*,\d{2}|[+-]?\d+\.\d{2})\s*$/;

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
  let text: string;
  try {
    const data = await pdfParse(buffer);
    text = data.text;
  } catch {
    return { transactions: [], method: "structural", error: "PDF okunamadı" };
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const transactions: ParsedTransaction[] = [];
  const dates: string[] = [];

  // Pass 1: try same-line matching (ideal case)
  for (const line of lines) {
    const dateMatch = line.match(DATE_INLINE_RE);
    if (!dateMatch) continue;
    const amountMatch = line.match(AMOUNT_INLINE_RE);
    if (!amountMatch) continue;

    const date = normalizeDate(dateMatch[1]);
    const amount = parseAmount(amountMatch[1]);
    if (isNaN(amount)) continue;

    const desc = line
      .replace(dateMatch[0], "")
      .replace(amountMatch[0], "")
      .replace(/\s+/g, " ")
      .trim();
    if (!desc) continue;

    dates.push(date);
    transactions.push({ date, description: desc, amount, currency: "TRY", rawSource: line });
  }

  if (transactions.length > 0) {
    dates.sort();
    return { transactions, method: "structural", dateFrom: dates[0], dateTo: dates[dates.length - 1] };
  }

  // Pass 2: sliding window — date on one line, description + amount on nearby lines
  const WINDOW = 4;
  const used = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    if (used.has(i)) continue;
    const dateMatch = lines[i].match(DATE_RE);
    if (!dateMatch) continue;

    const date = normalizeDate(dateMatch[1]);
    const descLines: string[] = [];
    let amount: number | null = null;
    let amountLine = -1;

    for (let j = i + 1; j <= Math.min(i + WINDOW, lines.length - 1); j++) {
      if (used.has(j)) break;
      const amtMatch = lines[j].match(AMOUNT_RE);
      if (amtMatch) {
        amount = parseAmount(amtMatch[1]);
        amountLine = j;
        break;
      }
      // Stop if we hit another date
      if (lines[j].match(DATE_RE)) break;
      descLines.push(lines[j]);
    }

    if (amount === null || isNaN(amount)) continue;

    const desc = descLines.join(" ").replace(/\s+/g, " ").trim();
    if (!desc) continue;

    // Mark used lines
    used.add(i);
    for (let j = i + 1; j <= amountLine; j++) used.add(j);

    const rawSource = [lines[i], ...descLines, lines[amountLine]].join(" | ");
    dates.push(date);
    transactions.push({ date, description: desc, amount, currency: "TRY", rawSource });
  }

  dates.sort();

  return {
    transactions,
    method: "structural",
    dateFrom: dates[0],
    dateTo: dates[dates.length - 1],
    error: transactions.length === 0 ? "Yapısal çıkarım başarısız — AI ile tekrar denenecek" : undefined,
  };
}
