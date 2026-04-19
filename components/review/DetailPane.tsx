"use client";

import { useState } from "react";
import type { ReviewTx, Category, Account } from "./types";

interface Props {
  tx: ReviewTx;
  categories: Category[];
  accounts: Account[];
  lang: string;
  update: (id: string, patch: Partial<ReviewTx>) => void;
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
}

// Build category label breadcrumb
function catBreadcrumb(catId: string | null, cats: Category[], lang: string): string {
  if (!catId) return "";
  const chain: string[] = [];
  let c: Category | undefined = cats.find((x) => x.id === catId);
  while (c) {
    chain.unshift(lang === "tr" ? c.labelTr : c.labelEn);
    c = c.parentId ? cats.find((x) => x.id === c!.parentId) : undefined;
  }
  return chain.join(" › ");
}

function getCatColor(catId: string | null, cats: Category[]): string {
  if (!catId) return "var(--ink-4)";
  return cats.find((c) => c.id === catId)?.color ?? "var(--ink-4)";
}

// Group categories by parent for <optgroup>
function groupedCats(cats: Category[], lang: string) {
  const parents = cats.filter((c) => !c.parentId);
  return parents.map((p) => ({
    parent: lang === "tr" ? p.labelTr : p.labelEn,
    children: cats.filter((c) => c.parentId === p.id),
  }));
}

export function DetailPane({ tx, categories, accounts, lang, update, onApprove, onSkip }: Props) {
  const [newTag, setNewTag] = useState("");
  const t = (tr: string, en: string) => lang === "tr" ? tr : en;
  const tags: string[] = tx.tags ?? [];
  const meta = tx.metadata ?? {};
  const suggestedSlug = meta.suggestedCategorySlug as string | undefined;
  const suggestedCat = suggestedSlug ? categories.find((c) => c.slug === suggestedSlug) : null;

  const amount = Number(tx.amount);
  const groups = groupedCats(categories, lang);

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="upper dim">
            {tx.date} · {accounts.find((a) => a.id === tx.accountId)?.name ?? ""}
            {tx.rawSource && <> · <span className="mono">RAW</span></>}
          </div>
          <div className="display" style={{ fontSize: 38, fontWeight: 300, letterSpacing: "-0.02em", marginTop: 6, lineHeight: 1.05 }}>
            {tx.description}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
            {tx.suspicious && <span className="pill warn">⚠ {t("Tutar olağandan yüksek", "Unusual amount")}</span>}
            {!tx.categoryId && <span className="pill warn">{t("kategori önerilemedi", "no category guessed")}</span>}
            {tx.confidence && <span className="pill">AI {tx.confidence}%</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="upper dim">{t("Tutar", "Amount")}</div>
          <div
            className="display num"
            style={{ fontSize: 52, fontWeight: 300, letterSpacing: "-0.02em", color: amount > 0 ? "var(--pos)" : "var(--ink)" }}
          >
            {amount > 0 ? "+" : "−"}{Math.abs(amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </div>
          <div className="mono dim" style={{ fontSize: 11 }}>{tx.currency}</div>
        </div>
      </div>

      <div className="divider-dash" />

      {/* Fields grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="field">
          <label>{t("Açıklama", "Description")}</label>
          <input
            className="input"
            value={tx.description}
            onChange={(e) => update(tx.id, { description: e.target.value })}
          />
        </div>
        <div className="field">
          <label>{t("Tarih", "Date")}</label>
          <input
            className="input mono"
            type="date"
            value={tx.date}
            onChange={(e) => update(tx.id, { date: e.target.value })}
          />
        </div>
        <div className="field">
          <label>{t("Kategori", "Category")}</label>
          <select
            className="select-field"
            value={tx.categoryId ?? ""}
            onChange={(e) => update(tx.id, { categoryId: e.target.value || null })}
          >
            <option value="">{t("— seç —", "— pick —")}</option>
            {groups.map((g) => (
              <optgroup key={g.parent} label={g.parent}>
                {g.children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "tr" ? c.labelTr : c.labelEn}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {tx.categoryId && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "var(--f-mono)", color: "var(--ink-3)", marginTop: 2 }}>
              <span style={{ width: 7, height: 7, background: getCatColor(tx.categoryId, categories), display: "inline-block" }} />
              {catBreadcrumb(tx.categoryId, categories, lang)}
            </div>
          )}
          {/* AI suggestion */}
          {suggestedCat && !tx.categoryId && (
            <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
              <span className="upper dim" style={{ fontSize: 9 }}>AI:</span>
              <button
                className="chip"
                onClick={() => update(tx.id, { categoryId: suggestedCat.id })}
                style={{ cursor: "pointer", color: suggestedCat.color ?? "var(--ink-2)" }}
              >
                <span className="dot" />
                {lang === "tr" ? suggestedCat.labelTr : suggestedCat.labelEn}
              </button>
            </div>
          )}
        </div>
        <div className="field">
          <label>{t("Hesap", "Account")}</label>
          <select
            className="select-field"
            value={tx.accountId}
            onChange={(e) => update(tx.id, { accountId: e.target.value })}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}{a.last4 ? ` ••• ${a.last4}` : ""}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="field">
        <label>{t("Etiketler", "Tags")}</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {tags.map((tag, i) => (
            <span key={i} className="chip-tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {tag}
              <button
                style={{ fontSize: 11, color: "var(--ink-3)" }}
                onClick={() => update(tx.id, { tags: tags.filter((_, j) => j !== i) })}
              >×</button>
            </span>
          ))}
          <input
            placeholder={t("+ etiket", "+ tag")}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTag.trim()) {
                update(tx.id, { tags: [...tags, newTag.trim()] });
                setNewTag("");
              }
            }}
            style={{ border: "0.5px dashed var(--rule-strong)", background: "transparent", padding: "2px 7px", fontSize: 10.5, fontFamily: "var(--f-mono)", width: 110, outline: "none", color: "var(--ink)" }}
          />
        </div>
      </div>

      {/* Note */}
      <div className="field">
        <label>{t("Not", "Note")}</label>
        <textarea
          className="textarea"
          value={tx.note ?? ""}
          onChange={(e) => update(tx.id, { note: e.target.value })}
          placeholder={t("Bu işlem hakkında kısa not…", "A quick note for this transaction…")}
        />
      </div>

      {/* Raw source */}
      {tx.rawSource && (
        <details style={{ border: "0.5px solid var(--rule)", padding: "10px 14px" }}>
          <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--ink-3)" }} className="upper">
            {t("Kaynak satır", "Raw source line")}
          </summary>
          <pre className="mono" style={{ fontSize: 11, color: "var(--ink-3)", margin: "10px 0 0", whiteSpace: "pre-wrap" }}>
            {tx.rawSource}
          </pre>
        </details>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, borderTop: "0.5px solid var(--rule)", paddingTop: 16 }}>
        <button className="btn" onClick={() => onSkip(tx.id)}>
          {t("Atla", "Skip")} <span className="kbd">S</span>
        </button>
        <span style={{ flex: 1 }} />
        <button className="btn btn-accent" onClick={() => onApprove(tx.id)}>
          ✓ {t("Onayla & kaydet", "Approve & save")} <span className="kbd" style={{ borderColor: "rgba(255,255,255,0.4)", color: "rgba(255,255,255,0.8)" }}>A</span>
        </button>
      </div>
    </>
  );
}
