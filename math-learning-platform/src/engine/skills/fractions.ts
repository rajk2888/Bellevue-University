import { Fraction } from '../../lib/math/fraction';
import { lcm, multiplesOf } from '../../lib/math/numbers';
import { pick, randInt, type Rng } from '../../lib/math/rng';
import { normalize, praise } from '../answer';
import type { CheckResult, Difficulty, Problem, Skill, Step } from '../types';
import { clean, COLORS, problem, shuffle } from './common';

type Op = '+' | '−';

function pickFractions(d: Difficulty, rng: Rng, op: Op): [Fraction, Fraction] {
  for (let tries = 0; tries < 200; tries++) {
    let b: number;
    let dd: number;
    switch (d) {
      case 'easy':
        b = dd = pick(rng, [3, 4, 5, 6, 8, 10]);
        break;
      case 'medium': {
        b = pick(rng, [2, 3, 4, 5]);
        dd = b * pick(rng, [2, 3]);
        if (rng() < 0.5) [b, dd] = [dd, b];
        break;
      }
      case 'hard':
        b = pick(rng, [2, 3, 4, 5]);
        dd = pick(rng, [3, 4, 5, 7]);
        break;
      default:
        b = pick(rng, [4, 6, 8, 9, 10]);
        dd = pick(rng, [6, 9, 12, 15]);
    }
    if (d !== 'easy' && b === dd) continue;
    const a = randInt(rng, 1, b - 1);
    const c = randInt(rng, 1, dd - 1);
    const x = new Fraction(a, b);
    const y = new Fraction(c, dd);
    if (!x.isSimplified() || !y.isSimplified()) continue;
    if (op === '−' && x.value() <= y.value()) continue;
    if (d === 'easy' && op === '+' && a + c > b) continue;
    if (d === 'hard' && lcm(b, dd) !== b * dd) continue;
    if (d === 'challenge' && lcm(b, dd) === b * dd) continue;
    return [x, y];
  }
  return op === '+' ? [new Fraction(3, 4), new Fraction(1, 2)] : [new Fraction(3, 4), new Fraction(1, 2)];
}

const circleColor = [COLORS.a, COLORS.b];

