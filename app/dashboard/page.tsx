export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { transactions, categories } from "@/lib/db/schema";
import { and, gte, lt, eq, sql } from "drizzle-orm";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [txRows, catRows] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.date, sixMonthsAgo.toISOString().slice(0, 10)),
          eq(transactions.reviewStatus, "approved"),
        ),
      ),
    db.select().from(categories),
  ]);

  // Monthly spend aggregation
  const monthlyMap: Record<string, number> = {};
  txRows.forEach((tx) => {
    const amt = Number(tx.amount);
    if (amt < 0) {
      const key = tx.date.slice(0, 7);
      monthlyMap[key] = (monthlyMap[key] ?? 0) + Math.abs(amt);
    }
  });

  // This month category breakdown
  const thisMonth = now.toISOString().slice(0, 7);
  const catMap: Record<string, number> = {};
  txRows.forEach((tx) => {
    if (tx.date.startsWith(thisMonth) && Number(tx.amount) < 0 && tx.categoryId) {
      catMap[tx.categoryId] = (catMap[tx.categoryId] ?? 0) + Math.abs(Number(tx.amount));
    }
  });

  // KPIs
  const thisMonthSpend = Object.entries(monthlyMap).filter(([k]) => k === thisMonth).reduce((s, [, v]) => s + v, 0);
  const lastMonth = new Date(now); lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthKey = lastMonth.toISOString().slice(0, 7);
  const lastMonthSpend = monthlyMap[lastMonthKey] ?? 0;
  const delta = lastMonthSpend > 0 ? ((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100 : 0;

  const pendingCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.reviewStatus, "pending"))
    .then((r) => Number(r[0]?.count ?? 0));

  return (
    <DashboardClient
      monthlySpend={monthlyMap}
      categoryBreakdown={catMap}
      categories={catRows}
      kpis={{ thisMonthSpend, lastMonthSpend, delta, pendingCount }}
    />
  );
}
