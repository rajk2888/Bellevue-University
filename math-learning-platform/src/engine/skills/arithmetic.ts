import { pick, randInt, type Rng } from '../../lib/math/rng';
import type { Difficulty, Problem, Skill, Step } from '../types';
import { clean, numericChoices, problem } from './common';

const EMOJI = ['🍎', '⭐', '🐟', '🎈', '🍪', '🌸', '🚗', '🐞'];

function addRange(d: Difficulty, rng: Rng): [number, number] {
  switch (d) {
    case 'easy':
      return [randInt(rng, 1, 5), randInt(rng, 1, 4)];
    case 'medium':
      return [randInt(rng, 5, 12), randInt(rng, 2, 8)];
    case 'hard': {
      // two-digit, no regrouping
      const a = randInt(rng, 11, 60);
      const b = randInt(rng, 1, 3) * 10 + randInt(rng, 0, 9 - (a % 10));
      return [a, b];
    }
    default: {
      // two-digit with regrouping
      let a = randInt(rng, 15, 69);
      if (a % 10 === 0) a += 5;
      const b = randInt(rng, 1, 2) * 10 + randInt(rng, 10 - (a % 10), 9);
      return [a, b];
    }
  }
}

export function buildAddition(a: number, b: number, d: Difficulty): Problem {
  const sum = a + b;
  const emoji = EMOJI[(a * 7 + b) % EMOJI.length];
  let steps: Step[];
  if (sum <= 20) {
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    steps = [
      {
        title: 'Start with the bigger number',
        what: `Put ${big} in your head. It is the bigger number.`,
        why: 'Starting with the bigger number means we have fewer to count on.',
        rule: 'Order does not matter when adding: a + b = b + a.',
        math: `${a} + ${b}  →  start at ${big}`,
        simpler: `Think of ${big} ${emoji}. Now we will add ${small} more.`,
        visual: { kind: 'counting', groups: [{ count: a, emoji, label: String(a) }, { count: b, emoji, label: String(b) }] },
        checkpoint: { question: `Which number is bigger, ${a} or ${b}?`, answer: String(big) },
      },
      {
        title: `Count on ${small}`,
        what: `Count up ${small} from ${big}: ${Array.from({ length: small }, (_, i) => big + i + 1).join(', ')}.`,
        why: 'Each count adds one more.',
        rule: 'Adding means putting groups together.',
        math: `${big} + ${small} = ${sum}`,
        simpler: `Hop ${small} times on the number line starting at ${big}. Where do you land?`,
        mistakes: [`Counting ${big} again as the first number (start counting at ${big + 1}).`],
        visual: { kind: 'numberLine', min: 0, max: Math.max(10, sum + 1), jumps: [{ from: big, to: sum, label: `+${small}` }], points: [{ at: sum, label: String(sum) }] },
        checkpoint: { question: `What is ${big} + ${small}?`, answer: String(sum) },
      },
    ];
  } else {
    const [ta, oa] = [Math.floor(a / 10), a % 10];
    const [tb, ob] = [Math.floor(b / 10), b % 10];
    const ones = oa + ob;
    const carry = ones >= 10 ? 1 : 0;
    const tens = ta + tb + carry;
    steps = [
      {
        title: 'Split into tens and ones',
        what: `${a} is ${ta} tens and ${oa} ones. ${b} is ${tb} tens and ${ob} ones.`,
        why: 'Place value lets us add the ones together and the tens together.',
        rule: 'Place value: each digit’s value depends on its place.',
        math: `${a} = ${ta * 10} + ${oa}\n${b} = ${tb * 10} + ${ob}`,
        visual: { kind: 'baseTen', numbers: [a, b] },
        checkpoint: { question: `How many tens are in ${a}?`, answer: String(ta) },
      },
      {
        title: 'Add the ones',
        what: `${oa} + ${ob} = ${ones}.`,
        why: 'We always start with the ones place.',
        rule: carry ? '10 ones make 1 ten (regrouping).' : 'Add ones to ones.',
        math: carry ? `${oa} + ${ob} = ${ones} = 1 ten and ${ones - 10} ones` : `${oa} + ${ob} = ${ones}`,
        mistakes: carry ? ['Writing 2 digits in the ones place instead of regrouping.'] : undefined,
        checkpoint: { question: `What is ${oa} + ${ob}?`, answer: String(ones) },
      },
      {
        title: 'Add the tens',
        what: carry ? `${ta} tens + ${tb} tens + 1 regrouped ten = ${tens} tens.` : `${ta} tens + ${tb} tens = ${tens} tens.`,
        why: 'Tens are added to tens.',
        rule: 'Add each place value separately.',
        math: carry ? `${ta} + ${tb} + 1 = ${tens}` : `${ta} + ${tb} = ${tens}`,
        mistakes: carry ? ['Forgetting the regrouped ten.'] : undefined,
        checkpoint: { question: 'How many tens altogether?', answer: String(tens) },
      },
      {
        title: 'Put it together',
        what: `${tens} tens and ${ones % 10} ones make ${sum}.`,
        why: 'Combine the places to write the number.',
        math: `${a} + ${b} = ${sum}`,
        visual: { kind: 'baseTen', numbers: [sum], label: `= ${sum}` },
      },
    ];
  }
  return problem({
    skillId: 'add-within-100',
    difficulty: d,
    prompt: `${a} + ${b} = ?`,
    answer: String(sum),
    answerKind: 'number',
    steps,
    hints:
      sum <= 20
        ? [`Start at ${Math.max(a, b)}.`, `Count on ${Math.min(a, b)} more.`, 'Use your fingers or the number line.']
        : ['Add the ones first.', `${a % 10} + ${b % 10} = ?`, 'Then add the tens. Remember any regrouped ten!'],
    visual: sum <= 20 ? { kind: 'counting', groups: [{ count: a, emoji }, { count: b, emoji }] } : { kind: 'baseTen', numbers: [a, b] },
    choices: numericChoices(sum, Math.random),
  });
}

