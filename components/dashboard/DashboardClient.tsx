"use client";

import { usePrefs } from "@/components/shell/ThemeProvider";
import { SpendTrendChart } from "./SpendTrendChart";
import { CategoryDonut } from "./CategoryDonut";

interface Category { id: string; labelTr: string; labelEn: string; parentId: string | null; color: string | null; }

interface Props {
  monthlySpend: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  categories: Category[];
  kpis: { thisMonthSpend: number; lastMonthSpend: number; delta: number; pendingCount: number };
}

const FX: Record<string, number> = { TRY: 1, USD: 32.4, EUR: 35.2 };
const SYM: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

export function DashboardClient({ monthlySpend, categoryBreakdown, categories, kpis }: Props) {
  const { lang, currency } = usePrefs();
  const t = (tr: string, en: string) => lang === "tr" ? tr : en;
  const fx = FX[currency] ?? 1;
  const sym = SYM[currency] ?? "₺";

  function fmt(amount: number) {
    return sym + (amount / fx).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const sortedMonths = Object.keys(monthlySpend).sort();
  const trendData = sortedMonths.map((k) => {
    const d = new Date(k + "-01");
    return {
      label: (lang === "tr" ? MONTHS_TR : MONTHS_EN)[d.getMonth()],
      value: monthlySpend[k] / fx,
    };
  });

  const catData = Object.entries(categoryBreakdown)
    .map(([id, amount]) => {
      const cat = categories.find((c) => c.id === id);
      return {
        label: cat ? (lang === "tr" ? cat.labelTr : cat.labelEn) : "—",
        value: amount / fx,
        color: cat?.color ?? "var(--ink-4)",
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">{t("Genel Bakış", "Overview")}</div>
          <div className="page-title">{t("Gösterge ", "")}<em>{t("Paneli", "Dashboard")}</em></div>
        </div>
        {kpis.pendingCount > 0 && (
          <div>
            <a href="/review" className="pill warn" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
              ⏳ {kpis.pendingCount} {t("işlem inceleme bekliyor", "transactions pending review")}
            </a>
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "0.5px solid var(--rule)", marginBottom: 28 }}>
        <KPIBlock label={t("Bu Ay Harcama", "This Month")} value={fmt(kpis.thisMonthSpend)} delta={kpis.delta} />
        <KPIBlock label={t("Geçen Ay", "Last Month")} value={fmt(kpis.lastMonthSpend)} />
        <KPIBlock label={t("Aylık Ortalama", "Monthly Avg")} value={fmt(sortedMonths.length > 0 ? Object.values(monthlySpend).reduce((s, v) => s + v, 0) / sortedMonths.length : 0)} />
        <KPIBlock label={t("İnceleme Bekleyen", "Pending Review")} value={String(kpis.pendingCount)} isLast />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-head">
            <div className="panel-title">{t("Aylık Harcama Trendi", "Monthly Spend Trend")}</div>
            <span className="dim" style={{ fontSize: 11 }}>{t("son 6 ay", "last 6 months")}</span>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <SpendTrendChart data={trendData} currency={currency} />
          </div>
        </div>

        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-head">
            <div className="panel-title">{t("Bu Ay Kategori", "This Month by Category")}</div>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <CategoryDonut data={catData} lang={lang} />
          </div>
        </div>
      </div>

      {/* Top merchants */}
      <div className="panel" style={{ padding: 0 }}>
        <div className="panel-head">
          <div className="panel-title">{t("Bu Ay En Fazla Harcama", "Top Spend This Month")}</div>
        </div>
        <div>
          {catData.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 200px 100px", alignItems: "center", padding: "12px 18px", borderBottom: "0.5px solid var(--rule)", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, background: c.color, display: "inline-block" }} />
                <span style={{ fontSize: 13 }}>{c.label}</span>
              </div>
              <div style={{ height: 4, background: "var(--paper-3)", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: c.color, width: `${(c.value / (catData[0]?.value || 1)) * 100}%` }} />
              </div>
              <span className="mono num" style={{ textAlign: "right", fontSize: 13 }}>
                {sym}{c.value.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
              </span>
            </div>
          ))}
          {catData.length === 0 && (
            <div className="dim" style={{ padding: "32px 18px", textAlign: "center", fontSize: 13 }}>
              {t("Bu ay onaylanan işlem yok.", "No approved transactions this month.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPIBlock({ label, value, delta, isLast }: { label: string; value: string; delta?: number; isLast?: boolean }) {
  return (
    <div style={{ padding: "16px 20px", borderRight: isLast ? 0 : "0.5px solid var(--rule)" }}>
      <div className="upper dim">{label}</div>
      <div className="display num" style={{ fontSize: 34, fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.05, marginTop: 6 }}>
        {value}
      </div>
      {delta !== undefined && (
        <div style={{ marginTop: 6, fontSize: 11.5 }}>
          <span className="mono" style={{ color: delta > 0 ? "var(--neg)" : "var(--pos)" }}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="dim" style={{ marginLeft: 6, fontSize: 11 }}>geçen aya göre</span>
        </div>
      )}
    </div>
  );
}
