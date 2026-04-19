"use server";

import { db } from "@/lib/db";
import { transactions, uploads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function approveTx(id: string) {
  await db.update(transactions).set({ reviewStatus: "approved" }).where(eq(transactions.id, id));
}

export async function skipTx(id: string) {
  await db.update(transactions).set({ reviewStatus: "skipped" }).where(eq(transactions.id, id));
}

export async function saveAll(uploadId?: string) {
  if (uploadId) {
    await db
      .update(transactions)
      .set({ reviewStatus: "approved" })
      .where(eq(transactions.uploadId, uploadId));

    await db
      .update(uploads)
      .set({ status: "imported" })
      .where(eq(uploads.id, uploadId));
  }
  revalidatePath("/review");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
