import { useState } from 'react';

/** Interactive fraction bars: pick a denominator, click pieces to shade. */
export function FractionBuilder() {
  const [bars, setBars] = useState([
    { d: 4, shaded: new Set<number>([0, 1, 2]) },
    { d: 2, shaded: new Set<number>([0]) },
  ]);
  const setD = (i: number, d: number) => setBars((b) => b.map((x, k) => (k === i ? { d: Math.max(1, Math.min(12, d)), shaded: new Set() } : x)));
  const toggle = (i: number, seg: number) =>
    setBars((b) =>
      b.map((x, k) => {
        if (k !== i) return x;
        const s = new Set(x.shaded);
        if (s.has(seg)) s.delete(seg);
        else s.add(seg);
        return { ...x, shaded: s };
      }),
    );
  return (
    <div className="manip">
      <p className="muted small">Shade pieces to build fractions. Change the number of pieces to find equivalent fractions.</p>
      {bars.map((b, i) => (
        <div key={i} className="fb-row">
          <div className="stepper" role="group" aria-label={`Bar ${i + 1} pieces`}>
            <button type="button" className="btn tiny" onClick={() => setD(i, b.d - 1)} aria-label="Fewer pieces">
              −
            </button>
            <span aria-live="polite">{b.d} pieces</span>
            <button type="button" className="btn tiny" onClick={() => setD(i, b.d + 1)} aria-label="More pieces">
              +
            </button>
          </div>
          <div className="fb-bar" role="group" aria-label={`Fraction bar ${i + 1}: ${b.shaded.size} of ${b.d} shaded`}>
            {Array.from({ length: b.d }, (_, k) => (
              <button
                key={k}
                type="button"
                className={`fb-seg${b.shaded.has(k) ? ' on' : ''}`}
                style={{ background: b.shaded.has(k) ? (i === 0 ? '#6366f1' : '#f59e0b') : undefined }}
                aria-pressed={b.shaded.has(k)}
                aria-label={`Piece ${k + 1}`}
                onClick={() => toggle(i, k)}
              />
            ))}
          </div>
          <span className="fb-label">
            {b.shaded.size}/{b.d}
          </span>
        </div>
      ))}
      <p className="small">
        Together: <strong>{(bars[0].shaded.size / bars[0].d + bars[1].shaded.size / bars[1].d).toFixed(3).replace(/\.?0+$/, '')}</strong> wholes
      </p>
    </div>
  );
}

/** Click a grid to plot points; shows coordinates and the slope between the last two. */
export function PointPlotter({ range = 8 }: { range?: number }) {
  const [pts, setPts] = useState<[number, number][]>([]);
  const S = 280;
  const cell = S / (2 * range);
  const X = (x: number) => (x + range) * cell;
  const Y = (y: number) => (range - y) * cell;
  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 2 * range - range);
    const y = Math.round(range - ((e.clientY - r.top) / r.height) * 2 * range);
    setPts((p) => [...p, [x, y] as [number, number]].slice(-4));
  };
  const last2 = pts.slice(-2);
  const slope = last2.length === 2 && last2[1][0] !== last2[0][0] ? (last2[1][1] - last2[0][1]) / (last2[1][0] - last2[0][0]) : null;
  const [cursor, setCursor] = useState<[number, number]>([0, 0]);
  const move = (dx: number, dy: number) => setCursor(([x, y]) => [Math.max(-range, Math.min(range, x + dx)), Math.max(-range, Math.min(range, y + dy))]);
  return (
    <div className="manip">
      <p className="muted small">Click (or use arrow keys + Enter) to plot up to 4 points.</p>
      <svg
        viewBox={`0 0 ${S} ${S}`}
        className="plotter"
        onClick={onClick}
        tabIndex={0}
        role="application"
        aria-label={`Coordinate grid. Cursor at (${cursor[0]}, ${cursor[1]}). ${pts.length} points plotted.`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') move(-1, 0);
          else if (e.key === 'ArrowRight') move(1, 0);
          else if (e.key === 'ArrowUp') move(0, 1);
          else if (e.key === 'ArrowDown') move(0, -1);
          else if (e.key === 'Enter' || e.key === ' ') setPts((p) => [...p, cursor].slice(-4));
          else return;
          e.preventDefault();
        }}
      >
        {Array.from({ length: 2 * range + 1 }, (_, i) => (
          <g key={i}>
            <line x1={i * cell} y1={0} x2={i * cell} y2={S} stroke="var(--grid)" />
            <line x1={0} y1={i * cell} x2={S} y2={i * cell} stroke="var(--grid)" />
          </g>
        ))}
        <line x1={X(0)} y1={0} x2={X(0)} y2={S} stroke="var(--ink)" strokeWidth={2} />
        <line x1={0} y1={Y(0)} x2={S} y2={Y(0)} stroke="var(--ink)" strokeWidth={2} />
        {last2.length === 2 && <line x1={X(last2[0][0])} y1={Y(last2[0][1])} x2={X(last2[1][0])} y2={Y(last2[1][1])} stroke="var(--accent)" strokeWidth={2.5} />}
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={X(x)} cy={Y(y)} r={5} fill="var(--danger)" />
            <text x={X(x) + 6} y={Y(y) - 6} fontSize={10} fill="var(--ink)">
              ({x}, {y})
            </text>
          </g>
        ))}
        <circle cx={X(cursor[0])} cy={Y(cursor[1])} r={7} fill="none" stroke="var(--accent)" strokeDasharray="3 2" className="kbd-cursor" />
      </svg>
      <div className="row small">
        <span>Points: {pts.map((p) => `(${p[0]}, ${p[1]})`).join(', ') || 'none yet'}</span>
        {slope !== null && (
          <span>
            · slope between last two = <strong>{Number.isInteger(slope) ? slope : slope.toFixed(2)}</strong>
          </span>
        )}
        <button type="button" className="btn tiny" onClick={() => setPts([])}>
          Clear
        </button>
      </div>
    </div>
  );
}

const KEYS: Record<string, string[]> = {
  number: ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '−'],
  fraction: ['/', ' ', '−', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  expression: ['x', '^', '+', '−', '(', ')', '/', '·', '√', 'π'],
  list: [',', '−', '/', '.', '√'],
  text: [':', ',', '(', ')', '−'],
};

/** On-screen math keypad; inserts symbols at the caret. */
export function MathKeypad({ kind, onKey }: { kind: string; onKey: (k: string) => void }) {
  const keys = KEYS[kind] ?? KEYS.number;
  return (
    <div className="keypad" role="group" aria-label="Math symbols keypad">
      {keys.map((k) => (
        <button key={k} type="button" className="key" onClick={() => onKey(k)} aria-label={k === ' ' ? 'space (for mixed numbers)' : k === '/' ? 'fraction bar' : k === '−' ? 'minus' : k}>
          {k === ' ' ? '␣' : k}
        </button>
      ))}
    </div>
  );
}
