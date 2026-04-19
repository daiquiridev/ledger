"use client";

interface Slice { label: string; value: number; color: string; }
interface Props { data: Slice[]; lang: string; }

export function CategoryDonut({ data, lang }: Props) {
  if (data.length === 0) {
    return <div className="placeholder" style={{ height: 180 }}>veri yok</div>;
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 60;
  const cx = 80;
  const cy = 80;
  const SIZE = 160;
  const GAP = 0.02; // radians gap between slices

  let cursor = -Math.PI / 2;
  const slices = data.map((d) => {
    const angle = (d.value / total) * (2 * Math.PI - GAP * data.length);
    const start = cursor + GAP / 2;
    const end = cursor + angle + GAP / 2;
    cursor += angle + GAP;
    const r = R;
    const inner = r * 0.56;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const ix1 = cx + inner * Math.cos(end);
    const iy1 = cy + inner * Math.sin(end);
    const ix2 = cx + inner * Math.cos(start);
    const iy2 = cy + inner * Math.sin(start);
    const large = angle > Math.PI ? 1 : 0;
    return {
      ...d,
      d: `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix1.toFixed(2)},${iy1.toFixed(2)} A${inner},${inner} 0 ${large},0 ${ix2.toFixed(2)},${iy2.toFixed(2)} Z`,
      pct: ((d.value / total) * 100).toFixed(1),
    };
  });

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: SIZE, height: SIZE, flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} opacity={0.85} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fill="var(--ink-3)" fontFamily="var(--f-ui)" letterSpacing="0.1em" style={{ textTransform: "uppercase" }}>
          {lang === "tr" ? "TOPLAM" : "TOTAL"}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={14} fontWeight="300" fill="var(--ink)" fontFamily="var(--f-display)">
          {data.length} {lang === "tr" ? "kat." : "cat."}
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
            <span style={{ width: 8, height: 8, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
            <span className="mono dim" style={{ fontSize: 10.5 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