export function buildSubtraction(a: number, b: number, d: Difficulty): Problem {
  const diff = a - b;
  const emoji = EMOJI[(a + b) % EMOJI.length];
  let steps: Step[];
  if (a <= 20) {
    steps = [
      {
        title: `Start with ${a}`,
        what: `We have ${a} ${emoji}.`,
        why: 'Subtraction starts with the whole amount.',
        rule: 'Subtraction means taking away.',
        math: `${a} − ${b}`,
        visual: { kind: 'counting', groups: [{ count: a, emoji, label: String(a) }] },
      },
      {
        title: `Take away ${b}`,
        what: `Cross out ${b} of them and count what is left.`,
        why: 'Taking away shows how many remain.',
        rule: 'You can also count back on a number line.',
        math: `${a} − ${b} = ${diff}`,
        simpler: `Count back ${b} hops from ${a}.`,
        visual: { kind: 'counting', groups: [{ count: a, emoji }], crossedOut: b },
        checkpoint: { question: `How many are left?`, answer: String(diff) },
        mistakes: ['Counting the starting number as the first hop back.'],
      },
    ];
  } else {
    const [ta, oa] = [Math.floor(a / 10), a % 10];
    const [tb, ob] = [Math.floor(b / 10), b % 10];
    const borrow = oa < ob;
    steps = [
      {
        title: 'Look at the ones',
        what: borrow ? `${oa} is smaller than ${ob}, so we need to regroup 1 ten into 10 ones.` : `${oa} ones − ${ob} ones.`,
        why: 'We subtract place by place, starting with the ones.',
        rule: borrow ? '1 ten = 10 ones (regrouping / borrowing).' : 'Subtract ones from ones.',
        math: borrow ? `${ta} tens ${oa} ones → ${ta - 1} tens ${oa + 10} ones` : `${oa} − ${ob} = ${oa - ob}`,
        visual: { kind: 'baseTen', numbers: [a] },
        mistakes: borrow ? [`Subtracting the smaller digit from the bigger (${ob} − ${oa}) instead of regrouping.`] : undefined,
      },
      {
        title: 'Subtract the ones',
        what: `${borrow ? oa + 10 : oa} − ${ob} = ${(borrow ? oa + 10 : oa) - ob}.`,
        why: 'Now there are enough ones to take away.',
        math: `${borrow ? oa + 10 : oa} − ${ob} = ${(borrow ? oa + 10 : oa) - ob}`,
        checkpoint: { question: `${borrow ? oa + 10 : oa} − ${ob} = ?`, answer: String((borrow ? oa + 10 : oa) - ob) },
      },
      {
        title: 'Subtract the tens',
        what: `${borrow ? ta - 1 : ta} tens − ${tb} tens = ${(borrow ? ta - 1 : ta) - tb} tens.`,
        why: 'Tens are subtracted from tens.',
        math: `${borrow ? ta - 1 : ta} − ${tb} = ${(borrow ? ta - 1 : ta) - tb}`,
        mistakes: borrow ? ['Forgetting that one ten was regrouped.'] : undefined,
      },
      { title: 'Answer', what: `${a} − ${b} = ${diff}.`, why: 'Check by adding: ' + `${diff} + ${b} = ${a}.`, math: `${a} − ${b} = ${diff}`, rule: 'Addition undoes subtraction.' },
    ];
  }
  return problem({
    skillId: 'subtract-within-100',
    difficulty: d,
    prompt: `${a} − ${b} = ?`,
    answer: String(diff),
    answerKind: 'number',
    steps,
    hints: a <= 20 ? [`Start with ${a}.`, `Take away ${b}.`, `Count back ${b} from ${a}.`] : ['Start with the ones.', 'Do you need to regroup a ten?', 'Then subtract the tens.'],
    visual: a <= 20 ? { kind: 'counting', groups: [{ count: a, emoji }], crossedOut: 0 } : { kind: 'baseTen', numbers: [a] },
    choices: numericChoices(diff, Math.random),
  });
}

