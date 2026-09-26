/**
 * Core types for the step-by-step explanation engine.
 *
 * A *skill* knows how to generate problems at a difficulty level, how to
 * recognise a typed-in problem, and how to explain the solution one step at a
 * time. Everything the UI shows (steps, hints, visuals, misconceptions) is
 * plain data so it can later come from a server or an AI generator.
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'challenge';
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'challenge'];

/** Declarative visual descriptions rendered by `VisualRenderer`. */
export type Visual =
  | { kind: 'fractionBars'; fractions: { n: number; d: number; label?: string; color?: string }[] }
  | { kind: 'fractionCircles'; fractions: { n: number; d: number; label?: string; color?: string }[]; pizza?: boolean }
  | {
      kind: 'numberLine';
      min: number;
      max: number;
      step?: number;
      /** Denominator for fractional tick labels. */
      denominator?: number;
      jumps?: { from: number; to: number; label?: string }[];
      points?: { at: number; label?: string }[];
    }
  | { kind: 'counting'; groups: { count: number; emoji: string; label?: string }[]; crossedOut?: number }
  | { kind: 'baseTen'; numbers: number[]; label?: string }
  | { kind: 'array'; rows: number; cols: number; groupBy?: 'rows' | 'cols' }
  | { kind: 'equalGroups'; groups: number; perGroup: number; emoji?: string }
  | { kind: 'balance'; left: string; right: string; note?: string }
  | {
      kind: 'coordinatePlane';
      range?: number;
      points?: { x: number; y: number; label?: string }[];
      lines?: { m: number; b: number; label?: string; color?: string }[];
      parabola?: { a: number; b: number; c: number };
      curve?: { fn: 'exp' | 'log' | 'sin' | 'cos' | 'poly'; coeffs?: number[]; base?: number; label?: string };
      rise?: { from: [number, number]; to: [number, number] };
    }
  | { kind: 'rectangleArea'; width: number; length: number; unit?: string; showGrid?: boolean }
  | { kind: 'rightTriangle'; a: number | string; b: number | string; c: number | string; angle?: string; highlight?: 'a' | 'b' | 'c' }
  | { kind: 'bag'; items: { color: string; count: number; name: string }[]; highlight?: string }
  | { kind: 'barChart'; bars: { label: string; value: number }[]; meanLine?: number }
  | { kind: 'percentBar'; percent: number; total: number; label?: string }
  | { kind: 'ratioTable'; headers: [string, string]; rows: [string | number, string | number][]; highlightRow?: number }
  | { kind: 'growth'; values: { label: string; value: number }[] }
  | { kind: 'clock'; hour: number; minute: number }
  | { kind: 'coins'; coins: { name: 'penny' | 'nickel' | 'dime' | 'quarter' | 'dollar'; count: number }[] }
  | { kind: 'shape'; shape: 'triangle' | 'square' | 'rectangle' | 'circle' | 'pentagon' | 'hexagon' | 'cube' | 'cylinder'; label?: string }
  | { kind: 'angle'; degrees: number; label?: string };

/** A question the student answers *before* a step is revealed. */
export interface Checkpoint {
  question: string;
  /** Canonical expected answer (compared with `answersMatch`). */
  answer: string;
  /** Extra acceptable forms. */
  accept?: string[];
  /** Friendly nudge when the checkpoint answer is wrong. */
  nudge?: string;
}

export interface Step {
  title: string;
  /** What we are doing. */
  what: string;
  /** Why we are doing it. */
  why: string;
  /** The mathematical rule or property being used. */
  rule?: string;
  /** The math written out for this step (shown large and highlighted). */
  math: string;
  /** Alternative, simpler wording for "Explain this step again". */
  simpler?: string;
  /** Common mistakes students make here. */
  mistakes?: string[];
  visual?: Visual;
  checkpoint?: Checkpoint;
}

export type AnswerKind = 'number' | 'fraction' | 'expression' | 'list' | 'text';

export interface Problem {
  id: string;
  skillId: string;
  difficulty: Difficulty;
  /** Plain question text, e.g. "3/4 + 1/2 = ?" */
  prompt: string;
  /** Optional story framing for word problems. */
  story?: string;
  answer: string;
  /** Other acceptable written forms of the answer. */
  accept?: string[];
  answerKind: AnswerKind;
  /** Placeholder shown in the answer box, e.g. "e.g. 1 1/4". */
  answerHint?: string;
  steps: Step[];
  /** Progressive hints, least revealing first. */
  hints: string[];
  visual?: Visual;
  /** Multiple-choice options (used by the quiz when present). */
  choices?: string[];
}

export interface CheckResult {
  correct: boolean;
  /** Correct value but not in the requested form (e.g. not simplified). */
  almost?: boolean;
  message: string;
  /** Explanation of *why* a wrong answer is wrong, when we can tell. */
  misconception?: string;
}

export interface SkillTeaching {
  /** One-line summary for cards and search. */
  summary: string;
  whatYouWillLearn: string[];
  /** Short, plain-language concept explanation paragraphs. */
  concept: string[];
  keyVocabulary?: { term: string; meaning: string }[];
  conceptVisual?: Visual;
  realWorld: RealWorldStory;
  lessonSummary: string[];
}

export interface RealWorldStory {
  title: string;
  emoji: string;
  /** Short story told in scenes (shown one at a time). */
  scenes: { text: string; visual?: Visual }[];
  question: string;
  answer: string;
  accept?: string[];
  explanation: string;
}

export interface Skill {
  id: string;
  name: string;
  /** Grades where this skill is typically taught. */
  grades: number[];
  /** Skill ids that should be practised first when a student struggles. */
  prerequisites?: string[];
  keywords: string[];
  teaching: SkillTeaching;
  generate(difficulty: Difficulty, rng: () => number): Problem;
  /** Try to recognise a typed problem, e.g. "2x + 5 = 17". */
  parse?(text: string): Problem | null;
  /** Skill-specific answer checking (falls back to generic comparison). */
  check?(problem: Problem, input: string): CheckResult;
}
