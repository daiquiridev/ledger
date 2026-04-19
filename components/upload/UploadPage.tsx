"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrefs } from "@/components/shell/ThemeProvider";

type UploadState = "empty" | "parsing" | "ready" | "error";

interface ParseSummary {
  count: number;
  suspicious: number;
  uncategorized: number;
  dateFrom?: string;
  dateTo?: string;
  method: "structural" | "ai";
  uploadId: string;
}

const STEPS = {
  tr: ["Yükle", "Çıkarım", "İncele & Onayla"],
  en: ["Upload", "Extract", "Review & Approve"],
};

export function UploadPage() {
  const router = useRouter();
  const { lang } = usePrefs();
  const [state, setState] = useState<UploadState>("empty");
  const [progress, setProgress] = useState(0);
  const [method, setMethod] = useState<"structural" | "ai">("structural");
  const [filename, setFilename] = useState("");
  const [summary, setSummary] = useState<ParseSummary | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = (tr: string, en: string) => lang === "tr" ? tr : en;

  async function handleFile(file: File) {
    setFilename(file.name);
    setState("parsing");
    setProgress(0);
    setMethod("structural");

    // Animate progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) return p;
        const next = p + 3 + Math.random() * 5;
        if (next > 45) setMethod("ai"); // visual only until actual response
        return Math.min(next, 85);
      });
    }, 120);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Bir hata oluştu" }));
        throw new Error(err.error || "Upload hatası");
      }

      const data = await res.json() as ParseSummary;
      setProgress(100);
      setMethod(data.method);
      setTimeout(() => { setSummary(data); setState("ready"); }, 400);
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setState("error");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const stepIndex = state === "empty" ? 0 : state === "parsing" ? 1 : 2;
  const steps = STEPS[lang];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">{t("İçe Aktar", "Import")} · step 01 / 03</div>
          <div className="page-title">{t("Dosya ", "Upload ")}<em>{t("yükle", "statement")}</em></div>
        </div>
        <div className="page-meta">
          <div className="upper dim">{t("Desteklenen formatlar", "Supported")}</div>
          <div><strong>.XLS · .XLSX · .PDF</strong></div>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: "0.5px solid var(--rule)", marginBottom: 28 }}>
        {steps.map((label, i) => (
          <div
            key={i}
            style={{
              padding: "14px 18px",
              borderRight: i < 2 ? "0.5px solid var(--rule)" : 0,
              background: i === stepIndex ? "var(--paper-2)" : "transparent",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="display" style={{ fontSize: 22, color: i <= stepIndex ? "var(--ink)" : "var(--ink-4)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div style={{ fontSize: 13, color: i <= stepIndex ? "var(--ink)" : "var(--ink-3)" }}>{label}</div>
                <div className="upper dim" style={{ fontSize: 9 }}>
                  {i < stepIndex ? t("tamamlandı", "done") : i === stepIndex ? t("devam ediyor", "in progress") : t("beklemede", "waiting")}
                </div>
              </div>
            </div>
            {i === stepIndex && state !== "ready" && (
              <div style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, background: "var(--accent)" }} />
            )}
          </div>
        ))}
      </div>

      {state === "empty" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 22 }}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            style={{
              border: `1px dashed ${dragOver ? "var(--ink)" : "var(--rule-strong)"}`,
              background: dragOver ? "var(--paper-2)" : "var(--paper)",
              padding: "60px 40px", textAlign: "center", transition: "all .15s",
            }}
          >
            <div className="display" style={{ fontSize: 56, lineHeight: 1, marginBottom: 14, fontWeight: 300 }}>⤓</div>
            <div className="display" style={{ fontSize: 26, fontWeight: 300, letterSpacing: "-0.01em" }}>
              {t("Ekstreni buraya bırak", "Drop your statement here")}
            </div>
            <div className="dim" style={{ marginTop: 6, fontSize: 13 }}>
              {t("veya aşağıdaki butonla dosya seç", "or pick a file from your computer")}
            </div>
            <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>
                {t("Dosya seç", "Choose file")}
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xls,.xlsx,.pdf"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="upper dim" style={{ marginTop: 28, fontSize: 9.5 }}>
              {t("Dosyan şifrelenir · Banka şifresi istenmez", "Encrypted locally · We never ask for bank credentials")}
            </div>
          </div>

          {/* Recent imports */}
          <div className="panel" style={{ padding: 0 }}>
            <div className="panel-head">
              <div className="panel-title">{t("Son içe aktarmalar", "Recent imports")}</div>
            </div>
            <RecentImports lang={lang} />
          </div>
        </div>
      )}

      {state === "parsing" && (
        <div style={{ border: "0.5px solid var(--rule)", padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
            <div>
              <div className="upper dim">{t("İşleniyor", "Processing")}</div>
              <div className="display" style={{ fontSize: 28, fontWeight: 300, marginTop: 4 }}>{filename}</div>
            </div>
            <div className="display num" style={{ fontSize: 42, fontWeight: 300 }}>{Math.floor(progress)}%</div>
          </div>

          <div style={{ height: 3, background: "var(--paper-3)", position: "relative", marginBottom: 26 }}>
            <div style={{ position: "absolute", inset: 0, width: `${progress}%`, background: "var(--accent)", transition: "width .2s" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
            {[
              { label: t("Dosya okundu", "File read"), done: progress > 10 },
              { label: t("Yapısal çıkarım", "Structural extract"), done: progress > 40, running: progress <= 40 && progress > 10 },
              { label: t("AI yardımı", "AI assist"), done: progress > 65, running: method === "ai" && progress > 40 && progress <= 65 },
              { label: t("Kur & kategori", "FX & categorize"), done: progress > 90, running: progress > 65 && progress <= 90 },
            ].map((s, i) => (
              <div key={i} style={{ padding: "12px 0", borderRight: i < 3 ? "0.5px solid var(--rule)" : 0, paddingLeft: i === 0 ? 0 : 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <StepDot state={s.done ? "done" : s.running ? "running" : "idle"} />
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {method === "ai" && progress > 40 && progress < 80 && (
            <div style={{ marginTop: 22, padding: 14, border: "0.5px solid var(--accent)", background: "var(--paper-2)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span className="pill accent">AI</span>
                <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
                  {t(
                    "Ekstrenin düzeni standart dışı. Yapay zeka destekli çıkarıma geçildi.",
                    "Non-standard layout detected. Falling back to AI extraction.",
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {state === "ready" && summary && (
        <div>
          <div style={{ border: "0.5px solid var(--ink)", padding: 28, background: "var(--paper-2)", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="upper" style={{ color: "var(--pos)" }}>✓ {t("Hazır", "Ready")}</div>
                <div className="display" style={{ fontSize: 32, fontWeight: 300, marginTop: 6 }}>
                  <span className="num">{summary.count}</span> {t("işlem çıkarıldı", "transactions found")}
                </div>
                <div className="dim" style={{ marginTop: 4 }}>
                  {summary.suspicious} {t("şüpheli", "suspicious")} · {summary.uncategorized} {t("kategorisiz", "uncategorized")} · {t("hepsi düzenlenebilir", "all editable")}
                </div>
                {summary.dateFrom && (
                  <div style={{ marginTop: 10, fontSize: 11, fontFamily: "var(--f-mono)", color: "var(--ink-3)" }}>
                    {t("Tarih aralığı", "Date range")}: {summary.dateFrom} – {summary.dateTo}
                    {summary.method === "ai" && <> · <span style={{ color: "var(--accent)" }}>AI</span></>}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => setState("empty")}>{t("İptal", "Discard")}</button>
                <button
                  className="btn btn-accent"
                  onClick={() => router.push(`/review?upload=${summary.uploadId}`)}
                >
                  {t("İncelemeye başla", "Start reviewing")} →
                </button>
              </div>
            </div>
          </div>
          <div className="dim" style={{ fontSize: 12 }}>
            {t(
              "İsterseniz direkt toplu onaylayabilir, veya her işlemi tek tek gözden geçirip düzenleyebilirsiniz.",
              "You can bulk-approve all, or review each transaction individually.",
            )}
          </div>
        </div>
      )}

      {state === "error" && (
        <div style={{ border: "0.5px solid var(--neg)", padding: 28, background: "var(--paper-2)" }}>
          <div className="upper" style={{ color: "var(--neg)", marginBottom: 8 }}>
            ✕ {t("Hata", "Error")}
          </div>
          <div style={{ fontSize: 14 }}>{error}</div>
          <button className="btn" style={{ marginTop: 16 }} onClick={() => setState("empty")}>
            {t("Tekrar dene", "Try again")}
          </button>
        </div>
      )}
    </div>
  );
}

function StepDot({ state }: { state: "done" | "running" | "idle" }) {
  if (state === "done") return <span style={{ width: 10, height: 10, background: "var(--pos)", display: "inline-block", borderRadius: "50%" }} />;
  if (state === "running") return (
    <span style={{ width: 10, height: 10, border: "1.5px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} />
  );
  return <span style={{ width: 10, height: 10, border: "1px solid var(--rule-strong)", display: "inline-block", borderRadius: "50%" }} />;
}

function RecentImports({ lang }: { lang: string }) {
  // TODO: fetch from /api/uploads
  const placeholder = [
    { name: "garanti-mart-2026.pdf", when: "18 Mar", count: 62, ai: false },
    { name: "is-bankasi-q1.xlsx", when: "02 Mar", count: 198, ai: false },
    { name: "akbank-jan.pdf", when: "03 Feb", count: 41, ai: true },
  ];
  const t = (tr: string, en: string) => lang === "tr" ? tr : en;
  return (
    <div>
      {placeholder.map((h, i) => (
        <div key={i} style={{ padding: "12px 18px", borderBottom: "0.5px solid var(--rule)", display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
          <div>
            <div className="mono" style={{ fontSize: 12 }}>{h.name}</div>
            <div className="dim" style={{ fontSize: 10.5, marginTop: 3, display: "flex", gap: 6 }}>
              <span>{h.when}</span>
              <span>·</span>
              <span>{h.count} {t("işlem", "tx")}</span>
              {h.ai && <><span>·</span><span className="mono" style={{ color: "var(--accent)" }}>AI</span></>}
            </div>
          </div>
          <span className="pill pos">✓ {t("Kaydedildi", "saved")}</span>
        </div>
      ))}
    </div>
  );
}
