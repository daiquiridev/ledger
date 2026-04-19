export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CategoriesClient } from "@/components/categories/CategoriesClient";

export default async function CategoriesPage() {
  const [catRows, txRows] = await Promise.all([
    db.select().from(categories).orderBy(categories.sortOrder),
    db
      .select({ categoryId: transactions.categoryId, amount: transactions.amount })
      .from(transactions)
      .where(eq(transactions.reviewStatus, "approved")),
  ]);

  const spend: Record<string, number> = {};
  const counts: Record<string, number> = {};
  txRows.forEach((tx) => {
    if (tx.categoryId && Number(tx.amount) < 0) {
      spend[tx.categoryId] = (spend[tx.categoryId] ?? 0) + Math.abs(Number(tx.amount));
      counts[tx.categoryId] = (counts[tx.categoryId] ?? 0) + 1;
    }
  });

  return <CategoriesClient categories={catRows} spend={spend} counts={counts} />;
}
