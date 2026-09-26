import type { Difficulty } from '../engine/types';

export type AttemptSource = 'practice' | 'workspace' | 'quiz' | 'checkpoint' | 'story' | 'solver';

export interface Attempt {
  skillId: string;
  lessonId?: string;
  correct: boolean;
  difficulty: Difficulty;
  hintsUsed: number;
  source: AttemptSource;
  at: number;
}

export interface LessonProgress {
  sectionsDone: string[];
  completedAt?: number;
  quizScores: { score: number; total: number; at: number }[];
}

export interface Assignment {
  id: string;
  lessonId: string;
  note?: string;
  due?: string;
  assignedAt: number;
  by: 'teacher' | 'parent';
}

export interface Profile {
  name: string;
  grade: number;
  avatar: string;
}

export interface Settings {
  narrationRate: number;
  largeText: boolean;
  reduceMotion: boolean;
}

/**
 * Everything we remember about one learner. Kept in localStorage for this
 * version; the shape is designed to map 1:1 onto a future accounts API
 * (student ↔ teacher/parent links would live server-side).
 */
export interface ProgressState {
  version: 1;
  profile: Profile;
  attempts: Attempt[];
  lessons: Record<string, LessonProgress>;
  difficulty: Record<string, Difficulty>;
  activeDays: string[];
  practiceSeconds: Record<string, number>;
  assignments: Assignment[];
  tutorQuestions: number;
  settings: Settings;
}
