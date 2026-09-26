import { Fraction } from '../../lib/math/fraction';
import { fmt, money, round } from '../../lib/math/numbers';
import { pick, randInt } from '../../lib/math/rng';
import type { Difficulty, Problem, Skill } from '../types';
import { clean, numericChoices, problem } from './common';

/* ------------------------------------------------------------------ */
/* Percent of a number                                                 */
/* ------------------------------------------------------------------ */

export function buildPercent(pct: number, total: number, d: Difficulty, discount = false): Problem {
  const part = round((pct / 100) * total, 2);
  const dec = pct / 100;
  const frac = new Fraction(pct, 100).simplify();
  const final = round(total - part, 2);
  const niceFrac = frac.d <= 10;
  return problem({
    skillId: 'percent',
    difficulty: d,
    prompt: discount ? `A ${money(total)} item is ${pct}% off. What is the sale price?` : `What is ${pct}% of ${fmt(total)}?`,
    answer: discount ? fmt(final) : fmt(part),
    accept: discount ? [money(final)] : undefined,
    answerKind: 'number',
    steps: [
      {
        title: 'Understand percent',
        what: `${pct}% means ${pct} out of every 100.`,
        why: 'Percent literally means "per hundred", so we can write it as a fraction or a decimal.',
        rule: `p% = p/100`,
        math: `${pct}% = ${pct}/100 = ${fmt(dec)}${niceFrac ? ` = ${frac}` : ''}`,
        visual: { kind: 'percentBar', percent: pct, total, label: `${pct}% of ${fmt(total)}` },
        checkpoint: { question: `Write ${pct}% as a decimal.`, answer: fmt(dec) },
        mistakes: [`Writing ${pct}% as ${pct / 10} or ${pct} instead of ${fmt(dec)}.`],
      },
      {
        title: 'Multiply',
        what: `Multiply the decimal by ${fmt(total)}.`,
        why: '"Of" means multiply: we want that fraction of the whole amount.',
        rule: 'p% of N = (p/100) × N',
        math: niceFrac ? `${fmt(dec)} × ${fmt(total)} = ${fmt(part)}\n(or ${frac} of ${fmt(total)} = ${fmt(total)} ÷ ${frac.d} × ${frac.n} = ${fmt(part)})` : `${fmt(dec)} × ${fmt(total)} = ${fmt(part)}`,
        simpler: niceFrac ? `${frac} of ${fmt(total)}: split ${fmt(total)} into ${frac.d} equal parts and take ${frac.n}.` : undefined,
        checkpoint: { question: `What is ${pct}% of ${fmt(total)}?`, answer: fmt(part) },
      },
      ...(discount
        ? [
            {
              title: 'Subtract the discount',
              what: `The discount is ${money(part)}. Subtract it from the original price.`,
              why: 'A discount is taken away from the price.',
              rule: 'Sale price = original − discount (or original × (1 − p/100))',
              math: `${money(total)} − ${money(part)} = ${money(final)}`,
              mistakes: ['Stopping at the discount amount instead of the sale price.'],
              visual: { kind: 'percentBar' as const, percent: 100 - pct, total, label: `pay ${100 - pct}%` },
            },
          ]
        : []),
    ],
    hints: [`${pct}% = ${pct}/100.`, `Change ${pct}% to the decimal ${fmt(dec)}.`, `Multiply ${fmt(dec)} × ${fmt(total)}.${discount ? ' Then subtract from the price.' : ''}`],
    visual: { kind: 'percentBar', percent: pct, total },
    choices: discount ? undefined : numericChoices(part, Math.random, 5),
  });
}