export const addition: Skill = {
  id: 'add-within-100',
  name: 'Addition',
  grades: [1, 2],
  keywords: ['add', 'addition', 'plus', 'sum', 'count on', 'total', 'altogether', 'regroup'],
  teaching: {
    summary: 'Put groups together by counting on and adding tens and ones.',
    whatYouWillLearn: ['What adding means', 'How to count on from the bigger number', 'How to add tens and ones'],
    concept: [
      'Adding means putting groups together to find how many there are in all.',
      'A quick way to add small numbers is to start with the bigger number and count on.',
      'For bigger numbers, add the ones, then add the tens. If the ones make 10 or more, trade 10 ones for 1 ten.',
    ],
    conceptVisual: { kind: 'counting', groups: [{ count: 3, emoji: '🍎', label: '3' }, { count: 2, emoji: '🍎', label: '2' }] },
    realWorld: {
      title: 'Apples in the Basket',
      emoji: '🍎',
      scenes: [
        { text: 'Mia picks 4 apples from one tree.', visual: { kind: 'counting', groups: [{ count: 4, emoji: '🍎' }] } },
        { text: 'Then she picks 3 more from another tree.', visual: { kind: 'counting', groups: [{ count: 4, emoji: '🍎' }, { count: 3, emoji: '🍏' }] } },
      ],
      question: 'How many apples does Mia have now?',
      answer: '7',
      explanation: 'Start at 4 and count on 3: 5, 6, 7. So 4 + 3 = 7.',
    },
    lessonSummary: ['Adding puts groups together.', 'Start with the bigger number and count on.', 'Add ones first, then tens.'],
  },
  generate(d, rng) {
    const [a, b] = addRange(d, rng);
    return buildAddition(a, b, d);
  },
  parse(text) {
    const m = clean(text).match(/^(\d{1,3})\s*\+\s*(\d{1,3})$/);
    if (!m) return null;
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a + b > 199) return null;
    return buildAddition(a, b, 'medium');
  },
};

