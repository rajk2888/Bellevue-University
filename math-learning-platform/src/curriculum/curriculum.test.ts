import { describe, expect, it } from 'vitest';
import { getSkill } from '../engine/registry';
import { activeCurriculum, allLessons, search } from './index';

describe('curriculum', () => {
  it('covers grades 1 through 12', () => {
    expect(activeCurriculum.grades.map((g) => g.grade)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it('has unique lesson ids', () => {
    const ids = allLessons().map((l) => l.lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('references real skills and parseable worked examples', () => {
    for (const { lesson } of allLessons()) {
      if (!lesson.skillId) continue;
      const skill = getSkill(lesson.skillId);
      expect(skill, lesson.id).toBeDefined();
      if (lesson.workedExample) expect(skill!.parse?.(lesson.workedExample), `${lesson.id}: ${lesson.workedExample}`).toBeTruthy();
    }
  });
  it('finds lessons by keyword', () => {
    expect(search('adding fractions', 5)[0].href).toBe('/lesson/g5-add-fractions');
    expect(search('pizza').length).toBeGreaterThan(0);
  });
});