export const percent: Skill = {
  id: 'percent',
  name: 'Percentages',
  grades: [5, 6, 7],
  prerequisites: ['multiplication-facts'],
  keywords: ['percent', 'percentage', '%', 'discount', 'sale', 'tax', 'tip', 'off', 'of'],
  teaching: {
    summary: 'Find a percent of a number and calculate discounts.',
    whatYouWillLearn: ['What percent means', 'Converting percents to decimals and fractions', 'Finding a percent of a number', 'Calculating sale prices'],
    concept: ['Percent means "out of 100". 25% means 25 out of 100, or 1/4.', 'To find a percent of a number, change the percent to a decimal and multiply.', 'A discount is subtracted from the original price.'],
    conceptVisual: { kind: 'percentBar', percent: 25, total: 100 },
    realWorld: {
      title: 'Shoe Sale',
      emoji: '👟',
      scenes: [
        { text: 'Jordan finds a pair of shoes for $60. A sign says “25% OFF”.', visual: { kind: 'percentBar', percent: 25, total: 60, label: '25% of $60' } },
        { text: '25% is 1/4. One quarter of $60 is $15 — that is the discount.' },
      ],
      question: 'What is the sale price of the shoes (in dollars)?',
      answer: '45',
      accept: ['$45'],
      explanation: '25% of $60 = 0.25 × 60 = $15. Sale price: $60 − $15 = $45.',
    },
    lessonSummary: ['p% = p/100.', '"of" means multiply.', 'Sale price = original − discount.'],
  },
  generate(d, rng) {
    const pct = d === 'easy' ? pick(rng, [10, 50, 25]) : d === 'medium' ? pick(rng, [20, 25, 30, 40, 75]) : pick(rng, [15, 35, 12, 8, 65]);
    const total = d === 'easy' ? pick(rng, [20, 40, 60, 80, 100]) : pick(rng, [40, 60, 80, 120, 150, 200, 240]);
    return buildPercent(pct, total, d, d === 'hard' || d === 'challenge');
  },
  parse(text) {
    const s = clean(text);
    let m = s.match(/(\d+(?:\.\d+)?)\s*%\s*(?:off|discount)\s*(?:of|on)?\s*\$?(\d+(?:\.\d+)?)/);
    if (m) return buildPercent(Number(m[1]), Number(m[2]), 'medium', true);
    m = s.match(/\$?(\d+(?:\.\d+)?)\s*(?:with|at)?\s*(\d+(?:\.\d+)?)\s*%\s*(?:off|discount)/);
    if (m) return buildPercent(Number(m[2]), Number(m[1]), 'medium', true);
    m = s.match(/(\d+(?:\.\d+)?)\s*%\s*of\s*\$?(\d+(?:\.\d+)?)/);
    if (m) return buildPercent(Number(m[1]), Number(m[2]), 'medium');
    return null;
  },
};

/* ------------------------------------------------------------------ */
/* Ratios & proportions                                                 */
/* ------------------------------------------------------------------ */

export function buildProportion(a: number, b: number, c: number, d: Difficulty, story?: string): Problem {
  const x = round((b * c) / a, 3);
  const k = c / a;
  const intScale = Number.isInteger(k);
  return problem({
    skillId: 'ratios',
    difficulty: d,
    prompt: `Solve the proportion: ${a}/${b} = ${c}/x`,
    story,
    answer: fmt(x),
    answerKind: 'number',
    steps: [
      {
        title: 'Understand the proportion',
        what: `${a}/${b} = ${c}/x says the two ratios are equivalent.`,
        why: 'Equivalent ratios scale both parts by the same factor.',
        rule: 'In a proportion, the cross products are equal: a/b = c/d ⇔ a·d = b·c.',
        math: `${a} : ${b} = ${c} : x`,
        visual: { kind: 'ratioTable', headers: ['first', 'second'], rows: [[a, b], [c, 'x']] },
      },
      intScale
        ? {
            title: 'Find the scale factor',
            what: `${a} became ${c}. That is × ${fmt(k)}.`,
            why: 'Whatever we multiply one part by, we multiply the other part by.',
            rule: 'Equivalent ratios: multiply both terms by the same number.',
            math: `${c} ÷ ${a} = ${fmt(k)}`,
            checkpoint: { question: `${a} × ? = ${c}`, answer: fmt(k) },
          }
        : {
            title: 'Cross-multiply',
            what: `Multiply across: ${a} · x = ${b} · ${c}.`,
            why: 'Cross products of equal ratios are equal.',
            rule: 'a/b = c/x → a·x = b·c',
            math: `${a}x = ${b * c}`,
            checkpoint: { question: `What is ${b} × ${c}?`, answer: String(b * c) },
          },
      intScale
        ? {
            title: 'Scale the other part',
            what: `${b} × ${fmt(k)} = ${fmt(x)}.`,
            why: 'Keep the ratio the same.',
            math: `x = ${b} × ${fmt(k)} = ${fmt(x)}`,
            visual: { kind: 'ratioTable', headers: ['first', 'second'], rows: [[a, b], [c, fmt(x)]], highlightRow: 1 },
            mistakes: [`Adding ${c - a} instead of multiplying by ${fmt(k)}.`],
          }
        : {
            title: 'Divide',
            what: `Divide both sides by ${a}.`,
            why: 'Undo the multiplication to get x alone.',
            math: `x = ${b * c} ÷ ${a} = ${fmt(x)}`,
            mistakes: ['Dividing by the wrong number.'],
          },
    ],
    hints: [`How did ${a} change into ${c}?`, intScale ? `Multiply by ${fmt(k)}.` : 'Cross-multiply.', intScale ? `Do the same to ${b}.` : `Divide ${b * c} by ${a}.`],
    choices: numericChoices(x, Math.random, Math.max(2, b)),
  });
}

