/**
 * Keyword-based category suggestion for Turkish bank transactions.
 * Based on the category system in CLAUDE.md.
 */

interface CategoryRule {
  slug: string;
  patterns: RegExp[];
}

const RULES: CategoryRule[] = [
  // Gıda & Market
  { slug: "supermarket", patterns: [/a101|şok|migros|carrefour|bim|kipa|macro/i] },
  { slug: "yemek-siparis", patterns: [/getir|yemeksepeti|trendyol yemek|migros hızlı/i] },
  { slug: "restoran-kafe", patterns: [/restoran|cafe|kafe|starbucks|kronotrop|köfteci|pizza|burger/i] },

  // Alışveriş
  { slug: "online-alisveris", patterns: [/trendyol|hepsiburada|amazon|n11/i] },
  { slug: "giyim", patterns: [/mavi|zara|lcwaikiki|lc waikiki|sephora|vakko|boyner/i] },
  { slug: "ev-dekorasyon", patterns: [/ikea|koçtaş|bauhaus|bellona/i] },

  // Dijital
  { slug: "apple", patterns: [/apple\.com\/bill|apple\.com/i] },
  { slug: "streaming", patterns: [/netflix|spotify|blutv|gain\.tv|disney|youtube premium|exxen/i] },
  { slug: "yazilim-saas", patterns: [/adobe|cloudflare|proton|openai|chatgpt|raindrop|notion|hetzner|github|figma|slack/i] },
  { slug: "oyun", patterns: [/steam|discord nitro|xbox|playstation|epic games/i] },
  { slug: "muzik-araclari", patterns: [/splice|plugin boutique|waves|native instruments|envato/i] },

  // İçerik
  { slug: "onlyfans", patterns: [/of london|onlyfans/i] },
  { slug: "fansly", patterns: [/fansly/i] },
  { slug: "patreon", patterns: [/patreon/i] },

  // Ulaşım
  { slug: "taksi", patterns: [/yandex go|bitaksi|uber/i] },
  { slug: "toplu-tasima", patterns: [/izmiri̇mkart|akbil|metrobus|izulaşım/i] },

  // Fatura
  { slug: "elektrik-su-gaz", patterns: [/gediz|izsu|igdaş|iski|boğaziçi elektrik/i] },
  { slug: "telefon-internet", patterns: [/vodafone|turkcell|superonline|turknet|ttnet/i] },

  // Sağlık
  { slug: "saglik", patterns: [/eczane|hastane|klinik|medikal|acıbadem|memorial|optik/i] },

  // Finans
  { slug: "kart-odemesi", patterns: [/cep şube ödeme|kredi kartı ödeme|otomatik ödeme/i] },
  { slug: "sigorta", patterns: [/sigorta|emeklilik/i] },
  { slug: "vergi", patterns: [/vergi|kgvk|kbs/i] },
  { slug: "gelir", patterns: [/maaş|maas|gelir|freelance|ücret/i] },

  // Seyahat
  { slug: "seyahat", patterns: [/pegasus|thy|anadolujet|sunexpress|booking|airbnb|otel|hotel/i] },
];

export function suggestCategory(description: string): string | null {
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(description)) return rule.slug;
    }
  }
  return null;
}

/** Deduplicate key: prevents same transaction appearing twice from overlapping imports */
export function dedupHash(
  accountId: string,
  date: string,
  description: string,
  amount: number,
): string {
  const str = `${accountId}|${date}|${description.toLowerCase().trim()}|${amount.toFixed(2)}`;
  // Simple hash — good enough for dedup
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return `${h >>> 0}`;
}