export const subtraction: Skill = {
  id: 'subtract-within-100',
  name: 'Subtraction',
  grades: [1, 2],
  prerequisites: ['add-within-100'],
  keywords: ['subtract', 'subtraction', 'minus', 'take away', 'difference', 'left', 'borrow', 'regroup'],
  teaching: {
    summary: 'Take away and find how many are left.',
    whatYouWillLearn: ['What subtracting means', 'Counting back', 'Regrouping tens'],
    concept: ['Subtracting means taking some away and finding how many are left.', 'You can count back on a number line, or subtract ones and then tens.'],
    conceptVisual: { kind: 'counting', groups: [{ count: 6, emoji: '🎈' }], crossedOut: 2 },
    realWorld: {
      title: 'Balloons at the Party',
      emoji: '🎈',
      scenes: [
        { text: 'There were 8 balloons at the party.', visual: { kind: 'counting', groups: [{ count: 8, emoji: '🎈' }] } },
        { text: 'Oh no! 3 balloons floated away.', visual: { kind: 'counting', groups: [{ count: 8, emoji: '🎈' }], crossedOut: 3 } },
      ],
      question: 'How many balloons are left?',
      answer: '5',
      explanation: '8 − 3 = 5. Count back 3 from 8: 7, 6, 5.',
    },
    lessonSummary: ['Subtraction means taking away.', 'Count back, or subtract ones then tens.', 'Check with addition.'],
  },
  generate(d, rng) {
    let a: number, b: number;
    if (d === 'easy') [a, b] = [randInt(rng, 3, 10), randInt(rng, 1, 3)];
    else if (d === 'medium') [a, b] = [randInt(rng, 11, 20), randInt(rng, 2, 9)];
    else if (d === 'hard') {
      a = randInt(rng, 35, 99);
      b = randInt(rng, 1, Math.floor(a / 10) - 1) * 10 + randInt(rng, 0, a % 10);
    } else {
      a = randInt(rng, 41, 99);
      while (a % 10 === 9) a = randInt(rng, 41, 98);
      b = randInt(rng, 1, Math.floor(a / 10) - 2) * 10 + randInt(rng, (a % 10) + 1, 9);
    }
    return buildSubtraction(a, b, d);
  },
  parse(text) {
    const m = clean(text).match(/^(\d{1,3})\s*-\s*(\d{1,3})$/);
    if (!m) return null;
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (b > a || a > 199) return null;
    return buildSubtraction(a, b, 'medium');
  },
};

