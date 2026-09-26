import { fmt, money, paren, round } from '../../lib/math/numbers';
import { nonZero, pick, randInt } from '../../lib/math/rng';
import type { Difficulty, Problem, Skill, Step } from '../types';
import { clean, problem } from './common';

/* ------------------------------------------------------------------ */
/* Compound interest                                                    */
/* ------------------------------------------------------------------ */

export function buildCompound(P: number, ratePct: number, years: number, n: number, d: Difficulty): Problem {
  const r = ratePct / 100;
  const factor = 1 + r / n;
  const A = round(P * factor ** (n * years), 2);
  const growth = Array.from({ length: Math.min(years, 10) + 1 }, (_, t) => ({ label: `yr ${t}`, value: round(P * factor ** (n * t), 2) }));
  const nName = n === 1 ? 'yearly' : n === 4 ? 'quarterly' : n === 12 ? 'monthly' : `${n} times a year`;
  return problem({
    skillId: 'compound-interest',
    difficulty: d,
    prompt: `${money(P)} is invested at ${ratePct}% interest compounded ${nName} for ${years} years. How much is in the account? (nearest cent)`,
    answer: A.toFixed(2),
    accept: [`$${A.toFixed(2)}`],
    answerKind: 'number',
    steps: [
      {
        title: 'Identify the variables',
        what: `P = ${money(P)} (principal), r = ${ratePct}% = ${fmt(r)}, n = ${n} (${nName}), t = ${years} years.`,
        why: 'Each part of the formula has a meaning; mixing them up is the most common error.',
        rule: 'Compound interest: A = P(1 + r/n)^(n·t)',
        math: `P = ${P}, r = ${fmt(r)}, n = ${n}, t = ${years}`,
        checkpoint: { question: `Write ${ratePct}% as a decimal.`, answer: fmt(r) },
        mistakes: [`Using r = ${ratePct} instead of ${fmt(r)}.`],
      },
      {
        title: 'Growth factor per period',
        what: `Each period the money is multiplied by 1 + r/n = ${fmt(factor, 6)}.`,
        why: 'You keep what you had (the 1) and add the interest for that period (r/n).',
        rule: 'Multiplying by (1 + rate) increases an amount by that rate.',
        math: `1 + ${fmt(r)}/${n} = ${fmt(factor, 6)}`,
      },
      {
        title: 'Count the periods',
        what: `Interest is added n·t = ${n} × ${years} = ${n * years} times.`,
        why: 'Each compounding period applies the growth factor once more — that is why it is an exponent.',
        math: `n·t = ${n * years}`,
        checkpoint: { question: 'How many times is interest added?', answer: String(n * years) },
      },
      {
        title: 'Calculate',
        what: 'Raise the factor to the power and multiply by the principal.',
        why: 'Interest earns interest — this is exponential growth.',
        math: `A = ${P} × ${fmt(factor, 6)}^${n * years} ≈ ${money(A)}`,
        visual: { kind: 'growth', values: growth },
        mistakes: ['Multiplying by the exponent instead of raising to the power.', 'Using simple interest P(1 + rt).'],
      },
      {
        title: 'Interpret',
        what: `The account grows to ${money(A)} — that is ${money(round(A - P, 2))} of interest.`,
        why: `Compare with simple interest: ${money(round(P * r * years, 2))}. Compounding earns more because interest earns interest.`,
        math: `Interest earned = ${money(A)} − ${money(P)} = ${money(round(A - P, 2))}`,
      },
    ],
    hints: ['Use A = P(1 + r/n)^(nt).', `r must be a decimal: ${fmt(r)}.`, `Compute ${fmt(factor, 6)}^${n * years}, then multiply by ${P}.`],
    visual: { kind: 'growth', values: growth },
  });
}