export const ratios: Skill = {
  id: 'ratios',
  name: 'Ratios & Proportions',
  grades: [6, 7],
  prerequisites: ['multiplication-facts', 'equivalent-fractions'],
  keywords: ['ratio', 'ratios', 'proportion', 'proportional', 'scale', 'recipe', 'rate', 'unit rate', 'cross multiply'],
  teaching: {
    summary: 'Compare quantities and scale them up or down.',
    whatYouWillLearn: ['What a ratio is', 'Equivalent ratios and ratio tables', 'Solving proportions'],
    concept: ['A ratio compares two quantities, like 2 cups of flour to 3 eggs (2 : 3).', 'Equivalent ratios multiply both parts by the same number.', 'A proportion says two ratios are equal. Solve with a scale factor or cross-multiplication.'],
    conceptVisual: { kind: 'ratioTable', headers: ['cups flour', 'eggs'], rows: [[2, 3], [4, 6], [6, 9]] },
    realWorld: {
      title: 'Scaling a Pancake Recipe',
      emoji: '🥞',
      scenes: [
        { text: 'A pancake recipe uses 2 cups of flour for every 3 eggs.', visual: { kind: 'ratioTable', headers: ['cups flour', 'eggs'], rows: [[2, 3]] } },
        { text: 'Grandma wants to make a big batch using 8 cups of flour.', visual: { kind: 'ratioTable', headers: ['cups flour', 'eggs'], rows: [[2, 3], [8, '?']], highlightRow: 1 } },
      ],
      question: 'How many eggs does she need?',
      answer: '12',
      explanation: '2 × 4 = 8, so multiply the eggs by 4 too: 3 × 4 = 12 eggs.',
    },
    lessonSummary: ['A ratio compares two amounts.', 'Scale both parts by the same factor.', 'Cross-multiply to solve any proportion.'],
  },
  generate(d, rng) {
    const a = randInt(rng, 2, 6);
    const b = randInt(rng, 2, 9);
    const k = d === 'easy' ? randInt(rng, 2, 4) : d === 'medium' ? randInt(rng, 3, 8) : 0;
    const c = k ? a * k : a * randInt(rng, 2, 5) + randInt(rng, 1, a - 1);
    return buildProportion(a, b, c, d);
  },
  parse(text) {
    const s = clean(text).replace(/\s/g, '');
    let m = s.match(/^(\d+)\/(\d+)=(\d+)\/x$/) || s.match(/^(\d+):(\d+)=(\d+):x$/);
    if (m) return buildProportion(Number(m[1]), Number(m[2]), Number(m[3]), 'medium');
    m = s.match(/^x\/(\d+)=(\d+)\/(\d+)$/);
    if (m) return buildProportion(Number(m[3]), Number(m[2]), Number(m[1]), 'medium');
    return null;
  },
};

/* ------------------------------------------------------------------ */
/* Area                                                                 */
/* ------------------------------------------------------------------ */