export function buildMultiplication(a: number, b: number, d: Difficulty): Problem {
  const p = a * b;
  const small = a <= 10 && b <= 10;
  const steps: Step[] = small
    ? [
        {
          title: 'Read it as groups',
          what: `${a} × ${b} means ${a} groups of ${b}.`,
          why: 'Multiplication is a fast way to add equal groups.',
          rule: 'a × b = b + b + … (a times)',
          math: `${a} × ${b} = ${Array(a).fill(b).join(' + ')}`,
          visual: { kind: 'equalGroups', groups: a, perGroup: b },
          checkpoint: { question: `How many groups are there?`, answer: String(a) },
        },
        {
          title: 'Make an array',
          what: `Arrange them in ${a} rows of ${b}.`,
          why: 'An array lets us see all the groups at once and count by rows.',
          rule: 'Commutative property: a × b = b × a.',
          math: `${a} rows × ${b} columns`,
          visual: { kind: 'array', rows: a, cols: b },
        },
        {
          title: `Skip-count by ${b}`,
          what: `Count by ${b}s, ${a} times: ${Array.from({ length: a }, (_, i) => b * (i + 1)).join(', ')}.`,
          why: 'Skip-counting adds one group at a time.',
          math: `${a} × ${b} = ${p}`,
          simpler: b === 5 ? 'Count by fives like a clock!' : `Say the ${b}s: ${b}, ${2 * b}, ...`,
          mistakes: ['Adding the numbers (a + b) instead of multiplying.'],
          checkpoint: { question: `${a} × ${b} = ?`, answer: String(p) },
        },
      ]
    : (() => {
        const [big, sm] = a >= b ? [a, b] : [b, a];
        const tens = Math.floor(big / 10) * 10;
        const ones = big % 10;
        return [
          {
            title: 'Break apart the bigger number',
            what: `${big} = ${tens} + ${ones}.`,
            why: 'Smaller parts are easier to multiply in your head.',
            rule: 'Distributive property: a × (b + c) = a × b + a × c.',
            math: `${sm} × ${big} = ${sm} × (${tens} + ${ones})`,
            visual: { kind: 'rectangleArea', width: big, length: sm, showGrid: false },
          },
          {
            title: 'Multiply each part',
            what: `${sm} × ${tens} = ${sm * tens} and ${sm} × ${ones} = ${sm * ones}.`,
            why: 'Each part is a simpler multiplication fact.',
            math: `${sm} × ${tens} = ${sm * tens}\n${sm} × ${ones} = ${sm * ones}`,
            checkpoint: { question: `${sm} × ${tens} = ?`, answer: String(sm * tens) },
            mistakes: ['Forgetting to multiply the ones part.'],
          },
          {
            title: 'Add the parts',
            what: `${sm * tens} + ${sm * ones} = ${p}.`,
            why: 'The two parts together make the whole product.',
            math: `${a} × ${b} = ${p}`,
            checkpoint: { question: `${sm * tens} + ${sm * ones} = ?`, answer: String(p) },
          },
        ] as Step[];
      })();
  return problem({
    skillId: 'multiplication-facts',
    difficulty: d,
    prompt: `${a} × ${b} = ?`,
    answer: String(p),
    answerKind: 'number',
    steps,
    hints: small ? [`Think of ${a} groups of ${b}.`, `Skip-count by ${b}.`, `${b}, ${2 * b}, ${3 * b}, … keep going ${a} times.`] : ['Break the bigger number into tens and ones.', 'Multiply each part.', 'Add the two products.'],
    visual: small ? { kind: 'array', rows: a, cols: b } : undefined,
    choices: numericChoices(p, Math.random, Math.max(3, Math.min(a, b))),
  });
}

export const multiplication: Skill = {
  id: 'multiplication-facts',
  name: 'Multiplication',
  grades: [3, 4],
  prerequisites: ['add-within-100'],
  keywords: ['multiply', 'multiplication', 'times', 'product', 'groups of', 'array', 'skip count'],
  teaching: {
    summary: 'Multiplication as equal groups and arrays.',
    whatYouWillLearn: ['Multiplication means equal groups', 'Arrays', 'Skip-counting', 'Breaking numbers apart'],
    concept: [
      'Multiplication is repeated addition of equal groups. 3 × 4 means 3 groups of 4.',
      'An array arranges objects in rows and columns so we can see the groups.',
      'The order does not matter: 3 × 4 = 4 × 3.',
    ],
    conceptVisual: { kind: 'array', rows: 3, cols: 4 },
    realWorld: {
      title: 'Egg Cartons',
      emoji: '🥚',
      scenes: [{ text: 'A baker has 4 cartons. Each carton holds 6 eggs.', visual: { kind: 'equalGroups', groups: 4, perGroup: 6, emoji: '🥚' } }],
      question: 'How many eggs does the baker have?',
      answer: '24',
      explanation: '4 groups of 6: 6, 12, 18, 24. So 4 × 6 = 24.',
    },
    lessonSummary: ['a × b means a groups of b.', 'Use arrays and skip-counting.', 'Break big numbers into tens and ones.'],
  },
  generate(d, rng) {
    const [a, b] =
      d === 'easy'
        ? [randInt(rng, 2, 5), pick(rng, [2, 5, 10])]
        : d === 'medium'
          ? [randInt(rng, 3, 9), randInt(rng, 3, 9)]
          : d === 'hard'
            ? [randInt(rng, 6, 12), randInt(rng, 6, 12)]
            : [randInt(rng, 3, 9), randInt(rng, 13, 49)];
    return buildMultiplication(a, b, d);
  },
  parse(text) {
    const m = clean(text).match(/^(\d{1,3})\s*[*x]\s*(\d{1,3})$/);
    if (!m) return null;
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (Math.min(a, b) > 12 || Math.max(a, b) > 99) return null;
    return buildMultiplication(a, b, 'medium');
  },
};

