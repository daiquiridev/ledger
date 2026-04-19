/**
 * Seeds default categories from CLAUDE.md category system.
 * Run once after migration: npx tsx lib/db/seed.ts
 */
import { db } from "./index";
import { categories } from "./schema";

const GROUPS = [
  { slug: "gida", labelTr: "Gıda & Market", labelEn: "Food & Grocery" },
  { slug: "alisveris", labelTr: "Alışveriş", labelEn: "Shopping" },
  { slug: "dijital", labelTr: "Dijital Abonelikler", labelEn: "Digital Subscriptions" },
  { slug: "icerik", labelTr: "İçerik Platformları", labelEn: "Content Platforms" },
  { slug: "teknoloji", labelTr: "Teknoloji & Donanım", labelEn: "Technology & Hardware" },
  { slug: "ulasim", labelTr: "Ulaşım", labelEn: "Transport" },
  { slug: "fatura", labelTr: "Fatura & Altyapı", labelEn: "Bills & Utilities" },
  { slug: "saglik", labelTr: "Sağlık & Bakım", labelEn: "Health & Personal Care" },
  { slug: "finans", labelTr: "Finans", labelEn: "Finance" },
  { slug: "egitim", labelTr: "Eğitim", labelEn: "Education" },
  { slug: "seyahat", labelTr: "Seyahat & Konaklama", labelEn: "Travel & Accommodation" },
  { slug: "diger", labelTr: "Diğer", labelEn: "Other" },
];

const COLORS: Record<string, string> = {
  gida: "var(--c3)",
  alisveris: "var(--c6)",
  dijital: "var(--c5)",
  icerik: "var(--c2)",
  teknoloji: "var(--c4)",
  ulasim: "var(--c4)",
  fatura: "var(--c2)",
  saglik: "var(--c7)",
  finans: "var(--c8)",
  egitim: "var(--c7)",
  seyahat: "var(--c7)",
  diger: "var(--ink-4)",
};

async function seed() {
  console.log("Seeding categories...");

  for (let i = 0; i < GROUPS.length; i++) {
    const g = GROUPS[i];
    const [group] = await db
      .insert(categories)
      .values({ slug: g.slug, labelTr: g.labelTr, labelEn: g.labelEn, color: COLORS[g.slug], sortOrder: i })
      .onConflictDoNothing()
      .returning();

    if (!group) continue;

    // Children per group
    const children: { slug: string; tr: string; en: string; color?: string }[] = [];

    if (g.slug === "gida") {
      children.push(
        { slug: "supermarket", tr: "Süpermarket", en: "Supermarket" },
        { slug: "yemek-siparis", tr: "Yemek Siparişi", en: "Food Delivery" },
        { slug: "restoran-kafe", tr: "Restoran / Kafe", en: "Restaurant / Cafe" },
      );
    } else if (g.slug === "alisveris") {
      children.push(
        { slug: "online-alisveris", tr: "Online Alışveriş", en: "Online Shopping" },
        { slug: "giyim", tr: "Giyim / Aksesuar", en: "Clothing / Accessories" },
        { slug: "ev-dekorasyon", tr: "Ev & Dekorasyon", en: "Home & Decoration" },
      );
    } else if (g.slug === "dijital") {
      children.push(
        { slug: "apple", tr: "Apple", en: "Apple" },
        { slug: "streaming", tr: "Streaming", en: "Streaming" },
        { slug: "yazilim-saas", tr: "Yazılım / SaaS", en: "Software / SaaS" },
        { slug: "oyun", tr: "Oyun", en: "Gaming" },
        { slug: "muzik-araclari", tr: "Müzik Araçları", en: "Music Tools" },
      );
    } else if (g.slug === "icerik") {
      children.push(
        { slug: "onlyfans", tr: "OnlyFans", en: "OnlyFans" },
        { slug: "fansly", tr: "Fansly", en: "Fansly" },
        { slug: "patreon", tr: "Patreon", en: "Patreon" },
        { slug: "diger-icerik", tr: "Diğer İçerik", en: "Other Content" },
      );
    } else if (g.slug === "ulasim") {
      children.push(
        { slug: "taksi", tr: "Taksi / Ride-share", en: "Taxi / Ride-share" },
        { slug: "toplu-tasima", tr: "Toplu Taşıma", en: "Public Transit" },
      );
    } else if (g.slug === "fatura") {
      children.push(
        { slug: "elektrik-su-gaz", tr: "Elektrik / Su / Gaz", en: "Electricity / Water / Gas" },
        { slug: "telefon-internet", tr: "Telefon / İnternet", en: "Phone / Internet" },
      );
    } else if (g.slug === "finans") {
      children.push(
        { slug: "kart-odemesi", tr: "Kart Ödemesi", en: "Card Payment" },
        { slug: "sigorta", tr: "Sigorta", en: "Insurance" },
        { slug: "vergi", tr: "Vergi", en: "Tax" },
        { slug: "gelir", tr: "Gelir", en: "Income", color: "var(--pos)" },
        { slug: "transfer", tr: "Transfer", en: "Transfer" },
      );
    }

    for (let j = 0; j < children.length; j++) {
      const c = children[j];
      await db
        .insert(categories)
        .values({
          slug: c.slug,
          labelTr: c.tr,
          labelEn: c.en,
          parentId: group.id,
          color: c.color ?? COLORS[g.slug],
          sortOrder: j,
        })
        .onConflictDoNothing();
    }
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch(console.error);
