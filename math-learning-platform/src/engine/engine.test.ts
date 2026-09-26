import { describe, expect, it } from 'vitest';
import { Fraction } from '../lib/math/fraction';
import { parseLinear } from '../lib/math/linear';
import { createRng } from '../lib/math/rng';
import { answersMatch, checkAnswer } from './answer';
import { nextDifficulty } from './adaptive';
import { SKILLS, getSkill } from './registry';
import { solve, SOLVER_EXAMPLES } from './solver';
import { DIFFICULTIES } from './types';

describe('Fraction', () => {
  it('parses fractions, mixed numbers and decimals', () => {
    expect(Fraction.parse('3/4')!.toString()).toBe('3/4');
    expect(Fraction.parse('1 1/4')!.toString()).toBe('5/4');
    expect(Fraction.parse('-1 1/4')!.toString()).toBe('-5/4');
    expect(Fraction.parse('0.25')!.toString()).toBe('1/4');
  });
  it('adds and simplifies', () => {
    expect(new Fraction(3, 4).add(new Fraction(1, 2)).toMixedString()).toBe('1 1/4');
  });
});

describe('answersMatch', () => {
  it('accepts equivalent forms', () => {
    expect(answersMatch('x = 6', '6')).toBe(true);
    expect(answersMatch('1 1/4', '5/4')).toBe(true);
    expect(answersMatch('−3', '-3')).toBe(true);
    expect(answersMatch('3, 2', '2, 3')).toBe(true);
    expect(answersMatch('$45', '45')).toBe(true);
    expect(answersMatch('7', '6')).toBe(false);
  });
});

describe('parseLinear', () => {
  it('handles implicit multiplication and parentheses', () => {
    const l = parseLinear('3(x - 4) + 2x')!;
    expect(l.coef.toString()).toBe('5');
    expect(l.constant.toString()).toBe('-12');
    expect(parseLinear('x*x')).toBeNull();
  });
});

describe('the flagship example 3/4 + 1/2', () => {
  const { problem, skill } = solve('3/4 + 1/2')!;
  it('is recognised as adding fractions', () => expect(skill.id).toBe('add-fractions'));
  it('has the expected answer and 5+ steps', () => {
    expect(problem.answer).toBe('1 1/4');
    expect(problem.steps.map((s) => s.title)).toEqual([
      'Understand the denominators',
      'Find a common denominator',
      'Convert to equivalent fractions',
      'Add the numerators',
      'Simplify the answer',
      'Check the answer',
    ]);
  });
  it('diagnoses adding denominators', () => {
    const r = skill.check!(problem, '4/6');
    expect(r.correct).toBe(false);
    expect(r.misconception).toMatch(/never add denominators/);
  });
  it('flags unsimplified answers as almost', () => {
    const r = skill.check!(problem, '10/8');
    expect(r.almost).toBe(true);
  });
  it('accepts improper form', () => expect(skill.check!(problem, '5/4').correct).toBe(true));
});

describe('solver', () => {
  it('recognises every example', () => {
    for (const ex of SOLVER_EXAMPLES) {
      const r = solve(ex);
      expect(r, ex).not.toBeNull();
      expect(r!.problem.steps.length, ex).toBeGreaterThan(0);
    }
  });
  it('solves 2x + 5 = 17', () => {
    const r = solve('2x + 5 = 17')!;
    expect(r.skill.id).toBe('linear-equations');
    expect(r.problem.answer).toBe('6');
    expect(r.skill.check!(r.problem, '11').misconception).toMatch(/subtract 5/);
  });
  it('solves multi-step equations', () => {
    expect(solve('3(x - 4) = 2x + 1')!.problem.answer).toBe('13');
    expect(solve('5 = 2x + 1')!.problem.answer).toBe('2');
  });
  it('solves quadratics', () => {
    const r = solve('x^2 - 5x + 6 = 0')!;
    expect(r.skill.id).toBe('quadratics');
    expect(answersMatch('3, 2', r.problem.answer)).toBe(true);
  });
  it('solves percent discounts', () => expect(solve('$60 with 25% off')!.problem.answer).toBe('45'));
  it('solves derivatives', () => expect(solve('derivative of 3x^2 + 2x - 5')!.problem.answer).toBe('6x + 2'));
  it('solves systems', () => expect(solve('y = 2x + 1 and y = -x + 7')!.problem.answer).toBe('(2, 5)'));
  it('returns null for nonsense', () => expect(solve('hello there')).toBeNull());
});

describe('generators', () => {
  it('every skill generates self-consistent problems at every difficulty', () => {
    const rng = createRng(42);
    for (const skill of SKILLS) {
      for (const d of DIFFICULTIES) {
        for (let i = 0; i < 25; i++) {
          const p = skill.generate(d, rng);
          expect(p.steps.length, `${skill.id}/${d}`).toBeGreaterThan(0);
          expect(p.hints.length, `${skill.id}/${d}`).toBeGreaterThan(0);
          const res = skill.check ? skill.check(p, p.answer) : checkAnswer(p, p.answer);
          expect(res.correct, `${skill.id}/${d}: ${p.prompt} -> ${p.answer}`).toBe(true);
          for (const s of p.steps) {
            if (s.checkpoint) expect(s.checkpoint.answer, `${skill.id} ${s.title}`).not.toBe('');
          }
          if (p.choices) expect(p.choices.filter((c) => answersMatch(c, p.answer)).length, `${skill.id} choices ${p.choices} / ${p.answer}`).toBe(1);
          expect(p.answer).not.toMatch(/NaN|undefined|Infinity/);
        }
      }
    }
  });
  it('skill prerequisites exist', () => {
    for (const s of SKILLS) for (const p of s.prerequisites ?? []) expect(getSkill(p), `${s.id} -> ${p}`).toBeDefined();
  });
  it('real-world story answers match their own answer key', () => {
    for (const s of SKILLS) expect(answersMatch(s.teaching.realWorld.answer, s.teaching.realWorld.answer)).toBe(true);
  });
});

describe('tutor', () => {
  it('teaches instead of giving the answer', async () => {
    const { LocalTutor } = await import('../tutor/tutor');
    const t = new LocalTutor();
    const { problem, skill } = solve('3/4 + 1/2')!;
    const r = await t.reply('just tell me the answer', { grade: 5, problem, skill }, []);
    expect(r.text).not.toContain('1 1/4');
    expect(r.text).toMatch(/hint/i);
    const why = await t.reply('Why do we find a common denominator?', { grade: 5, problem, skill }, []);
    expect(why.text).toMatch(/same size/);
    const easier = await t.reply('Give me an easier problem', { grade: 5, problem, skill }, []);
    expect(easier.action).toEqual({ type: 'newProblem', change: 'easier' });
    const step = await t.reply("I don't understand step 4", { grade: 5, problem, skill }, []);
    expect(step.text).toMatch(/Step 4: Add the numerators/);
  });
});

describe('adaptive difficulty', () => {
  it('steps up after three clean correct answers', () => {
    const r = nextDifficulty('easy', Array(3).fill({ correct: true, difficulty: 'easy' }));
    expect(r.difficulty).toBe('medium');
  });
  it('steps down after two misses', () => {
    const r = nextDifficulty('hard', Array(2).fill({ correct: false, difficulty: 'hard' }));
    expect(r.difficulty).toBe('medium');
  });
  it('suggests a prerequisite when struggling at easy', () => {
    const r = nextDifficulty('easy', Array(4).fill({ correct: false, difficulty: 'easy' }));
    expect(r.suggestPrerequisite).toBe(true);
  });
});
