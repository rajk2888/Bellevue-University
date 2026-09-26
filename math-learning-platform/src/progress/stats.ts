import { allLessons, getLesson, lessonForSkill, nextLesson, POPULAR_LESSONS, type LessonContext } from '../curriculum';
import { getSkill } from '../engine/registry';
import { today } from './store';
import type { Attempt, ProgressState } from './types';

export type MasteryLevel = 'new' | 'practicing' | 'needs-help' | 'mastered';

export interface SkillStat {
  skillId: string;
  name: string;
  attempts: number;
  correct: number;
  accuracy: number;
  /** Accuracy over the most recent 10 attempts. */
  recentAccuracy: number;
  level: MasteryLevel;
  /** 0–100 progress toward mastery. */
  progress: number;
}

export function skillStats(state: ProgressState): SkillStat[] {
  const groups = new Map<string, Attempt[]>();
  for (const a of state.attempts) {
    if (!groups.has(a.skillId)) groups.set(a.skillId, []);
    groups.get(a.skillId)!.push(a);
  }
  return [...groups.entries()]
    .map(([skillId, list]) => {
      const correct = list.filter((a) => a.correct).length;
      const recent = list.slice(-10);
      const recentAccuracy = recent.filter((a) => a.correct).length / recent.length;
      const level: MasteryLevel =
        list.length >= 6 && recentAccuracy >= 0.8 ? 'mastered' : list.length >= 3 && recentAccuracy < 0.6 ? 'needs-help' : 'practicing';
      const progress = Math.round(Math.min(1, list.length / 8) * recentAccuracy * 100);
      return {
        skillId,
        name: getSkill(skillId)?.name ?? skillId,
        attempts: list.length,
        correct,
        accuracy: correct / list.length,
        recentAccuracy,
        level,
        progress: level === 'mastered' ? 100 : Math.min(progress, 95),
      };
    })
    .sort((a, b) => b.attempts - a.attempts);
}

export function overall(state: ProgressState) {
  const attempts = state.attempts.length;
  const correct = state.attempts.filter((a) => a.correct).length;
  const lessonsCompleted = Object.values(state.lessons).filter((l) => l.completedAt).length;
  const quizzes = Object.values(state.lessons).flatMap((l) => l.quizScores);
  const quizAvg = quizzes.length ? quizzes.reduce((s, q) => s + q.score / q.total, 0) / quizzes.length : null;
  const stars = correct + lessonsCompleted * 5 + quizzes.filter((q) => q.score === q.total).length * 3;
  const totalSeconds = Object.values(state.practiceSeconds).reduce((a, b) => a + b, 0);
  return {
    attempts,
    correct,
    accuracy: attempts ? correct / attempts : null,
    lessonsCompleted,
    quizzesTaken: quizzes.length,
    quizAvg,
    stars,
    level: Math.floor(stars / 20) + 1,
    starsToNextLevel: 20 - (stars % 20),
    streak: streak(state.activeDays),
    totalMinutes: Math.round(totalSeconds / 60),
  };
}