export function buildArea(w: number, l: number, d: Difficulty, unit = 'ft'): Problem {
  const area = w * l;
  return problem({
    skillId: 'area',
    difficulty: d,
    prompt: `Find the area of a rectangle ${fmt(l)} ${unit} long and ${fmt(w)} ${unit} wide.`,
    answer: fmt(area),
    accept: [`${fmt(area)} sq ${unit}`, `${fmt(area)} ${unit}^2`],
    answerKind: 'number',
    answerHint: `square ${unit}`,
    steps: [
      {
        title: 'Understand area',
        what: 'Area is the number of unit squares that cover a flat shape.',
        why: 'Flooring, paint and carpet are sold by area, so we need to know how many squares fit inside.',
        rule: 'Area of a rectangle = length × width',
        math: `A = l × w`,
        visual: { kind: 'rectangleArea', width: w, length: l, unit, showGrid: w * l <= 200 },
      },
      {
        title: 'Multiply',
        what: `Multiply ${fmt(l)} × ${fmt(w)}.`,
        why: `There are ${fmt(w)} rows with ${fmt(l)} squares in each row.`,
        rule: 'Rows × squares per row = total squares',
        math: `A = ${fmt(l)} × ${fmt(w)} = ${fmt(area)} ${unit}²`,
        mistakes: [`Adding the sides (that gives part of the perimeter, ${fmt(2 * (l + w))} ${unit} around).`, 'Forgetting square units.'],
        checkpoint: { question: `${fmt(l)} × ${fmt(w)} = ?`, answer: fmt(area) },
      },
    ],
    hints: ['Area = length × width.', `How many rows of ${fmt(l)} squares are there?`, `Multiply ${fmt(l)} × ${fmt(w)}.`],
    visual: { kind: 'rectangleArea', width: w, length: l, unit, showGrid: w * l <= 200 },
    choices: numericChoices(area, Math.random, 6),
  });
}

export const area: Skill = {
  id: 'area',
  name: 'Area of Rectangles',
  grades: [3, 4, 5, 6],
  prerequisites: ['multiplication-facts'],
  keywords: ['area', 'rectangle', 'square units', 'flooring', 'carpet', 'length', 'width', 'geometry'],
  teaching: {
    summary: 'Find how many square units cover a rectangle.',
    whatYouWillLearn: ['What area measures', 'Area = length × width', 'Square units'],
    concept: ['Area measures the space inside a flat shape, counted in square units.', 'A rectangle is rows of equal squares, so area = length × width.'],
    conceptVisual: { kind: 'rectangleArea', width: 3, length: 5, unit: 'units', showGrid: true },
    realWorld: {
      title: 'New Bedroom Floor',
      emoji: '🛏️',
      scenes: [
        { text: 'Sofia’s bedroom is 12 feet long and 10 feet wide. She wants new wooden flooring.', visual: { kind: 'rectangleArea', width: 10, length: 12, unit: 'ft', showGrid: true } },
        { text: 'Flooring is sold by the square foot.' },
      ],
      question: 'How many square feet of flooring does she need?',
      answer: '120',
      accept: ['120 sq ft', '120 ft^2'],
      explanation: '12 × 10 = 120 square feet.',
    },
    lessonSummary: ['Area counts square units.', 'Rectangle: A = l × w.', 'Label answers in square units.'],
  },
  generate(d, rng) {
    const [w, l] = d === 'easy' ? [randInt(rng, 2, 5), randInt(rng, 3, 8)] : d === 'medium' ? [randInt(rng, 4, 10), randInt(rng, 6, 12)] : [randInt(rng, 8, 15), randInt(rng, 11, 25)];
    return buildArea(w, l, d, pick(rng, ['ft', 'm', 'cm']));
  },
  parse(text) {
    const m = clean(text).match(/area.*?(\d+(?:\.\d+)?)\s*(?:by|x|\*|and)\s*(\d+(?:\.\d+)?)/);
    if (!m) return null;
    return buildArea(Number(m[2]), Number(m[1]), 'medium', 'units');
  },
};

/* ------------------------------------------------------------------ */
/* Pythagorean theorem                                                 */
/* ------------------------------------------------------------------ */