/** Build a full step-by-step explanation for a/b ± c/d. */
export function buildFractionProblem(x: Fraction, y: Fraction, op: Op, difficulty: Difficulty, story?: string): Problem {
  const skillId = op === '+' ? 'add-fractions' : 'subtract-fractions';
  const verb = op === '+' ? 'add' : 'subtract';
  const L = lcm(x.d, y.d);
  const X = x.withDenominator(L);
  const Y = y.withDenominator(L);
  const rawN = op === '+' ? X.n + Y.n : X.n - Y.n;
  const raw = new Fraction(rawN, L);
  const simple = raw.simplify();
  const finalText = simple.toMixedString();
  const same = x.d === y.d;
  const prompt = `${x} ${op} ${y} = ?`;

  const steps: Step[] = [];

  steps.push({
    title: 'Understand the denominators',
    what: `Look at the bottom numbers (denominators). They are ${x.d} and ${y.d}.`,
    why: 'The denominator tells us how many equal pieces the whole is cut into — so it tells us the SIZE of each piece. We can only ' + verb + ' pieces that are the same size.',
    rule: 'Fractions can be added or subtracted directly only when their denominators are equal.',
    math: `${x} ${op} ${y}   →   denominators: ${x.d} and ${y.d}`,
    simpler: same
      ? `Both fractions are cut into ${x.d} pieces, so the pieces are already the same size. Easy!`
      : `One fraction is cut into ${x.d} pieces and the other into ${y.d} pieces. Those pieces are different sizes, like big and small pizza slices.`,
    mistakes: [`${op === '+' ? 'Adding' : 'Subtracting'} the denominators together (the size of a piece does not change when you ${verb} pieces).`],
    visual: {
      kind: 'fractionBars',
      fractions: [
        { n: x.n, d: x.d, label: x.toString(), color: COLORS.a },
        { n: y.n, d: y.d, label: y.toString(), color: COLORS.b },
      ],
    },
    checkpoint: {
      question: 'Are the denominators the same? (yes or no)',
      answer: same ? 'yes' : 'no',
      accept: same ? ['y', 'same'] : ['n', 'different'],
      nudge: `Compare the bottom numbers: ${x.d} and ${y.d}.`,
    },
  });

  if (!same) {
    const mx = multiplesOf(x.d, Math.max(4, L / x.d + 1));
    const my = multiplesOf(y.d, Math.max(4, L / y.d + 1));
    steps.push({
      title: 'Find a common denominator',
      what: `Find the smallest number that both ${x.d} and ${y.d} divide into evenly. That is the least common denominator (LCD): ${L}.`,
      why: `We need both fractions cut into pieces of the same size. Cutting both wholes into ${L} pieces works for both fractions.`,
      rule: 'Least Common Denominator = the Least Common Multiple (LCM) of the denominators.',
      math: `Multiples of ${x.d}: ${mx.join(', ')}…\nMultiples of ${y.d}: ${my.join(', ')}…\nLCD = ${L}`,
      simpler: `Count by ${x.d}s and by ${y.d}s. The first number you say in BOTH lists is ${L}.`,
      mistakes: [
        'Using any common multiple is fine, but the least one keeps numbers small.',
        'Picking a number that only one of the denominators divides into.',
      ],
      visual: {
        kind: 'fractionBars',
        fractions: [
          { n: 0, d: x.d, label: `${x.d} pieces` },
          { n: 0, d: y.d, label: `${y.d} pieces` },
          { n: 0, d: L, label: `${L} pieces fit both` },
        ],
      },
      checkpoint: {
        question: `What is the least common denominator of ${x.d} and ${y.d}?`,
        answer: String(L),
        nudge: `List multiples of ${Math.max(x.d, y.d)} until you find one that ${Math.min(x.d, y.d)} also divides into.`,
      },
    });

    const kx = L / x.d;
    const ky = L / y.d;
    const convertLines = [
      kx === 1 ? `${x} already has denominator ${L}` : `${x} = (${x.n} × ${kx}) / (${x.d} × ${kx}) = ${X}`,
      ky === 1 ? `${y} already has denominator ${L}` : `${y} = (${y.n} × ${ky}) / (${y.d} × ${ky}) = ${Y}`,
    ];
    const toConvert = kx !== 1 ? { f: x, F: X } : { f: y, F: Y };
    steps.push({
      title: 'Convert to equivalent fractions',
      what: `Rewrite each fraction with denominator ${L}. Multiply the top and bottom by the same number.`,
      why: 'Multiplying the top and bottom by the same number is like multiplying by 1 — the amount stays the same, only the number of pieces changes.',
      rule: 'Equivalent fractions: a/b = (a × k)/(b × k) for any k ≠ 0.',
      math: convertLines.join('\n'),
      simpler: `Cut every piece into smaller equal pieces. ${toConvert.f} becomes ${toConvert.F} — same amount of pizza, just more slices.`,
      mistakes: ['Multiplying only the denominator and forgetting the numerator.', 'Adding the same number to top and bottom (that changes the value!).'],
      visual: {
        kind: 'fractionBars',
        fractions: [
          { n: x.n, d: x.d, label: x.toString(), color: COLORS.a },
          { n: X.n, d: L, label: X.toString(), color: COLORS.a },
          { n: y.n, d: y.d, label: y.toString(), color: COLORS.b },
          { n: Y.n, d: L, label: Y.toString(), color: COLORS.b },
        ],
      },
      checkpoint: {
        question: `Write ${toConvert.f} with denominator ${L}. (type like ${toConvert.F.n + 1}/${L})`,
        answer: toConvert.F.toString(),
        accept: [String(toConvert.F.n)],
        nudge: `${L} ÷ ${toConvert.f.d} = ${L / toConvert.f.d}. Multiply the numerator ${toConvert.f.n} by that too.`,
      },
    });
  }

  steps.push({
    title: `${op === '+' ? 'Add' : 'Subtract'} the numerators`,
    what: `Now the pieces are the same size, so ${verb} the numerators and keep the denominator ${L}.`,
    why: `The numerators count how many pieces we have. ${X.n} pieces ${op === '+' ? 'plus' : 'minus'} ${Y.n} pieces = ${rawN} pieces, each still 1/${L} of the whole.`,
    rule: `a/c ${op} b/c = (a ${op} b)/c`,
    math: `${X} ${op} ${Y} = (${X.n} ${op} ${Y.n})/${L} = ${raw}`,
    simpler: `Count the shaded pieces: ${X.n} ${op === '+' ? 'and' : 'take away'} ${Y.n} makes ${rawN}. The pieces are still ${L}ths.`,
    mistakes: [`${op === '+' ? 'Adding' : 'Subtracting'} the denominators: ${X.n}/${L} ${op} ${Y.n}/${L} is NOT ${rawN}/${op === '+' ? 2 * L : 0}.`],
    visual:
      op === '+'
        ? {
            kind: 'fractionCircles',
            fractions: [
              { n: X.n, d: L, label: X.toString(), color: COLORS.a },
              { n: Y.n, d: L, label: Y.toString(), color: COLORS.b },
              { n: rawN, d: L, label: `= ${raw}`, color: COLORS.sum },
            ],
          }
        : {
            kind: 'fractionBars',
            fractions: [
              { n: X.n, d: L, label: X.toString(), color: COLORS.a },
              { n: Y.n, d: L, label: `take away ${Y}`, color: COLORS.b },
              { n: rawN, d: L, label: `= ${raw}`, color: COLORS.sum },
            ],
          },
    checkpoint: {
      question: `What is ${X} ${op} ${Y}?`,
      answer: raw.toString(),
      accept: rawN === 0 ? ['0'] : [simple.toString(), simple.toMixedString()],
      nudge: `Keep the denominator ${L}. Just ${verb} ${X.n} and ${Y.n}.`,
    },
  });

  const needsSimplify = !raw.sameForm(simple) || simple.isImproper();
  if (needsSimplify) {
    const lines: string[] = [];
    if (!raw.sameForm(simple)) {
      const g = raw.n / simple.n;
      lines.push(`${raw} = (${raw.n} ÷ ${g})/(${raw.d} ÷ ${g}) = ${simple}`);
    }
    if (simple.isImproper()) {
      const whole = Math.floor(simple.n / simple.d);
      const rem = simple.n % simple.d;
      lines.push(`${simple} = ${whole} whole${whole > 1 ? 's' : ''} and ${rem}/${simple.d} left over = ${finalText}`);
    }
    steps.push({
      title: 'Simplify the answer',
      what: simple.isImproper()
        ? `${raw} is more than one whole, so write it as a mixed number${raw.sameForm(simple) ? '' : ' after reducing'}.`
        : `Reduce ${raw} by dividing the top and bottom by their greatest common factor.`,
      why: 'Simplest form is the clearest way to say the same amount — it is easier to picture and compare.',
      rule: simple.isImproper()
        ? 'Improper fraction → mixed number: divide numerator by denominator; the quotient is the whole number and the remainder stays over the denominator.'
        : 'Divide numerator and denominator by their greatest common factor (GCF).',
      math: lines.join('\n'),
      simpler: simple.isImproper()
        ? `Every ${simple.d} pieces make one whole pizza. ${simple.n} pieces make ${Math.floor(simple.n / simple.d)} whole and ${simple.n % simple.d} extra.`
        : `Can the top and bottom both be divided by the same number? Divide them to get ${simple}.`,
      mistakes: ['Stopping at an improper fraction or an unreduced fraction when simplest form is asked for.'],
      visual: { kind: 'fractionCircles', fractions: [{ n: simple.n, d: simple.d, label: finalText, color: COLORS.sum }] },
      checkpoint: {
        question: 'Write the answer in simplest form (mixed number if it is more than 1).',
        answer: finalText,
        accept: [simple.toString()],
        nudge: 'How many whole groups of the denominator fit into the numerator?',
      },
    });
  }

  steps.push({
    title: 'Check the answer',
    what: `The answer is ${finalText}. Does it make sense?`,
    why: 'Estimating is a quick way to catch mistakes.',
    rule: 'Estimate using benchmarks: 0, 1/2 and 1.',
    math: `${x} ${op} ${y} = ${finalText}   (≈ ${x.value().toFixed(2)} ${op} ${y.value().toFixed(2)} = ${(op === '+' ? x.value() + y.value() : x.value() - y.value()).toFixed(2)})`,
    simpler: `${x} is about ${x.value().toFixed(2)} and ${y} is about ${y.value().toFixed(2)}. Our answer is close to ${(op === '+' ? x.value() + y.value() : x.value() - y.value()).toFixed(2)}, so it makes sense.`,
  });

  const hints = same
    ? [
        'Look at the denominators. Are the pieces the same size?',
        `The denominators match, so keep ${L} as the denominator.`,
        `${verb === 'add' ? 'Add' : 'Subtract'} only the numerators: ${X.n} ${op} ${Y.n}.`,
        needsSimplify ? `Now simplify ${raw}.` : `Write your answer over ${L}.`,
      ]
    : [
        'Look at the denominators.',
        `Can you find a number that both ${x.d} and ${y.d} divide into?`,
        `Try converting both fractions into ${L}ths.`,
        `${X} ${op} ${Y} — now ${verb} the numerators.`,
        needsSimplify ? `Simplify ${raw}.` : `Your answer has denominator ${L}.`,
      ];

  const wrong1 = new Fraction(op === '+' ? x.n + y.n : Math.max(0, x.n - y.n), op === '+' ? x.d + y.d : Math.max(1, Math.abs(x.d - y.d)));
  // Multiple-choice distractors must never be equal in value to the answer.
  const distractors = [wrong1, new Fraction(rawN + 1, L), new Fraction(rawN, L * 2), new Fraction(Math.max(1, rawN - 1), L), new Fraction(rawN + 2, L)];
  const seen: Fraction[] = [simple];
  for (const f of distractors) if (seen.length < 4 && !seen.some((g) => g.equals(f))) seen.push(f);
  const choices = shuffle([finalText, ...seen.slice(1).map((f) => f.toString())], Math.random);

  return problem({
    skillId,
    difficulty,
    prompt,
    story,
    answer: finalText,
    accept: [simple.toString()],
    answerKind: 'fraction',
    answerHint: 'e.g. 5/6 or 1 1/4',
    steps,
    hints,
    visual: {
      kind: 'fractionBars',
      fractions: [
        { n: x.n, d: x.d, label: x.toString(), color: circleColor[0] },
        { n: y.n, d: y.d, label: y.toString(), color: circleColor[1] },
      ],
    },
    choices: choices.length === 4 ? choices : undefined,
  });
}