export const compoundInterest: Skill = {
  id: 'compound-interest',
  name: 'Compound Interest',
  grades: [11, 12],
  prerequisites: ['percent', 'exponentials'],
  keywords: ['compound interest', 'interest', 'savings', 'invest', 'bank', 'exponential growth', 'principal', 'finance'],
  teaching: {
    summary: 'See how savings grow when interest earns interest.',
    whatYouWillLearn: ['Principal, rate, periods', 'A = P(1 + r/n)^(nt)', 'Simple vs. compound interest'],
    concept: ['With compound interest, each period’s interest is added to the balance, so next period you earn interest on a bigger amount.', 'This makes money grow exponentially: A = P(1 + r/n)^(nt).'],
    conceptVisual: { kind: 'growth', values: [0, 1, 2, 3, 4, 5].map((t) => ({ label: `yr ${t}`, value: round(1000 * 1.1 ** t, 0) })) },
    realWorld: {
      title: 'Saving for College',
      emoji: '🎓',
      scenes: [
        { text: 'Lena puts $1,000 into a savings account that pays 5% interest, compounded yearly.' },
        { text: 'After year 1: $1,050. After year 2 she earns 5% of $1,050, not just $1,000!', visual: { kind: 'growth', values: [0, 1, 2, 3].map((t) => ({ label: `yr ${t}`, value: round(1000 * 1.05 ** t, 2) })) } },
      ],
      question: 'How much will she have after 3 years? (nearest cent)',
      answer: '1157.63',
      accept: ['$1157.63', '1,157.63'],
      explanation: 'A = 1000(1.05)³ = 1000 × 1.157625 ≈ $1,157.63.',
    },
    lessonSummary: ['A = P(1 + r/n)^(nt).', 'Convert the rate to a decimal.', 'Compound interest beats simple interest over time.'],
  },
  generate(d, rng) {
    const P = pick(rng, [500, 1000, 2000, 2500, 5000]);
    const rate = pick(rng, [2, 3, 4, 5, 6, 8]);
    const years = d === 'easy' ? randInt(rng, 1, 3) : randInt(rng, 3, 10);
    const n = d === 'easy' || d === 'medium' ? 1 : pick(rng, [4, 12]);
    return buildCompound(P, rate, years, n, d);
  },
  parse(text) {
    const s = clean(text).replace(/,/g, '');
    if (!/(interest|invest|compound)/.test(s)) return null;
    const P = s.match(/\$?(\d+(?:\.\d+)?)(?!\s*%)(?!\s*year)/);
    const r = s.match(/(\d+(?:\.\d+)?)\s*%/);
    const t = s.match(/(\d+)\s*years?/);
    if (!P || !r || !t) return null;
    const n = /monthly/.test(s) ? 12 : /quarterly/.test(s) ? 4 : 1;
    return buildCompound(Number(P[1]), Number(r[1]), Number(t[1]), n, 'medium');
  },
};

/* ------------------------------------------------------------------ */
/* Exponential equations & logarithms                                  */
/* ------------------------------------------------------------------ */

