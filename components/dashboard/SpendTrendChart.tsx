"use client";

// Hand-built SVG line chart — faithful to the design's no-library approach

interface DataPoint { label: string; value: number; }

interface Props {
  data: DataPoint[];
  currency: string;
}

const SYM: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

export function SpendTrendChart({ data, currency }: Props) {
  if (data.length === 0) {
    return <div className="placeholder" style={{ height: 160 }}>veri yok</div>;
  }

  const W = 560;
  const H = 160;
  const PAD = { top: 16, right: 24, bottom: 32, left: 56 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const sym = SYM[currency] ?? "₺";

  const points = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top + (1 - d.value / maxVal) * chartH,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = pathD + ` L${points[points.length - 1].x.toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${PAD.left},${(PAD.top + chartH).toFixed(1)} Z`;

  // Y-axis labels
  const yTicks = [0, 0.5, 1].map((frac) => ({
    y: PAD.top + (1 - frac) * chartH,
    label: sym + (maxVal * frac / 1000).toFixed(0) + "K",
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <line key={i} x1={PAD.left} y1={tick.y} x2={W - PAD.right} y2={tick.y} stroke="var(--rule)" strokeWidth={0.5} />
      ))}

      {/* Y labels */}
      {yTicks.map((tick, i) => (
        <text key={i} x={PAD.left - 6} y={tick.y + 4} textAnchor="end" fontSize={9} fill="var(--ink-4)" fontFamily="var(--f-mono)">
          {tick.label}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaD} fill="var(--accent)" opacity={0.08} />

      {/* Line */}
      <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="var(--accent)" />
          <text x={p.x} y={H - 8} textAnchor="middle" fontSize={9.5} fill="var(--ink-3)" fontFamily="var(--f-ui)" letterSpacing="0.08em">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