export function buildPythagoras(a: number, b: number, d: Difficulty): Problem {
  const c2 = a * a + b * b;
  const c = Math.sqrt(c2);
  const exact = Number.isInteger(c);
  return problem({
    skillId: 'pythagorean',
    difficulty: d,
    prompt: `A right triangle has legs ${fmt(a)} and ${fmt(b)}. Find the hypotenuse${exact ? '' : ' (to 2 decimal places)'}.`,
    answer: fmt(c, 2),
    accept: exact ? undefined : [`√${c2}`, `sqrt(${c2})`],
    answerKind: 'number',
    steps: [
      {
        title: 'Label the triangle',
        what: `The legs are a = ${fmt(a)} and b = ${fmt(b)}. The hypotenuse c is the longest side, across from the right angle.`,
        why: 'The theorem only works when we know which side is the hypotenuse.',
        rule: 'Pythagorean theorem: a² + b² = c²',
        math: `a = ${fmt(a)}, b = ${fmt(b)}, c = ?`,
        visual: { kind: 'rightTriangle', a, b, c: 'c', highlight: 'c' },
      },
      {
        title: 'Square the legs',
        what: `${fmt(a)}² = ${a * a} and ${fmt(b)}² = ${b * b}.`,
        why: 'The theorem compares the areas of squares built on each side.',
        math: `${fmt(a)}² + ${fmt(b)}² = ${a * a} + ${b * b} = ${c2}`,
        checkpoint: { question: `${fmt(a)}² + ${fmt(b)}² = ?`, answer: String(c2) },
        mistakes: [`Doubling instead of squaring (${fmt(a)} × 2).`],
      },
      {
        title: 'Take the square root',
        what: `c² = ${c2}, so c = √${c2}${exact ? ` = ${fmt(c)}` : ` ≈ ${fmt(c, 2)}`}.`,
        why: 'Square root undoes squaring.',
        rule: 'If c² = k and c > 0, then c = √k.',
        math: `c = √${c2} ${exact ? '=' : '≈'} ${fmt(c, 2)}`,
        mistakes: [`Forgetting the square root and answering ${c2}.`, `Adding the legs: ${a + b}.`],
        visual: { kind: 'rightTriangle', a, b, c: fmt(c, 2), highlight: 'c' },
      },
    ],
    hints: ['Use a² + b² = c².', `Square both legs and add: ${fmt(a)}² + ${fmt(b)}².`, `Take the square root of ${c2}.`],
    visual: { kind: 'rightTriangle', a, b, c: '?' },
  });
}

const TRIPLES: [number, number][] = [[3, 4], [6, 8], [5, 12], [8, 15], [9, 12], [7, 24], [12, 16]];

export const pythagorean: Skill = {
  id: 'pythagorean',
  name: 'Pythagorean Theorem',
  grades: [8, 9],
  prerequisites: ['multiplication-facts'],
  keywords: ['pythagorean', 'pythagoras', 'hypotenuse', 'right triangle', 'legs', 'a^2 + b^2', 'distance'],
  teaching: {
    summary: 'Find a missing side of a right triangle.',
    whatYouWillLearn: ['Parts of a right triangle', 'a² + b² = c²', 'Using square roots'],
    concept: ['In a right triangle, the side across from the right angle is the hypotenuse — the longest side.', 'The squares of the two legs add up to the square of the hypotenuse: a² + b² = c².'],
    conceptVisual: { kind: 'rightTriangle', a: 3, b: 4, c: 5 },
    realWorld: {
      title: 'The Ladder',
      emoji: '🪜',
      scenes: [{ text: 'A ladder leans against a wall. Its foot is 6 ft from the wall and it reaches 8 ft up.', visual: { kind: 'rightTriangle', a: 8, b: 6, c: '?' } }],
      question: 'How long is the ladder (ft)?',
      answer: '10',
      explanation: '6² + 8² = 36 + 64 = 100, and √100 = 10 ft.',
    },
    lessonSummary: ['Identify the hypotenuse.', 'a² + b² = c².', 'Take the square root at the end.'],
  },
  generate(d, rng) {
    if (d === 'challenge' || d === 'hard') return buildPythagoras(randInt(rng, 2, 9), randInt(rng, 2, 9), d);
    const [a, b] = pick(rng, d === 'easy' ? TRIPLES.slice(0, 3) : TRIPLES);
    return buildPythagoras(a, b, d);
  },
  parse(text) {
    const s = clean(text);
    if (!/(pythag|hypotenuse|right triangle|legs)/.test(s)) return null;
    const nums = s.match(/\d+(\.\d+)?/g);
    if (!nums || nums.length < 2) return null;
    return buildPythagoras(Number(nums[0]), Number(nums[1]), 'medium');
  },
};

/* ------------------------------------------------------------------ */
/* Mean                                                                 */
/* ------------------------------------------------------------------ */

