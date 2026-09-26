import { pick, randInt } from '../../lib/math/rng';
import type { Skill } from '../types';
import { problem, shuffle } from './common';

export const tellingTime: Skill = {
  id: 'telling-time',
  name: 'Telling Time',
  grades: [1, 2],
  keywords: ['time', 'clock', 'hour', 'minute', 'o’clock', 'half past', 'quarter past'],
  teaching: {
    summary: 'Read hours and minutes on a clock.',
    whatYouWillLearn: ['The hour hand and minute hand', 'O’clock and half past', 'Counting minutes by fives'],
    concept: ['The short hand points to the hour. The long hand points to the minutes.', 'Each number on the clock is 5 minutes for the long hand: count by fives!'],
    conceptVisual: { kind: 'clock', hour: 3, minute: 0 },
    realWorld: {
      title: 'Time for Lunch',
      emoji: '🥪',
      scenes: [{ text: 'Lunch starts when the short hand points to 12 and the long hand points to 6.', visual: { kind: 'clock', hour: 12, minute: 30 } }],
      question: 'What time is lunch? (like 12:30)',
      answer: '12:30',
      accept: ['half past 12', '12 30'],
      explanation: 'The long hand on 6 means 30 minutes (6 × 5). So it is 12:30 — half past twelve.',
    },
    lessonSummary: ['Short hand = hour.', 'Long hand = minutes (count by 5s).'],
  },
  generate(d, rng) {
    const hour = randInt(rng, 1, 12);
    const minute = d === 'easy' ? 0 : d === 'medium' ? pick(rng, [0, 30]) : randInt(rng, 0, 11) * 5;
    const text = `${hour}:${String(minute).padStart(2, '0')}`;
    return problem({
      skillId: 'telling-time',
      difficulty: d,
      prompt: 'What time does the clock show? (type like 3:30)',
      answer: text,
      accept: minute === 0 ? [`${hour} o'clock`, `${hour} o’clock`, String(hour)] : undefined,
      answerKind: 'text',
      answerHint: 'e.g. 3:30',
      visual: { kind: 'clock', hour, minute },
      steps: [
        {
          title: 'Read the hour hand',
          what: `The short hand points ${minute === 0 ? 'right at' : 'just past'} ${hour}.`,
          why: 'The short hand tells the hour.',
          rule: 'Short hand = hours.',
          math: `hour = ${hour}`,
          visual: { kind: 'clock', hour, minute },
          checkpoint: { question: 'What hour is it?', answer: String(hour) },
        },
        {
          title: 'Read the minute hand',
          what: `The long hand points to ${minute / 5 || 12}. Count by fives: ${minute} minutes.`,
          why: 'Each number on the clock means 5 minutes for the long hand.',
          rule: 'Long hand number × 5 = minutes.',
          math: `${minute / 5 || 0} × 5 = ${minute}`,
          mistakes: ['Mixing up the short and long hands.', 'Reading the number the long hand points to as minutes (6 means 30, not 6).'],
        },
        { title: 'Put it together', what: `The time is ${text}.`, why: 'Hours first, then minutes.', math: text },
      ],
      hints: ['Find the short hand first.', 'The long hand shows minutes — count by 5s.', `The short hand is near ${hour}.`],
    });
  },
};

const COIN_VALUE = { penny: 1, nickel: 5, dime: 10, quarter: 25, dollar: 100 } as const;

