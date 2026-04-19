"use client";

import { useState } from "react";
import { usePrefs } from "@/components/shell/ThemeProvider";

interface Entry { id: string; kind: string; name: string; currency: string; amount: string; unitPrice: string | null; avgCost: string | null; color: string | null; note: string | null; metadata: Record<string, unknown> | null; }

const FX: Record<string, number> = { TRY: 1, USD: 32.4, EUR: 35.2, GR: 3420, ADET: 1, PAY: 1 };

function toTRY(e: Entry): number {
  const amt = Number(e.amount);
  const unit = Number(e.unitPrice ?? 0);
  if (e.currency === "TRY") return amt;
  if (["GR", "ADET", "PAY"].includes(e.currency)) return amt * unit;
  return amt * (FX[e.currency] ?? 1);
}

type Tab = "overview" | "investments" | "gold" | "loans";

const SYM: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

export function WealthClient({ entries }: { entries: Entry[] }) {
  const { lang, currency } = usePrefs();
  const t = (tr: string, en: string) => lang === "tr" ? tr : en;
  const [tab, setTab] = useState<Tab>("overview");
  const fx = FX[currency] ?? 1;
  const sym = SYM[currency] ?? "₺";

  const assets = entries.filter((e) => !["card-debt", "loan"].includes(e.kind));
  const liabilities = entries.filter((e) => ["card-debt", "loan"].includes(e.kind));

  const totalAssets = assets.reduce((s, e) => s + toTRY(e), 0);
  const totalLiab = liabilities.reduce((s, e) => s + Math.abs(toTRY(e)), 0);
  const net = totalAssets - totalLiab;

  function fmt(v: number) {
    return sym + (v / fx).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  const kindLabel: Record<string, { tr: string; en: string }> = {
    cash: { tr: "Nakit / Vadeli", en: "Cash / Deposits" },
    fx: { tr: "Döviz", en: "FX" },
    gold: { tr: "Altın", en: "Gold" },
    stock: { tr: "Hisse", en: "Stocks" },
    fund: { tr: "Fon", en: "Funds" },
    "card-debt": { tr: "Kart Borcu", en: "Card Debt" },
    loan: { tr: "Kredi", en: "Loan" },
  };

  const byKind: Record<string, number> = {};
  assets.forEach((e) => { byKind[e.kind] = (byKind[e.kind] ?? 0) + toTRY(e); });

  const tabs: { id: Tab; tr: string; en: string }[] = [
    { id: "overview", tr: "Genel Bakış", en: "Overview" },
    { id: "investments", tr: "Yatırımlar", en: "Investments" },
    { id: "gold", tr: "Altın", en: "Gold" },
    { id: "loans", tr: "Krediler & Borçlar", en: "Loans & Debts" },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">{t("Varlıklar", "Wealth")}</div>
          <div className="page-title">{t("Net ", "Net ")}<em>{t("Değer", "Worth")}</em></div>
        </div>
        <div className="page-meta">
          <div className="upper dim">{t("Toplam net değer", "Total net worth")}</div>
          <div className="display num" style={{ fontSize: 32, fontWeight: 300, color: net >= 0 ? "var(--pos)" : "var(--neg)" }}>
            {fmt(net)}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: "0.5px solid var(--rule)", marginBottom: 24 }}>
        <div style={{ padding: "14px 18px", borderRight: "0.5px solid var(--rule)" }}>
          <div className="upper dim">{t("Toplam Varlık", "Total Assets")}</div>
          <div className="display num" style={{ fontSize: 28, fontWeight: 300, marginTop: 4, color: "var(--pos)" }}>{fmt(totalAssets)}</div>
        </div>
        <div style={{ padding: "14px 18px", borderRight: "0.5px solid var(--rule)" }}>
          <div className="upper dim">{t("Toplam Yükümlülük", "Total Liabilities")}</div>
          <div className="display num" style={{ fontSize: 28, fontWeight: 300, marginTop: 4, color: "var(--neg)" }}>{fmt(totalLiab)}</div>
        </div>
        <div style={{ padding: "14px 18px" }}>
          <div className="upper dim">{t("Net Değer", "Net Worth")}</div>
          <div className="display num" style={{ fontSize: 28, fontWeight: 300, marginTop: 4 }}>{fmt(net)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="seg" style={{ marginBottom: 20 }}>
        {tabs.map((tb) => (
          <button key={tb.id} className={tab === tb.id ? "on" : ""} onClick={() => setTab(tb.id)}>
            {lang === "tr" ? tb.tr : tb.en}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="panel" style={{ padding: 0 }}>
          <div style={{ padding: "10px 18px", borderBottom: "0.5px solid var(--rule-strong)", display: "grid", gridTemplateColumns: "1fr 120px 120px 40px", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", gap: 14 }}>
            <span>{t("Kalem", "Item")}</span>
            <span style={{ textAlign: "right" }}>{t("Miktar", "Amount")}</span>
            <span style={{ textAlign: "right" }}>TRY</span>
            <span />
          </div>
          {Object.entries(byKind).map(([kind, total]) => {
            const kindEntries = assets.filter((e) => e.kind === kind);
            const label = kindLabel[kind] ?? { tr: kind, en: kind };
            return (
              <div key={kind}>
                <div style={{ padding: "11px 18px", background: "var(--paper-2)", borderBottom: "0.5px solid var(--rule)", display: "grid", gridTemplateColumns: "1fr 120px 120px 40px", gap: 14, alignItems: "center" }}>
                  <span className="display" style={{ fontSize: 16, fontWeight: 400 }}>{lang === "tr" ? label.tr : label.en}</span>
                  <span />
                  <span className="mono num" style={{ textAlign: "right", fontSize: 13 }}>{fmt(total)}</span>
                  <span />
                </div>
                {kindEntries.map((e) => (
                  <div key={e.id} style={{ padding: "10px 18px", borderBottom: "0.5px solid var(--rule)", display: "grid", gridTemplateColumns: "1fr 120px 120px 40px", gap: 14, alignItems: "center" }}>
                    <div style={{ paddingLeft: 20, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, background: e.color ?? "var(--c1)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13 }}>{e.name}</span>
                      {e.note && <span className="dim" style={{ fontSize: 11 }}>· {e.note}</span>}
                    </div>
                    <span className="mono num dim" style={{ textAlign: "right", fontSize: 12 }}>
                      {Number(e.amount).toLocaleString("tr-TR")} {e.currency}
                    </span>
                    <span className="mono num" style={{ textAlign: "right", fontSize: 12.5 }}>{fmt(toTRY(e))}</span>
                    <span className="dim" style={{ textAlign: "right", fontSize: 11 }}>⋯</span>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Liabilities */}
          {liabilities.length > 0 && (
            <>
              <div style={{ padding: "11px 18px", background: "var(--paper-2)", borderBottom: "0.5px solid var(--rule)", display: "grid", gridTemplateColumns: "1fr 120px 120px 40px", gap: 14, alignItems: "center" }}>
                <span className="display" style={{ fontSize: 16, fontWeight: 400, color: "var(--neg)" }}>{t("Yükümlülükler", "Liabilities")}</span>
                <span />
                <span className="mono num" style={{ textAlign: "right", fontSize: 13, color: "var(--neg)" }}>−{fmt(totalLiab)}</span>
                <span />
              </div>
              {liabilities.map((e) => {
                const meta = e.metadata ?? {};
                return (
                  <div key={e.id} style={{ padding: "10px 18px", borderBottom: "0.5px solid var(--rule)", display: "grid", gridTemplateColumns: "1fr 120px 120px 40px", gap: 14, alignItems: "center" }}>
                    <div style={{ paddingLeft: 20, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, background: e.color ?? "var(--c6)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13 }}>{e.name}</span>
                      {meta?.monthly != null && <span className="dim mono" style={{ fontSize: 11 }}>· {fmt(Number(meta.monthly))} /ay</span>}
                    </div>
                    <span />
                    <span className="mono num" style={{ textAlign: "right", fontSize: 12.5, color: "var(--neg)" }}>−{fmt(Math.abs(toTRY(e)))}</span>
                    <span className="dim" style={{ textAlign: "right", fontSize: 11 }}>⋯</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {(tab === "investments" || tab === "gold" || tab === "loans") && (
        <div className="panel" style={{ padding: 32, textAlign: "center" }}>
          <div className="dim" style={{ fontSize: 13 }}>
            {t("Bu sekme geliştirme aşamasında. Varlıkları 'Genel Bakış' sekmesinden yönetebilirsiniz.", "This tab is under development. Manage entries from the Overview tab.")}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary">+ {t("Varlık / Borç Ekle", "Add Asset / Liability")}</button>
      </div>
    </div>
  );
}
