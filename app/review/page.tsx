export const dynamic = "force-dynamic";
import { ReviewPage } from "@/components/review/ReviewPage";
import { db } from "@/lib/db";
import { transactions, categories, accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface Props {
  searchParams: Promise<{ upload?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { upload: uploadId } = await searchParams;

  const where = uploadId
    ? and(eq(transactions.uploadId, uploadId), eq(transactions.reviewStatus, "pending"))
    : eq(transactions.reviewStatus, "pending");

  const [rawTx, catRows, accRows] = await Promise.all([
    db.select().from(transactions).where(where).limit(200),
    db.select().from(categories),
    db.select().from(accounts),
  ]);

  const txRows = rawTx.map((tx) => ({ ...tx, metadata: tx.metadata as Record<string, unknown> | null }));

  return <ReviewPage initialTx={txRows} categories={catRows} accounts={accRows} uploadId={uploadId} />;
}
