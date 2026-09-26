/* StepWise Math — visual models.
 *
 * render(descriptor) returns an SVG/HTML string for a step's `visual`.
 * All colors come from CSS classes (see styles.css, "Visual models"), so the
 * drawings follow the light/dark theme. Every drawing has a text alternative
 * via role="img" and aria-label for screen readers.
 */
(function (SW) {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svg = (w, h, body, label) =>
    `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;

  function fractionBar(f, x, y, w, h, tone, showLabel = true) {
    let out = "";
    const pw = w / f.d;
    for (let i = 0; i < f.d; i++) {
      const filledWhole = i < f.n;
      out += `<rect x="${x + i * pw}" y="${y}" width="${pw}" height="${h}" class="${filledWhole ? "fill-" + tone : "fill-empty"} stroke-ink" rx="2"/>`;
    }
    if (showLabel) out += `<text x="${x + w + 12}" y="${y + h / 2 + 6}" class="t-math">${f.n}/${f.d}</text>`;
    return out;
  }

  const R = {
    fractionBars(v) {
      // Improper fractions spill into extra bars.
      const rows = [];
      v.rows.forEach((f, i) => {
        const tone = v.pairs ? (i < 2 ? "a" : "b") : ["a", "b", "c"][i % 3];
        if (f.n > f.d) {
          let left = f.n;
          while (left > 0) { rows.push({ f: { n: Math.min(left, f.d), d: f.d }, tone, label: left === f.n ? `${f.n}/${f.d}` : "" }); left -= f.d; }
        } else rows.push({ f, tone, label: `${f.n}/${f.d}` });
      });
      const h = 34, gap = 14, w = 300;
      const body = rows.map((r, i) => {
        let s = fractionBar(r.f, 10, 10 + i * (h + gap), w, h, r.tone, false);
        if (r.label) s += `<text x="${w + 22}" y="${10 + i * (h + gap) + h / 2 + 6}" class="t-math">${r.label}</text>`;
        return s;
      }).join("");
      const label = (v.label ? v.label + ": " : "") + v.rows.map((f) => `${f.n}/${f.d}`).join(", ");
      return svg(390, 20 + rows.length * (h + gap), body, "Fraction bars. " + label);
    },

    fractionCircles(v) {
      // Draw pizzas: one full circle per whole, then the remainder.
      const f = v.value;
      const wholes = Math.floor(f.n / f.d), rem = f.n % f.d;
      const circles = [];
      for (let i = 0; i < wholes; i++) circles.push({ n: f.d, d: f.d });
      if (rem) circles.push({ n: rem, d: f.d });
      const r = 58;
      const body = circles.map((c, i) => pizza(80 + i * 140, 72, r, c.n, c.d)).join("");
      return svg(Math.max(160, circles.length * 140 + 20), 150, body, `Fraction circles showing ${v.label || f.n + "/" + f.d}`);
    },

    pizza(v) { return svg(150, 150, pizza(75, 75, 64, v.n, v.d, v.tone || "a"), `A pizza cut into ${v.d} slices with ${v.n} shaded`); },

    multiples(v) {
      const row = (n, y, tone) => {
        let s = `<text x="4" y="${y + 21}" class="t-label">${n}:</text>`;
        let x = 40;
        for (let k = 1; n * k <= v.lcm * 2 && k <= 8; k++) {
          const hit = n * k === v.lcm;
          s += `<rect x="${x}" y="${y}" width="40" height="30" rx="6" class="${hit ? "fill-hit" : "fill-" + tone + "-soft"} stroke-ink"/><text x="${x + 20}" y="${y + 21}" text-anchor="middle" class="t-num">${n * k}</text>`;
          x += 46;
        }
        return s;
      };
      return svg(420, 84, row(v.a, 6, "a") + row(v.b, 46, "b"), `Multiples of ${v.a} and ${v.b}; the first shared multiple is ${v.lcm}`);
    },

    balance(v) {
      const body = `
        <polygon points="200,150 185,175 215,175" class="fill-ink"/>
        <rect x="60" y="140" width="280" height="8" rx="4" class="fill-ink"/>
        <line x1="90" y1="140" x2="90" y2="96" class="stroke-ink" stroke-width="2"/>
        <line x1="310" y1="140" x2="310" y2="96" class="stroke-ink" stroke-width="2"/>
        <rect x="30" y="56" width="120" height="44" rx="10" class="fill-a-soft stroke-ink"/>
        <rect x="250" y="56" width="120" height="44" rx="10" class="fill-b-soft stroke-ink"/>
        <text x="90" y="85" text-anchor="middle" class="t-math">${esc(v.left)}</text>
        <text x="310" y="85" text-anchor="middle" class="t-math">${esc(v.right)}</text>
        <text x="200" y="40" text-anchor="middle" class="t-label">balanced: both sides are equal</text>`;
      return svg(400, 185, body, `Balance scale: ${v.left} equals ${v.right}`);
    },

    numberLine(v) {
      const W = 460, pad = 24, span = v.to - v.from;
      const X = (n) => pad + ((n - v.from) / span) * (W - 2 * pad);
      let s = `<line x1="${pad - 8}" y1="90" x2="${W - pad + 8}" y2="90" class="stroke-ink" stroke-width="2"/>`;
      const step = span > 30 ? 5 : span > 16 ? 2 : 1;
      for (let n = v.from; n <= v.to; n++) {
        const major = n % step === 0;
        s += `<line x1="${X(n)}" y1="${major ? 82 : 86}" x2="${X(n)}" y2="${major ? 98 : 94}" class="stroke-ink"/>`;
        if (major) s += `<text x="${X(n)}" y="116" text-anchor="middle" class="t-small">${String(n).replace("-", "−")}</text>`;
      }
      let at = v.start;
      s += `<circle cx="${X(at)}" cy="90" r="7" class="fill-a"/>`;
      (v.jumps || []).forEach((j) => {
        const to = at + j, mid = (X(at) + X(to)) / 2;
        s += `<path d="M ${X(at)} 84 Q ${mid} ${84 - Math.min(70, Math.abs(X(to) - X(at)) * 0.6)} ${X(to)} 84" class="stroke-b arc" fill="none" stroke-width="3" marker-end="url(#arrow)"/>`;
        s += `<text x="${mid}" y="${Math.max(16, 84 - Math.min(70, Math.abs(X(to) - X(at)) * 0.6) / 2 - 12)}" text-anchor="middle" class="t-label">${j > 0 ? "+" : "−"}${Math.abs(j)}</text>`;
        at = to;
        s += `<circle cx="${X(at)}" cy="90" r="7" class="fill-b"/>`;
      });
      const defs = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fill-b"/></marker></defs>`;
      return svg(W, 130, defs + s, `Number line from ${v.from} to ${v.to}, starting at ${v.start}${(v.jumps || []).length ? ", jumping " + v.jumps.join(", ") + " to land on " + at : ""}`);
    },

    counters(v) {
      const total = v.a + v.b;
      let s = "";
      for (let i = 0; i < total; i++) {
        const x = 24 + (i % 10) * 36, y = 24 + Math.floor(i / 10) * 40;
        const crossed = v.crossed && i >= v.a - v.crossed;
        s += `<circle cx="${x}" cy="${y}" r="14" class="${i < v.a ? "fill-a" : "fill-b"} ${crossed ? "crossed" : ""}"/>`;
        if (crossed) s += `<line x1="${x - 12}" y1="${y - 12}" x2="${x + 12}" y2="${y + 12}" class="stroke-bad" stroke-width="3"/>`;
      }
      return svg(380, 24 + Math.ceil(total / 10) * 40, s, v.crossed ? `${v.a} counters with ${v.crossed} crossed out` : `${v.a} counters and ${v.b} more counters`);
    },

    baseTen(v) {
      let s = "", y = 10;
      v.numbers.forEach((n, row) => {
        const tens = Math.floor(n / 10), ones = n % 10;
        let x = 10;
        for (let i = 0; i < tens; i++) { s += `<rect x="${x}" y="${y}" width="12" height="80" class="fill-${row ? "b" : "a"} stroke-ink"/>`; for (let k = 1; k < 10; k++) s += `<line x1="${x}" y1="${y + k * 8}" x2="${x + 12}" y2="${y + k * 8}" class="stroke-ink thin"/>`; x += 18; }
        x += 10;
        for (let i = 0; i < ones; i++) { s += `<rect x="${x + (i % 5) * 14}" y="${y + Math.floor(i / 5) * 14 + 52}" width="12" height="12" class="fill-${row ? "b" : "a"} stroke-ink"/>`; }
        s += `<text x="${x + 84}" y="${y + 70}" class="t-math">${n}</text>`;
        y += 100;
      });
      return svg(360, y, s, `Base-ten blocks for ${v.numbers.join(" and ")}`);
    },

    array(v) {
      const size = v.squares ? 34 : 28, gap = v.squares ? 0 : 8;
      let s = "";
      for (let r = 0; r < v.rows; r++) for (let c = 0; c < v.cols; c++) {
        const x = 10 + c * (size + gap), y = 10 + r * (size + gap);
        s += v.squares
          ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" class="fill-a-soft stroke-ink"/>`
          : `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2 - 2}" class="${v.highlightRows && r % 2 ? "fill-b" : "fill-a"}"/>`;
      }
      if (v.highlightRows) for (let r = 0; r < v.rows; r++) s += `<text x="${14 + v.cols * (size + gap)}" y="${10 + r * (size + gap) + size / 2 + 5}" class="t-small">${(r + 1) * v.cols}</text>`;
      return svg(40 + v.cols * (size + gap) + 30, 20 + v.rows * (size + gap), s, `${v.rows} rows of ${v.cols}`);
    },

    hundredGrid(v) {
      let s = "";
      for (let i = 0; i < 100; i++) s += `<rect x="${4 + (i % 10) * 16}" y="${4 + Math.floor(i / 10) * 16}" width="15" height="15" class="${i < v.shaded ? "fill-a" : "fill-empty"} stroke-ink thin"/>`;
      return svg(168, 168, s, `${v.shaded} of 100 squares shaded`);
    },

    marbles(v) {
      const all = [...Array(v.r).fill("bad"), ...Array(v.b).fill("b"), ...Array(v.g).fill("c")];
      const s = all.map((c, i) => `<circle cx="${24 + (i % 8) * 34}" cy="${24 + Math.floor(i / 8) * 34}" r="13" class="fill-${c}"/>`).join("");
      return svg(290, 24 + Math.ceil(all.length / 8) * 34, s, `${v.r} red, ${v.b} blue and ${v.g} green marbles`);
    },

    bars(v) {
      const max = Math.max(...v.values) * 1.15, H = 150, bw = Math.min(46, 300 / v.values.length - 8);
      let s = `<line x1="30" y1="${H}" x2="${40 + v.values.length * (bw + 8)}" y2="${H}" class="stroke-ink"/>`;
      v.values.forEach((val, i) => {
        const h = (val / max) * (H - 20);
        s += `<rect x="${36 + i * (bw + 8)}" y="${H - h}" width="${bw}" height="${h}" rx="3" class="fill-a"/>`;
        s += `<text x="${36 + i * (bw + 8) + bw / 2}" y="${H - h - 5}" text-anchor="middle" class="t-small">${v.money ? "$" + Math.round(val) : val}</text>`;
      });
      if (v.meanLine != null) {
        const y = H - (v.meanLine / max) * (H - 20);
        s += `<line x1="30" y1="${y}" x2="${40 + v.values.length * (bw + 8)}" y2="${y}" class="stroke-b" stroke-width="2" stroke-dasharray="6 4"/><text x="${44 + v.values.length * (bw + 8)}" y="${y + 4}" class="t-label">mean</text>`;
      }
      return svg(110 + v.values.length * (bw + 8), H + 10, s, `Bar chart of ${v.values.join(", ")}${v.meanLine != null ? "; mean " + v.meanLine.toFixed(1) : ""}`);
    },
  };

  function pizza(cx, cy, r, n, d, tone = "a") {
    let s = `<circle cx="${cx}" cy="${cy}" r="${r + 5}" class="fill-crust"/>`;
    for (let i = 0; i < d; i++) {
      const a0 = (i / d) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const p = d === 1
        ? `<circle cx="${cx}" cy="${cy}" r="${r}" class="${i < n ? "fill-" + tone : "fill-empty"} stroke-ink"/>`
        : `<path d="M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z" class="${i < n ? "fill-" + tone : "fill-empty"} stroke-ink slice"/>`;
      s += p;
    }
    return s;
  }

  SW.visuals = {
    render(v) { return v && R[v.kind] ? R[v.kind](v) : ""; },
    pizza: (n, d, tone) => R.pizza({ n, d, tone }),
    bars: (rows, opts = {}) => R.fractionBars(Object.assign({ rows }, opts)),
  };
})(window.StepWise = window.StepWise || {});
