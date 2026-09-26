import { Fraction } from '../lib/math/fraction';
import type { CheckResult, Problem } from './types';

/** Normalise student input: unicode minus, spaces, "x =" prefixes, $ and %. */
export function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/^[a-z]\s*=\s*/, '')
    .replace(/\$/g, '')
    .replace(/(\d),(\d{3})(?!\d)/g, '$1$2') // thousands separators: 1,157.63
    .replace(/%$/, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([+\-*/^(),=])\s*/g, '$1')
    .replace(/(\d)\s+(\d+\/)/, '$1 $2');
}

/** Numeric value of a plain number, fraction or mixed number (null otherwise). */
export function numericValue(input: string): number | null {
  const s = normalize(input);
  const f = Fraction.parse(s);
  if (f) return f.value();
  const n = Number(s);
  return s !== '' && Number.isFinite(n) ? n : null;
}

/** Compare two answers: numerically when both are numbers, else textually. */
export function answersMatch(input: string, expected: string, tolerance = 0.011): boolean {
  const a = normalize(input);
  const b = normalize(expected);
  if (a === b) return true;
  if (b.includes(',')) {
    // Unordered list of values, e.g. roots "2, 3".
    const as = a.split(/,|\bor\b|\band\b/).map((x) => x.trim()).filter(Boolean);
    const bs = b.split(',').map((x) => x.trim());
    if (as.length !== bs.length) return false;
    const remaining = [...bs];
    for (const x of as) {
      const i = remaining.findIndex((y) => answersMatch(x, y, tolerance));
      if (i < 0) return false;
      remaining.splice(i, 1);
    }
    return true;
  }
  const va = numericValue(a);
  const vb = numericValue(b);
  if (va !== null && vb !== null) return Math.abs(va - vb) <= tolerance * Math.max(1, Math.abs(vb) / 100);
  return a.replace(/\s/g, '') === b.replace(/\s/g, '');
}

export function checkAnswer(problem: Problem, input: string, custom?: (p: Problem, i: string) => CheckResult): CheckResult {
  if (!input.trim()) return { correct: false, message: 'Type your answer first — any attempt is a great start!' };
  if (custom) return custom(problem, input);
  const all = [problem.answer, ...(problem.accept ?? [])];
  if (all.some((a) => answersMatch(input, a))) {
    return { correct: true, message: praise() };
  }
  return { correct: false, message: 'Not quite yet. Try a hint, or check each step again.' };
}

const PRAISES = [
  'Correct! Great thinking.',
  'Yes! You got it.',
  'Excellent work — that is right!',
  'Correct! Your steps paid off.',
  'Nice job! That is exactly right.',
];

export function praise(): string {
  return PRAISES[Math.floor(Math.random() * PRAISES.length)];
}
