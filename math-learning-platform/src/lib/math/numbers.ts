export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/** Round to a sensible number of decimals and drop floating-point noise. */
export function round(n: number, places = 4): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

export function fmt(n: number, places = 4): string {
  const r = round(n, places);
  return Object.is(r, -0) ? '0' : String(r);
}

/** Signed term for display, e.g. (+5) -> "+ 5", (-3) -> "− 3". */
export function signed(n: number): string {
  return n < 0 ? `− ${fmt(-n)}` : `+ ${fmt(n)}`;
}

/** Wrap negatives in parentheses: (-3) -> "(−3)". */
export function paren(n: number): string {
  return n < 0 ? `(−${fmt(-n)})` : fmt(n);
}

export function money(n: number): string {
  return `$${n.toFixed(2).replace(/\.00$/, '')}`;
}

export function multiplesOf(n: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => n * (i + 1));
}