function parseFractionOp(text: string, op: Op): Problem | null {
  const s = clean(text);
  const sym = op === '+' ? '\\+' : '-';
  const m = s.match(new RegExp(`^(\\d+)\\s*/\\s*(\\d+)\\s*${sym}\\s*(\\d+)\\s*/\\s*(\\d+)$`));
  if (!m) return null;
  const [a, b, c, d] = m.slice(1).map(Number);
  if (!b || !d) return null;
  const x = new Fraction(a, b);
  const y = new Fraction(c, d);
  if (op === '−' && x.value() < y.value()) return null;
  return buildFractionProblem(x, y, op, 'medium');
}

function checkFraction(p: Problem, input: string, op: Op): CheckResult {
  const [xs, ys] = p.prompt.replace(' = ?', '').split(` ${op} `);
  const x = Fraction.parse(xs)!;
  const y = Fraction.parse(ys)!;
  const exact = Fraction.parse(p.accept![0])!;
  const given = Fraction.parse(input.replace(/[−–]/g, '-').trim());
  if (!given) {
    return { correct: false, message: 'Write your answer as a fraction like 5/6 or a mixed number like 1 1/4.' };
  }
  // Exact form required: 10/8 has the right value but is not simplified.
  if (normalize(input) === normalize(p.answer) || given.sameForm(exact)) {
    return { correct: true, message: praise() };
  }
  if (given.equals(exact)) {
    return {
      correct: false,
      almost: true,
      message: `So close! ${input.trim()} has the right value — now simplify it.`,
      misconception: exact.isImproper()
        ? 'Your fraction is equal to the answer but can be simplified or written as a mixed number.'
        : 'Divide the top and bottom by their greatest common factor.',
    };
  }
  if (op === '+' && given.sameForm(new Fraction(x.n + y.n, x.d + y.d))) {
    return {
      correct: false,
      message: 'It looks like you added the tops AND the bottoms.',
      misconception: `The denominator shows the SIZE of each piece. When you put ${x} and ${y} together, the pieces do not get smaller, so we never add denominators. First make the denominators the same.`,
    };
  }
  if (x.d !== y.d && given.sameForm(new Fraction(op === '+' ? x.n + y.n : x.n - y.n, Math.max(x.d, y.d)))) {
    return {
      correct: false,
      message: 'You combined the numerators before making the pieces the same size.',
      misconception: `${x} and ${y} have different-sized pieces. Convert both to the common denominator ${lcm(x.d, y.d)} first.`,
    };
  }
  return { correct: false, message: 'Not quite. Try a hint to find the next step.' };
}

