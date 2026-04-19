export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { TagsClient } from "@/components/tags/TagsClient";

export default async function TagsPage() {
  const tagRows = await db.select().from(tags).orderBy(tags.name);
  return <TagsClient tags={tagRows} />;
}
