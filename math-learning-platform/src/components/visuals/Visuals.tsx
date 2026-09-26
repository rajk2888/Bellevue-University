import type { ReactNode } from 'react';
import type { Visual } from '../../engine/types';
import { fmt } from '../../lib/math/numbers';

/* All visuals are inline SVG/HTML so they scale, print, theme and can be read by screen readers. */

const INK = 'var(--ink)';
const MUTED = 'var(--ink-muted)';
const LINE = 'var(--line-strong)';
const PALETTE = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9', '#84cc16'];

export function VisualRenderer({ visual, caption }: { visual: Visual; caption?: string }) {
  return (
    <figure className="visual" aria-label={caption ?? describe(visual)}>
      <div className="visual-body">{render(visual)}</div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function render(v: Visual): ReactNode {
  switch (v.kind) {
    case 'fractionBars':
      return <FractionBars fractions={v.fractions} />;
    case 'fractionCircles':
      return <FractionCircles fractions={v.fractions} pizza={v.pizza} />;
    case 'numberLine':
      return <NumberLine {...v} />;
    case 'counting':
      return <Counting groups={v.groups} crossedOut={v.crossedOut} />;
    case 'baseTen':
      return <BaseTen numbers={v.numbers} label={v.label} />;
    case 'array':
      return <ArrayGrid rows={v.rows} cols={v.cols} />;
    case 'equalGroups':
      return <EqualGroups groups={v.groups} perGroup={v.perGroup} emoji={v.emoji} />;
    case 'balance':
      return <Balance left={v.left} right={v.right} note={v.note} />;
    case 'coordinatePlane':
      return <CoordinatePlane {...v} />;
    case 'rectangleArea':
      return <RectangleArea {...v} />;
    case 'rightTriangle':
      return <RightTriangle {...v} />;
    case 'bag':
      return <Bag items={v.items} highlight={v.highlight} />;
    case 'barChart':
      return <BarChart bars={v.bars} meanLine={v.meanLine} />;
    case 'growth':
      return <BarChart bars={v.values} money />;
    case 'percentBar':
      return <PercentBar percent={v.percent} total={v.total} label={v.label} />;
    case 'ratioTable':
      return <RatioTable headers={v.headers} rows={v.rows} highlightRow={v.highlightRow} />;
    case 'clock':
      return <Clock hour={v.hour} minute={v.minute} />;
    case 'coins':
      return <Coins coins={v.coins} />;
    case 'shape':
      return <Shape shape={v.shape} label={v.label} />;
    case 'angle':
      return <Angle degrees={v.degrees} label={v.label} />;
  }
}

/** Plain-language description for screen readers. */
export function describe(v: Visual): string {
  switch (v.kind) {
    case 'fractionBars':
    case 'fractionCircles':
      return `${v.kind === 'fractionBars' ? 'Fraction bars' : 'Fraction circles'}: ${v.fractions.map((f) => `${f.label ?? `${f.n}/${f.d}`} (${f.n} of ${f.d} equal parts shaded)`).join('; ')}`;
    case 'numberLine':
      return `Number line from ${v.min} to ${v.max}${v.jumps?.length ? `, with jumps ${v.jumps.map((j) => `from ${j.from} to ${j.to}`).join(', ')}` : ''}${v.points?.length ? `, marked points ${v.points.map((p) => p.at).join(', ')}` : ''}`;
    case 'counting':
      return `Counting objects: ${v.groups.map((g) => `${g.count} ${g.emoji}`).join(' and ')}${v.crossedOut ? `, ${v.crossedOut} crossed out` : ''}`;
    case 'baseTen':
      return `Base-ten blocks showing ${v.numbers.join(' and ')}`;
    case 'array':
      return `Array of ${v.rows} rows and ${v.cols} columns`;
    case 'equalGroups':
      return `${v.groups} equal groups with ${v.perGroup} in each group`;
    case 'balance':
      return `Balance scale: left side ${v.left}, right side ${v.right}`;
    case 'coordinatePlane':
      return `Coordinate plane${v.lines?.length ? ` with lines ${v.lines.map((l) => `y = ${fmt(l.m)}x + ${fmt(l.b)}`).join(', ')}` : ''}${v.parabola ? ` with parabola y = ${v.parabola.a}x² + ${v.parabola.b}x + ${v.parabola.c}` : ''}${v.points?.length ? `, points ${v.points.map((p) => `(${fmt(p.x, 2)}, ${fmt(p.y, 2)})`).join(', ')}` : ''}`;
    case 'rectangleArea':
      return `Rectangle ${v.length} by ${v.width}${v.unit ? ` ${v.unit}` : ''}`;
    case 'rightTriangle':
      return `Right triangle with legs ${v.a || 'unknown'} and ${v.b || 'unknown'} and hypotenuse ${v.c}${v.angle ? `, angle ${v.angle}` : ''}`;
    case 'bag':
      return `Bag of marbles: ${v.items.map((i) => `${i.count} ${i.name}`).join(', ')}`;
    case 'barChart':
      return `Bar chart: ${v.bars.map((b) => `${b.label} ${b.value}`).join(', ')}${v.meanLine !== undefined ? `; mean ${v.meanLine}` : ''}`;
    case 'growth':
      return `Growth over time: ${v.values.map((b) => `${b.label} ${b.value}`).join(', ')}`;
    case 'percentBar':
      return `Bar showing ${v.percent}% of ${v.total}`;
    case 'ratioTable':
      return `Ratio table: ${v.headers.join(' to ')}; ${v.rows.map((r) => r.join(' to ')).join('; ')}`;
    case 'clock':
      return `Clock showing ${v.hour}:${String(v.minute).padStart(2, '0')}`;
    case 'coins':
      return `Coins: ${v.coins.map((c) => `${c.count} ${c.name}`).join(', ')}`;
    case 'shape':
      return `A ${v.shape}`;
    case 'angle':
      return `Angle of ${v.degrees} degrees`;
  }
}

/* ------------------------------ Fractions ------------------------------ */

function FractionBars({ fractions }: { fractions: { n: number; d: number; label?: string; color?: string }[] }) {
  const W = 320;
  const H = 34;
  const rows: { n: number; d: number; label?: string; color: string }[] = [];
  fractions.forEach((f, i) => {
    const color = f.color ?? PALETTE[i % PALETTE.length];
    const wholes = Math.max(1, Math.ceil(f.n / f.d));
    for (let w = 0; w < wholes; w++) rows.push({ n: Math.min(f.d, f.n - w * f.d), d: f.d, label: w === 0 ? f.label : '', color });
  });
  const labelW = 150;
  return (
    <svg viewBox={`0 0 ${W + labelW + 10} ${rows.length * (H + 14) + 4}`} className="svg-visual" aria-hidden="true">
      {rows.map((r, i) => {
        const y = i * (H + 14) + 2;
        const seg = W / r.d;
        return (
          <g key={i}>
            {Array.from({ length: r.d }, (_, k) => (
              <rect
                key={k}
                x={k * seg + 1}
                y={y}
                width={seg}
                height={H}
                fill={k < r.n ? r.color : 'var(--surface-2)'}
                stroke={LINE}
                strokeWidth={1.5}
                className="shade"
                style={{ transitionDelay: `${k * 40}ms` }}
              />
            ))}
            {r.label && (
              <text x={W + 12} y={y + H / 2 + 6} fontSize={17} fill={INK} fontWeight={600}>
                {r.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function sectorPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

function FractionCircles({ fractions, pizza }: { fractions: { n: number; d: number; label?: string; color?: string }[]; pizza?: boolean }) {
  const R = 52;
  const circles: { n: number; d: number; label?: string; color: string }[] = [];
  fractions.forEach((f, i) => {
    const color = f.color ?? PALETTE[i % PALETTE.length];
    const wholes = Math.max(1, Math.ceil(f.n / f.d));
    for (let w = 0; w < wholes; w++) circles.push({ n: Math.min(f.d, f.n - w * f.d), d: f.d, label: w === wholes - 1 ? f.label : '', color });
  });
  const cell = 2 * R + 34;
  return (
    <svg viewBox={`0 0 ${circles.length * cell} ${2 * R + 40}`} className="svg-visual" aria-hidden="true" style={{ maxWidth: circles.length * 170 }}>
      {circles.map((c, i) => {
        const cx = i * cell + cell / 2;
        const cy = R + 6;
        const start = -Math.PI / 2;
        return (
          <g key={i}>
            {pizza && <circle cx={cx} cy={cy} r={R + 5} fill="#d97706" opacity={0.85} />}
            {Array.from({ length: c.d }, (_, k) => {
              const a0 = start + (k * 2 * Math.PI) / c.d;
              const a1 = start + ((k + 1) * 2 * Math.PI) / c.d;
              const on = k < c.n;
              const fill = pizza ? (on ? '#fbbf24' : 'var(--surface-2)') : on ? c.color : 'var(--surface-2)';
              return c.d === 1 ? (
                <circle key={k} cx={cx} cy={cy} r={R} fill={fill} stroke={LINE} strokeWidth={2} className="shade" />
              ) : (
                <path key={k} d={sectorPath(cx, cy, R, a0, a1)} fill={fill} stroke={pizza ? '#92400e' : LINE} strokeWidth={2} className="shade" style={{ transitionDelay: `${k * 50}ms` }} />
              );
            })}
            {pizza &&
              Array.from({ length: c.n }, (_, k) => {
                const a = start + ((k + 0.5) * 2 * Math.PI) / c.d;
                return <circle key={`p${k}`} cx={cx + R * 0.55 * Math.cos(a)} cy={cy + R * 0.55 * Math.sin(a)} r={6} fill="#dc2626" />;
              })}
            {c.label && (
              <text x={cx} y={2 * R + 32} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>
                {c.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------ Number line ------------------------------ */

function NumberLine({ min, max, step = 1, denominator, jumps = [], points = [] }: Extract<Visual, { kind: 'numberLine' }>) {
  const W = 600;
  const pad = 30;
  const span = max - min || 1;
  const x = (v: number) => pad + ((v - min) / span) * (W - 2 * pad);
  const tickStep = denominator ? 1 / denominator : span > 30 ? Math.ceil(span / 20) : step;
  const ticks: number[] = [];
  for (let v = min; v <= max + 1e-9; v += tickStep) ticks.push(Math.round(v * 1000) / 1000);
  const y = 80;
  return (
    <svg viewBox={`0 0 ${W} 120`} className="svg-visual" aria-hidden="true">
      <defs>
        <marker id="nl-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
        </marker>
      </defs>
      <line x1={pad - 15} y1={y} x2={W - pad + 15} y2={y} stroke={INK} strokeWidth={2} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} y1={y - 7} x2={x(t)} y2={y + 7} stroke={INK} strokeWidth={t === 0 ? 3 : 1.5} />
          <text x={x(t)} y={y + 26} textAnchor="middle" fontSize={ticks.length > 22 ? 11 : 14} fill={MUTED}>
            {denominator ? fracLabel(t, denominator) : fmt(t).replace('-', '−')}
          </text>
        </g>
      ))}
      {jumps.map((j, i) => {
        const x0 = x(j.from);
        const x1 = x(j.to);
        const h = Math.min(55, 18 + Math.abs(x1 - x0) / 4);
        return (
          <g key={i} className="draw-in">
            <path d={`M ${x0} ${y - 8} Q ${(x0 + x1) / 2} ${y - 8 - h * 1.4} ${x1} ${y - 8}`} fill="none" stroke="var(--accent)" strokeWidth={3} markerEnd="url(#nl-arrow)" />
            {j.label && (
              <text x={(x0 + x1) / 2} y={y - 12 - h * 0.75} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--accent)">
                {j.label}
              </text>
            )}
          </g>
        );
      })}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(p.at)} cy={y} r={7} fill="var(--success)" stroke="white" strokeWidth={2} />
          {p.label && (
            <text x={x(p.at)} y={y + 46} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--success)">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function fracLabel(v: number, d: number) {
  const n = Math.round(v * d);
  if (n % d === 0) return String(n / d);
  return `${n}/${d}`;
}

/* ------------------------------ Counting & place value ------------------------------ */

function Counting({ groups, crossedOut = 0 }: { groups: { count: number; emoji: string; label?: string }[]; crossedOut?: number }) {
  const total = groups.reduce((s, g) => s + g.count, 0);
  let idx = 0;
  return (
    <div className="counting" aria-hidden="true">
      {groups.map((g, gi) => (
        <div key={gi} className="counting-group-wrap">
          {gi > 0 && <span className="counting-plus">+</span>}
          <div className="counting-group">
            <div className="counting-items">
              {Array.from({ length: g.count }, (_, k) => {
                idx++;
                const crossed = idx > total - crossedOut;
                return (
                  <span key={k} className={`counting-item pop${crossed ? ' crossed' : ''}`} style={{ animationDelay: `${idx * 60}ms` }}>
                    {g.emoji}
                  </span>
                );
              })}
            </div>
            {g.label && <div className="counting-label">{g.label}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function BaseTen({ numbers, label }: { numbers: number[]; label?: string }) {
  return (
    <div className="base-ten" aria-hidden="true">
      {numbers.map((n, i) => {
        const hundreds = Math.floor(n / 100);
        const tens = Math.floor((n % 100) / 10);
        const ones = n % 10;
        return (
          <div key={i} className="base-ten-number">
            {i > 0 && <span className="counting-plus">+</span>}
            <div>
              <div className="base-ten-blocks">
                {Array.from({ length: Math.min(hundreds, 9) }, (_, k) => (
                  <span key={`h${k}`} className="bt-flat" title="hundred" />
                ))}
                {Array.from({ length: tens }, (_, k) => (
                  <span key={`t${k}`} className="bt-rod" title="ten" />
                ))}
                <span className="bt-ones">
                  {Array.from({ length: ones }, (_, k) => (
                    <span key={`o${k}`} className="bt-unit" title="one" />
                  ))}
                </span>
              </div>
              <div className="counting-label">
                {n} = {hundreds ? `${hundreds} hundred${hundreds > 1 ? 's' : ''}, ` : ''}
                {tens} ten{tens === 1 ? '' : 's'}, {ones} one{ones === 1 ? '' : 's'}
              </div>
            </div>
          </div>
        );
      })}
      {label && <div className="base-ten-label">{label}</div>}
    </div>
  );
}

function ArrayGrid({ rows, cols }: { rows: number; cols: number }) {
  const r = Math.min(rows, 12);
  const c = Math.min(cols, 12);
  const s = 26;
  return (
    <svg viewBox={`0 0 ${c * s + 70} ${r * s + 30}`} className="svg-visual" style={{ maxWidth: c * s * 1.6 + 110 }} aria-hidden="true">
      {Array.from({ length: r }, (_, i) =>
        Array.from({ length: c }, (_, j) => (
          <circle key={`${i}-${j}`} cx={20 + j * s} cy={16 + i * s} r={9} fill={PALETTE[i % 2 === 0 ? 0 : 4]} className="pop-svg" style={{ animationDelay: `${(i * c + j) * 15}ms` }} />
        )),
      )}
      <text x={c * s + 14} y={16 + ((r - 1) * s) / 2 + 5} fontSize={14} fill={MUTED}>
        {rows} rows
      </text>
      <text x={20 + ((c - 1) * s) / 2} y={r * s + 24} fontSize={14} fill={MUTED} textAnchor="middle">
        {cols} in each row
      </text>
    </svg>
  );
}

function EqualGroups({ groups, perGroup, emoji = '●' }: { groups: number; perGroup: number; emoji?: string }) {
  return (
    <div className="equal-groups" aria-hidden="true">
      {Array.from({ length: Math.min(groups, 12) }, (_, g) => (
        <div key={g} className="eg-group">
          {Array.from({ length: Math.min(perGroup, 20) }, (_, k) => (
            <span key={k} className="pop" style={{ animationDelay: `${(g * perGroup + k) * 30}ms` }}>
              {emoji}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Algebra ------------------------------ */

function Balance({ left, right, note }: { left: string; right: string; note?: string }) {
  return (
    <svg viewBox="0 0 420 190" className="svg-visual" aria-hidden="true" style={{ maxWidth: 520 }}>
      <polygon points="210,60 190,170 230,170" fill="var(--surface-3)" stroke={LINE} strokeWidth={2} />
      <rect x={150} y={168} width={120} height={10} rx={4} fill="var(--surface-3)" stroke={LINE} />
      <line x1={40} y1={60} x2={380} y2={60} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <circle cx={210} cy={60} r={7} fill="var(--accent)" />
      {[
        { x: 95, text: left },
        { x: 325, text: right },
      ].map((p, i) => (
        <g key={i}>
          <line x1={p.x - 55} y1={60} x2={p.x - 55} y2={100} stroke={LINE} strokeWidth={2} />
          <line x1={p.x + 55} y1={60} x2={p.x + 55} y2={100} stroke={LINE} strokeWidth={2} />
          <path d={`M ${p.x - 70} 100 Q ${p.x} 140 ${p.x + 70} 100 Z`} fill={i === 0 ? 'var(--accent-soft)' : 'var(--warm-soft)'} stroke={LINE} strokeWidth={2} />
          <text x={p.x} y={92} textAnchor="middle" fontSize={p.text.length > 12 ? 15 : 20} fontWeight={700} fill={INK} className="math-font">
            {p.text}
          </text>
        </g>
      ))}
      <text x={210} y={30} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--accent)">
        =
      </text>
      {note && (
        <text x={210} y={188} textAnchor="middle" fontSize={13} fill={MUTED}>
          {note}
        </text>
      )}
    </svg>
  );
}

function CoordinatePlane({ range = 10, points = [], lines = [], parabola, curve, rise }: Extract<Visual, { kind: 'coordinatePlane' }>) {
  const S = 360;
  const pad = 20;
  const R = range;
  const X = (x: number) => pad + ((x + R) / (2 * R)) * S;
  const Y = (y: number) => pad + ((R - y) / (2 * R)) * S;
  const gridStep = R > 12 ? 5 : R > 6 ? 2 : 1;
  const sample = (fn: (x: number) => number) => {
    const pts: string[] = [];
    let pen = false;
    for (let i = 0; i <= 240; i++) {
      const x = -R + (i / 240) * 2 * R;
      const y = fn(x);
      if (!Number.isFinite(y) || Math.abs(y) > R * 1.5) {
        pen = false;
        continue;
      }
      pts.push(`${pen ? 'L' : 'M'} ${X(x).toFixed(1)} ${Y(y).toFixed(1)}`);
      pen = true;
    }
    return pts.join(' ');
  };
  const curveFn = curve
    ? (x: number) => {
        switch (curve.fn) {
          case 'exp':
            return (curve.base ?? 2) ** x;
          case 'log':
            return Math.log(x) / Math.log(curve.base ?? 10);
          case 'sin':
            return Math.sin(x);
          case 'cos':
            return Math.cos(x);
          default:
            return (curve.coeffs ?? []).reduce((s, c, p) => s + c * x ** p, 0);
        }
      }
    : null;
  return (
    <svg viewBox={`0 0 ${S + 2 * pad} ${S + 2 * pad}`} className="svg-visual coord" aria-hidden="true" style={{ maxWidth: 420 }}>
      <defs>
        <clipPath id="plane-clip">
          <rect x={pad} y={pad} width={S} height={S} />
        </clipPath>
      </defs>
      <rect x={pad} y={pad} width={S} height={S} fill="var(--surface)" stroke={LINE} />
      {Array.from({ length: Math.floor((2 * R) / gridStep) + 1 }, (_, i) => -R + i * gridStep).map((v) => (
        <g key={v}>
          <line x1={X(v)} y1={pad} x2={X(v)} y2={pad + S} stroke="var(--grid)" strokeWidth={1} />
          <line x1={pad} y1={Y(v)} x2={pad + S} y2={Y(v)} stroke="var(--grid)" strokeWidth={1} />
          {v !== 0 && (
            <>
              <text x={X(v)} y={Y(0) + 14} fontSize={10} textAnchor="middle" fill={MUTED}>
                {String(v).replace('-', '−')}
              </text>
              <text x={X(0) - 5} y={Y(v) + 4} fontSize={10} textAnchor="end" fill={MUTED}>
                {String(v).replace('-', '−')}
              </text>
            </>
          )}
        </g>
      ))}
      <line x1={pad} y1={Y(0)} x2={pad + S} y2={Y(0)} stroke={INK} strokeWidth={2} />
      <line x1={X(0)} y1={pad} x2={X(0)} y2={pad + S} stroke={INK} strokeWidth={2} />
      <text x={pad + S - 4} y={Y(0) - 6} fontSize={13} textAnchor="end" fill={INK} fontStyle="italic">
        x
      </text>
      <text x={X(0) + 6} y={pad + 14} fontSize={13} fill={INK} fontStyle="italic">
        y
      </text>
      <g clipPath="url(#plane-clip)">
        {lines.map((l, i) => (
          <g key={i} className="draw-in">
            <path d={sample((x) => l.m * x + l.b)} stroke={l.color ?? PALETTE[i % PALETTE.length]} strokeWidth={3} fill="none" />
            {l.label && (
              <text x={X(R * 0.55)} y={Y(l.m * R * 0.55 + l.b) - 8} fontSize={13} fontWeight={700} fill={l.color ?? PALETTE[i % PALETTE.length]}>
                {l.label}
              </text>
            )}
          </g>
        ))}
        {parabola && <path className="draw-in" d={sample((x) => parabola.a * x * x + parabola.b * x + parabola.c)} stroke={PALETTE[0]} strokeWidth={3} fill="none" />}
        {curveFn && <path className="draw-in" d={sample(curveFn)} stroke={PALETTE[3]} strokeWidth={3} fill="none" />}
        {rise && (
          <g>
            <line x1={X(rise.from[0])} y1={Y(rise.from[1])} x2={X(rise.to[0])} y2={Y(rise.from[1])} stroke="var(--warm)" strokeWidth={3} strokeDasharray="6 4" />
            <line x1={X(rise.to[0])} y1={Y(rise.from[1])} x2={X(rise.to[0])} y2={Y(rise.to[1])} stroke="var(--success)" strokeWidth={3} strokeDasharray="6 4" />
            <text x={(X(rise.from[0]) + X(rise.to[0])) / 2} y={Y(rise.from[1]) + 16} fontSize={12} textAnchor="middle" fill="var(--warm)" fontWeight={700}>
              run {rise.to[0] - rise.from[0]}
            </text>
            <text x={X(rise.to[0]) + 6} y={(Y(rise.from[1]) + Y(rise.to[1])) / 2} fontSize={12} fill="var(--success)" fontWeight={700}>
              rise {rise.to[1] - rise.from[1]}
            </text>
          </g>
        )}
        {curve?.label && (
          <text x={X(R * 0.2)} y={pad + 18} fontSize={13} fontWeight={700} fill={PALETTE[3]}>
            {curve.label}
          </text>
        )}
      </g>
      {points.map((p, i) => (
        <g key={i} className="pop-svg">
          <circle cx={X(p.x)} cy={Y(p.y)} r={6} fill="var(--danger)" stroke="white" strokeWidth={2} />
          {p.label && (
            <text x={X(p.x) + 8} y={Y(p.y) - 8} fontSize={13} fontWeight={700} fill={INK}>
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------ Geometry ------------------------------ */

function RectangleArea({ width, length, unit = '', showGrid = true }: Extract<Visual, { kind: 'rectangleArea' }>) {
  const maxW = 320;
  const maxH = 200;
  const scale = Math.min(maxW / length, maxH / width);
  const w = length * scale;
  const h = width * scale;
  return (
    <svg viewBox={`0 0 ${w + 90} ${h + 60}`} className="svg-visual" style={{ maxWidth: w + 150 }} aria-hidden="true">
      <rect x={20} y={10} width={w} height={h} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={3} />
      {showGrid &&
        Array.from({ length: Math.round(length) - 1 }, (_, i) => <line key={`v${i}`} x1={20 + (i + 1) * scale} y1={10} x2={20 + (i + 1) * scale} y2={10 + h} stroke="var(--accent)" strokeOpacity={0.35} />)}
      {showGrid &&
        Array.from({ length: Math.round(width) - 1 }, (_, i) => <line key={`h${i}`} x1={20} y1={10 + (i + 1) * scale} x2={20 + w} y2={10 + (i + 1) * scale} stroke="var(--accent)" strokeOpacity={0.35} />)}
      <text x={20 + w / 2} y={h + 38} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>
        {fmt(length)} {unit}
      </text>
      <text x={w + 30} y={10 + h / 2 + 5} fontSize={16} fontWeight={700} fill={INK}>
        {fmt(width)} {unit}
      </text>
    </svg>
  );
}

function RightTriangle({ a, b, c, angle, highlight }: Extract<Visual, { kind: 'rightTriangle' }>) {
  const hl = (s: string) => (highlight === s ? 'var(--danger)' : INK);
  return (
    <svg viewBox="0 0 340 230" className="svg-visual" aria-hidden="true" style={{ maxWidth: 400 }}>
      <polygon points="60,30 60,190 300,190" fill="var(--accent-soft)" stroke="none" />
      <line x1={60} y1={30} x2={60} y2={190} stroke={hl('a')} strokeWidth={highlight === 'a' ? 5 : 3} />
      <line x1={60} y1={190} x2={300} y2={190} stroke={hl('b')} strokeWidth={highlight === 'b' ? 5 : 3} />
      <line x1={60} y1={30} x2={300} y2={190} stroke={hl('c')} strokeWidth={highlight === 'c' ? 5 : 3} />
      <rect x={60} y={172} width={18} height={18} fill="none" stroke={INK} strokeWidth={1.5} />
      {a !== '' && (
        <text x={48} y={115} textAnchor="end" fontSize={18} fontWeight={700} fill={hl('a')}>
          {String(a)}
        </text>
      )}
      {b !== '' && (
        <text x={180} y={216} textAnchor="middle" fontSize={18} fontWeight={700} fill={hl('b')}>
          {String(b)}
        </text>
      )}
      <text x={192} y={98} fontSize={18} fontWeight={700} fill={hl('c')}>
        {String(c)}
      </text>
      {angle && (
        <>
          <path d="M 262 190 A 38 38 0 0 0 268 169" fill="none" stroke="var(--warm)" strokeWidth={2.5} />
          <text x={236} y={182} fontSize={15} fontWeight={700} fill="var(--warm)">
            {angle}
          </text>
        </>
      )}
    </svg>
  );
}

function Shape({ shape, label }: { shape: Extract<Visual, { kind: 'shape' }>['shape']; label?: string }) {
  const cx = 110;
  const cy = 100;
  const poly = (n: number, r = 75, rot = -Math.PI / 2) =>
    Array.from({ length: n }, (_, i) => `${cx + r * Math.cos(rot + (i * 2 * Math.PI) / n)},${cy + r * Math.sin(rot + (i * 2 * Math.PI) / n)}`).join(' ');
  let el: ReactNode;
  switch (shape) {
    case 'triangle':
      el = <polygon points={poly(3)} />;
      break;
    case 'square':
      el = <rect x={45} y={35} width={130} height={130} />;
      break;
    case 'rectangle':
      el = <rect x={20} y={55} width={180} height={95} />;
      break;
    case 'pentagon':
      el = <polygon points={poly(5)} />;
      break;
    case 'hexagon':
      el = <polygon points={poly(6, 75, 0)} />;
      break;
    case 'circle':
      el = <circle cx={cx} cy={cy} r={75} />;
      break;
    case 'cube':
      el = (
        <g>
          <rect x={40} y={60} width={100} height={100} />
          <polygon points="40,60 80,25 180,25 140,60" />
          <polygon points="140,60 180,25 180,125 140,160" />
        </g>
      );
      break;
    case 'cylinder':
      el = (
        <g>
          <path d="M 50 50 L 50 150 A 60 18 0 0 0 170 150 L 170 50" />
          <ellipse cx={110} cy={50} rx={60} ry={18} />
        </g>
      );
      break;
  }
  return (
    <svg viewBox="0 0 220 220" className="svg-visual shape-svg" aria-hidden="true" style={{ maxWidth: 240 }}>
      <g fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={4} strokeLinejoin="round">
        {el}
      </g>
      {label && (
        <text x={110} y={210} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>
          {label}
        </text>
      )}
    </svg>
  );
}

function Angle({ degrees, label }: { degrees: number; label?: string }) {
  const r = 120;
  const a = (degrees * Math.PI) / 180;
  return (
    <svg viewBox="0 0 280 180" className="svg-visual" aria-hidden="true" style={{ maxWidth: 320 }}>
      <line x1={40} y1={150} x2={260} y2={150} stroke={INK} strokeWidth={3} />
      <line x1={40} y1={150} x2={40 + r * Math.cos(a)} y2={150 - r * Math.sin(a)} stroke={INK} strokeWidth={3} className="draw-in" />
      <path d={`M ${40 + 40} 150 A 40 40 0 0 0 ${40 + 40 * Math.cos(a)} ${150 - 40 * Math.sin(a)}`} fill="none" stroke="var(--warm)" strokeWidth={3} />
      <text x={100} y={130} fontSize={16} fontWeight={700} fill="var(--warm)">
        {label ?? `${degrees}°`}
      </text>
    </svg>
  );
}

/* ------------------------------ Data & probability ------------------------------ */

function Bag({ items, highlight }: { items: { color: string; count: number; name: string }[]; highlight?: string }) {
  const marbles = items.flatMap((i) => Array.from({ length: i.count }, () => i));
  const perRow = Math.max(4, Math.ceil(Math.sqrt(marbles.length * 1.6)));
  const rows = Math.ceil(marbles.length / perRow);
  const W = perRow * 30 + 40;
  const H = rows * 30 + 60;
  return (
    <div className="bag-wrap" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} className="svg-visual" style={{ maxWidth: W * 1.4 }}>
        <path d={`M 10 30 Q ${W / 2} 5 ${W - 10} 30 L ${W - 16} ${H - 10} Q ${W / 2} ${H + 4} 16 ${H - 10} Z`} fill="var(--surface-2)" stroke={LINE} strokeWidth={2} />
        {marbles.map((m, i) => (
          <circle
            key={i}
            cx={30 + (i % perRow) * 30}
            cy={45 + Math.floor(i / perRow) * 30}
            r={11}
            fill={m.color}
            opacity={highlight && m.name !== highlight ? 0.25 : 1}
            stroke={highlight === m.name ? INK : 'white'}
            strokeWidth={2}
            className="pop-svg"
            style={{ animationDelay: `${i * 25}ms` }}
          />
        ))}
      </svg>
      <ul className="legend">
        {items.map((i) => (
          <li key={i.name}>
            <span className="swatch" style={{ background: i.color }} /> {i.count} {i.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarChart({ bars, meanLine, money }: { bars: { label: string; value: number }[]; meanLine?: number; money?: boolean }) {
  const W = 420;
  const H = 200;
  const max = Math.max(...bars.map((b) => b.value), meanLine ?? 0) * 1.12 || 1;
  const bw = (W - 40) / bars.length;
  const y = (v: number) => H - 20 - (v / max) * (H - 50);
  return (
    <svg viewBox={`0 0 ${W} ${H + 10}`} className="svg-visual" aria-hidden="true" style={{ maxWidth: 520 }}>
      <line x1={30} y1={H - 20} x2={W - 5} y2={H - 20} stroke={LINE} strokeWidth={2} />
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={36 + i * bw} y={y(b.value)} width={bw * 0.7} height={H - 20 - y(b.value)} rx={4} fill={PALETTE[money ? 2 : 0]} className="grow" style={{ animationDelay: `${i * 60}ms` }} />
          <text x={36 + i * bw + bw * 0.35} y={y(b.value) - 5} textAnchor="middle" fontSize={bars.length > 8 ? 9 : 12} fontWeight={700} fill={INK}>
            {money ? `$${Math.round(b.value).toLocaleString()}` : fmt(b.value, 2)}
          </text>
          <text x={36 + i * bw + bw * 0.35} y={H - 4} textAnchor="middle" fontSize={11} fill={MUTED}>
            {b.label}
          </text>
        </g>
      ))}
      {meanLine !== undefined && (
        <g>
          <line x1={30} y1={y(meanLine)} x2={W - 5} y2={y(meanLine)} stroke="var(--danger)" strokeWidth={2.5} strokeDasharray="8 5" />
          <text x={W - 8} y={y(meanLine) - 6} textAnchor="end" fontSize={13} fontWeight={700} fill="var(--danger)">
            mean = {fmt(meanLine, 2)}
          </text>
        </g>
      )}
    </svg>
  );
}

function PercentBar({ percent, total, label }: { percent: number; total: number; label?: string }) {
  const W = 400;
  return (
    <svg viewBox={`0 0 ${W + 20} 96`} className="svg-visual" aria-hidden="true" style={{ maxWidth: 520 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={10 + (i * W) / 10} y={20} width={W / 10} height={36} fill="var(--surface-2)" stroke={LINE} />
      ))}
      <rect x={10} y={20} width={(W * Math.min(percent, 100)) / 100} height={36} fill="var(--accent)" opacity={0.85} className="grow-x" />
      {[0, 25, 50, 75, 100].map((p) => (
        <text key={p} x={10 + (W * p) / 100} y={14} textAnchor="middle" fontSize={11} fill={MUTED}>
          {p}%
        </text>
      ))}
      <text x={10 + W / 2} y={80} textAnchor="middle" fontSize={15} fontWeight={700} fill={INK}>
        {label ?? `${percent}% of ${fmt(total)} = ${fmt((percent / 100) * total, 2)}`}
      </text>
    </svg>
  );
}

function RatioTable({ headers, rows, highlightRow }: { headers: [string, string]; rows: [string | number, string | number][]; highlightRow?: number }) {
  return (
    <table className="ratio-table">
      <thead>
        <tr>
          <th scope="col">{headers[0]}</th>
          <th scope="col">{headers[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={i === highlightRow ? 'hl' : undefined}>
            <td>{r[0]}</td>
            <td>{r[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------ Time & money ------------------------------ */

function Clock({ hour, minute }: { hour: number; minute: number }) {
  const hAngle = (((hour % 12) + minute / 60) * 30 - 90) * (Math.PI / 180);
  const mAngle = (minute * 6 - 90) * (Math.PI / 180);
  return (
    <svg viewBox="0 0 200 200" className="svg-visual" aria-hidden="true" style={{ maxWidth: 220 }}>
      <circle cx={100} cy={100} r={92} fill="var(--surface)" stroke="var(--accent)" strokeWidth={6} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 - 90) * (Math.PI / 180);
        return (
          <text key={i} x={100 + 72 * Math.cos(a)} y={100 + 72 * Math.sin(a) + 6} textAnchor="middle" fontSize={17} fontWeight={700} fill={INK}>
            {i + 1}
          </text>
        );
      })}
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 - 90) * (Math.PI / 180);
        const r0 = i % 5 === 0 ? 82 : 86;
        return <line key={i} x1={100 + r0 * Math.cos(a)} y1={100 + r0 * Math.sin(a)} x2={100 + 90 * Math.cos(a)} y2={100 + 90 * Math.sin(a)} stroke={MUTED} strokeWidth={i % 5 === 0 ? 2 : 1} />;
      })}
      <line x1={100} y1={100} x2={100 + 45 * Math.cos(hAngle)} y2={100 + 45 * Math.sin(hAngle)} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <line x1={100} y1={100} x2={100 + 70 * Math.cos(mAngle)} y2={100 + 70 * Math.sin(mAngle)} stroke="var(--accent)" strokeWidth={4} strokeLinecap="round" />
      <circle cx={100} cy={100} r={6} fill={INK} />
    </svg>
  );
}

const COIN_STYLE = {
  penny: { fill: '#c2703d', r: 19, text: '1¢' },
  nickel: { fill: '#a8a29e', r: 22, text: '5¢' },
  dime: { fill: '#d4d4d8', r: 17, text: '10¢' },
  quarter: { fill: '#9ca3af', r: 25, text: '25¢' },
  dollar: { fill: '#86efac', r: 25, text: '$1' },
} as const;

function Coins({ coins }: { coins: { name: keyof typeof COIN_STYLE; count: number }[] }) {
  const list = coins.flatMap((c) => Array.from({ length: c.count }, () => c.name));
  return (
    <div className="coins" aria-hidden="true">
      {list.map((name, i) => {
        const s = COIN_STYLE[name];
        return name === 'dollar' ? (
          <span key={i} className="bill pop" style={{ animationDelay: `${i * 70}ms` }}>
            $1
          </span>
        ) : (
          <span key={i} className="coin pop" style={{ width: s.r * 2.4, height: s.r * 2.4, background: s.fill, animationDelay: `${i * 70}ms` }}>
            {s.text}
          </span>
        );
      })}
    </div>
  );
}