export function buildDivision(total: number, groups: number, d: Difficulty): Problem {
  const q = Math.floor(total / groups);
  const r = total % groups;
  return problem({
    skillId: 'division-facts',
    difficulty: d,
    prompt: `${total} ÷ ${groups} = ?`,
    answer: r ? `${q} r${r}` : String(q),
    accept: r ? [`${q} R${r}`, `${q} remainder ${r}`] : undefined,
    answerKind: r ? 'text' : 'number',
    answerHint: r ? 'e.g. 4 r2' : undefined,
    steps: [
      {
        title: 'Understand the question',
        what: `${total} ÷ ${groups} asks: if we share ${total} into ${groups} equal groups, how many go in each group?`,
        why: 'Division is fair sharing into equal groups.',
        rule: 'Division is the inverse (opposite) of multiplication.',
        math: `${total} ÷ ${groups} = ?  ↔  ${groups} × ? = ${total}`,
        visual: { kind: 'equalGroups', groups, perGroup: q, emoji: '🍪' },
      },
      {
        title: 'Use a multiplication fact',
        what: `Which number times ${groups} is ${r ? `close to (but not more than) ${total}` : total}?`,
        why: 'Knowing multiplication facts makes division fast.',
        rule: 'If a × b = c, then c ÷ a = b.',
        math: `${groups} × ${q} = ${groups * q}`,
        checkpoint: { question: `${groups} × ? = ${groups * q}`, answer: String(q) },
        mistakes: ['Dividing the wrong way (the smaller number by the bigger).'],
      },
      ...(r
        ? [
            {
              title: 'Find the remainder',
              what: `${total} − ${groups * q} = ${r} left over.`,
              why: 'The remainder is what cannot be shared equally.',
              rule: 'The remainder is always smaller than the divisor.',
              math: `${total} ÷ ${groups} = ${q} remainder ${r}`,
            } as Step,
          ]
        : []),
    ],
    hints: [`Think: ${groups} times what equals ${total}?`, `Skip-count by ${groups}.`, `${groups} × ${q} = ${groups * q}.`],
    visual: { kind: 'equalGroups', groups, perGroup: q, emoji: '🍪' },
    choices: r ? undefined : numericChoices(q, Math.random),
  });
}

