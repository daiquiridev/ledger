"use client";

import { usePrefs } from "@/components/shell/ThemeProvider";
import { SettingsDrawer } from "@/components/shell/SettingsDrawer";
import { useState } from "react";

export function SettingsPage() {
  const { lang } = usePrefs();
  const t = (tr: string, en: string) => lang === "tr" ? tr : en;
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">{t("Ayarlar", "Settings")}</div>
          <div className="page-title"><em>{t("Genel", "General")}</em></div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ marginBottom: 16, fontFamily: "var(--f-display)", fontSize: 18, fontWeight: 400 }}>
            {t("Görünüm & Tema", "Appearance & Theme")}
          </div>
          <div className="dim" style={{ fontSize: 13, marginBottom: 16 }}>
            {t("Tema, yoğunluk, vurgu rengi ve font ayarları aşağıdaki panelden değiştirilebilir.", "Change theme, density, accent color, and font from the panel below.")}
          </div>
          <button className="btn" onClick={() => setDrawerOpen(true)}>
            ⚙ {t("Görünüm Ayarlarını Aç", "Open Appearance Settings")}
          </button>
        </div>

        <div className="panel" style={{ padding: 24 }}>
          <div style={{ marginBottom: 12, fontFamily: "var(--f-display)", fontSize: 18, fontWeight: 400 }}>
            {t("Hakkında", "About")}
          </div>
          <div className="dim" style={{ fontSize: 12, fontFamily: "var(--f-mono)" }}>
            Ledger v0.1.0 · Next.js · PostgreSQL · Docker
          </div>
        </div>
      </div>

      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
