import { SKILLS } from './registry';
import type { Problem, Skill } from './types';

/**
 * Order matters: more specific recognisers run first so that, for example,
 * "3/4 + 1/2" is treated as fractions rather than division, and
 * "x^2 - 5x + 6 = 0" as a quadratic rather than a linear equation.
 */
const PARSE_ORDER = [
  'derivatives',
  'compound-interest',
  'exponentials',
  'systems',
  'quadratics',
  'ratios',
  'linear-equations',
  'slope',
  'pythagorean',
  'area',
  'mean',
  'percent',
  'add-fractions',
  'subtract-fractions',
  'decimals',
  'integers',
  'add-within-100',
  'subtract-within-100',
  'multiplication-facts',
  'division-facts',
];

export interface SolveResult {
  problem: Problem;
  skill: Skill;
}

/**
 * Recognise a typed math problem and build a step-by-step explanation.
 * Future: an image/photo pipeline (OCR → text) can feed straight into this.
 */
export function solve(text: string): SolveResult | null {
  if (!text.trim()) return null;
  for (const id of PARSE_ORDER) {
    const skill = SKILLS.find((s) => s.id === id);
    if (!skill?.parse) continue;
    try {
      const problem = skill.parse(text);
      if (problem) return { problem, skill };
    } catch {
      // A recogniser that throws simply does not match.
    }
  }
  return null;
}

export const SOLVER_EXAMPLES = [
  '3/4 + 1/2',
  '2x + 5 = 17',
  '3(x - 4) = 2x + 1',
  'x^2 - 5x + 6 = 0',
  '25% of 60',
  '$60 with 25% off',
  '3/4 = x/12',
  '-7 + 12',
  '48 + 37',
  '7 x 8',
  'mean of 12, 18, 15, 19',
  'slope of (1, 2) and (4, 8)',
  '2^x = 32',
  'derivative of 3x^2 + 2x - 5',
  'y = 2x + 1 and y = -x + 7',
  'compound interest $1000 at 5% for 3 years',
];
