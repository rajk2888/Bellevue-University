import { Fraction } from './fraction';

/** A linear expression  coef·x + constant  with exact fractional coefficients. */
export interface Linear {
  coef: Fraction;
  constant: Fraction;
  /** True when the source text contained parentheses (needs distributing). */
  hadParens: boolean;
}

const ZERO = new Fraction(0);
const ONE = new Fraction(1);

/**
 * Parse a linear expression in one variable, e.g. "2x + 5", "3(x - 4)", "x/2 - 1".
 * Returns null for anything non-linear or unparseable.
 */
export function parseLinear(src: string, variable = 'x'): Linear | null {
  const text = src.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/');
  if (!text) return null;
  let pos = 0;
  let hadParens = false;

  type Val = { c: Fraction; k: Fraction };
  const peek = () => text[pos];

  function number(): Fraction | null {
    const m = text.slice(pos).match(/^\d+(\.\d+)?/);
    if (!m) return null;
    pos += m[0].length;
    return Fraction.parse(m[0]);
  }

  function primary(): Val | null {
    const ch = peek();
    if (ch === '(') {
      hadParens = true;
      pos++;
      const v = expr();
      if (!v || peek() !== ')') return null;
      pos++;
      return v;
    }
    if (ch === variable) {
      pos++;
      return { c: ONE, k: ZERO };
    }
    const n = number();
    if (!n) return null;
    return { c: ZERO, k: n };
  }

  function unary(): Val | null {
    if (peek() === '-') {
      pos++;
      const v = unary();
      return v && { c: v.c.neg(), k: v.k.neg() };
    }
    if (peek() === '+') {
      pos++;
      return unary();
    }
    return primary();
  }

  function mul(a: Val, b: Val): Val | null {
    if (!a.c.isZero() && !b.c.isZero()) return null; // x·x is not linear
    return { c: a.c.mul(b.k).add(b.c.mul(a.k)), k: a.k.mul(b.k) };
  }

  function term(): Val | null {
    let v = unary();
    if (!v) return null;
    for (;;) {
      const ch = peek();
      if (ch === '*') {
        pos++;
        const r = unary();
        if (!r) return null;
        const m = mul(v, r);
        if (!m) return null;
        v = m;
      } else if (ch === '/') {
        pos++;
        const r = unary();
        if (!r || !r.c.isZero() || r.k.isZero()) return null;
        v = { c: v.c.div(r.k), k: v.k.div(r.k) };
      } else if (ch === variable || ch === '(') {
        // implicit multiplication: 2x, 3(x+1), x(2)
        const r = primary();
        if (!r) return null;
        const m = mul(v, r);
        if (!m) return null;
        v = m;
      } else break;
    }
    return v;
  }

  function expr(): Val | null {
    let v = term();
    if (!v) return null;
    while (peek() === '+' || peek() === '-') {
      const op = text[pos++];
      const r = term();
      if (!r) return null;
      v = op === '+' ? { c: v.c.add(r.c), k: v.k.add(r.k) } : { c: v.c.sub(r.c), k: v.k.sub(r.k) };
    }
    return v;
  }

  const v = expr();
  if (!v || pos !== text.length) return null;
  return { coef: v.c, constant: v.k, hadParens };
}

/** Pretty-print coef·x + constant, e.g. "2x − 5", "−x", "3". */
export function showLinear(coef: Fraction, constant: Fraction, variable = 'x'): string {
  const parts: string[] = [];
  if (!coef.isZero()) {
    const c = coef.simplify();
    const cs = c.equals(ONE) ? '' : c.equals(ONE.neg()) ? '−' : c.d !== 1 ? `(${fracText(c)})` : fracText(c);
    parts.push(`${cs}${variable}`);
  }
  if (!constant.isZero() || parts.length === 0) {
    const k = constant.simplify();
    if (parts.length === 0) parts.push(fracText(k));
    else parts.push(k.n < 0 ? `− ${fracText(k.neg())}` : `+ ${fracText(k)}`);
  }
  return parts.join(' ');
}

export function fracText(f: Fraction): string {
  const s = f.simplify();
  const t = s.d === 1 ? String(s.n) : `${s.n}/${s.d}`;
  return t.replace(/^-/, '−');
}
