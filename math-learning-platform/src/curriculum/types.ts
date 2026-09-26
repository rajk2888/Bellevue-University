import type { Difficulty } from '../engine/types';

/**
 * Curriculum model: Curriculum → Grade → Domain → Topic → Lesson.
 *
 * The same engine skills can be mapped into any number of curricula
 * (e.g. Common Core, a state framework, IB, Cambridge) — add another
 * `Curriculum` object and register it in `curricula.ts`.
 */
export interface Curriculum {
  id: string;
  name: string;
  /** Short note about which standards the codes refer to. */
  standardsNote?: string;
  grades: GradeLevel[];
}

export type GradeBand = 'early' | 'elementary' | 'middle' | 'high';

export interface GradeLevel {
  grade: number;
  domains: Domain[];
}

export interface Domain {
  id: string;
  name: string;
  icon: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  lessons: LessonRef[];
}

export interface LessonRef {
  /** Globally unique slug, used in URLs: /lesson/:id */
  id: string;
  title: string;
  /** Engine skill that powers the interactive lesson. Omitted → "coming soon". */
  skillId?: string;
  /** Typed problem used as the fixed worked example (parsed by the skill). */
  workedExample?: string;
  /** Starting difficulty for practice at this grade. */
  startDifficulty?: Difficulty;
  standards?: string[];
  /** Short description for lessons without a skill yet. */
  description?: string;
}

export interface GradeBandInfo {
  id: GradeBand;
  label: string;
  grades: number[];
  emoji: string;
  blurb: string;
}