export function buildMean(values: number[], d: Difficulty, names?: string[]): Problem {
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = round(sum / values.length, 2);
  return problem({
    skillId: 'mean',
    difficulty: d,
    prompt: `Find the mean of: ${values.join(', ')}`,
    answer: fmt(mean),
    answerKind: 'number',
    steps: [
      {
        title: 'Understand the mean',
        what: 'The mean (average) is the value each item would have if the total were shared equally.',
        why: 'It gives one number that represents the whole data set.',
        rule: 'Mean = sum of values ÷ number of values',
        math: `values: ${values.join(', ')}`,
        visual: { kind: 'barChart', bars: values.map((v, i) => ({ label: names?.[i] ?? `#${i + 1}`, value: v })) },
      },
      {
        title: 'Add the values',
        what: `Add all ${values.length} values.`,
        why: 'The total is what we will share out equally.',
        math: `${values.join(' + ')} = ${sum}`,
        checkpoint: { question: 'What is the total?', answer: String(sum) },
      },
      {
        title: 'Divide by how many',
        what: `Divide ${sum} by ${values.length}.`,
        why: 'Sharing the total equally among all the items.',
        math: `${sum} ÷ ${values.length} = ${fmt(mean)}`,
        mistakes: ['Dividing by the wrong count.', 'Confusing mean with median (the middle value).'],
        visual: { kind: 'barChart', bars: values.map((v, i) => ({ label: names?.[i] ?? `#${i + 1}`, value: v })), meanLine: mean },
        checkpoint: { question: `${sum} ÷ ${values.length} = ?`, answer: fmt(mean) },
      },
    ],
    hints: ['Mean = total ÷ count.', `Add them: the total is ${sum}.`, `Divide by ${values.length}.`],
    visual: { kind: 'barChart', bars: values.map((v, i) => ({ label: names?.[i] ?? `#${i + 1}`, value: v })) },
    choices: numericChoices(mean, Math.random, 4),
  });
}

export const mean: Skill = {
  id: 'mean',
  name: 'Mean (Average)',
  grades: [6, 7],
  prerequisites: ['division-facts'],
  keywords: ['mean', 'average', 'statistics', 'data', 'scores'],
  teaching: {
    summary: 'Find the average of a data set.',
    whatYouWillLearn: ['What the mean represents', 'Sum ÷ count', 'Reading a bar chart'],
    concept: ['The mean is the "fair share" value: add everything up and split it equally.', 'Mean = (sum of all values) ÷ (number of values).'],
    conceptVisual: { kind: 'barChart', bars: [{ label: 'A', value: 4 }, { label: 'B', value: 6 }, { label: 'C', value: 8 }], meanLine: 6 },
    realWorld: {
      title: 'Basketball Scores',
      emoji: '🏀',
      scenes: [{ text: 'The Hawks scored 12, 18, 15 and 19 points in four quarters.', visual: { kind: 'barChart', bars: [{ label: 'Q1', value: 12 }, { label: 'Q2', value: 18 }, { label: 'Q3', value: 15 }, { label: 'Q4', value: 19 }] } }],
      question: 'What was their mean score per quarter?',
      answer: '16',
      explanation: '12 + 18 + 15 + 19 = 64, and 64 ÷ 4 = 16 points per quarter.',
    },
    lessonSummary: ['Add all values.', 'Divide by how many values.'],
  },
  generate(d, rng) {
    const n = d === 'easy' ? 3 : d === 'medium' ? 4 : 5;
    const target = randInt(rng, 5, 20);
    const values = Array.from({ length: n - 1 }, () => target + randInt(rng, -4, 4));
    const last = d === 'challenge' ? target + randInt(rng, -3, 3) : target * n - values.reduce((a, b) => a + b, 0);
    values.push(Math.max(0, last));
    return buildMean(values, d);
  },
  parse(text) {
    const s = clean(text);
    if (!/(mean|average)/.test(s)) return null;
    const nums = s.match(/-?\d+(\.\d+)?/g);
    if (!nums || nums.length < 2) return null;
    return buildMean(nums.map(Number), 'medium');
  },
};

/* ------------------------------------------------------------------ */
/* Probability                                                          */
/* ------------------------------------------------------------------ */

