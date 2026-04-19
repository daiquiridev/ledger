/**
 * XLS/XLSX parser for Garanti and Yapı Kredi bank statements.
 * Ported from process_xls.py (see CLAUDE.md for format spec).
 */
import * as XLSX from "xlsx";
import type { ParsedTransaction, ParseResult } from "./types";

function parseAmount(raw: string | number): number {
  if (typeof raw === "number") return raw;
  const s = String(raw).trim();
  if (!s || s === "-") return 0;
  // European format: "1.234,56" → comma is decimal, dot is thousands
  if (s.includes(",")) {
    return parseFloat(s.replace(/\./g, "").replace(",", "."));
  }
  // Float string: "-1152.15"
  return parseFloat(s);
}

function parseDate(raw: string): string | null {
  // "DD/MM/YYYY"
  const m = String(raw).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function isDateCell(val: unknown): val is string {
  return typeof val === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(val.trim());
}

function isCardHeader(val: unknown): val is string {
  return typeof val === "string" && val.includes("Numaralı Kart");
}

function extractCardLast4(header: string): string | undefined {
  const m = header.match(/(\d{4})\s+\*+\s+\*+\s+(\d{4})/);
  return m ? m[2] : undefined;
}

export function parseXls(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const transactions: ParsedTransaction[] = [];
  let currentCard: string | undefined;
  const dates: string[] = [];

  for (const row of rows) {
    if (!Array.isArray(row) || row.length === 0) continue;

    const first = String(row[0] ?? "").trim();

    // Card header row
    if (isCardHeader(first)) {
      currentCard = extractCardLast4(first);
      continue;
    }

    // Column header row — skip
    if (first === "Tarih") continue;

    // Data row
    if (isDateCell(first)) {
      const date = parseDate(first);
      if (!date) continue;

      const description = String(row[1] ?? "").trim();
      const rawAmount = row[4] ?? row[3] ?? "";
      const amount = parseAmount(rawAmount as string);

      if (!description || isNaN(amount)) continue;

      // Installment info from description e.g. "(2/3)"
      const installMatch = description.match(/\((\d+\/\d+)\)/);

      dates.push(date);
      transactions.push({
        date,
        description,
        amount,
        currency: "TRY",
        rawSource: row.join("\t"),
        cardLast4: currentCard,
        installment: installMatch?.[1],
      });
    }
  }

  dates.sort();
  return {
    transactions,
    method: "structural",
    dateFrom: dates[0],
    dateTo: dates[dates.length - 1],
  };
}
