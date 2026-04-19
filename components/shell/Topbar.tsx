"use client";

import { usePathname } from "next/navigation";
import { usePrefs } from "./ThemeProvider";
import { SettingsDrawer } from "./SettingsDrawer";
import { useState } from "react";

const TITLES: Record<string, { section: { tr: string; en: string }; page: { tr: string; en: string } }> = {
  "/dashboard":    { section: { tr: "Ana sayfa", en: "Home" },      page: { tr: "Gösterge Paneli", en: "Dashboard" } },
  "/import":       { section: { tr: "Ana sayfa", en: "Home" },      page: { tr: "İçe Aktar", en: "Import" } },
  "/review":       { section: { tr: "İçe Aktar", en: "Import" },    page: { tr: "İnceleme", en: "Review" } },
  "/transactions": { section: { tr: "Defter", en: "Ledger" },       page: { tr: "İşlemler", en: "Transactions" } },
  "/categories":   { section: { tr: "Defter", en: "Ledger" },       page: { tr: "Kategoriler", en: "Categories" } },
  "/tags":         { section: { tr: "Defter", en: "Ledger" },       page: { tr: "Etiketler", en: "Tags" } },
  "/wealth":       { section: { tr: "Varlıklar", en: "Wealth" },    page: { tr: "Net Değer", en: "Net Worth" } },
  "/accounts":     { section: { tr: "Ayarlar", en: "Settings" },    page: { tr: "Hesaplar", en: "Accounts" } },
  "/settings":     { section: { tr: "Ayarlar", en: "Settings" },    page: { tr: "Genel", en: "General" } },
};

export function Topbar() {
  const pathname = usePathname();
  const { lang, currency, set } = usePrefs();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const match = Object.keys(TITLES)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname.startsWith(k));
  const title = match ? TITLES[match] : TITLES["/dashboard"];

  return (
    <>
      <div className="topbar">
        <div className="crumbs">
          <span>{lang === "tr" ? title.section.tr : title.section.en}</span>
          <span className="sep">/</span>
          <span className="here">{lang === "tr" ? title.page.tr : title.page.en}</span>
        </div>

        <div className="topbar-actions">
          <div className="search">
            <span className="dim mono" style={{ fontSize: 11 }}>⌕</span>
            <input placeholder={lang === "tr" ? "işlem, merchant, etiket ara…" : "search transactions, tags…"} />
            <span className="kbd">⌘K</span>
          </div>

          <div className="seg" role="tablist">
            <button className={lang === "tr" ? "on" : ""} onClick={() => set("lang", "tr")}>TR</button>
            <button className={lang === "en" ? "on" : ""} onClick={() => set("lang", "en")}>EN</button>
          </div>

          <select
            className="select-field"
            style={{ width: 82, padding: "6px 28px 6px 10px", fontSize: 12 }}
            value={currency}
            onChange={(e) => set("currency", e.target.value as "TRY" | "USD" | "EUR")}
          >
            <option value="TRY">₺ TRY</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>

          <button className="btn btn-ghost btn-sm" onClick={() => setDrawerOpen(true)}>
            ⚙ {lang === "tr" ? "Ayarlar" : "Settings"}
          </button>
        </div>
      </div>

      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
