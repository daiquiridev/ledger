export interface ReviewTx {
  id: string;
  date: string;
  description: string;
  amount: string | number;
  currency: string;
  categoryId: string | null;
  accountId: string | null;
  note: string | null;
  suspicious: boolean | null;
  reviewStatus: "pending" | "approved" | "skipped" | null;
  rawSource: string | null;
  confidence: number | null;
  metadata: Record<string, unknown> | null;
  tags?: string[];
}

export interface Category {
  id: string;
  slug: string;
  labelTr: string;
  labelEn: string;
  parentId: string | null;
  color: string | null;
}

export interface Account {
  id: string;
  name: string;
  bank: string;
  last4: string | null;
}