export function buildExpEquation(base: number, x: number, d: Difficulty): Problem {
  const value = base ** x;
  const powers = Array.from({ length: Math.max(x, 1) + 1 }, (_, i) => `${base}^${i} = ${base ** i}`);
  return problem({
    skillId: 'exponentials',
    difficulty: d,
    prompt: `Solve: ${base}^x = ${fmt(value)}`,
    answer: String(x),
    answerKind: 'number',
    steps: [
      {
        title: 'Ask the logarithm question',
        what: `${base}^x = ${fmt(value)} asks: "${base} to what power gives ${fmt(value)}?"`,
        why: 'A logarithm is exactly that question: log_b(y) is the exponent that turns b into y.',
        rule: 'b^x = y  ⇔  x = log_b(y)',
        math: `x = log_${base}(${fmt(value)})`,
        visual: { kind: 'coordinatePlane', range: 8, curve: { fn: 'exp', base, label: `y = ${base}^x` } },
      },
      {
        title: 'Write both sides with the same base',
        what: `Rewrite ${fmt(value)} as a power of ${base}.`,
        why: 'If the bases match, the exponents must match.',
        rule: 'If b^x = b^k, then x = k.',
        math: powers.slice(-4).join('\n'),
        checkpoint: { question: `${base} to what power is ${fmt(value)}?`, answer: String(x) },
        mistakes: [`Dividing ${fmt(value)} by ${base} (that is not how exponents work).`],
      },
      {
        title: 'Check with logs',
        what: `x = ${x}. Check: log(${fmt(value)}) ÷ log(${base}) = ${x}.`,
        why: 'The change-of-base formula lets a calculator solve any exponential equation.',
        rule: 'log_b(y) = log(y) / log(b)',
        math: `x = log(${fmt(value)}) / log(${base}) = ${x}`,
      },
    ],
    hints: [`${base} to what power is ${fmt(value)}?`, `List powers of ${base}: ${powers.slice(0, 4).join(', ')}…`, 'Match the exponents.'],
    visual: { kind: 'coordinatePlane', range: 8, curve: { fn: 'exp', base } },
  });
}

export const exponentials: Skill = {
  id: 'exponentials',
  name: 'Exponentials & Logarithms',
  grades: [10, 11, 12],
  prerequisites: ['linear-equations'],
  keywords: ['exponent', 'exponential', 'log', 'logarithm', 'power', 'base', 'growth', 'decay'],
  teaching: {
    summary: 'Solve equations where the unknown is an exponent.',
    whatYouWillLearn: ['Exponential functions', 'Logarithms as inverse of exponents', 'Solving b^x = y'],
    concept: ['In an exponential function y = b^x, the variable is in the exponent, so y grows (or shrinks) by a constant factor.', 'A logarithm undoes an exponent: log_b(y) = x means b^x = y.'],
    conceptVisual: { kind: 'coordinatePlane', range: 6, curve: { fn: 'exp', base: 2, label: 'y = 2^x' } },
    realWorld: {
      title: 'Bacteria Growth',
      emoji: '🦠',
      scenes: [{ text: 'A colony of bacteria doubles every hour. It starts with 1 cell.', visual: { kind: 'growth', values: [0, 1, 2, 3, 4, 5].map((t) => ({ label: `${t}h`, value: 2 ** t })) } }],
      question: 'After how many hours are there 64 cells?',
      answer: '6',
      explanation: '2^x = 64 and 2^6 = 64, so x = 6 hours.',
    },
    lessonSummary: ['b^x = y ⇔ x = log_b(y).', 'Match bases when you can.', 'Otherwise use log(y)/log(b).'],
  },
  generate(d, rng) {
    const base = d === 'easy' ? pick(rng, [2, 10]) : pick(rng, [2, 3, 4, 5]);
    const x = randInt(rng, 2, d === 'easy' ? 4 : base === 2 ? 8 : 4);
    return buildExpEquation(base, x, d);
  },
  parse(text) {
    const s = clean(text).replace(/\s/g, '');
    let m = s.match(/^(\d+)\^x=(\d+)$/);
    if (m) {
      const [b, y] = [Number(m[1]), Number(m[2])];
      const x = Math.round(Math.log(y) / Math.log(b));
      if (b ** x === y) return buildExpEquation(b, x, 'medium');
      return null;
    }
    m = s.match(/^log_?(\d+)\(?(\d+)\)?$/);
    if (m) {
      const [b, y] = [Number(m[1]), Number(m[2])];
      const x = Math.round(Math.log(y) / Math.log(b));
      if (b ** x === y) return buildExpEquation(b, x, 'medium');
    }
    return null;
  },
};

/* ------------------------------------------------------------------ */
/* Right-triangle trigonometry                                          */
/* ------------------------------------------------------------------ */

