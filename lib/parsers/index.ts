import { parseXls } from "./xls";
import { parsePdf } from "./pdf";
import { parseWithAI } from "./ai";
import type { ParseResult } from "./types";
import pdfParse from "pdf-parse";

export type { ParseResult, ParsedTransaction } from "./types";

export async function parseFile(buffer: Buffer, filename: string): Promise<ParseResult> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "xls" || ext === "xlsx") {
    return parseXls(buffer);
  }

  if (ext === "pdf") {
    const result = await parsePdf(buffer);
    if (result.transactions.length > 0) return result;

    // Fallback to AI
    let text = "";
    try {
      const data = await pdfParse(buffer);
      text = data.text;
    } catch {
      return { transactions: [], method: "ai", error: "PDF okunamadı" };
    }
    return parseWithAI(text);
  }

  // CSV — simple fallback
  const text = buffer.toString("utf-8");
  return parseWithAI(text);
}