const pizzaTeaching = {
  concept: [
    'A fraction describes part of a whole. The bottom number (denominator) says how many equal pieces the whole is cut into. The top number (numerator) says how many of those pieces we have.',
    'To add fractions, the pieces must be the same size. If the denominators already match, just add the numerators and keep the denominator.',
    'If the denominators are different, first rewrite the fractions as equivalent fractions with a common denominator — then add the numerators.',
  ],
};

export const addFractions: Skill = {
  id: 'add-fractions',
  name: 'Adding Fractions',
  grades: [4, 5],
  prerequisites: ['equivalent-fractions', 'add-within-100'],
  keywords: ['fraction', 'fractions', 'add', 'adding', 'sum', 'denominator', 'numerator', 'common denominator', 'pizza', 'lcd'],
  teaching: {
    summary: 'Add fractions with like and unlike denominators, then simplify.',
    whatYouWillLearn: [
      'What the numerator and denominator mean',
      'Why pieces must be the same size before adding',
      'How to find a common denominator',
      'How to write equivalent fractions',
      'How to simplify and write mixed numbers',
    ],
    concept: pizzaTeaching.concept,
    keyVocabulary: [
      { term: 'Numerator', meaning: 'The top number — how many pieces we have.' },
      { term: 'Denominator', meaning: 'The bottom number — how many equal pieces make one whole.' },
      { term: 'Common denominator', meaning: 'A denominator shared by two fractions.' },
      { term: 'Equivalent fractions', meaning: 'Different-looking fractions with the same value, like 1/2 and 2/4.' },
      { term: 'Mixed number', meaning: 'A whole number and a fraction together, like 1 1/4.' },
    ],
    conceptVisual: {
      kind: 'fractionBars',
      fractions: [
        { n: 1, d: 2, label: '1/2', color: COLORS.a },
        { n: 2, d: 4, label: '2/4 (same amount!)', color: COLORS.a },
      ],
    },
    realWorld: {
      title: 'Pizza Night',
      emoji: '🍕',
      scenes: [
        {
          text: 'Maya and Leo ordered two pizzas of the same size. Maya’s pizza was cut into 4 slices, and she ate 3 of them — that is 3/4 of a pizza.',
          visual: { kind: 'fractionCircles', pizza: true, fractions: [{ n: 3, d: 4, label: 'Maya: 3/4', color: COLORS.a }] },
        },
        {
          text: 'Leo’s pizza was cut into only 2 big slices. He ate 1 slice — that is 1/2 of a pizza.',
          visual: { kind: 'fractionCircles', pizza: true, fractions: [{ n: 1, d: 2, label: 'Leo: 1/2', color: COLORS.b }] },
        },
        {
          text: 'The slices are different sizes! To count them together, Leo cuts his big slice in half. Now his 1/2 is the same as 2/4.',
          visual: {
            kind: 'fractionCircles',
            pizza: true,
            fractions: [
              { n: 1, d: 2, label: '1/2', color: COLORS.b },
              { n: 2, d: 4, label: '= 2/4', color: COLORS.b },
            ],
          },
        },
        {
          text: 'Now all the slices are fourths. Maya’s 3 slices plus Leo’s 2 slices = 5 slices, each 1/4 of a pizza.',
          visual: {
            kind: 'fractionCircles',
            pizza: true,
            fractions: [
              { n: 3, d: 4, label: '3/4', color: COLORS.a },
              { n: 2, d: 4, label: '2/4', color: COLORS.b },
            ],
          },
        },
      ],
      question: 'How much pizza did Maya and Leo eat altogether? (fraction or mixed number)',
      answer: '1 1/4',
      accept: ['5/4', '1.25'],
      explanation: '3/4 + 2/4 = 5/4. Four fourths make one whole pizza, with 1/4 left over, so they ate 1 1/4 pizzas.',
    },
    lessonSummary: [
      'Denominators tell the size of the pieces — you only add numerators.',
      'Different denominators? Find the least common denominator (LCD) first.',
      'Rewrite each fraction as an equivalent fraction with the LCD.',
      'Add the numerators and keep the denominator.',
      'Simplify, and write improper fractions as mixed numbers.',
    ],
  },
  generate(d, rng) {
    const [x, y] = pickFractions(d, rng, '+');
    return buildFractionProblem(x, y, '+', d);
  },
  parse: (t) => parseFractionOp(t, '+'),
  check: (p, i) => checkFraction(p, i, '+'),
};

