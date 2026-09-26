import type { Difficulty, Problem } from '../types';

let counter = 0;
export function problemId(skillId: string): string {
  counter += 1;
  return `${skillId}-${Date.now().toString(36)}-${counter}`;
}

export function byDifficulty<T>(d: Difficulty, table: Record<Difficulty, T>): T {
  return table[d];
}

/** Build a problem object, filling in the id. */
export function problem(p: Omit<Problem, 'id'>): Problem {
  return { id: problemId(p.skillId), ...p };
}

/** Tidy up typed problem text for matching: unicode operators, spaces. */
export function clean(text: string): string {
  return text
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/\s+/g, ' ')
    .replace(/\s*=\s*\??\s*$/, '')
    .replace(/^\s*(what is|solve|find|calculate|compute|simplify|evaluate)\s*:?\s*/i, '')
    .replace(/\?$/, '')
    .trim();
}

export const COLORS = {
  a: '#6366f1',
  b: '#f59e0b',
  sum: '#10b981',
  warn: '#ef4444',
};

/** Distinct multiple-choice options around a numeric answer. */
export function numericChoices(answer: number, rng: () => number, spread = 3): string[] {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < 4 && guard++ < 50) {
    const delta = Math.floor(rng() * spread * 2 + 1) - spread;
    if (delta !== 0) set.add(answer + delta);
  }
  return shuffle([...set].map(String), rng);
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
