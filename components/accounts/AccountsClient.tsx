"use client";

import { usePrefs } from "@/components/shell/ThemeProvider";

const COLORS = ["var(--c1)", "var(--c4)", "var(--c3)", "var(--c5)", "var(--c2)", "var(--c7)"];

interface Account { id: string; name: string; bank: string; type: string; last4: string | null; currency: string; color: string | null; createdAt: Date; }

export function AccountsClient({ accounts, txCounts }: { accounts: Account[]; txCounts: Record<string, number> }) {
  const { lang } = usePrefs();
  const t = (tr: string, en: string) => lang === "tr" ? tr : en;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">{t("Ayarlar", "Settings")}</div>
          <div className="page-title"><em>{t("Hesaplar", "Accounts")}</em></div>
        </div>
        <button className="btn btn-primary">+ {t("Hesap ekle", "Add account")}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {accounts.map((a, i) => (
          <div key={a.id} className="panel" style={{ padding: 22, position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: a.color ?? COLORS[i % COLORS.length] }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="upper dim">{a.type === "credit_card" ? t("Kredi Kartı", "Credit Card") : t("Banka Hesabı", "Bank Account")} · {a.bank}</div>
                <div className="display" style={{ fontSize: 22, fontWeight: 400, marginTop: 4 }}>{a.name}</div>
                {a.last4 && <div className="mono dim" style={{ fontSize: 11, marginTop: 2 }}>•••• {a.last4}</div>}
              </div>
              <span className="pill">{a.currency}</span>
            </div>
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "0.5px dashed var(--rule-strong)", display: "flex", gap: 14, fontSize: 11, color: "var(--ink-3)" }}>
              <span>{txCounts[a.id] ?? 0} {t("işlem", "transactions")}</span>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="dim" style={{ gridColumn: "1/-1", padding: "60px 0", textAlign: "center", fontSize: 13 }}>
            {t("Henüz hesap yok. Ekstreni içe aktarırken hesap seçebilirsiniz.", "No accounts yet. Select an account when importing a statement.")}
          </div>
        )}
      </div>
    </div>
  );
}
