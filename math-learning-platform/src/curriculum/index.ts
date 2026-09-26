import { getSkill, SKILLS } from '../engine/registry';
import { commonCore } from './commonCore';
import type { Curriculum, Domain, GradeBand, GradeBandInfo, LessonRef, Topic } from './types';

export * from './types';

/** Register additional curricula here. */
export const CURRICULA: Curriculum[] = [commonCore];
export const activeCurriculum = CURRICULA[0];

export const GRADE_BANDS: GradeBandInfo[] = [
  { id: 'early', label: 'Grades 1–2', grades: [1, 2], emoji: '🧸', blurb: 'Counting, adding, shapes, time and money' },
  { id: 'elementary', label: 'Grades 3–5', grades: [3, 4, 5], emoji: '🍕', blurb: 'Multiplication, fractions, decimals and area' },
  { id: 'middle', label: 'Grades 6–8', grades: [6, 7, 8], emoji: '⚖️', blurb: 'Ratios, integers, equations and probability' },
  { id: 'high', label: 'Grades 9–10', grades: [9, 10], emoji: '📈', blurb: 'Algebra, functions, quadratics and geometry' },
  { id: 'high', label: 'Grades 11–12', grades: [11, 12], emoji: '∫', blurb: 'Trigonometry, logarithms and calculus' },
];

export function bandForGrade(grade: number): GradeBand {
  if (grade <= 2) return 'early';
  if (grade <= 5) return 'elementary';
  if (grade <= 8) return 'middle';
  return 'high';
}

export interface LessonContext {
  lesson: LessonRef;
  grade: number;
  domain: Domain;
  topic: Topic;
}

const lessonIndex = new Map<string, LessonContext>();
for (const g of activeCurriculum.grades)
  for (const domain of g.domains)
    for (const topic of domain.topics)
      for (const lesson of topic.lessons) lessonIndex.set(lesson.id, { lesson, grade: g.grade, domain, topic });

export function getLesson(id: string): LessonContext | undefined {
  return lessonIndex.get(id);
}

export function allLessons(): LessonContext[] {
  return [...lessonIndex.values()];
}

export function getGrade(grade: number) {
  return activeCurriculum.grades.find((g) => g.grade === grade);
}

/** The lesson after this one in curriculum order (same grade first). */
export function nextLesson(id: string): LessonContext | undefined {
  const list = allLessons().filter((l) => l.lesson.skillId);
  const i = list.findIndex((l) => l.lesson.id === id);
  return i >= 0 ? list[i + 1] : undefined;
}

/** The best lesson to learn a given skill at (closest to the student's grade). */
export function lessonForSkill(skillId: string, grade?: number): LessonContext | undefined {
  const candidates = allLessons().filter((l) => l.lesson.skillId === skillId);
  if (!candidates.length) return undefined;
  if (grade === undefined) return candidates[0];
  return [...candidates].sort((a, b) => Math.abs(a.grade - grade) - Math.abs(b.grade - grade))[0];
}

export interface SearchHit {
  kind: 'lesson' | 'skill';
  title: string;
  subtitle: string;
  href: string;
  score: number;
}

/** Lightweight keyword search over lessons and skills. */
export function search(query: string, grade?: number): SearchHit[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const words = q.split(/\s+/).filter((w) => w.length > 1 || /\d/.test(w));
  const hits: SearchHit[] = [];
  for (const ctx of allLessons()) {
    const skill = ctx.lesson.skillId ? getSkill(ctx.lesson.skillId) : undefined;
    const hay = [ctx.lesson.title, ctx.topic.name, ctx.domain.name, skill?.name, skill?.teaching.summary, ...(skill?.keywords ?? []), ctx.lesson.description, `grade ${ctx.grade}`]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 5;
    for (const w of words) if (hay.includes(w)) score += 1;
    if (ctx.lesson.title.toLowerCase().includes(q)) score += 5;
    if (!score) continue;
    if (grade !== undefined) score += Math.max(0, 2 - Math.abs(ctx.grade - grade) * 0.5);
    if (ctx.lesson.skillId) score += 0.5;
    hits.push({
      kind: 'lesson',
      title: ctx.lesson.title,
      subtitle: `Grade ${ctx.grade} · ${ctx.domain.name} · ${ctx.topic.name}${ctx.lesson.skillId ? '' : ' · coming soon'}`,
      href: `/lesson/${ctx.lesson.id}`,
      score,
    });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 12);
}

export const POPULAR_LESSONS = ['g5-add-fractions', 'g1-addition', 'g3-multiplication', 'g7-two-step', 'g7-discounts', 'g9-quadratics', 'g8-pythagorean', 'g11-compound-interest'];

export { SKILLS };
