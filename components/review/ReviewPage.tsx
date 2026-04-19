"use client";

import { useState, useEffect, useCallback } from "react";
import { usePrefs } from "@/components/shell/ThemeProvider";
import { DetailPane } from "./DetailPane";
import { approveTx, skipTx, saveAll } from "@/app/actions/review";
import type { ReviewTx, Category, Account } from "./types";

interface Props {
  initialTx: ReviewTx[];
  categories: Category[];
  accounts: Account[];
  uploadId?: string;
}

type Filter = "all" | "pending" | "suspicious" | "uncategorized";

export function ReviewPage({ initialTx, categories, accounts, uploadId }: Props) {
  const { lang } = usePrefs();
  const t = (tr: string, en: string) => lang === "tr" ? tr : en;

  const [queue, setQueue] = useState<ReviewTx[]>(initialTx);
  const [activeId, setActiveId] = useState<string | null>(initialTx[0]?.id ?? null);
  const [filter, setFilter] = useState<Filter>("all");
  const [saving, setSaving] = useState(false);

  const filtered = queue.filter((q) => {
    if (filter === "pending") return q.reviewStatus === "pending";
    if (filter === "suspicious") return q.suspicious;
    if (filter === "uncategorized") return !q.categoryId;
    return true;
  });

  const active = queue.find((q) => q.id === activeId) ?? filtered[0] ?? null;
  const approved = queue.filter((q) => q.reviewStatus === "approved").length;
  const skipped = queue.filter((q) => q.reviewStatus === "skipped").length;
  const pending = queue.filter((q) => q.reviewStatus === "pending" || !q.reviewStatus).length;
  const pct = queue.length > 0 ? Math.round(((approved + skipped) / queue.length) * 100) : 0;

  function update(id: string, patch: Partial<ReviewTx>) {
    setQueue((q) => q.map((tx) => tx.id === id ? { ...tx, ...patch } : tx));
  }

  function nextPending(currentId: string) {
    const idx = queue.findIndex((q) => q.id === currentId);
    const next = queue.slice(idx + 1).find((q) => q.reviewStatus === "pending")
      ?? queue.find((q) => q.reviewStatus === "pending" && q.id !== currentId);
    if (next) setActiveId(next.id);
  }

  function handleApprove(id: string) {
    update(id, { reviewStatus: "approved" });
    approveTx(id);
    nextPending(id);
  }

  function handleSkip(id: string) {
    update(id, { reviewStatus: "skipped" });
    skipTx(id);
    nextPending(id);
  }

  function approveAll() {
    queue.filter((q) => q.reviewStatus === "pending" && !q.suspicious).forEach((q) => {
      update(q.id, { reviewStatus: "approved" });
      approveTx(q.id);
    });
  }

  async function handleSaveAll() {
    setSaving(true);
    await saveAll(uploadId);
    setSaving(false);
  }

  // Keyboard shortcuts
  const onKey = useCallback((e: KeyboardEvent) => {
    if (!active) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;
    if (e.key === "a" || e.key === "A") handleApprove(active.id);
    if (e.key === "s" || e.key === "S") handleSkip(active.id);
    if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
      const idx = queue.findIndex((q) => q.id === active.id);
      if (idx < queue.length - 1) setActiveId(queue[idx + 1].id);
    }
    if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
      const idx = queue.findIndex((q) => q.id === active.id);
      if (idx > 0) setActiveId(queue[idx - 1].id);
    }
  }, [active, queue]);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function fmtDate(iso: string) {
    const d = new Date(iso);
    return { day: d.getDate(), month: (lang === "tr" ? MONTHS_TR : MONTHS_EN)[d.getMonth()] };
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1500 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 16, borderBottom: "0.5px solid var(--rule)" }}>
        <div>
          <div className="page-kicker">{t("İnceleme", "Review")}{uploadId ? ` · upload #${uploadId.slice(0, 8)}` : ""}</div>
          <div className="page-title" style={{ fontSize: 34 }}>
            <em>{pending}</em> {t("işlem bekliyor", "pending")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              <span style={{ color: "var(--pos)" }}>{approved}</span> {t("onaylandı", "approved")} ·{" "}
              <span>{skipped}</span> {t("atlandı", "skipped")} ·{" "}
              <span style={{ color: "var(--accent)" }}>{pending}</span> {t("bekliyor", "pending")}
            </div>
            <div style={{ width: 220, height: 3, background: "var(--paper-3)", marginTop: 6, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: "var(--accent)", transition: "width .3s" }} />
            </div>
          </div>
          <button className="btn" onClick={approveAll}>{t("Şüphesiz olanları onayla", "Approve safe ones")}</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSaveAll}>
            {saving ? t("Kaydediliyor…", "Saving…") : t("Hepsini kaydet", "Save all")} →
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, margin: "14px 0", alignItems: "center" }}>
        {([
          ["all", t("Tümü", "All"), queue.length],
          ["pending", t("Beklemede", "Pending"), pending],
          ["suspicious", t("Şüpheli", "Suspicious"), queue.filter((q) => q.suspicious).length],
          ["uncategorized", t("Kategorisiz", "Uncategorized"), queue.filter((q) => !q.categoryId).length],
        ] as [Filter, string, number][]).map(([k, label, n]) => (
          <button
            key={k}
            className={"btn btn-sm" + (filter === k ? " btn-primary" : "")}
            onClick={() => setFilter(k)}
          >
            {label} <span className="mono" style={{ opacity: 0.7 }}>{n}</span>
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <span className="dim" style={{ fontSize: 11 }}>
          <span className="kbd">J</span><span className="kbd">K</span> {t("gezin", "nav")} ·{" "}
          <span className="kbd">A</span> {t("onayla", "approve")} ·{" "}
          <span className="kbd">S</span> {t("atla", "skip")}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="dim" style={{ padding: "60px 0", textAlign: "center", fontSize: 16 }}>
          {t("İncelenecek işlem yok.", "No transactions to review.")}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", border: "0.5px solid var(--rule)", minHeight: 600 }}>
          {/* List */}
          <div style={{ borderRight: "0.5px solid var(--rule)", maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
            {filtered.map((q) => {
              const { day, month } = fmtDate(q.date);
              return (
                <div
                  key={q.id}
                  className={"tx-card" + (q.id === activeId ? " active" : "") + (q.suspicious ? " suspicious" : "")}
                  style={{
                    border: 0,
                    borderBottom: "0.5px solid var(--rule)",
                    opacity: q.reviewStatus === "pending" ? 1 : 0.5,
                  }}
                  onClick={() => setActiveId(q.id)}
                >
                  <div className="tx-date">
                    <div className="d">{day}</div>
                    <div className="m">{month}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="tx-desc" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.description}
                    </div>
                    <div className="tx-meta">
                      {q.suspicious && <span className="pill warn">⚠ {t("şüpheli", "suspicious")}</span>}
                      {!q.categoryId && <span className="pill warn">{t("kategori yok", "no category")}</span>}
                      {q.reviewStatus === "approved" && <span className="pill pos">✓</span>}
                      {q.reviewStatus === "skipped" && <span className="pill">—</span>}
                    </div>
                  </div>
                  <div className={"tx-amt" + (Number(q.amount) > 0 ? " pos" : " neg")}>
                    <span className="cur">₺</span>
                    {Math.abs(Number(q.amount)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail */}
          <div style={{ padding: "28px 36px", display: "flex", flexDirection: "column", gap: 20, background: "var(--paper)" }}>
            {active ? (
              <DetailPane
                tx={active}
                categories={categories}
                accounts={accounts}
                lang={lang}
                update={update}
                onApprove={handleApprove}
                onSkip={handleSkip}
              />
            ) : (
              <div className="dim">{t("İşlem seçin", "Pick a transaction")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