export function buildTrig(angle: number, hyp: number, find: 'opposite' | 'adjacent', d: Difficulty): Problem {
  const rad = (angle * Math.PI) / 180;
  const fn = find === 'opposite' ? 'sin' : 'cos';
  const ratio = find === 'opposite' ? Math.sin(rad) : Math.cos(rad);
  const ans = round(hyp * ratio, 2);
  return problem({
    skillId: 'trigonometry',
    difficulty: d,
    prompt: `In a right triangle, the hypotenuse is ${hyp} and one angle is ${angle}°. Find the side ${find} that angle (2 decimal places).`,
    answer: fmt(ans, 2),
    answerKind: 'number',
    steps: [
      {
        title: 'Label the sides',
        what: `From the ${angle}° angle: the hypotenuse is ${hyp}; we want the ${find} side.`,
        why: 'Trig ratios depend on which sides we know and want, relative to the angle.',
        rule: 'SOH CAH TOA: sin = opp/hyp, cos = adj/hyp, tan = opp/adj',
        math: `hyp = ${hyp}, ${find} = ?`,
        visual: { kind: 'rightTriangle', a: find === 'opposite' ? '?' : '', b: find === 'adjacent' ? '?' : '', c: hyp, angle: `${angle}°`, highlight: find === 'opposite' ? 'a' : 'b' },
      },
      {
        title: 'Choose the ratio',
        what: `${find} and hypotenuse → use ${fn === 'sin' ? 'SOH (sine)' : 'CAH (cosine)'}.`,
        why: `${fn} is the ratio that connects the ${find} side and the hypotenuse.`,
        rule: `${fn}(θ) = ${find === 'opposite' ? 'opp' : 'adj'} / hyp`,
        math: `${fn}(${angle}°) = ${find} / ${hyp}`,
        checkpoint: { question: 'Which ratio: sin, cos, or tan?', answer: fn, accept: [fn === 'sin' ? 'sine' : 'cosine'] },
        mistakes: ['Using tan when the hypotenuse is involved.'],
      },
      {
        title: 'Solve',
        what: `Multiply both sides by ${hyp}.`,
        why: 'Undo the division to isolate the unknown side.',
        math: `${find} = ${hyp} × ${fn}(${angle}°) = ${hyp} × ${fmt(ratio, 4)} ≈ ${fmt(ans, 2)}`,
        mistakes: ['Calculator in radian mode instead of degree mode.'],
      },
    ],
    hints: ['Label opposite, adjacent and hypotenuse from the angle.', `Use ${fn === 'sin' ? 'SOH' : 'CAH'}.`, `${find} = ${hyp} × ${fn}(${angle}°).`],
    visual: { kind: 'rightTriangle', a: find === 'opposite' ? '?' : '', b: find === 'adjacent' ? '?' : '', c: hyp, angle: `${angle}°` },
  });
}

export const trigonometry: Skill = {
  id: 'trigonometry',
  name: 'Right-Triangle Trigonometry',
  grades: [10, 11],
  prerequisites: ['pythagorean', 'ratios'],
  keywords: ['trig', 'trigonometry', 'sine', 'cosine', 'tangent', 'sin', 'cos', 'tan', 'soh cah toa', 'angle'],
  teaching: {
    summary: 'Use sine, cosine and tangent to find missing sides.',
    whatYouWillLearn: ['Opposite, adjacent, hypotenuse', 'SOH CAH TOA', 'Finding a missing side'],
    concept: ['In a right triangle, the ratios between sides depend only on the angle.', 'sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent.'],
    conceptVisual: { kind: 'rightTriangle', a: 'opp', b: 'adj', c: 'hyp', angle: 'θ' },
    realWorld: {
      title: 'Wheelchair Ramp',
      emoji: '♿',
      scenes: [{ text: 'A ramp 12 ft long rises at an angle of 5° from the ground.', visual: { kind: 'rightTriangle', a: '?', b: '', c: 12, angle: '5°', highlight: 'a' } }],
      question: 'How high does the ramp rise (ft, 2 decimals)?',
      answer: '1.05',
      explanation: 'height = 12 × sin(5°) ≈ 12 × 0.0872 ≈ 1.05 ft.',
    },
    lessonSummary: ['Label the sides from the angle.', 'Pick SOH, CAH or TOA.', 'Solve for the unknown side.'],
  },
  generate(d, rng) {
    const angle = d === 'easy' ? pick(rng, [30, 60]) : pick(rng, [20, 25, 35, 40, 50, 55, 70]);
    const hyp = randInt(rng, 5, 20);
    return buildTrig(angle, hyp, rng() < 0.5 ? 'opposite' : 'adjacent', d);
  },
};

