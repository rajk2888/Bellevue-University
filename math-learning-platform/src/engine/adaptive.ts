import { DIFFICULTIES, type Difficulty } from './types';

export interface AttemptLike {
  correct: boolean;
  difficulty: Difficulty;
  hintsUsed?: number;
}

export interface AdaptiveDecision {
  difficulty: Difficulty;
  /** Suggest practising a prerequisite skill first. */
  suggestPrerequisite: boolean;
  message?: string;
}

/**
 * Simple, transparent adaptivity:
 *  - 3 correct in a row (with ≤1 hint each) → step up one level
 *  - 2 wrong in a row → step down one level
 *  - struggling at "easy" (3 of the last 4 wrong) → recommend a prerequisite
 */
export function nextDifficulty(current: Difficulty, recent: AttemptLike[]): AdaptiveDecision {
  const idx = DIFFICULTIES.indexOf(current);
  // Only attempts at the current level count, so a level change starts fresh.
  const atLevel = recent.filter((a) => a.difficulty === current);
  const last = atLevel.slice(-4);
  const streakRight = countTail(atLevel, (a) => a.correct && (a.hintsUsed ?? 0) <= 1);
  const streakWrong = countTail(atLevel, (a) => !a.correct);

  if (current === 'easy' && last.length >= 3 && last.filter((a) => !a.correct).length >= 3) {
    return {
      difficulty: 'easy',
      suggestPrerequisite: true,
      message: 'Let’s build a strong foundation first with a skill that helps here. You’ll come back ready!',
    };
  }
  if (streakWrong >= 2 && idx > 0) {
    return { difficulty: DIFFICULTIES[idx - 1], suggestPrerequisite: false, message: 'Let’s try a slightly easier one to lock in the idea.' };
  }
  if (streakRight >= 3 && idx < DIFFICULTIES.length - 1) {
    return { difficulty: DIFFICULTIES[idx + 1], suggestPrerequisite: false, message: 'You’re on a roll! Here’s a bit more of a challenge.' };
  }
  return { difficulty: current, suggestPrerequisite: false };
}

function countTail<T>(items: T[], pred: (x: T) => boolean): number {
  let n = 0;
  for (let i = items.length - 1; i >= 0 && pred(items[i]); i--) n++;
  return n;
}