export const countingMoney: Skill = {
  id: 'money',
  name: 'Counting Money',
  grades: [1, 2],
  prerequisites: ['add-within-100'],
  keywords: ['money', 'coins', 'cents', 'penny', 'nickel', 'dime', 'quarter', 'dollar'],
  teaching: {
    summary: 'Count coins to find the total value.',
    whatYouWillLearn: ['Coin values', 'Counting from the biggest coin', 'Writing cents'],
    concept: ['A penny is 1¢, a nickel 5¢, a dime 10¢ and a quarter 25¢.', 'Start counting with the coins worth the most, then count on.'],
    conceptVisual: { kind: 'coins', coins: [{ name: 'quarter', count: 1 }, { name: 'dime', count: 2 }, { name: 'penny', count: 3 }] },
    realWorld: {
      title: 'The Lemonade Stand',
      emoji: '🍋',
      scenes: [{ text: 'A cup of lemonade costs 35¢. Zoe pays with a quarter and a dime.', visual: { kind: 'coins', coins: [{ name: 'quarter', count: 1 }, { name: 'dime', count: 1 }] } }],
      question: 'How many cents did Zoe pay?',
      answer: '35',
      accept: ['35¢', '35 cents'],
      explanation: 'Quarter = 25¢, then count on a dime: 35¢. That is exactly right!',
    },
    lessonSummary: ['Know each coin’s value.', 'Start with the biggest coin and count on.'],
  },
  generate(d, rng) {
    const kinds = (d === 'easy' ? ['dime', 'penny'] : d === 'medium' ? ['dime', 'nickel', 'penny'] : ['quarter', 'dime', 'nickel', 'penny']) as (keyof typeof COIN_VALUE)[];
    const coins = kinds.map((name) => ({ name, count: randInt(rng, name === 'quarter' ? 1 : 0, name === 'quarter' ? 3 : 4) })).filter((c) => c.count > 0);
    if (!coins.length) coins.push({ name: 'dime', count: 2 });
    const total = coins.reduce((s, c) => s + COIN_VALUE[c.name] * c.count, 0);
    let running = 0;
    const counts: number[] = [];
    for (const c of coins) for (let i = 0; i < c.count; i++) counts.push((running += COIN_VALUE[c.name]));
    return problem({
      skillId: 'money',
      difficulty: d,
      prompt: 'How many cents are these coins worth?',
      answer: String(total),
      accept: [`${total}¢`, `${total} cents`],
      answerKind: 'number',
      visual: { kind: 'coins', coins },
      steps: [
        {
          title: 'Name each coin',
          what: coins.map((c) => `${c.count} ${c.name}${c.count > 1 ? 's' : ''} (${COIN_VALUE[c.name]}¢ each)`).join(', ') + '.',
          why: 'Different coins are worth different amounts.',
          rule: 'penny 1¢ · nickel 5¢ · dime 10¢ · quarter 25¢',
          math: coins.map((c) => `${c.name}: ${COIN_VALUE[c.name]}¢`).join('\n'),
          visual: { kind: 'coins', coins },
        },
        {
          title: 'Count on from the biggest',
          what: `Count: ${counts.join(', ')}.`,
          why: 'Starting with the biggest coins makes counting easier.',
          math: `total = ${total}¢`,
          mistakes: ['Counting every coin as 1.', 'Mixing up nickels and dimes (a dime is smaller but worth more!).'],
          checkpoint: { question: 'How many cents in all?', answer: String(total) },
        },
      ],
      hints: ['What is each coin worth?', 'Start with the coin worth the most.', `Count on: ${counts.slice(0, 2).join(', ')}, …`],
    });
  },
};

const SHAPES = [
  { shape: 'triangle', sides: 3 },
  { shape: 'square', sides: 4 },
  { shape: 'rectangle', sides: 4 },
  { shape: 'pentagon', sides: 5 },
  { shape: 'hexagon', sides: 6 },
] as const;

export const shapes: Skill = {
  id: 'shapes',
  name: 'Shapes & Sides',
  grades: [1, 2],
  keywords: ['shape', 'shapes', 'triangle', 'square', 'circle', 'sides', 'corners', 'vertices', 'hexagon', 'pentagon', 'geometry'],
  teaching: {
    summary: 'Name flat shapes and count their sides and corners.',
    whatYouWillLearn: ['Names of common shapes', 'Counting sides and corners'],
    concept: ['Flat (2D) shapes are made of straight sides that meet at corners (vertices).', 'A triangle has 3 sides, a square and rectangle have 4, a pentagon 5 and a hexagon 6.'],
    conceptVisual: { kind: 'shape', shape: 'hexagon', label: 'hexagon: 6 sides' },
    realWorld: {
      title: 'Shapes Around Us',
      emoji: '🐝',
      scenes: [{ text: 'Honeybees build their honeycomb out of hexagons.', visual: { kind: 'shape', shape: 'hexagon' } }],
      question: 'How many sides does each honeycomb cell have?',
      answer: '6',
      explanation: 'A hexagon has 6 sides and 6 corners.',
    },
    lessonSummary: ['Count the straight sides.', 'Corners = sides for flat shapes.'],
  },
  generate(d, rng) {
    const s = pick(rng, d === 'easy' ? SHAPES.slice(0, 3) : SHAPES);
    return problem({
      skillId: 'shapes',
      difficulty: d,
      prompt: `How many sides does this shape have?`,
      answer: String(s.sides),
      answerKind: 'number',
      visual: { kind: 'shape', shape: s.shape },
      choices: shuffle(['3', '4', '5', '6'], rng),
      steps: [
        {
          title: 'Count the sides',
          what: `Put your finger on one corner and trace around the ${s.shape}, counting each straight side.`,
          why: 'Counting carefully from one starting point stops us counting a side twice.',
          rule: `A ${s.shape} has ${s.sides} sides.`,
          math: `${s.shape}: ${s.sides} sides, ${s.sides} corners`,
          visual: { kind: 'shape', shape: s.shape, label: s.shape },
        },
      ],
      hints: ['Start at one corner.', 'Count each straight side once.'],
    });
  },
};
