"use client";

import { useState, useMemo } from "react";
import { usePrefs } from "@/components/shell/ThemeProvider";

interface Tx { id: string; date: string; description: string; amount: string; currency: string; categoryId: string | null; accountId: string | null; note: string | null; }
interface Category { id: string; labelTr: string; labelEn: string; parentId: string | null; color: string | null; }
interface Account { id: string; name: string; }

const FX: Record<string, number> = { TRY: 1, USD: 32.4, EUR: 35.2 };
const SYM: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };
const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function TransactionsClient({ transactions, categories, accounts }: { transactions: Tx[]; categories: Category[]; accounts: Account[]; }) {
  const { lang, currency } = usePrefs();
  const t = (tr: string, en: string) => lang === "tr" ? tr : en;
  const fx = FX[currency] ?? 1;
  const sym = SYM[currency] ?? "₺";

  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [acctFilter, setAcctFilter] = useState("all");
  const [period, setPeriod] = useState("30d");

  const cutoff = useMemo(() => {
    const d = new Date();
    if (period === "7d") d.setDate(d.getDate() - 7);
    else if (period === "30d") d.setDate(d.getDate() - 30);
    else if (period === "90d") d.setDate(d.getDate() - 90);
    else return null;
    return d.toISOString().slice(0, 10);
  }, [period]);

  const filtered = useMemo(() => transactions.filter((tx) => {
    if (q && !tx.description.toLowerCase().includes(q.toLowerCase())) return false;
    if (catFilter !== "all" && tx.categoryId !== catFilter) return false;
    if (acctFilter !== "all" && tx.accountId !== acctFilter) return false;
    if (cutoff && tx.date < cutoff) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 200), [transactions, q, catFilter, acctFilter, cutoff]);

  const totalSpend = filtered.reduce((s, tx) => Number(tx.amount) < 0 ? s + Math.abs(Number(tx.amount)) : s, 0);

  // Group by date
  const groups: Record<string, Tx[]> = {};
  filtered.forEach((tx) => { (groups[tx.date] ??= []).push(tx); });
  const dates = Object.keys(groups).sort().reverse();

  function catLabel(catId: string | null) {
    if (!catId) return "";
    const chain: string[] = [];
    let c: Category | undefined = categories.find((x) => x.id === catId);
    while (c) {
      chain.unshift(lang === "tr" ? c.labelTr : c.labelEn);
      c = c.parentId ? categories.find((x) => x.id === c!.parentId) : undefined;
    }
    return chain.join(" › ");
  }

  function catColor(catId: string | null) {
    return categories.find((c) => c.id === catId)?.color ?? "var(--ink-4)";
  }

  function fmtDate(iso: string) {
    const d = new Date(iso + "T00:00:00");
    const months = lang === "tr" ? MONTHS_TR : MONTHS_EN;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function fmtAmt(amount: string) {
    return (Math.abs(Number(amount)) / fx).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">{t("Defter", "Ledger")}</div>
          <div className="page-title">{t("Tüm ", "All ")}<em>{t("işlemler", "transactions")}</em></div>
        </div>
        <div className="page-meta">
          <div className="upper dim">{t("Filtrelenmiş harcama", "Filtered spend")}</div>
          <div className="display num" style={{ fontSize: 28, fontWeight: 300 }}>{sym}{(totalSpend / fx).toLocaleString("tr-TR", { minimumFractionDigits: 0 })}</div>
          <div className="mono dim" style={{ fontSize: 11 }}>{filtered.length} {t("işlem", "transactions")}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div className="search" style={{ width: 320 }}>
          <span className="dim mono" style={{ fontSize: 11 }}>⌕</span>
          <input placeholder={t("açıklama, etiket…", "description, tag…")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select-field" style={{ width: 150 }} value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="7d">{t("Son 7 gün", "Last 7 days")}</option>
          <option value="30d">{t("Son 30 gün", "Last 30 days")}</option>
          <option value="90d">{t("Son 90 gün", "Last 90 days")}</option>
          <option value="all">{t("Tümü", "All time")}</option>
        </select>
        <select className="select-field" style={{ width: 200 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="all">{t("Tüm kategoriler", "All categories")}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{lang === "tr" ? c.labelTr : c.labelEn}</option>)}
        </select>
        <select className="select-field" style={{ width: 180 }} value={acctFilter} onChange={(e) => setAcctFilter(e.target.value)}>
          <option value="all">{t("Tüm hesaplar", "All accounts")}</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <button className="btn btn-sm">{t("Dışa aktar", "Export")} CSV</button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        {dates.map((date) => {
          const dayTotal = groups[date].reduce((s, tx) => Number(tx.amount) < 0 ? s + Math.abs(Number(tx.amount)) : s, 0);
          return (
            <div key={date}>
              <div style={{ padding: "10px 18px", background: "var(--paper-2)", borderBottom: "0.5px solid var(--rule)", display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <span className="upper dim">{fmtDate(date)}</span>
                <span className="mono dim">{sym}{(dayTotal / fx).toLocaleString("tr-TR", { minimumFractionDigits: 0 })}</span>
              </div>
              {groups[date].map((tx) => (
                <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "180px 1fr 220px 130px", gap: 14, padding: "var(--row-pad) 18px", borderBottom: "0.5px solid var(--rule)", alignItems: "center", fontSize: 13 }}>
                  <span className="mono dim" style={{ fontSize: 11.5 }}>{accounts.find((a) => a.id === tx.accountId)?.name ?? "—"}</span>
                  <span>{tx.description}</span>
                  <span>
                    {tx.categoryId && (
                      <span className="chip" style={{ color: catColor(tx.categoryId) }}>
                        <span className="dot" />
                        {catLabel(tx.categoryId)}
                      </span>
                    )}
                  </span>
                  <span className="mono num" style={{ textAlign: "right", color: Number(tx.amount) > 0 ? "var(--pos)" : "var(--ink)", fontSize: 13 }}>
                    {Number(tx.amount) > 0 ? "+" : "−"}{sym}{fmtAmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
        {dates.length === 0 && (
          <div className="dim" style={{ padding: "60px 18px", textAlign: "center", fontSize: 13 }}>
            {t("Filtreyle eşleşen işlem yok.", "No transactions match the filter.")}
          </div>
        )}
      </div>
    </div>
  );
}
