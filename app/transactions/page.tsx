export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { transactions, categories, accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";

export default async function TransactionsPage() {
  const [txRows, catRows, accRows] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.reviewStatus, "approved")).orderBy(transactions.date).limit(500),
    db.select().from(categories),
    db.select().from(accounts),
  ]);

  return <TransactionsClient transactions={txRows} categories={catRows} accounts={accRows} />;
}
