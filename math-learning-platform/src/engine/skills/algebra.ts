import { Fraction } from '../../lib/math/fraction';
import { fracText, parseLinear, showLinear } from '../../lib/math/linear';
import { fmt, paren } from '../../lib/math/numbers';
import { nonZero, pick, randInt } from '../../lib/math/rng';
import { answersMatch, numericValue, praise } from '../answer';
import type { CheckResult, Difficulty, Problem, Skill, Step } from '../types';
import { clean, problem } from './common';

const F = (n: number, d = 1) => new Fraction(n, d);

/* ------------------------------------------------------------------ */
/* Linear equations                                                    */
/* ------------------------------------------------------------------ */

export function buildLinearEquation(leftText: string, rightText: string, difficulty: Difficulty, story?: string): Problem | null {
  const L = parseLinear(leftText);
  const R = parseLinear(rightText);
  if (!L || !R) return null;
  if (L.coef.isZero() && R.coef.isZero()) return null;

  const pretty = (s: string) => s.replace(/\s*([+\-=])\s*/g, ' $1 ').replace(/-/g, '−').replace(/\*/g, '·').replace(/\(\s*−\s*/g, '(−').replace(/^ − /, '−').trim();
  const original = `${pretty(leftText)} = ${pretty(rightText)}`;
  const steps: Step[] = [];
  let a = L.coef;
  let b = L.constant;
  let c = R.coef;
  let d = R.constant;

  // Keep x on whichever side has the larger coefficient, so it stays positive.
  let swapped = false;
  if (c.value() > a.value()) {
    [a, b, c, d] = [c, d, a, b];
    swapped = true;
  }

  steps.push({
    title: 'Understand the goal',
    what: 'We want to find the value of x that makes both sides equal. Our goal is to get x by itself on one side.',
    why: 'An equation is like a balanced scale. Whatever we do to one side, we must do to the other to keep it balanced.',
    rule: 'Properties of equality: adding, subtracting, multiplying or dividing both sides by the same number keeps an equation true.',
    math: original,
    simpler: 'Think of a see-saw that is perfectly level. To keep it level, anything you add or remove on one side you must also do on the other side.',
    visual: { kind: 'balance', left: pretty(leftText), right: pretty(rightText) },
  });

  if (L.hadParens || R.hadParens || (swapped && !c.isZero())) {
    const lhs = showLinear(a, b);
    const rhs = showLinear(c, d);
    const shown = swapped ? `${rhs} = ${lhs}` : `${lhs} = ${rhs}`;
    if (L.hadParens || R.hadParens) {
      steps.push({
        title: 'Simplify each side',
        what: 'Use the distributive property to remove parentheses and combine like terms.',
        why: 'It is easier to undo operations when each side is simple.',
        rule: 'Distributive property: a(b + c) = ab + ac.',
        math: shown,
        mistakes: ['Multiplying only the first term inside the parentheses.'],
      });
    }
  }

  if (!c.isZero()) {
    const newA = a.sub(c);
    steps.push({
      title: 'Collect the x terms on one side',
      what: `Subtract ${showLinear(c, F(0))} from both sides.`,
      why: 'We want all the x terms together on one side of the equation.',
      rule: 'Subtraction property of equality.',
      math: `${showLinear(a, b)} = ${showLinear(c, d)}\n(subtract ${showLinear(c, F(0))} from both sides)\n${showLinear(newA, b)} = ${showLinear(F(0), d)}`,
      mistakes: ['Subtracting from only one side.', 'Losing the sign of a term when moving it.'],
      visual: { kind: 'balance', left: showLinear(newA, b), right: showLinear(F(0), d) },
    });
    if (newA.isZero()) {
      const same = b.equals(d);
      return problem({
        skillId: 'linear-equations',
        difficulty,
        prompt: `Solve: ${original}`,
        answer: same ? 'all real numbers' : 'no solution',
        accept: same ? ['infinitely many', 'infinite', 'any number'] : ['none', 'no solutions'],
        answerKind: 'text',
        steps: [
          ...steps,
          {
            title: same ? 'Always true' : 'Never true',
            what: same ? 'The x terms cancelled and both sides are the same number.' : `The x terms cancelled, leaving ${fracText(b)} = ${fracText(d)}, which is false.`,
            why: same ? 'Every value of x makes the equation true.' : 'No value of x can make a false statement true.',
            math: `${fracText(b)} = ${fracText(d)}`,
          },
        ],
        hints: ['Collect the x terms on one side.', 'What happens to the x terms?'],
      });
    }
    a = newA;
    c = F(0);
  }

  const C = d.sub(b);
  if (!b.isZero()) {
    const verb = b.n > 0 ? 'Subtract' : 'Add';
    const amt = fracText(b.n > 0 ? b : b.neg());
    steps.push({
      title: `Undo the ${b.n > 0 ? 'addition' : 'subtraction'}`,
      what: `${verb} ${amt} ${b.n > 0 ? 'from' : 'to'} both sides.`,
      why: `The ${b.n > 0 ? '+' : '−'} ${amt} is attached to the x term. Doing the opposite operation removes it, leaving just the x term.`,
      rule: `${b.n > 0 ? 'Subtraction' : 'Addition'} property of equality: inverse operations undo each other.`,
      math: `${showLinear(a, b)} ${b.n > 0 ? '−' : '+'} ${amt} = ${fracText(d)} ${b.n > 0 ? '−' : '+'} ${amt}\n${showLinear(a, F(0))} = ${fracText(C)}`,
      simpler: `Take ${amt} off both sides of the see-saw so it stays balanced.`,
      mistakes: [`${b.n > 0 ? 'Adding' : 'Subtracting'} ${amt} instead of doing the opposite.`, 'Changing only one side.'],
      visual: { kind: 'balance', left: showLinear(a, F(0)), right: fracText(C), note: `${b.n > 0 ? '−' : '+'}${amt} on both sides` },
      checkpoint: {
        question: `What is ${fracText(d)} ${b.n > 0 ? '−' : '+'} ${amt}?`,
        answer: fracText(C),
        nudge: `Work out the right-hand side: ${fracText(d)} ${b.n > 0 ? '−' : '+'} ${amt}.`,
      },
    });
  }

  const x = C.div(a);
  if (!a.equals(F(1))) {
    steps.push({
      title: a.equals(F(-1)) ? 'Undo the negative' : 'Undo the multiplication',
      what: `Divide both sides by ${fracText(a)}.`,
      why: `${showLinear(a, F(0))} means ${fracText(a)} × x. Dividing by ${fracText(a)} undoes the multiplication and leaves x alone.`,
      rule: 'Division property of equality.',
      math: `${showLinear(a, F(0))} ÷ ${paren(a.value()).replace(/^\(-/, '(−')} = ${fracText(C)} ÷ ${paren(a.value()).replace(/^\(-/, '(−')}\nx = ${fracText(x)}`,
      simpler: `If ${fracText(a)} equal groups of x make ${fracText(C)}, one x is ${fracText(C)} ÷ ${fracText(a)}.`,
      mistakes: ['Subtracting the coefficient instead of dividing.', 'Dropping a negative sign.'],
      visual: { kind: 'balance', left: 'x', right: fracText(x) },
      checkpoint: { question: `What is ${fracText(C)} ÷ ${fracText(a)}?`, answer: fracText(x), nudge: `Divide ${fracText(C)} by ${fracText(a)}.` },
    });
  }

  const lv = L.coef.mul(x).add(L.constant);
  const rv = R.coef.mul(x).add(R.constant);
  steps.push({
    title: 'Check the solution',
    what: `Substitute x = ${fracText(x)} into the original equation.`,
    why: 'If both sides come out equal, our answer is correct.',
    rule: 'Substitution.',
    math: `Left side: ${fracText(lv)}\nRight side: ${fracText(rv)}\n${fracText(lv)} = ${fracText(rv)} ✓`,
  });

  return problem({
    skillId: 'linear-equations',
    difficulty,
    prompt: `Solve for x: ${original}`,
    story,
    answer: fracText(x),
    accept: x.isInteger() ? undefined : [fmt(x.value(), 3)],
    answerKind: 'number',
    answerHint: 'x = ?',
    steps,
    hints: [
      'What is happening to x? List the operations.',
      !c.isZero() || R.coef.n !== 0 ? 'Get all the x terms on one side first.' : b.isZero() ? 'Only one operation to undo.' : `Undo the ${b.n > 0 ? '+' : '−'} ${fracText(b.n > 0 ? b : b.neg())} first.`,
      a.equals(F(1)) ? 'Now x is alone!' : `Then divide both sides by ${fracText(a)}.`,
    ],
    visual: { kind: 'balance', left: pretty(leftText), right: pretty(rightText) },
  });
}

function checkLinear(p: Problem, input: string): CheckResult {
  if ([p.answer, ...(p.accept ?? [])].some((a) => answersMatch(input, a))) return { correct: true, message: praise() };
  const v = numericValue(input);
  if (v === null) return { correct: false, message: 'Type a number, like 6 or x = 6.' };
  // Look for classic slips: adding instead of subtracting the constant.
  const m = p.prompt.match(/:\s*(-?\d*)x\s*([+−])\s*(\d+)\s*=\s*(−?\d+)$/);
  if (m) {
    const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
    const b = (m[2] === '+' ? 1 : -1) * Number(m[3]);
    const c = Number(m[4].replace('−', '-'));
    if (Math.abs(v - (c + b) / a) < 1e-9)
      return { correct: false, message: 'Check the direction of your first step.', misconception: `To undo ${b > 0 ? '+' : '−'} ${Math.abs(b)}, do the opposite: ${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)} on both sides.` };
    if (a !== 1 && Math.abs(v - (c - b)) < 1e-9)
      return { correct: false, message: 'You are one step away!', misconception: `${a}x = ${c - b} means ${a} times x. Divide both sides by ${a} to find x.` };
    if (Math.abs(v - (c / a - b)) < 1e-9 && b !== 0)
      return { correct: false, message: 'The order of undoing matters.', misconception: `Undo the addition/subtraction first, then the multiplication — like taking off shoes before socks in reverse!` };
  }
  return { correct: false, message: `Not quite. Try substituting your answer back into the equation to check it.` };
}

export const linearEquations: Skill = {
  id: 'linear-equations',
  name: 'Solving Linear Equations',
  grades: [6, 7, 8, 9],
  prerequisites: ['integers'],
  keywords: ['equation', 'solve', 'solve for x', 'linear', 'variable', 'unknown', 'x', 'algebra', 'balance', 'one-step', 'two-step'],
  teaching: {
    summary: 'Solve equations by keeping them balanced and undoing operations.',
    whatYouWillLearn: ['What an equation means', 'Inverse operations', 'Solving one-step, two-step and multi-step equations', 'Checking a solution'],
    concept: [
      'An equation says two expressions are equal — like a balanced scale.',
      'To solve, undo what is being done to x using inverse operations: subtraction undoes addition, division undoes multiplication.',
      'Always do the same thing to both sides so the equation stays balanced. Undo addition/subtraction first, then multiplication/division.',
    ],
    keyVocabulary: [
      { term: 'Variable', meaning: 'A letter, like x, that stands for an unknown number.' },
      { term: 'Coefficient', meaning: 'The number multiplying the variable (the 2 in 2x).' },
      { term: 'Inverse operation', meaning: 'An operation that undoes another.' },
    ],
    conceptVisual: { kind: 'balance', left: '2x + 5', right: '17' },
    realWorld: {
      title: 'Choosing a Phone Plan',
      emoji: '📱',
      scenes: [
        { text: 'Plan A costs $20 a month plus $5 for each GB of data. Priya paid $45 last month.' },
        { text: 'If g is the number of GB she used: 20 + 5g = 45.', visual: { kind: 'balance', left: '5g + 20', right: '45' } },
      ],
      question: 'How many GB did Priya use?',
      answer: '5',
      explanation: 'Subtract 20 from both sides: 5g = 25. Divide by 5: g = 5 GB.',
    },
    lessonSummary: ['Keep the equation balanced.', 'Undo + and − first, then × and ÷.', 'Check by substituting your answer.'],
  },
  generate(d, rng) {
    const x = nonZero(rng, d === 'easy' ? 1 : -9, d === 'easy' ? 12 : 12);
    let left: string;
    let right: string;
    if (d === 'easy') {
      if (rng() < 0.5) {
        const b = randInt(rng, 2, 15);
        left = `x + ${b}`;
        right = String(x + b);
      } else {
        const a = randInt(rng, 2, 9);
        left = `${a}x`;
        right = String(a * x);
      }
    } else if (d === 'medium') {
      const a = randInt(rng, 2, 9);
      const b = nonZero(rng, -15, 15);
      left = `${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}`;
      right = String(a * x + b);
    } else if (d === 'hard') {
      const a = randInt(rng, 3, 9);
      const c = randInt(rng, 1, a - 1);
      const b = nonZero(rng, -12, 12);
      const dd = (a - c) * x + b;
      left = `${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}`;
      right = `${c}x ${dd < 0 ? '-' : '+'} ${Math.abs(dd)}`;
    } else {
      const a = randInt(rng, 2, 5);
      const k = nonZero(rng, -6, 6);
      const c = randInt(rng, 1, 3);
      const dd = a * (x + k) - c * x;
      left = `${a}(x ${k < 0 ? '-' : '+'} ${Math.abs(k)})`;
      right = `${c}x ${dd < 0 ? '-' : '+'} ${Math.abs(dd)}`;
    }
    return buildLinearEquation(left, right, d)!;
  },
  parse(text) {
    const s = clean(text).replace(/^solve( for x)?:?\s*/, '');
    if ((s.match(/=/g) ?? []).length !== 1 || !s.includes('x') || /x\s*\^|x²/.test(s)) return null;
    const [l, r] = s.split('=');
    return buildLinearEquation(l.trim(), r.trim(), 'medium');
  },
  check: checkLinear,
};

/* ------------------------------------------------------------------ */
/* Integers                                                             */
/* ------------------------------------------------------------------ */

export function buildIntegerProblem(a: number, b: number, op: '+' | '−', d: Difficulty): Problem {
  const bEff = op === '+' ? b : -b;
  const r = a + bEff;
  const lo = Math.min(0, a, r) - 2;
  const hi = Math.max(0, a, r) + 2;
  return problem({
    skillId: 'integers',
    difficulty: d,
    prompt: `${paren(a).replace('-', '−')} ${op} ${paren(b).replace('-', '−')} = ?`,
    answer: fmt(r).replace('-', '−'),
    answerKind: 'number',
    steps: [
      ...(op === '−'
        ? [
            {
              title: 'Rewrite subtraction as addition',
              what: `Subtracting ${paren(b)} is the same as adding its opposite, ${paren(-b)}.`,
              why: 'Adding the opposite lets us use one set of rules for everything.',
              rule: 'a − b = a + (−b)',
              math: `${paren(a)} − ${paren(b)} = ${paren(a)} + ${paren(-b)}`.replace(/-/g, '−'),
              mistakes: ['Changing the sign of the first number too.'],
              checkpoint: { question: `What is the opposite of ${fmt(b)}?`, answer: fmt(-b) },
            } as Step,
          ]
        : []),
      {
        title: 'Start on the number line',
        what: `Start at ${fmt(a)}.`,
        why: 'The number line shows direction: right is positive, left is negative.',
        rule: 'Numbers increase to the right, decrease to the left.',
        math: `start: ${fmt(a)}`.replace('-', '−'),
        visual: { kind: 'numberLine', min: lo, max: hi, points: [{ at: a, label: 'start' }] },
      },
      {
        title: `Move ${bEff >= 0 ? 'right' : 'left'} ${Math.abs(bEff)}`,
        what: `Adding ${paren(bEff)} means moving ${Math.abs(bEff)} to the ${bEff >= 0 ? 'right' : 'left'}.`,
        why: bEff >= 0 ? 'Adding a positive number moves right.' : 'Adding a negative number moves left.',
        rule: 'Same signs: add and keep the sign. Different signs: subtract the absolute values and keep the sign of the larger.',
        math: `${paren(a)} + ${paren(bEff)} = ${fmt(r)}`.replace(/-/g, '−'),
        visual: { kind: 'numberLine', min: lo, max: hi, jumps: [{ from: a, to: r, label: `${bEff >= 0 ? '+' : '−'}${Math.abs(bEff)}` }], points: [{ at: r, label: fmt(r) }] },
        mistakes: ['Moving the wrong direction for a negative number.'],
        checkpoint: { question: 'Where do you land?', answer: fmt(r) },
      },
    ],
    hints: [op === '−' ? 'Change subtraction to adding the opposite.' : 'Picture a number line.', `Start at ${fmt(a)}.`, `Move ${Math.abs(bEff)} to the ${bEff >= 0 ? 'right' : 'left'}.`],
    visual: { kind: 'numberLine', min: lo, max: hi, points: [{ at: a }] },
  });
}

export const integers: Skill = {
  id: 'integers',
  name: 'Adding & Subtracting Integers',
  grades: [6, 7],
  prerequisites: ['subtract-within-100'],
  keywords: ['integer', 'integers', 'negative', 'positive', 'number line', 'opposite', 'temperature'],
  teaching: {
    summary: 'Add and subtract positive and negative numbers with a number line.',
    whatYouWillLearn: ['What negative numbers are', 'Adding integers on a number line', 'Subtracting by adding the opposite'],
    concept: ['Integers are whole numbers and their opposites: …, −2, −1, 0, 1, 2, …', 'On a number line, adding a positive moves right and adding a negative moves left.', 'Subtracting a number is the same as adding its opposite.'],
    conceptVisual: { kind: 'numberLine', min: -5, max: 5, jumps: [{ from: 2, to: -3, label: '−5' }] },
    realWorld: {
      title: 'Winter Temperatures',
      emoji: '🌡️',
      scenes: [{ text: 'In the morning it was −4°C. By noon the temperature rose 9 degrees.', visual: { kind: 'numberLine', min: -6, max: 7, jumps: [{ from: -4, to: 5, label: '+9' }] } }],
      question: 'What was the temperature at noon (°C)?',
      answer: '5',
      explanation: '−4 + 9 = 5. Start at −4 and move 9 to the right.',
    },
    lessonSummary: ['Positive → move right; negative → move left.', 'a − b = a + (−b).'],
  },
  generate(d, rng) {
    const r = d === 'easy' ? 6 : d === 'medium' ? 10 : 20;
    const a = nonZero(rng, -r, r);
    const b = nonZero(rng, -r, r);
    const op = d === 'easy' ? '+' : pick(rng, ['+', '−'] as const);
    return buildIntegerProblem(a, b, op, d);
  },
  parse(text) {
    const s = clean(text).replace(/\s/g, '');
    const m = s.match(/^\(?(-?\d+)\)?([+-])\(?(-?\d+)\)?$/);
    if (!m || (!m[1].startsWith('-') && !m[3].startsWith('-') && !(m[2] === '-' && Number(m[3]) > Number(m[1])))) return null;
    return buildIntegerProblem(Number(m[1]), Number(m[3]), m[2] === '+' ? '+' : '−', 'medium');
  },
};

/* ------------------------------------------------------------------ */
/* Quadratics                                                           */
/* ------------------------------------------------------------------ */

/** Parse "ax^2 + bx + c" (x² accepted). Returns coefficients or null. */
export function parseQuadratic(src: string): [number, number, number] | null {
  const s = src.replace(/\s+/g, '').replace(/x²/g, 'x^2').replace(/[−–]/g, '-').replace(/\*/g, '');
  if (!/x\^2/.test(s)) return null;
  const terms = s.match(/[+-]?[^+-]+/g);
  if (!terms) return null;
  let a = 0,
    b = 0,
    c = 0;
  for (const t of terms) {
    let m = t.match(/^([+-]?)(\d*\.?\d*)x\^2$/);
    if (m) {
      a += (m[1] === '-' ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
      continue;
    }
    m = t.match(/^([+-]?)(\d*\.?\d*)x$/);
    if (m) {
      b += (m[1] === '-' ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
      continue;
    }
    m = t.match(/^([+-]?)(\d+\.?\d*)$/);
    if (m) {
      c += (m[1] === '-' ? -1 : 1) * Number(m[2]);
      continue;
    }
    return null;
  }
  return a === 0 ? null : [a, b, c];
}

const term = (coef: number, v: string, first = false) => {
  if (coef === 0) return '';
  const abs = Math.abs(coef);
  const body = `${abs === 1 && v ? '' : fmt(abs)}${v}`;
  if (first) return (coef < 0 ? '−' : '') + body;
  return ` ${coef < 0 ? '−' : '+'} ${body}`;
};
export const showQuad = (a: number, b: number, c: number) => `${term(a, 'x²', true)}${term(b, 'x')}${term(c, '')}`;

export function buildQuadratic(a: number, b: number, c: number, d: Difficulty): Problem {
  const disc = b * b - 4 * a * c;
  const eq = `${showQuad(a, b, c)} = 0`;
  const steps: Step[] = [
    {
      title: 'Identify a, b and c',
      what: `Compare with ax² + bx + c = 0: a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}.`,
      why: 'Knowing the coefficients tells us which method to use.',
      rule: 'Standard form of a quadratic equation: ax² + bx + c = 0.',
      math: eq,
      visual: { kind: 'coordinatePlane', range: 10, parabola: { a, b, c } },
      checkpoint: { question: 'What is c?', answer: fmt(c) },
    },
  ];
  let answer: string;
  const sq = Math.sqrt(disc);
  const intRoots = disc >= 0 && Number.isInteger(sq) && a === 1;
  if (disc < 0) {
    steps.push({
      title: 'Check the discriminant',
      what: `b² − 4ac = ${fmt(disc)}, which is negative.`,
      why: 'A negative discriminant means the parabola never crosses the x-axis.',
      rule: 'Discriminant: b² − 4ac < 0 → no real solutions.',
      math: `${paren(b)}² − 4(${fmt(a)})(${paren(c)}) = ${fmt(disc)}`,
    });
    answer = 'no real solutions';
  } else if (intRoots) {
    const r1 = (-b + sq) / 2;
    const r2 = (-b - sq) / 2;
    const p = -r1;
    const q = -r2;
    steps.push(
      {
        title: 'Find two numbers',
        what: `Find two numbers that multiply to c = ${fmt(c)} and add to b = ${fmt(b)}. They are ${fmt(p)} and ${fmt(q)}.`,
        why: 'Because (x + p)(x + q) = x² + (p + q)x + pq, the numbers must multiply to c and add to b.',
        rule: 'Factoring x² + bx + c: find p, q with p·q = c and p + q = b.',
        math: `${paren(p)} × ${paren(q)} = ${fmt(c)}\n${paren(p)} + ${paren(q)} = ${fmt(b)}`,
        mistakes: ['Finding numbers that multiply to c but forgetting to check that they add to b.', 'Sign errors with negative numbers.'],
        checkpoint: { question: `Two numbers multiply to ${fmt(c)} and add to ${fmt(b)}. Name them (e.g. "2, 3").`, answer: `${fmt(p)}, ${fmt(q)}` },
      },
      {
        title: 'Factor',
        what: 'Write the quadratic as a product of two binomials.',
        why: 'A product is easy to solve because of the zero-product property.',
        rule: 'x² + bx + c = (x + p)(x + q)',
        math: `(x${term(p, '')})(x${term(q, '')}) = 0`,
      },
      {
        title: 'Use the zero-product property',
        what: 'Set each factor equal to zero and solve.',
        why: 'If two numbers multiply to 0, at least one of them must be 0.',
        rule: 'If A·B = 0, then A = 0 or B = 0.',
        math: `x${term(p, '')} = 0  →  x = ${fmt(r1)}\nx${term(q, '')} = 0  →  x = ${fmt(r2)}`,
        visual: { kind: 'coordinatePlane', range: Math.max(6, Math.ceil(Math.max(Math.abs(r1), Math.abs(r2))) + 2), parabola: { a, b, c }, points: [{ x: r1, y: 0, label: fmt(r1) }, { x: r2, y: 0, label: fmt(r2) }] },
      },
    );
    answer = r1 === r2 ? fmt(r1) : `${fmt(Math.min(r1, r2))}, ${fmt(Math.max(r1, r2))}`;
  } else {
    const r1 = (-b + sq) / (2 * a);
    const r2 = (-b - sq) / (2 * a);
    steps.push(
      {
        title: 'Compute the discriminant',
        what: `b² − 4ac = ${fmt(disc)}.`,
        why: 'The discriminant tells how many real solutions there are and goes under the square root.',
        rule: 'Discriminant D = b² − 4ac.',
        math: `${paren(b)}² − 4(${fmt(a)})(${paren(c)}) = ${fmt(disc)}`,
        checkpoint: { question: 'What is b² − 4ac?', answer: fmt(disc) },
      },
      {
        title: 'Apply the quadratic formula',
        what: 'Substitute into the quadratic formula.',
        why: 'The formula solves any quadratic, even ones that do not factor nicely.',
        rule: 'x = (−b ± √(b² − 4ac)) / 2a',
        math: `x = (${fmt(-b)} ± √${fmt(disc)}) / ${fmt(2 * a)}\nx ≈ ${fmt(r1, 3)}  or  x ≈ ${fmt(r2, 3)}`,
        mistakes: ['Forgetting that −b flips the sign of b.', 'Dividing only the square root by 2a.'],
        visual: { kind: 'coordinatePlane', range: 8, parabola: { a, b, c }, points: [{ x: r1, y: 0 }, { x: r2, y: 0 }] },
      },
    );
    answer = r1 === r2 ? fmt(r1, 3) : `${fmt(Math.min(r1, r2), 3)}, ${fmt(Math.max(r1, r2), 3)}`;
  }
  return problem({
    skillId: 'quadratics',
    difficulty: d,
    prompt: `Solve: ${eq}`,
    answer,
    accept: answer === 'no real solutions' ? ['none', 'no solution'] : undefined,
    answerKind: 'list',
    answerHint: 'e.g. 2, 3',
    steps,
    hints: intRoots
      ? ['Can this be factored?', `Find two numbers that multiply to ${fmt(c)} and add to ${fmt(b)}.`, 'Set each factor equal to zero.']
      : ['Identify a, b and c.', 'Compute the discriminant b² − 4ac.', 'Use the quadratic formula.'],
    // No graph up front: the x-intercepts would give the answer away.
  });
}

export const quadratics: Skill = {
  id: 'quadratics',
  name: 'Solving Quadratic Equations',
  grades: [9, 10],
  prerequisites: ['linear-equations', 'integers'],
  keywords: ['quadratic', 'factor', 'factoring', 'parabola', 'x squared', 'x^2', 'roots', 'zeros', 'quadratic formula', 'discriminant'],
  teaching: {
    summary: 'Solve quadratics by factoring or with the quadratic formula.',
    whatYouWillLearn: ['Standard form ax² + bx + c = 0', 'Factoring trinomials', 'The zero-product property', 'The quadratic formula and discriminant'],
    concept: [
      'A quadratic equation has an x² term. Its graph is a U-shaped curve called a parabola.',
      'The solutions (roots) are where the parabola crosses the x-axis.',
      'If it factors, use the zero-product property. If not, the quadratic formula always works.',
    ],
    conceptVisual: { kind: 'coordinatePlane', range: 6, parabola: { a: 1, b: -1, c: -6 }, points: [{ x: -2, y: 0, label: '−2' }, { x: 3, y: 0, label: '3' }] },
    realWorld: {
      title: 'Designing a Garden',
      emoji: '🌱',
      scenes: [{ text: 'A garden is a rectangle whose length is 3 m more than its width. Its area is 40 m². If w is the width, w(w + 3) = 40, so w² + 3w − 40 = 0.', visual: { kind: 'rectangleArea', width: 5, length: 8, unit: 'm' } }],
      question: 'What is the width of the garden (in meters)?',
      answer: '5',
      explanation: 'w² + 3w − 40 = (w + 8)(w − 5) = 0, so w = 5 or w = −8. A width cannot be negative, so w = 5 m.',
    },
    lessonSummary: ['Write in standard form.', 'Factor: find numbers that multiply to c and add to b.', 'Otherwise use x = (−b ± √(b² − 4ac)) / 2a.'],
  },
  generate(d, rng) {
    if (d === 'challenge') {
      const a = randInt(rng, 2, 4);
      const b = nonZero(rng, -9, 9);
      const c = nonZero(rng, -9, 3);
      return buildQuadratic(a, b, c, d);
    }
    const r1 = nonZero(rng, -6, 6);
    let r2 = nonZero(rng, -6, 6);
    if (d === 'easy') r2 = Math.abs(r2) * Math.sign(r1);
    return buildQuadratic(1, -(r1 + r2), r1 * r2, d);
  },
  parse(text) {
    const s = clean(text);
    const parts = s.split('=');
    if (parts.length > 2) return null;
    const left = parseQuadratic(parts[0]);
    if (!left) return null;
    let [a, b, c] = left;
    if (parts[1] !== undefined && parts[1].trim() !== '' && parts[1].trim() !== '0') {
      const right = parseQuadratic(parts[1]) ?? (() => {
        const lin = parseLinear(parts[1].trim());
        return lin ? ([0, lin.coef.value(), lin.constant.value()] as [number, number, number]) : null;
      })();
      if (!right) return null;
      a -= right[0];
      b -= right[1];
      c -= right[2];
    }
    return buildQuadratic(a, b, c, 'medium');
  },
};

/* ------------------------------------------------------------------ */
/* Linear functions: slope                                              */
/* ------------------------------------------------------------------ */

export function buildSlope(x1: number, y1: number, x2: number, y2: number, d: Difficulty): Problem {
  const rise = y2 - y1;
  const run = x2 - x1;
  const m = new Fraction(rise, run).simplify();
  const b = new Fraction(y1).sub(m.mul(new Fraction(x1)));
  return problem({
    skillId: 'slope',
    difficulty: d,
    prompt: `Find the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`,
    answer: fracText(m),
    accept: [fmt(m.value(), 3)],
    answerKind: 'fraction',
    steps: [
      {
        title: 'Recall what slope means',
        what: 'Slope measures steepness: how much y changes for each 1 step in x.',
        why: 'Slope = rise ÷ run is the rate of change of the line.',
        rule: 'm = (y₂ − y₁) / (x₂ − x₁)',
        math: `(x₁, y₁) = (${x1}, ${y1}),  (x₂, y₂) = (${x2}, ${y2})`,
        visual: { kind: 'coordinatePlane', range: 10, points: [{ x: x1, y: y1, label: 'A' }, { x: x2, y: y2, label: 'B' }] },
      },
      {
        title: 'Find the rise',
        what: `Rise = y₂ − y₁ = ${y2} − ${paren(y1)} = ${rise}.`,
        why: 'The rise is the vertical change.',
        math: `rise = ${rise}`,
        checkpoint: { question: 'What is the rise (y₂ − y₁)?', answer: String(rise) },
        mistakes: ['Subtracting in a different order for x and y.'],
      },
      {
        title: 'Find the run',
        what: `Run = x₂ − x₁ = ${x2} − ${paren(x1)} = ${run}.`,
        why: 'The run is the horizontal change.',
        math: `run = ${run}`,
        checkpoint: { question: 'What is the run (x₂ − x₁)?', answer: String(run) },
        visual: { kind: 'coordinatePlane', range: 10, points: [{ x: x1, y: y1, label: 'A' }, { x: x2, y: y2, label: 'B' }], rise: { from: [x1, y1], to: [x2, y2] } },
      },
      {
        title: 'Divide rise by run',
        what: `m = ${rise} / ${run} = ${fracText(m)}.`,
        why: 'Slope is the ratio of the two changes.',
        rule: 'Simplify the fraction.',
        math: `m = ${rise}/${run} = ${fracText(m)}`,
        mistakes: ['Putting run over rise (x over y).'],
        visual: { kind: 'coordinatePlane', range: 10, lines: [{ m: m.value(), b: b.value(), label: `y = ${showLinear(m, b)}` }], points: [{ x: x1, y: y1 }, { x: x2, y: y2 }] },
      },
    ],
    hints: ['Slope = rise / run.', `Rise: ${y2} − ${paren(y1)}.`, `Run: ${x2} − ${paren(x1)}.`],
    visual: { kind: 'coordinatePlane', range: 10, points: [{ x: x1, y: y1, label: 'A' }, { x: x2, y: y2, label: 'B' }] },
  });
}

export const slope: Skill = {
  id: 'slope',
  name: 'Slope & Linear Functions',
  grades: [8, 9],
  prerequisites: ['integers'],
  keywords: ['slope', 'rise over run', 'rate of change', 'linear function', 'line', 'graph', 'y = mx + b', 'coordinate'],
  teaching: {
    summary: 'Measure how steep a line is and write linear functions.',
    whatYouWillLearn: ['Slope as rise over run', 'Computing slope from two points', 'Slope-intercept form y = mx + b'],
    concept: ['A linear function makes a straight line. Its slope tells how much y changes when x increases by 1.', 'Positive slope rises to the right; negative slope falls.', 'In y = mx + b, m is the slope and b is where the line crosses the y-axis.'],
    conceptVisual: { kind: 'coordinatePlane', range: 6, lines: [{ m: 2, b: 1, label: 'y = 2x + 1' }], rise: { from: [0, 1], to: [1, 3] } },
    realWorld: {
      title: 'Taxi Fare',
      emoji: '🚕',
      scenes: [{ text: 'A taxi charges a $3 starting fee plus $2 per mile. The cost is y = 2x + 3.', visual: { kind: 'coordinatePlane', range: 10, lines: [{ m: 2, b: 3, label: 'cost' }] } }],
      question: 'How much does a 4-mile ride cost (in dollars)?',
      answer: '11',
      accept: ['$11'],
      explanation: 'y = 2(4) + 3 = 11. The slope 2 is the cost per mile; 3 is the starting fee.',
    },
    lessonSummary: ['m = rise/run = (y₂ − y₁)/(x₂ − x₁).', 'y = mx + b: m is slope, b is y-intercept.'],
  },
  generate(d, rng) {
    const r = d === 'easy' ? 5 : 8;
    for (;;) {
      const x1 = randInt(rng, -r, r);
      const y1 = randInt(rng, d === 'easy' ? 0 : -r, r);
      const x2 = randInt(rng, -r, r);
      const y2 = randInt(rng, d === 'easy' ? 0 : -r, r);
      if (x1 === x2) continue;
      if (d === 'easy' && (x2 < x1 || (y2 - y1) % (x2 - x1) !== 0)) continue;
      return buildSlope(x1, y1, x2, y2, d);
    }
  },
  parse(text) {
    const m = clean(text).match(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\).*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
    if (!m) return null;
    const [x1, y1, x2, y2] = m.slice(1).map(Number);
    if (x1 === x2) return null;
    return buildSlope(x1, y1, x2, y2, 'medium');
  },
};

/* ------------------------------------------------------------------ */
/* Systems of equations (two lines in slope-intercept form)            */
/* ------------------------------------------------------------------ */

export function buildSystem(m1: number, b1: number, m2: number, b2: number, d: Difficulty, story?: string): Problem {
  const x = new Fraction(b2 - b1, m1 - m2).simplify();
  const y = new Fraction(m1).mul(x).add(new Fraction(b1));
  const e1 = `y = ${showLinear(F(m1), F(b1))}`;
  const e2 = `y = ${showLinear(F(m2), F(b2))}`;
  return problem({
    skillId: 'systems',
    difficulty: d,
    prompt: `Solve the system:  ${e1}  and  ${e2}. Give (x, y).`,
    story,
    answer: `(${fracText(x)}, ${fracText(y)})`,
    accept: [`${fracText(x)}, ${fracText(y)}`],
    answerKind: 'text',
    answerHint: '(x, y)',
    steps: [
      {
        title: 'Understand the goal',
        what: 'Find the point (x, y) that makes BOTH equations true.',
        why: 'On a graph, that is where the two lines cross.',
        rule: 'The solution of a system is the intersection point.',
        math: `${e1}\n${e2}`,
        visual: { kind: 'coordinatePlane', range: 10, lines: [{ m: m1, b: b1, label: '①' }, { m: m2, b: b2, label: '②', color: '#f59e0b' }] },
      },
      {
        title: 'Set the expressions equal',
        what: 'Both equations equal y, so their right sides must be equal.',
        why: 'At the crossing point, the y-values are the same.',
        rule: 'Substitution: if y = A and y = B, then A = B.',
        math: `${showLinear(F(m1), F(b1))} = ${showLinear(F(m2), F(b2))}`,
      },
      {
        title: 'Solve for x',
        what: 'Collect x terms on one side and constants on the other.',
        why: 'This is now a one-variable linear equation.',
        rule: 'Inverse operations keep the equation balanced.',
        math: `${showLinear(F(m1 - m2), F(0))} = ${fmt(b2 - b1)}\nx = ${fracText(x)}`,
        checkpoint: { question: 'What is x?', answer: fracText(x) },
      },
      {
        title: 'Find y',
        what: `Substitute x = ${fracText(x)} into the first equation.`,
        why: 'Either equation gives the same y at the intersection.',
        math: `y = ${fmt(m1)}(${fracText(x)}) ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)} = ${fracText(y)}`,
        checkpoint: { question: 'What is y?', answer: fracText(y) },
        visual: { kind: 'coordinatePlane', range: 10, lines: [{ m: m1, b: b1 }, { m: m2, b: b2, color: '#f59e0b' }], points: [{ x: x.value(), y: y.value(), label: `(${fracText(x)}, ${fracText(y)})` }] },
      },
    ],
    hints: ['Both equations say "y = …". Set them equal.', 'Solve the new equation for x.', 'Plug x back in to find y.'],
  });
}

export const systems: Skill = {
  id: 'systems',
  name: 'Systems of Linear Equations',
  grades: [8, 9, 10],
  prerequisites: ['linear-equations', 'slope'],
  keywords: ['system', 'systems', 'simultaneous', 'intersection', 'two equations', 'substitution', 'elimination'],
  teaching: {
    summary: 'Find where two lines meet using substitution.',
    whatYouWillLearn: ['What a system solution means', 'Solving by substitution', 'Checking on a graph'],
    concept: ['A system is two equations that must both be true.', 'The solution is the point where their graphs intersect.', 'When both are solved for y, set them equal and solve for x.'],
    conceptVisual: { kind: 'coordinatePlane', range: 8, lines: [{ m: 1, b: 1 }, { m: -1, b: 5, color: '#f59e0b' }], points: [{ x: 2, y: 3, label: '(2, 3)' }] },
    realWorld: {
      title: 'Comparing Phone Plans',
      emoji: '📱',
      scenes: [
        { text: 'Plan A: $30 a month plus $2 per GB. Plan B: $10 a month plus $6 per GB.' },
        { text: 'If x is the number of GB: Cost A is y = 2x + 30 and Cost B is y = 6x + 10.', visual: { kind: 'ratioTable', headers: ['GB used', 'Plan A / Plan B'], rows: [[1, '$32 / $16'], [3, '$36 / $28'], [5, '$40 / $40'], [7, '$44 / $52']], highlightRow: 2 } },
      ],
      question: 'At how many GB do the plans cost the same?',
      answer: '5',
      explanation: '2x + 30 = 6x + 10 → 20 = 4x → x = 5 GB. Both cost $40. Use less than 5 GB? Plan B is cheaper.',
    },
    lessonSummary: ['Set the two expressions for y equal.', 'Solve for x, then substitute to find y.', 'The answer is the intersection point.'],
  },
  generate(d, rng) {
    for (;;) {
      const x = randInt(rng, -4, 4);
      const y = randInt(rng, -5, 5);
      const m1 = nonZero(rng, -3, 3);
      const m2 = nonZero(rng, -3, 3);
      if (m1 === m2) continue;
      const b1 = y - m1 * x;
      const b2 = y - m2 * x;
      if (Math.abs(b1) > 9 || Math.abs(b2) > 9) continue;
      return buildSystem(m1, b1, m2, b2, d);
    }
  },
  parse(text) {
    const s = clean(text);
    const eqs = s.match(/y\s*=\s*[^,;]+?(?=(,|;|\band\b|y\s*=|$))/g);
    if (!eqs || eqs.length !== 2) return null;
    const lines = eqs.map((e) => parseLinear(e.replace(/y\s*=/, '').trim()));
    if (lines.some((l) => !l)) return null;
    const [l1, l2] = lines as NonNullable<(typeof lines)[number]>[];
    if (l1.coef.equals(l2.coef)) return null;
    return buildSystem(l1.coef.value(), l1.constant.value(), l2.coef.value(), l2.constant.value(), 'medium');
  },
};
