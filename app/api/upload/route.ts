import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parsers";
import { suggestCategory, dedupHash } from "@/lib/categorize";
import { db } from "@/lib/db";
import { uploads, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const accountId = formData.get("accountId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "pdf";

  // Create upload record
  const [upload] = await db
    .insert(uploads)
    .values({
      filename,
      filetype: ext,
      sizeBytes: buffer.length,
      status: "parsing",
      accountId: accountId ?? undefined,
    })
    .returning();

  try {
    const result = await parseFile(buffer, filename);

    if (result.error && result.transactions.length === 0) {
      await db.update(uploads).set({ status: "failed", errorMessage: result.error }).where(eq(uploads.id, upload.id));
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    // Find category IDs for slugs (lazy — skip DB lookup for now, store slugs in metadata)
    let suspicious = 0;
    let uncategorized = 0;

    // Insert transactions as pending review
    const txRows = result.transactions.map((tx) => {
      const slug = suggestCategory(tx.description);
      const hash = dedupHash(accountId ?? "unknown", tx.date, tx.description, tx.amount);
      if (!slug) uncategorized++;
      if (Math.abs(tx.amount) > 10000) suspicious++;

      return {
        accountId: accountId ?? null,
        uploadId: upload.id,
        date: tx.date,
        description: tx.description,
        amount: String(tx.amount),
        currency: tx.currency ?? "TRY",
        reviewStatus: "pending" as const,
        rawSource: tx.rawSource,
        suspicious: Math.abs(tx.amount) > 10000,
        dedupHash: hash,
        metadata: {
          cardLast4: tx.cardLast4,
          installment: tx.installment,
          suggestedCategorySlug: slug,
        },
      };
    });

    // Insert, skip duplicates
    if (txRows.length > 0) {
      await db
        .insert(transactions)
        .values(txRows)
        .onConflictDoNothing();
    }

    // Update upload record
    await db.update(uploads).set({
      status: "ready",
      parseMethod: result.method,
      txCount: result.transactions.length,
      dateRangeFrom: result.dateFrom,
      dateRangeTo: result.dateTo,
      processedAt: new Date(),
    }).where(eq(uploads.id, upload.id));

    return NextResponse.json({
      uploadId: upload.id,
      count: result.transactions.length,
      suspicious,
      uncategorized,
      dateFrom: result.dateFrom,
      dateTo: result.dateTo,
      method: result.method,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Parse hatası";
    await db.update(uploads).set({ status: "failed", errorMessage: msg }).where(eq(uploads.id, upload.id));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
