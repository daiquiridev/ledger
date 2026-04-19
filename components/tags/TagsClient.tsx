"use client";

import { usePrefs } from "@/components/shell/ThemeProvider";

interface Tag { id: string; name: string; color: string | null; }

export function TagsClient({ tags }: { tags: Tag[] }) {
  const { lang } = usePrefs();
  const t = (tr: string, en: string) => lang === "tr" ? tr : en;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">{t("Defter", "Ledger")}</div>
          <div className="page-title"><em>{t("Etiketler", "Tags")}</em></div>
        </div>
        <button className="btn btn-primary">+ {t("Yeni etiket", "New tag")}</button>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <div
              key={tag.id}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", border: "0.5px dashed var(--rule-strong)", fontSize: 13 }}
            >
              <span className="mono" style={{ color: tag.color ?? "var(--accent)" }}>#</span>
              <span>{tag.name}</span>
            </div>
          ))}
          {tags.length === 0 && (
            <div className="dim" style={{ fontSize: 13 }}>
              {t("Henüz etiket yok. İşlem incelemesinde etiket ekleyebilirsiniz.", "No tags yet. Add them during transaction review.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