export function streak(days: string[]): number {
  const set = new Set(days);
  const d = new Date();
  if (!set.has(today(d))) d.setDate(d.getDate() - 1); // yesterday still counts
  let n = 0;
  while (set.has(today(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export interface Recommendation {
  lesson: LessonContext;
  reason: string;
}

/** Recommend what to learn next, in order of usefulness. */
export function recommendations(state: ProgressState): Recommendation[] {
  const recs: Recommendation[] = [];
  const seen = new Set<string>();
  const add = (lesson: LessonContext | undefined, reason: string) => {
    if (!lesson || seen.has(lesson.lesson.id)) return;
    seen.add(lesson.lesson.id);
    recs.push({ lesson, reason });
  };
  for (const a of state.assignments) add(getLesson(a.lessonId), a.by === 'teacher' ? 'Assigned by your teacher' : 'Suggested by your parent');
  for (const s of skillStats(state).filter((x) => x.level === 'needs-help')) {
    const skill = getSkill(s.skillId);
    const pre = skill?.prerequisites?.[0];
    add(lessonForSkill(s.skillId, state.profile.grade), `Let’s strengthen ${s.name}`);
    if (pre) add(lessonForSkill(pre, state.profile.grade), `Builds the foundation for ${s.name}`);
  }
  const lastDone = Object.entries(state.lessons)
    .filter(([, l]) => l.completedAt)
    .sort((a, b) => (b[1].completedAt ?? 0) - (a[1].completedAt ?? 0))[0];
  if (lastDone) add(nextLesson(lastDone[0]), 'Next up after your last lesson');
  const inProgress = Object.entries(state.lessons).find(([, l]) => !l.completedAt && l.sectionsDone.length);
  if (inProgress) add(getLesson(inProgress[0]), 'Pick up where you left off');
  const gradeLessons = allLessons().filter((l) => l.grade === state.profile.grade && l.lesson.skillId && !state.lessons[l.lesson.id]?.completedAt);
  for (const l of gradeLessons.slice(0, 2)) add(l, `Grade ${state.profile.grade} lesson`);
  for (const id of POPULAR_LESSONS) add(getLesson(id), 'Popular with students');
  return recs.slice(0, 4);
}

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  earned: boolean;
}

export function badges(state: ProgressState): Badge[] {
  const o = overall(state);
  const stats = skillStats(state);
  const perfectQuiz = Object.values(state.lessons).some((l) => l.quizScores.some((q) => q.score === q.total));
  const learnedFromHint = state.attempts.some((a) => a.correct && a.hintsUsed > 0);
  return [
    { id: 'first-correct', emoji: '🌱', name: 'First Step', description: 'Solve your first problem', earned: o.correct >= 1 },
    { id: 'hint-helper', emoji: '💡', name: 'Hint Detective', description: 'Use a hint and then solve it', earned: learnedFromHint },
    { id: 'ten-correct', emoji: '⭐', name: 'Rising Star', description: 'Solve 10 problems', earned: o.correct >= 10 },
    { id: 'first-lesson', emoji: '📘', name: 'Lesson Finisher', description: 'Complete a whole lesson', earned: o.lessonsCompleted >= 1 },
    { id: 'quiz-ace', emoji: '🏆', name: 'Quiz Ace', description: 'Get every mini-quiz question right', earned: perfectQuiz },
    { id: 'streak-3', emoji: '🔥', name: 'Three-Day Streak', description: 'Learn three days in a row', earned: o.streak >= 3 },
    { id: 'curious', emoji: '🤔', name: 'Curious Mind', description: 'Ask the tutor 5 questions', earned: state.tutorQuestions >= 5 },
    { id: 'explorer', emoji: '🧭', name: 'Explorer', description: 'Practice 5 different skills', earned: stats.length >= 5 },
    { id: 'mastery', emoji: '🎓', name: 'Skill Master', description: 'Master any skill', earned: stats.some((s) => s.level === 'mastered') },
    { id: 'fifty-correct', emoji: '🌟', name: 'Math Marathon', description: 'Solve 50 problems', earned: o.correct >= 50 },
  ];
}

/** Accuracy per week for "improvement over time" charts. */
export function weeklyAccuracy(state: ProgressState, weeks = 6): { label: string; accuracy: number | null; attempts: number }[] {
  const now = Date.now();
  const week = 7 * 86_400_000;
  return Array.from({ length: weeks }, (_, i) => {
    const start = now - (weeks - i) * week;
    const list = state.attempts.filter((a) => a.at >= start && a.at < start + week);
    return {
      label: i === weeks - 1 ? 'This week' : `${weeks - 1 - i}w ago`,
      accuracy: list.length ? list.filter((a) => a.correct).length / list.length : null,
      attempts: list.length,
    };
  });
}

export function recentActivity(state: ProgressState, limit = 8) {
  return [...state.attempts]
    .reverse()
    .slice(0, limit)
    .map((a) => ({ ...a, skillName: getSkill(a.skillId)?.name ?? a.skillId }));
}