const MARBLES = [
  { name: 'red', color: '#ef4444' },
  { name: 'blue', color: '#3b82f6' },
  { name: 'green', color: '#10b981' },
  { name: 'yellow', color: '#eab308' },
];

export function buildProbability(counts: number[], targetIdx: number, d: Difficulty): Problem {
  const items = counts.map((c, i) => ({ ...MARBLES[i], count: c }));
  const total = counts.reduce((a, b) => a + b, 0);
  const fav = counts[targetIdx];
  const p = new Fraction(fav, total).simplify();
  const target = MARBLES[targetIdx].name;
  return problem({
    skillId: 'probability',
    difficulty: d,
    prompt: `A bag has ${items.map((i) => `${i.count} ${i.name}`).join(', ')} marbles. You pick one without looking. What is P(${target})?`,
    answer: p.toString(),
    accept: [`${fav}/${total}`, fmt(p.value(), 3)],
    answerKind: 'fraction',
    steps: [
      {
        title: 'Count all outcomes',
        what: `There are ${counts.join(' + ')} = ${total} marbles in total.`,
        why: 'Each marble is equally likely to be picked, so every marble is one possible outcome.',
        rule: 'Total outcomes = everything that could happen.',
        math: `total = ${total}`,
        visual: { kind: 'bag', items },
        checkpoint: { question: 'How many marbles are in the bag?', answer: String(total) },
      },
      {
        title: 'Count favorable outcomes',
        what: `${fav} marbles are ${target}.`,
        why: 'Favorable outcomes are the ones we are asking about.',
        math: `favorable = ${fav}`,
        visual: { kind: 'bag', items, highlight: target },
      },
      {
        title: 'Write the probability',
        what: `P(${target}) = favorable ÷ total = ${fav}/${total}${p.d !== total ? ` = ${p}` : ''}.`,
        why: 'Probability is the fraction of outcomes that are favorable.',
        rule: 'P(event) = favorable outcomes / total outcomes',
        math: `P(${target}) = ${fav}/${total}${p.d !== total ? ` = ${p}` : ''} ≈ ${fmt(p.value() * 100, 1)}%`,
        mistakes: [`Comparing ${target} to the other colors only (${fav}/${total - fav}) instead of to the total.`],
      },
    ],
    hints: ['How many marbles are there altogether?', `How many are ${target}?`, 'Probability = favorable / total.'],
    visual: { kind: 'bag', items },
  });
}

export const probability: Skill = {
  id: 'probability',
  name: 'Simple Probability',
  grades: [7, 8],
  prerequisites: ['equivalent-fractions'],
  keywords: ['probability', 'chance', 'likely', 'odds', 'marbles', 'random', 'outcome', 'bag'],
  teaching: {
    summary: 'Measure how likely an event is, from 0 to 1.',
    whatYouWillLearn: ['Outcomes and events', 'P = favorable / total', 'Probability as fraction, decimal and percent'],
    concept: ['Probability measures how likely something is, from 0 (impossible) to 1 (certain).', 'When all outcomes are equally likely: P(event) = favorable outcomes ÷ total outcomes.'],
    conceptVisual: { kind: 'bag', items: [{ name: 'red', color: '#ef4444', count: 3 }, { name: 'blue', color: '#3b82f6', count: 1 }], highlight: 'red' },
    realWorld: {
      title: 'The Mystery Bag',
      emoji: '🎒',
      scenes: [{ text: 'A bag holds 3 red, 5 blue and 2 green marbles. Sam reaches in without looking.', visual: { kind: 'bag', items: [{ name: 'red', color: '#ef4444', count: 3 }, { name: 'blue', color: '#3b82f6', count: 5 }, { name: 'green', color: '#10b981', count: 2 }] } }],
      question: 'What is the probability Sam picks a blue marble?',
      answer: '1/2',
      accept: ['5/10', '0.5', '50%'],
      explanation: '5 blue out of 10 total: 5/10 = 1/2.',
    },
    lessonSummary: ['Count total outcomes.', 'Count favorable outcomes.', 'Divide: favorable / total.'],
  },
  generate(d, rng) {
    const kinds = d === 'easy' ? 2 : d === 'medium' ? 3 : 4;
    const counts = Array.from({ length: kinds }, () => randInt(rng, 1, d === 'easy' ? 5 : 8));
    return buildProbability(counts, randInt(rng, 0, kinds - 1), d);
  },
};

