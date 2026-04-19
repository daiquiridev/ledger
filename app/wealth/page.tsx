export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { wealthEntries } from "@/lib/db/schema";
import { WealthClient } from "@/components/wealth/WealthClient";

export default async function WealthPage() {
  const rows = await db.select().from(wealthEntries).orderBy(wealthEntries.kind);
  const entries = rows.map((r) => ({ ...r, metadata: r.metadata as Record<string, unknown> | null }));
  return <WealthClient entries={entries} />;
}
