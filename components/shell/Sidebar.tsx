"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrefs } from "./ThemeProvider";

const NAV = [
  { href: "/dashboard", label: { tr: "Gösterge Paneli", en: "Dashboard" }, section: "overview" },
  { href: "/import", label: { tr: "İçe Aktar", en: "Import" }, section: "overview" },
  { href: "/review", label: { tr: "İnceleme", en: "Review" }, section: "overview", badge: true },
  { href: "/transactions", label: { tr: "İşlemler", en: "Transactions" }, section: "ledger" },
  { href: "/categories", label: { tr: "Kategoriler", en: "Categories" }, section: "ledger" },
  { href: "/tags", label: { tr: "Etiketler", en: "Tags" }, section: "ledger" },
  { href: "/wealth", label: { tr: "Net Değer", en: "Net Worth" }, section: "wealth" },
  { href: "/accounts", label: { tr: "Hesaplar", en: "Accounts" }, section: "settings" },
  { href: "/settings", label: { tr: "Ayarlar", en: "Settings" }, section: "settings" },
];

const SECTIONS = [
  { id: "overview", tr: "Genel Bakış", en: "Overview" },
  { id: "ledger", tr: "Defter", en: "Ledger" },
  { id: "wealth", tr: "Varlıklar", en: "Wealth" },
  { id: "settings", tr: "Ayarlar", en: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { lang } = usePrefs();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">L</span>
        <div>
          <div className="brand-name">Ledger</div>
          <div className="brand-sub">{lang === "tr" ? "kişisel finans" : "personal finance"}</div>
        </div>
      </div>

      {SECTIONS.map((s) => (
        <div key={s.id}>
          <div className="nav-section">{lang === "tr" ? s.tr : s.en}</div>
          <nav className="nav">
            {NAV.filter((n) => n.section === s.id).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={"nav-item" + (pathname.startsWith(n.href) ? " active" : "")}
              >
                <span>{lang === "tr" ? n.label.tr : n.label.en}</span>
              </Link>
            ))}
          </nav>
        </div>
      ))}

      <div className="sidebar-foot">
        <span className="avatar">D</span>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ color: "var(--ink)", fontSize: 12 }}>dagkan</div>
          <div style={{ fontSize: 10.5 }}>dagkan@daiquiri.dev</div>
        </div>
      </div>
    </aside>
  );
}