export const subtractFractions: Skill = {
  id: 'subtract-fractions',
  name: 'Subtracting Fractions',
  grades: [4, 5],
  prerequisites: ['add-fractions', 'equivalent-fractions'],
  keywords: ['fraction', 'subtract', 'subtracting', 'difference', 'minus', 'take away', 'denominator'],
  teaching: {
    summary: 'Subtract fractions by first making the pieces the same size.',
    whatYouWillLearn: ['Why subtraction needs a common denominator', 'How to convert fractions', 'How to subtract numerators and simplify'],
    concept: [
      'Subtracting fractions works just like adding: the pieces must be the same size first.',
      'Find a common denominator, rewrite both fractions, subtract the numerators, keep the denominator, and simplify.',
    ],
    conceptVisual: { kind: 'fractionBars', fractions: [{ n: 3, d: 4, label: '3/4', color: COLORS.a }, { n: 1, d: 4, label: '− 1/4', color: COLORS.b }, { n: 2, d: 4, label: '= 2/4 = 1/2', color: COLORS.sum }] },
    realWorld: {
      title: 'Ribbon for a Project',
      emoji: '🎀',
      scenes: [
        { text: 'Ava has 7/8 of a meter of ribbon.', visual: { kind: 'fractionBars', fractions: [{ n: 7, d: 8, label: '7/8 m', color: COLORS.a }] } },
        { text: 'She cuts off 1/2 of a meter for a bow. 1/2 is the same as 4/8.', visual: { kind: 'fractionBars', fractions: [{ n: 1, d: 2, label: '1/2', color: COLORS.b }, { n: 4, d: 8, label: '4/8', color: COLORS.b }] } },
      ],
      question: 'How much ribbon is left?',
      answer: '3/8',
      accept: ['0.375'],
      explanation: '7/8 − 4/8 = 3/8 of a meter.',
    },
    lessonSummary: ['Make the denominators the same.', 'Subtract the numerators; keep the denominator.', 'Simplify your answer.'],
  },
  generate(d, rng) {
    const [x, y] = pickFractions(d, rng, '−');
    return buildFractionProblem(x, y, '−', d);
  },
  parse: (t) => parseFractionOp(t, '−'),
  check: (p, i) => checkFraction(p, i, '−'),
};