export const division: Skill = {
  id: 'division-facts',
  name: 'Division',
  grades: [3, 4],
  prerequisites: ['multiplication-facts'],
  keywords: ['divide', 'division', 'share', 'equal groups', 'quotient', 'remainder', 'per'],
  teaching: {
    summary: 'Share equally and connect division to multiplication.',
    whatYouWillLearn: ['Division as fair sharing', 'Using multiplication facts', 'Remainders'],
    concept: ['Division splits a total into equal groups.', 'Every division fact has a matching multiplication fact: 12 ÷ 3 = 4 because 3 × 4 = 12.'],
    conceptVisual: { kind: 'equalGroups', groups: 3, perGroup: 4, emoji: '🍪' },
    realWorld: {
      title: 'Sharing Cookies',
      emoji: '🍪',
      scenes: [{ text: '15 cookies are shared equally among 3 friends.', visual: { kind: 'equalGroups', groups: 3, perGroup: 5, emoji: '🍪' } }],
      question: 'How many cookies does each friend get?',
      answer: '5',
      explanation: '15 ÷ 3 = 5 because 3 × 5 = 15.',
    },
    lessonSummary: ['Division shares equally.', 'Use the matching multiplication fact.', 'Leftovers are the remainder.'],
  },
  generate(d, rng) {
    const g = d === 'easy' ? pick(rng, [2, 5, 10]) : randInt(rng, 3, 9);
    const q = randInt(rng, 2, d === 'easy' ? 5 : 9);
    const r = d === 'hard' || d === 'challenge' ? randInt(rng, 1, g - 1) : 0;
    return buildDivision(g * q + r, g, d);
  },
  parse(text) {
    const m = clean(text).match(/^(\d{1,3})\s*\/\s*(\d{1,2})$/);
    if (!m) return null;
    const [t, g] = [Number(m[1]), Number(m[2])];
    if (!g || t / g > 20) return null;
    return buildDivision(t, g, 'medium');
  },
};

export const placeValue: Skill = {
  id: 'place-value',
  name: 'Place Value',
  grades: [1, 2],
  keywords: ['place value', 'tens', 'ones', 'hundreds', 'digit'],
  teaching: {
    summary: 'Understand tens and ones.',
    whatYouWillLearn: ['What each digit means', 'Tens and ones with base-ten blocks'],
    concept: ['In a two-digit number, the left digit tells how many tens and the right digit tells how many ones.', '34 means 3 tens and 4 ones: 30 + 4.'],
    conceptVisual: { kind: 'baseTen', numbers: [34] },
    realWorld: {
      title: 'Packs of Crayons',
      emoji: '🖍️',
      scenes: [{ text: 'Crayons come in boxes of 10. Leo has 4 full boxes and 6 loose crayons.', visual: { kind: 'baseTen', numbers: [46] } }],
      question: 'How many crayons does Leo have?',
      answer: '46',
      explanation: '4 tens = 40, plus 6 ones = 46.',
    },
    lessonSummary: ['Left digit = tens, right digit = ones.', '10 ones make 1 ten.'],
  },
  generate(d, rng) {
    const n = d === 'easy' ? randInt(rng, 11, 39) : d === 'medium' ? randInt(rng, 40, 99) : randInt(rng, 101, 999);
    const hundreds = Math.floor(n / 100);
    const tens = Math.floor((n % 100) / 10);
    const ones = n % 10;
    const askTens = rng() < 0.5 || n < 100;
    return problem({
      skillId: 'place-value',
      difficulty: d,
      prompt: askTens ? `How many tens are in ${n}? (just the tens digit)` : `What is the value of the digit ${hundreds} in ${n}?`,
      answer: askTens ? String(tens) : String(hundreds * 100),
      answerKind: 'number',
      steps: [
        {
          title: 'Name each place',
          what: n >= 100 ? `${n}: ${hundreds} hundreds, ${tens} tens, ${ones} ones.` : `${n}: ${tens} tens and ${ones} ones.`,
          why: 'Each place is worth 10 times the place to its right.',
          rule: 'Place value: ones, tens, hundreds…',
          math: n >= 100 ? `${n} = ${hundreds * 100} + ${tens * 10} + ${ones}` : `${n} = ${tens * 10} + ${ones}`,
          visual: n < 100 ? { kind: 'baseTen', numbers: [n] } : undefined,
        },
      ],
      hints: ['Which digit is in the tens place?', 'Read the number from right to left: ones, tens, hundreds.'],
    });
  },
};
