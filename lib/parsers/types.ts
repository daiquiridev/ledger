export interface ParsedTransaction {
  date: string;           // "YYYY-MM-DD"
  description: string;
  amount: number;         // negative = spend, positive = income/refund
  currency: string;       // "TRY"
  rawSource: string;
  cardLast4?: string;
  installment?: string;   // "2/3"
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  method: "structural" | "ai";
  dateFrom?: string;
  dateTo?: string;
  error?: string;
}
