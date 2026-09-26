import { useState } from 'react';

interface Bar {
  label: string;
  value: number | null;
  /** Tooltip text; defaults to "label: value". */
  tip?: string;
}

/**
 * Single-series bar chart (one hue, so no legend — the card title names it).
 * Per-bar hover/focus tooltip and a visually-hidden table for screen readers.
 */
export function MiniBarChart({ bars, max, format = (v) => String(v), title }: { bars: Bar[]; max?: number; format?: (v: number) => string; title: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 460;
  const H = 150;
  const top = max ?? Math.max(1, ...bars.map((b) => b.value ?? 0));
  const bw = W / bars.length;
  const barW = Math.min(36, bw - 6);
  const y = (v: number) => H - 22 - (v / top) * (H - 40);
  return (
    <div className="mini-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        <line x1={0} y1={H - 22} x2={W} y2={H - 22} stroke="var(--line-strong)" strokeWidth={1} />
        {bars.map((b, i) => {
          const x = i * bw + (bw - barW) / 2;
          const v = b.value ?? 0;
          const h = H - 22 - y(v);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={b.tip ?? `${b.label}: ${b.value === null ? 'no data' : format(v)}`}>
              <rect x={i * bw} y={0} width={bw} height={H} fill="transparent" />
              {b.value !== null && h > 0 && <path d={roundedTop(x, y(v), barW, h, Math.min(4, h))} fill="var(--chart-1)" opacity={hover === null || hover === i ? 1 : 0.55} />}
              {b.value === null && (
                <text x={x + barW / 2} y={H - 28} textAnchor="middle" fontSize={10} fill="var(--ink-muted)">
                  –
                </text>
              )}
              {(bars.length <= 8 || i % 2 === 0 || i === bars.length - 1) && (
                <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--ink-muted)">
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
        {hover !== null && (
          <g pointerEvents="none">
            <rect x={Math.min(W - 130, Math.max(0, hover * bw + bw / 2 - 65))} y={4} width={130} height={24} rx={6} fill="var(--ink)" />
            <text x={Math.min(W - 65, Math.max(65, hover * bw + bw / 2))} y={20} textAnchor="middle" fontSize={11} fill="var(--surface)">
              {bars[hover].tip ?? `${bars[hover].label}: ${bars[hover].value === null ? 'no data' : format(bars[hover].value!)}`}
            </text>
          </g>
        )}
      </svg>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {bars.map((b) => (
            <tr key={b.label}>
              <th scope="row">{b.label}</th>
              <td>{b.value === null ? 'no data' : format(b.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  return `M ${x} ${y + h} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h} Z`;
}