/* ------------------------------------------------------------------ */
/* Decimals                                                             */
/* ------------------------------------------------------------------ */

export function buildDecimalAdd(a: number, b: number, d: Difficulty): Problem {
  const places = Math.max(...[a, b].map((n) => (String(n).split('.')[1] ?? '').length));
  const s = round(a + b, places);
  const pad = (n: number) => n.toFixed(places);
  return problem({
    skillId: 'decimals',
    difficulty: d,
    prompt: `${fmt(a)} + ${fmt(b)} = ?`,
    answer: fmt(s),
    answerKind: 'number',
    steps: [
      {
        title: 'Line up the decimal points',
        what: 'Write the numbers in a column with the decimal points lined up.',
        why: 'Lining up the points makes sure tenths are added to tenths and hundredths to hundredths.',
        rule: 'Only add digits with the same place value.',
        math: `  ${pad(a).padStart(8)}\n+ ${pad(b).padStart(8)}`,
        simpler: 'Add zeros to the end so both numbers have the same number of decimal places — it does not change their value.',
        mistakes: ['Lining up the last digits instead of the decimal points.'],
      },
      {
        title: 'Add like whole numbers',
        what: 'Add each column from right to left, regrouping as usual.',
        why: 'Decimal addition works exactly like whole-number addition.',
        math: `  ${pad(a).padStart(8)}\n+ ${pad(b).padStart(8)}\n  ${'-'.repeat(8)}\n  ${pad(s).padStart(8)}`,
        checkpoint: { question: `${fmt(a)} + ${fmt(b)} = ?`, answer: fmt(s) },
      },
      {
        title: 'Place the decimal point',
        what: 'Bring the decimal point straight down.',
        why: 'The answer has the same place values as the numbers we added.',
        math: `${fmt(a)} + ${fmt(b)} = ${fmt(s)}`,
      },
    ],
    hints: ['Line up the decimal points.', 'Fill empty places with zeros.', 'Add like whole numbers and bring the point down.'],
    choices: [fmt(s), fmt(round(s + 0.1, 2)), fmt(round(s - 1, 2)), fmt(round(a * 10 + b, 2))],
  });
}

export const decimals: Skill = {
  id: 'decimals',
  name: 'Adding Decimals',
  grades: [4, 5],
  prerequisites: ['add-within-100', 'place-value'],
  keywords: ['decimal', 'decimals', 'tenths', 'hundredths', 'point', 'money'],
  teaching: {
    summary: 'Add decimals by lining up place values.',
    whatYouWillLearn: ['Tenths and hundredths', 'Lining up decimal points', 'Adding decimals'],
    concept: ['Decimals are another way to write fractions with denominators of 10, 100, 1000…', 'To add decimals, line up the decimal points so each place value lines up, then add as usual.'],
    conceptVisual: { kind: 'percentBar', percent: 35, total: 1, label: '0.35 of a whole' },
    realWorld: {
      title: 'Snack Shopping',
      emoji: '🧃',
      scenes: [{ text: 'Juice costs $1.25 and a muffin costs $2.50.', visual: { kind: 'coins', coins: [{ name: 'dollar', count: 3 }, { name: 'quarter', count: 3 }] } }],
      question: 'How much do they cost together (in dollars)?',
      answer: '3.75',
      accept: ['$3.75'],
      explanation: '1.25 + 2.50 = 3.75, so $3.75.',
    },
    lessonSummary: ['Line up the decimal points.', 'Add like whole numbers.', 'Bring the decimal point down.'],
  },
  generate(d, rng) {
    const places = d === 'easy' ? 1 : 2;
    const f = 10 ** places;
    const a = randInt(rng, 1, d === 'easy' ? 50 : 900) / f;
    const b = randInt(rng, 1, d === 'easy' ? 50 : 900) / (d === 'challenge' ? 10 : f);
    return buildDecimalAdd(a, b, d);
  },
  parse(text) {
    const m = clean(text).match(/^(\d*\.\d+|\d+)\s*\+\s*(\d*\.\d+|\d+)$/);
    if (!m || (!m[1].includes('.') && !m[2].includes('.'))) return null;
    return buildDecimalAdd(Number(m[1]), Number(m[2]), 'medium');
  },
};
