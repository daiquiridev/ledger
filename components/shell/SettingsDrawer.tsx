"use client";

import { usePrefs, type FontPair, type Theme, type Density } from "./ThemeProvider";

const ACCENT_HUES = [
  { h: 40, label: "Terracotta" },
  { h: 200, label: "Slate" },
  { h: 145, label: "Sage" },
  { h: 270, label: "Plum" },
  { h: 15, label: "Brick" },
  { h: 60, label: "Amber" },
];

const FONTS: { id: FontPair; label: string }[] = [
  { id: "fraunces", label: "Fraunces / Instrument Sans" },
  { id: "playfair", label: "Playfair Display / Inter" },
  { id: "dm", label: "DM Serif / DM Sans" },
  { id: "spectral", label: "Spectral / IBM Plex Sans" },
  { id: "poppins", label: "Poppins / Poppins" },
  { id: "sora", label: "Sora / Manrope" },
];

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, density, fontPair, accentHue, set } = usePrefs();

  if (!open) return null;

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 50, background: "transparent" }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed", right: 16, bottom: 16, zIndex: 100,
          width: 280, background: "var(--paper)",
          border: "0.5px solid var(--ink)",
          boxShadow: "4px 4px 0 var(--ink)",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "0.5px solid var(--rule)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span style={{ fontFamily: "var(--f-display)", fontSize: 16 }}>Görünüm</span>
          <button className="btn-ghost btn-sm btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Theme */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="upper dim" style={{ fontSize: 9.5 }}>Tema</label>
            <div className="seg">
              {(["light", "dark"] as Theme[]).map((t) => (
                <button key={t} className={theme === t ? "on" : ""} onClick={() => set("theme", t)}>
                  {t === "light" ? "☀ Açık" : "☽ Koyu"}
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="upper dim" style={{ fontSize: 9.5 }}>Yoğunluk</label>
            <div className="seg">
              {(["compact", "comfortable", "spacious"] as Density[]).map((d) => (
                <button key={d} className={density === d ? "on" : ""} onClick={() => set("density", d)}>
                  {d === "compact" ? "Sıkı" : d === "comfortable" ? "Normal" : "Geniş"}
                </button>
              ))}
            </div>
          </div>

          {/* Accent */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="upper dim" style={{ fontSize: 9.5 }}>Vurgu Rengi</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ACCENT_HUES.map(({ h, label }) => (
                <button
                  key={h}
                  title={label}
                  onClick={() => set("accentHue", h)}
                  style={{
                    width: 22, height: 22,
                    background: `oklch(0.58 0.14 ${h})`,
                    border: accentHue === h ? "2px solid var(--ink)" : "1px solid var(--rule-strong)",
                    outline: accentHue === h ? "2px solid var(--ink)" : "none",
                    outlineOffset: 2,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Font pair */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="upper dim" style={{ fontSize: 9.5 }}>Font</label>
            <select
              className="select-field"
              value={fontPair}
              onChange={(e) => set("fontPair", e.target.value as FontPair)}
              style={{ fontSize: 11.5 }}
            >
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
