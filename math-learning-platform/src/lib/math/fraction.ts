import { gcd } from './numbers';

/** Immutable exact fraction. Denominator is always positive. */
export class Fraction {
  readonly n: number;
  readonly d: number;

  constructor(n: number, d = 1) {
    if (d === 0) throw new Error('Denominator cannot be zero');
    if (d < 0) {
      n = -n;
      d = -d;
    }
    this.n = n;
    this.d = d;
  }

  static parse(text: string): Fraction | null {
    const s = text.trim().replace(/\s+/g, ' ').replace(/−/g, '-');
    let m = s.match(/^(-?\d+) (\d+)\s*\/\s*(\d+)$/); // mixed number "1 1/4"
    if (m) {
      const whole = parseInt(m[1], 10);
      const num = parseInt(m[2], 10);
      const den = parseInt(m[3], 10);
      if (den === 0) return null;
      const sign = whole < 0 || m[1].startsWith('-') ? -1 : 1;
      return new Fraction(sign * (Math.abs(whole) * den + num), den);
    }
    m = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
    if (m) {
      const den = parseInt(m[2], 10);
      if (den === 0) return null;
      return new Fraction(parseInt(m[1], 10), den);
    }
    m = s.match(/^-?\d+(\.\d+)?$/);
    if (m) {
      const decimals = m[1] ? m[1].length - 1 : 0;
      const den = 10 ** decimals;
      return new Fraction(Math.round(parseFloat(s) * den), den).simplify();
    }
    return null;
  }

  add(o: Fraction): Fraction {
    return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d).simplify();
  }

  sub(o: Fraction): Fraction {
    return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d).simplify();
  }

  mul(o: Fraction): Fraction {
    return new Fraction(this.n * o.n, this.d * o.d).simplify();
  }

  div(o: Fraction): Fraction {
    return new Fraction(this.n * o.d, this.d * o.n).simplify();
  }

  neg(): Fraction {
    return new Fraction(-this.n, this.d);
  }

  isZero(): boolean {
    return this.n === 0;
  }

  isInteger(): boolean {
    return this.simplify().d === 1;
  }

  simplify(): Fraction {
    const g = gcd(this.n, this.d);
    return new Fraction(this.n / g, this.d / g);
  }

  /** Same value written with a new denominator (must be a multiple). */
  withDenominator(d: number): Fraction {
    return new Fraction((this.n * d) / this.d, d);
  }

  equals(o: Fraction): boolean {
    return this.n * o.d === o.n * this.d;
  }

  /** Same value AND written identically (after sign normalisation). */
  sameForm(o: Fraction): boolean {
    return this.n === o.n && this.d === o.d;
  }

  isSimplified(): boolean {
    return gcd(this.n, this.d) === 1;
  }

  isImproper(): boolean {
    return Math.abs(this.n) >= this.d && this.d !== 1;
  }

  value(): number {
    return this.n / this.d;
  }

  toString(): string {
    return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`;
  }

  /** "1 1/4" style when improper, otherwise "3/4". */
  toMixedString(): string {
    const s = this.simplify();
    if (s.d === 1) return String(s.n);
    if (Math.abs(s.n) < s.d) return s.toString();
    const whole = Math.trunc(s.n / s.d);
    const rem = Math.abs(s.n % s.d);
    return `${whole} ${rem}/${s.d}`;
  }
}
