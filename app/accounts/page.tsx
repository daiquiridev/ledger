export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { AccountsClient } from "@/components/accounts/AccountsClient";

export default async function AccountsPage() {
  const [accRows, txCounts] = await Promise.all([
    db.select().from(accounts).orderBy(accounts.createdAt),
    db
      .select({ accountId: transactions.accountId, count: sql<number>`count(*)` })
      .from(transactions)
      .groupBy(transactions.accountId),
  ]);

  const countMap: Record<string, number> = {};
  txCounts.forEach((r) => { if (r.accountId) countMap[r.accountId] = Number(r.count); });

  return <AccountsClient accounts={accRows} txCounts={countMap} />;
}