/* ------------------------------------------------------------------ */
/* Derivatives: power rule                                              */
/* ------------------------------------------------------------------ */

type Term = { c: number; p: number };

export function parsePolynomial(src: string): Term[] | null {
  const s = src.replace(/\s+/g, '').replace(/x²/g, 'x^2').replace(/x³/g, 'x^3').replace(/[−–]/g, '-').replace(/\*/g, '');
  const parts = s.match(/[+-]?[^+-]+/g);
  if (!parts) return null;
  const terms: Term[] = [];
  for (const t of parts) {
    const m = t.match(/^([+-]?)(\d*\.?\d*)(x(?:\^(\d+))?)?$/);
    if (!m || (!m[2] && !m[3])) return null;
    const sign = m[1] === '-' ? -1 : 1;
    const c = sign * (m[2] ? Number(m[2]) : 1);
    const p = m[3] ? (m[4] ? Number(m[4]) : 1) : 0;
    terms.push({ c, p });
  }
  return terms;
}

export function showPoly(terms: Term[]): string {
  const t = terms.filter((x) => x.c !== 0).sort((a, b) => b.p - a.p);
  if (!t.length) return '0';
  return t
    .map(({ c, p }, i) => {
      const abs = Math.abs(c);
      const coef = abs === 1 && p !== 0 ? '' : fmt(abs);
      const v = p === 0 ? '' : p === 1 ? 'x' : `x^${p}`;
      const sign = c < 0 ? (i === 0 ? '−' : ' − ') : i === 0 ? '' : ' + ';
      return `${sign}${coef}${v}`;
    })
    .join('');
}

export function buildDerivative(terms: Term[], d: Difficulty): Problem {
  const deriv = terms.filter((t) => t.p > 0).map((t) => ({ c: t.c * t.p, p: t.p - 1 }));
  const f = showPoly(terms);
  const fp = showPoly(deriv);
  const steps: Step[] = [
    {
      title: 'Recall the power rule',
      what: 'Differentiate one term at a time.',
      why: 'The derivative of a sum is the sum of the derivatives, and each power of x follows one simple rule.',
      rule: 'Power rule: d/dx (c·xⁿ) = c·n·xⁿ⁻¹.  The derivative of a constant is 0.',
      math: `f(x) = ${f}`,
    },
    ...terms.map((t, i): Step => ({
      title: `Term ${i + 1}: ${showPoly([t])}`,
      what: t.p === 0 ? `${fmt(t.c)} is a constant, so its derivative is 0.` : `Bring down the exponent ${t.p} and multiply: ${fmt(t.c)} × ${t.p} = ${fmt(t.c * t.p)}. Lower the exponent by 1 to ${t.p - 1}.`,
      why: t.p === 0 ? 'A constant never changes, so its rate of change is zero.' : 'This is the slope contribution of this term.',
      math: t.p === 0 ? `d/dx (${fmt(t.c)}) = 0` : `d/dx (${showPoly([t])}) = ${paren(t.c)}·${t.p}·x^${t.p - 1} = ${showPoly([{ c: t.c * t.p, p: t.p - 1 }])}`,
      mistakes: t.p > 1 ? ['Forgetting to lower the exponent.', 'Multiplying the exponent into the power instead of the coefficient.'] : undefined,
      checkpoint: t.p > 0 ? { question: `Derivative of ${showPoly([t])}?`, answer: showPoly([{ c: t.c * t.p, p: t.p - 1 }]) } : undefined,
    })),
    {
      title: 'Combine',
      what: 'Add the derivatives of all the terms.',
      why: 'Sum rule of differentiation.',
      math: `f′(x) = ${fp}`,
      visual: terms.every((t) => t.p <= 3) ? { kind: 'coordinatePlane', range: 6, curve: { fn: 'poly', coeffs: toCoeffs(terms), label: 'f(x)' } } : undefined,
    },
  ];
  return problem({
    skillId: 'derivatives',
    difficulty: d,
    prompt: `Find the derivative of f(x) = ${f}`,
    answer: fp,
    accept: [fp.replace(/\s/g, ''), fp.replace(/\^1(?!\d)/g, '')],
    answerKind: 'expression',
    answerHint: 'e.g. 6x^2 + 2',
    steps,
    hints: ['Use the power rule on each term.', 'Multiply by the exponent, then subtract 1 from it.', 'Constants disappear.'],
  });
}

