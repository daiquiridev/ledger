"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";
export type Density = "compact" | "comfortable" | "spacious";
export type FontPair = "fraunces" | "playfair" | "dm" | "spectral" | "poppins" | "sora";

interface Prefs {
  theme: Theme;
  density: Density;
  fontPair: FontPair;
  accentHue: number;
  lang: "tr" | "en";
  currency: "TRY" | "USD" | "EUR";
}

interface PrefsCtx extends Prefs {
  set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
}

const DEFAULTS: Prefs = {
  theme: "light",
  density: "comfortable",
  fontPair: "fraunces",
  accentHue: 40,
  lang: "tr",
  currency: "TRY",
};

const FONT_PAIRS: Record<FontPair, { display: string; ui: string }> = {
  fraunces: { display: "var(--font-fraunces)", ui: "var(--font-instrument-sans)" },
  playfair: { display: "var(--font-playfair-display)", ui: "var(--font-inter)" },
  dm: { display: "var(--font-dm-serif-display)", ui: "var(--font-dm-sans)" },
  spectral: { display: "var(--font-spectral)", ui: "var(--font-ibm-plex-sans)" },
  poppins: { display: "var(--font-poppins)", ui: "var(--font-poppins)" },
  sora: { display: "var(--font-sora)", ui: "var(--font-manrope)" },
};

const Ctx = createContext<PrefsCtx>({ ...DEFAULTS, set: () => {} });

export function usePrefs() {
  return useContext(Ctx);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ledger-prefs");
      if (stored) setPrefs({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  // Apply to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", prefs.theme);
    root.setAttribute("data-density", prefs.density);
    root.style.setProperty("--accent-h", String(prefs.accentHue));

    const pair = FONT_PAIRS[prefs.fontPair];
    root.style.setProperty("--f-display", pair.display + ", 'Times New Roman', serif");
    root.style.setProperty("--f-ui", pair.ui + ", 'Helvetica Neue', Arial, sans-serif");
  }, [prefs]);

  function set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem("ledger-prefs", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  return <Ctx.Provider value={{ ...prefs, set }}>{children}</Ctx.Provider>;
}
