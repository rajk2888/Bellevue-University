import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Difficulty } from '../engine/types';
import type { Assignment, Attempt, ProgressState, Settings } from './types';

const KEY = 'stepwise-math-progress-v1';
const MAX_ATTEMPTS = 1000;

export function today(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function initialState(): ProgressState {
  return {
    version: 1,
    profile: { name: '', grade: 5, avatar: '🦉' },
    attempts: [],
    lessons: {},
    difficulty: {},
    activeDays: [],
    practiceSeconds: {},
    assignments: [],
    tutorQuestions: 0,
    settings: { narrationRate: 1, largeText: false, reduceMotion: false },
  };
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== 1) return initialState();
    return { ...initialState(), ...parsed, settings: { ...initialState().settings, ...parsed.settings } };
  } catch {
    return initialState();
  }
}

function save(state: ProgressState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode) — the app still works for this session.
  }
}

export interface ProgressApi {
  state: ProgressState;
  recordAttempt(a: Omit<Attempt, 'at'>): void;
  markSection(lessonId: string, section: string): void;
  completeLesson(lessonId: string): void;
  recordQuiz(lessonId: string, score: number, total: number): void;
  setDifficulty(skillId: string, d: Difficulty): void;
  setProfile(p: Partial<ProgressState['profile']>): void;
  setSettings(s: Partial<Settings>): void;
  addPracticeTime(seconds: number): void;
  countTutorQuestion(): void;
  addAssignment(a: Omit<Assignment, 'id' | 'assignedAt'>): void;
  removeAssignment(id: string): void;
  loadDemoData(): void;
  reset(): void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(load);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    save(state);
  }, [state]);

  const touchDay = (s: ProgressState): ProgressState => {
    const d = today();
    return s.activeDays.includes(d) ? s : { ...s, activeDays: [...s.activeDays, d].slice(-400) };
  };

  const update = useCallback((fn: (s: ProgressState) => ProgressState) => setState((s) => fn(s)), []);

  const api = useMemo<ProgressApi>(
    () => ({
      state,
      recordAttempt: (a) =>
        update((s) => touchDay({ ...s, attempts: [...s.attempts, { ...a, at: Date.now() }].slice(-MAX_ATTEMPTS) })),
      markSection: (lessonId, section) =>
        update((s) => {
          const lp = s.lessons[lessonId] ?? { sectionsDone: [], quizScores: [] };
          if (lp.sectionsDone.includes(section)) return s;
          return touchDay({ ...s, lessons: { ...s.lessons, [lessonId]: { ...lp, sectionsDone: [...lp.sectionsDone, section] } } });
        }),
      completeLesson: (lessonId) =>
        update((s) => {
          const lp = s.lessons[lessonId] ?? { sectionsDone: [], quizScores: [] };
          if (lp.completedAt) return s;
          return touchDay({ ...s, lessons: { ...s.lessons, [lessonId]: { ...lp, completedAt: Date.now() } } });
        }),
      recordQuiz: (lessonId, score, total) =>
        update((s) => {
          const lp = s.lessons[lessonId] ?? { sectionsDone: [], quizScores: [] };
          return touchDay({ ...s, lessons: { ...s.lessons, [lessonId]: { ...lp, quizScores: [...lp.quizScores, { score, total, at: Date.now() }] } } });
        }),
      setDifficulty: (skillId, d) => update((s) => ({ ...s, difficulty: { ...s.difficulty, [skillId]: d } })),
      setProfile: (p) => update((s) => ({ ...s, profile: { ...s.profile, ...p } })),
      setSettings: (p) => update((s) => ({ ...s, settings: { ...s.settings, ...p } })),
      addPracticeTime: (seconds) =>
        update((s) => {
          const d = today();
          return { ...s, practiceSeconds: { ...s.practiceSeconds, [d]: (s.practiceSeconds[d] ?? 0) + seconds } };
        }),
      countTutorQuestion: () => update((s) => ({ ...s, tutorQuestions: s.tutorQuestions + 1 })),
      addAssignment: (a) =>
        update((s) => ({ ...s, assignments: [...s.assignments, { ...a, id: Math.random().toString(36).slice(2), assignedAt: Date.now() }] })),
      removeAssignment: (id) => update((s) => ({ ...s, assignments: s.assignments.filter((x) => x.id !== id) })),
      loadDemoData: () => update((s) => demoData(s)),
      reset: () => setState(initialState()),
    }),
    [state, update],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress must be used inside <ProgressProvider>');
  return v;
}

/** Sample history so parents/teachers can preview the dashboards. */
function demoData(s: ProgressState): ProgressState {
  const now = Date.now();
  const day = 86_400_000;
  const attempts: Attempt[] = [];
  const plan: [string, number, number][] = [
    ['add-fractions', 14, 0.85],
    ['equivalent-fractions', 8, 0.9],
    ['subtract-fractions', 6, 0.5],
    ['decimals', 7, 0.72],
    ['multiplication-facts', 12, 0.92],
    ['percent', 5, 0.4],
  ];
  plan.forEach(([skillId, n, rate], k) => {
    for (let i = 0; i < n; i++) {
      attempts.push({
        skillId,
        correct: (i * 37 + k * 11) % 100 < rate * 100,
        difficulty: i < n / 2 ? 'easy' : 'medium',
        hintsUsed: i % 3 === 0 ? 1 : 0,
        source: i % 4 === 0 ? 'quiz' : 'practice',
        at: now - (13 - Math.floor((i / n) * 13)) * day + k * 60_000,
      });
    }
  });
  const days: string[] = [];
  const secs: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    if (i === 9 || i === 5) continue;
    const d = today(new Date(now - i * day));
    days.push(d);
    secs[d] = 600 + ((i * 431) % 1200);
  }
  return {
    ...s,
    profile: { ...s.profile, name: s.profile.name || 'Alex', grade: 5 },
    attempts: [...attempts.sort((a, b) => a.at - b.at), ...s.attempts],
    lessons: {
      ...s.lessons,
      'g5-add-fractions': { sectionsDone: ['learn', 'visual', 'story', 'example', 'try', 'practice', 'quiz'], completedAt: now - 2 * day, quizScores: [{ score: 3, total: 5, at: now - 6 * day }, { score: 5, total: 5, at: now - 2 * day }] },
      'g3-multiplication': { sectionsDone: ['learn', 'example', 'practice', 'quiz'], completedAt: now - 10 * day, quizScores: [{ score: 4, total: 5, at: now - 10 * day }] },
      'g4-equivalent-fractions': { sectionsDone: ['learn', 'example', 'practice'], completedAt: now - 8 * day, quizScores: [] },
      'g5-subtract-fractions': { sectionsDone: ['learn', 'example'], quizScores: [{ score: 2, total: 5, at: now - day }] },
    },
    activeDays: Array.from(new Set([...days, ...s.activeDays])).sort(),
    practiceSeconds: { ...secs, ...s.practiceSeconds },
    tutorQuestions: s.tutorQuestions + 6,
  };
}
