"use client";

import { usePrefs } from "@/components/shell/ThemeProvider";

interface Category { id: string; slug: string; labelTr: string; labelEn: string; parentId: string | null; color: string | null; }

interface Props {
  categories: Category[];
  spend: Record<string, number>;
  counts: Record<string, number>;
}

const FX: Record<string, number> = { TRY: 1, USD: 32.4, EUR: 35.2 };
const SYM: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

export function CategoriesClient({ categories, spend, counts }: Props) {
  const { lang, currency } = usePrefs();
  const t = (tr: string, en: string) => lang === "tr" ? tr : en;
  const fx = FX[currency] ?? 1;
  const sym = SYM[currency] ?? "₺";

  // Build tree: roots are categories with no parent
  const roots = categories.filter((c) => !c.parentId);
  const children = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  function sumSpend(id: string): number {
    const own = spend[id] ?? 0;
    return children(id).reduce((s, c) => s + sumSpend(c.id), own);
  }

  const grandTotal = roots.reduce((s, c) => s + sumSpend(c.id), 0);

  function fmt(amount: number) {
    return sym + (amount / fx).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">{t("Defter", "Ledger")}</div>
          <div className="page-title"><em>{t("Kategoriler", "Categories")}</em></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm">{t("Grup ekle", "Add group")}</button>
          <button className="btn btn-primary">+ {t("Yeni kategori", "New category")}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "baseline", padding: "14px 18px", border: "0.5px solid var(--rule)", marginBottom: 20 }}>
        <span className="upper dim">{t("Toplam harcama", "Total spend")}</span>
        <span className="dim" style={{ fontSize: 11 }}>{t("tüm kategoriler · onaylanan işlemler", "all categories · approved transactions")}</span>
        <span className="display num" style={{ fontSize: 22, fontWeight: 300 }}>{fmt(grandTotal)}</span>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 140px 32px", padding: "10px 18px", borderBottom: "0.5px solid var(--rule-strong)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          <span>{t("Kategori", "Category")}</span>
          <span>{t("Üst", "Parent")}</span>
          <span style={{ textAlign: "right" }}>{t("İşlem", "Count")}</span>
          <span style={{ textAlign: "right" }}>{t("Tutar", "Amount")}</span>
          <span />
        </div>

        {roots.map((root) => {
          const rootTotal = sumSpend(root.id);
          const rootCount = counts[root.id] ?? 0;
          const subs = children(root.id);
          return (
            <div key={root.id}>
              {/* Root row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 140px 32px", padding: "13px 18px", borderBottom: "0.5px solid var(--rule)", background: "var(--paper-2)", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="mono dim" style={{ fontSize: 10, width: 14 }}>{subs.length > 0 ? "▾" : " "}</span>
                  <span style={{ width: 12, height: 12, background: root.color ?? "var(--ink-4)", flexShrink: 0 }} />
                  <span className="display" style={{ fontSize: 17, fontWeight: 400 }}>{lang === "tr" ? root.labelTr : root.labelEn}</span>
                  {subs.length > 0 && <span className="pill" style={{ fontSize: 9 }}>{subs.length} {t("alt", "sub")}</span>}
                </div>
                <span className="dim" style={{ fontSize: 11 }}>—</span>
                <span className="mono num dim" style={{ fontSize: 11, textAlign: "right" }}>{rootCount + subs.reduce((s, c) => s + (counts[c.id] ?? 0), 0)}</span>
                <div style={{ textAlign: "right" }}>
                  <div className="mono num" style={{ fontSize: 13 }}>{fmt(rootTotal)}</div>
                  <div className="mono dim" style={{ fontSize: 10 }}>{grandTotal > 0 ? ((rootTotal / grandTotal) * 100).toFixed(1) : 0}%</div>
                </div>
                <span className="dim mono" style={{ textAlign: "right", fontSize: 11 }}>⋯</span>
              </div>

              {/* Children */}
              {subs.map((sub) => {
                const subTotal = sumSpend(sub.id);
                const subCount = counts[sub.id] ?? 0;
                return (
                  <div key={sub.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 140px 32px", padding: "10px 18px", borderBottom: "0.5px solid var(--rule)", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 26 }}>
                      <span className="mono dim" style={{ fontSize: 9 }}>└</span>
                      <span style={{ width: 9, height: 9, background: sub.color ?? "var(--ink-4)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13 }}>{lang === "tr" ? sub.labelTr : sub.labelEn}</span>
                    </div>
                    <span className="dim" style={{ fontSize: 11 }}>{lang === "tr" ? root.labelTr : root.labelEn}</span>
                    <span className="mono num dim" style={{ fontSize: 11, textAlign: "right" }}>{subCount}</span>
                    <div style={{ textAlign: "right" }}>
                      <div className="mono num" style={{ fontSize: 12.5 }}>{fmt(subTotal)}</div>
                      <div style={{ height: 2, background: "var(--paper-3)", marginTop: 3, position: "relative" }}>
                        <div style={{ position: "absolute", inset: 0, background: sub.color ?? "var(--c1)", width: `${grandTotal > 0 ? Math.min((subTotal / grandTotal) * 100 * 5, 100) : 0}%` }} />
                      </div>
                    </div>
                    <span className="dim mono" style={{ textAlign: "right", fontSize: 11 }}>⋯</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