export const equivalentFractions: Skill = {
  id: 'equivalent-fractions',
  name: 'Equivalent Fractions',
  grades: [3, 4],
  prerequisites: ['multiplication-facts'],
  keywords: ['equivalent', 'fraction', 'same value', 'equal fractions'],
  teaching: {
    summary: 'Find fractions that name the same amount.',
    whatYouWillLearn: ['What equivalent fractions are', 'How to multiply top and bottom by the same number'],
    concept: [
      'Equivalent fractions show the same amount with different-sized pieces.',
      'Multiply (or divide) the numerator and denominator by the same number to get an equivalent fraction.',
    ],
    conceptVisual: { kind: 'fractionBars', fractions: [{ n: 1, d: 3, label: '1/3', color: COLORS.a }, { n: 2, d: 6, label: '2/6', color: COLORS.a }, { n: 4, d: 12, label: '4/12', color: COLORS.a }] },
    realWorld: {
      title: 'Sharing a Chocolate Bar',
      emoji: '🍫',
      scenes: [{ text: 'A chocolate bar has 2 big pieces. Sam eats 1 of them (1/2). If the bar had been broken into 6 small pieces, how many small pieces is that?', visual: { kind: 'fractionBars', fractions: [{ n: 1, d: 2, label: '1/2', color: COLORS.a }, { n: 3, d: 6, label: '?/6', color: COLORS.a }] } }],
      question: '1/2 = ?/6',
      answer: '3',
      accept: ['3/6'],
      explanation: '6 ÷ 2 = 3, so multiply the top and bottom by 3: 1/2 = 3/6.',
    },
    lessonSummary: ['Multiply top and bottom by the same number.', 'The amount stays the same; the pieces change size.'],
  },
  generate(d, rng) {
    const b = pick(rng, d === 'easy' ? [2, 3, 4] : [3, 4, 5, 6]);
    const a = randInt(rng, 1, b - 1);
    const k = d === 'easy' ? 2 : randInt(rng, 2, d === 'challenge' ? 6 : 4);
    const D = b * k;
    return problem({
      skillId: 'equivalent-fractions',
      difficulty: d,
      prompt: `${a}/${b} = ?/${D}`,
      answer: String(a * k),
      accept: [`${a * k}/${D}`],
      answerKind: 'number',
      answerHint: 'the missing numerator',
      hints: [`How do you get from ${b} to ${D}?`, `${b} × ${k} = ${D}.`, `Multiply the numerator by ${k} too.`],
      steps: [
        {
          title: 'Compare the denominators',
          what: `The denominator changes from ${b} to ${D}.`,
          why: 'We need to know how many times smaller each new piece is.',
          rule: 'Equivalent fractions: multiply top and bottom by the same number.',
          math: `${D} ÷ ${b} = ${k}`,
          checkpoint: { question: `What do you multiply ${b} by to get ${D}?`, answer: String(k) },
          visual: { kind: 'fractionBars', fractions: [{ n: a, d: b, label: `${a}/${b}`, color: COLORS.a }, { n: a * k, d: D, label: `${a * k}/${D}`, color: COLORS.a }] },
        },
        {
          title: 'Multiply the numerator',
          what: `Multiply the numerator ${a} by ${k}.`,
          why: 'Whatever we do to the bottom, we must do to the top so the value stays the same.',
          rule: 'a/b = (a × k)/(b × k)',
          math: `${a}/${b} = (${a} × ${k})/(${b} × ${k}) = ${a * k}/${D}`,
          mistakes: ['Adding instead of multiplying.'],
        },
      ],
    });
  },
};