function toCoeffs(terms: Term[]): number[] {
  const c = [0, 0, 0, 0];
  for (const t of terms) c[t.p] += t.c;
  return c;
}

export const derivatives: Skill = {
  id: 'derivatives',
  name: 'Derivatives (Power Rule)',
  grades: [12],
  prerequisites: ['slope', 'exponentials'],
  keywords: ['derivative', 'differentiate', 'calculus', 'power rule', 'rate of change', 'd/dx', 'slope of tangent'],
  teaching: {
    summary: 'Find instantaneous rates of change with the power rule.',
    whatYouWillLearn: ['What a derivative measures', 'The power rule', 'Differentiating polynomials'],
    concept: ['A derivative measures how fast a function is changing at each point — the slope of the tangent line.', 'For powers of x, the power rule makes this quick: bring the exponent down and subtract one.'],
    conceptVisual: { kind: 'coordinatePlane', range: 5, curve: { fn: 'poly', coeffs: [0, 0, 1, 0], label: 'y = x²' }, lines: [{ m: 2, b: -1, label: 'tangent at x=1' }] },
    realWorld: {
      title: 'Speed of a Falling Ball',
      emoji: '⚽',
      scenes: [{ text: 'A ball falls so that its distance after t seconds is d(t) = 5t² meters.' }, { text: 'Its speed is the derivative: how fast the distance is changing.' }],
      question: 'What is the speed d′(t) at t = 3 seconds (m/s)?',
      answer: '30',
      explanation: 'd′(t) = 10t, so d′(3) = 30 m/s.',
    },
    lessonSummary: ['d/dx xⁿ = n·xⁿ⁻¹.', 'Constants → 0.', 'Differentiate term by term.'],
  },
  generate(d, rng) {
    const count = d === 'easy' ? 1 : d === 'medium' ? 2 : 3;
    const powers = [4, 3, 2, 1, 0].filter(() => true);
    const chosen = powers.slice(d === 'challenge' ? 0 : 1).sort(() => rng() - 0.5).slice(0, count);
    const terms = chosen.sort((a, b) => b - a).map((p) => ({ c: nonZero(rng, -6, 9), p }));
    if (terms.every((t) => t.p === 0)) terms[0].p = 2;
    return buildDerivative(terms, d);
  },
  parse(text) {
    const s = clean(text);
    const m = s.match(/^(?:(?:the\s+)?derivative\s+of|d\/dx|differentiate)\s*\(?\s*(?:f\(x\)\s*=|y\s*=)?\s*(.+?)\)?$/);
    if (!m) return null;
    const terms = parsePolynomial(m[1]);
    return terms ? buildDerivative(terms, 'medium') : null;
  },
};
