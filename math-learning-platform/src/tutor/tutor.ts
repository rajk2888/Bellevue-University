import { answersMatch } from '../engine/answer';
import { SKILLS } from '../engine/registry';
import { solve } from '../engine/solver';
import type { Problem, Skill, Visual } from '../engine/types';

export interface TutorContext {
  grade: number;
  skill?: Skill;
  problem?: Problem;
  /** Index of the step the student is looking at (if any). */
  stepIndex?: number;
  lessonTitle?: string;
}

export type TutorAction = { type: 'newProblem'; change: 'easier' | 'harder' | 'same' } | { type: 'showStep'; index: number };

export interface TutorReply {
  text: string;
  visual?: Visual;
  action?: TutorAction;
  suggestions?: string[];
}

export interface ChatTurn {
  role: 'student' | 'tutor';
  text: string;
}

/**
 * A tutor provider turns a student message into a teaching reply.
 * `LocalTutor` runs entirely in the browser. A server-backed LLM tutor can
 * implement the same interface (see `RemoteTutor`).
 */
export interface TutorProvider {
  readonly name: string;
  reply(message: string, ctx: TutorContext, history: ChatTurn[]): Promise<TutorReply>;
}

const DEFAULT_SUGGESTIONS = ['Give me a hint', 'Why does this step work?', 'Show me visually', 'Give me an easier problem'];

const GLOSSARY: Record<string, string> = {
  numerator: 'The numerator is the top number of a fraction. It counts how many pieces you have.',
  denominator: 'The denominator is the bottom number of a fraction. It tells how many equal pieces make one whole — so it tells the size of each piece.',
  'common denominator': 'A common denominator is a number both denominators divide into evenly, so both fractions can be cut into same-size pieces.',
  lcd: 'LCD means least common denominator — the smallest number both denominators divide into.',
  'mixed number': 'A mixed number is a whole number and a fraction together, like 1 1/4.',
  variable: 'A variable is a letter, like x, that stands for a number we do not know yet.',
  coefficient: 'A coefficient is the number multiplied by a variable. In 3x, the coefficient is 3.',
  equation: 'An equation says two things are equal, like a balanced scale: 2x + 5 = 17.',
  slope: 'Slope tells how steep a line is: rise ÷ run, or how much y changes when x goes up by 1.',
  hypotenuse: 'The hypotenuse is the longest side of a right triangle, across from the right angle.',
  percent: 'Percent means "out of 100". 25% = 25/100 = 0.25.',
  ratio: 'A ratio compares two amounts, like 2 cups of flour for every 3 eggs (2 : 3).',
  probability: 'Probability is how likely something is: favorable outcomes ÷ total outcomes, from 0 to 1.',
  mean: 'The mean (average) is the total shared equally: add all the values and divide by how many there are.',
  integer: 'Integers are whole numbers and their opposites: … −2, −1, 0, 1, 2 …',
  derivative: 'A derivative measures how fast a function is changing — the slope of the curve at a point.',
  logarithm: 'A logarithm answers "what power?": log₂(8) = 3 because 2³ = 8.',
  quadratic: 'A quadratic has an x² term. Its graph is a U-shaped parabola.',
  area: 'Area is how many unit squares cover a flat shape.',
  product: 'The product is the answer to a multiplication.',
  sum: 'The sum is the answer to an addition.',
  quotient: 'The quotient is the answer to a division.',
};

const OPERATION_WORDS: [RegExp, RegExp][] = [
  [/divid|÷|split/, /÷|divide/i],
  [/multipl|times|×/, /×|multipl/i],
  [/subtract|minus|take away|−/, /−|subtract/i],
  [/add|plus|\+/, /\+|add/i],
  [/common denominator|lcd|same denominator/, /common denominator|lcd/i],
  [/square root|√/, /√|square root/i],
  [/simplif|reduce/, /simplif|reduce/i],
  [/cross/, /cross/i],
];

export class LocalTutor implements TutorProvider {
  readonly name = 'StepWise Tutor (on-device)';
  private hintIndex = new Map<string, number>();

  async reply(raw: string, ctx: TutorContext, history: ChatTurn[]): Promise<TutorReply> {
    const msg = raw.toLowerCase().trim();
    const { problem, skill } = ctx;
    const young = ctx.grade <= 4;
    const steps = problem?.steps ?? [];
    const curStep = ctx.stepIndex !== undefined ? steps[ctx.stepIndex] : undefined;

    if (/^(hi|hello|hey|yo)\b/.test(msg)) {
      return {
        text: `Hi! I’m your math tutor. ${problem ? `We’re working on “${problem.prompt}”. ` : ''}I won’t just give answers — I’ll help you figure it out. What would you like help with?`,
        suggestions: DEFAULT_SUGGESTIONS,
      };
    }

    // Grade-adapted re-explanation: "explain like I'm in grade 5"
    const gradeMatch = msg.match(/grade\s*(\d{1,2})|(\d{1,2})(st|nd|rd|th)\s*grade/);
    if (gradeMatch && /explain|like|as if/.test(msg)) {
      const g = Number(gradeMatch[1] ?? gradeMatch[2]);
      return this.explainAtGrade(g, ctx);
    }
    if (/simpl(er|y)|easier way|don.?t (get|understand)|confus|explain (it )?again|lost/.test(msg) && !/step\s*\d/.test(msg)) {
      return this.explainAtGrade(Math.max(1, ctx.grade - 2), ctx);
    }

    // "Step 4" questions
    const stepMatch = msg.match(/step\s*(\d+)/);
    if (stepMatch && steps.length) {
      const i = Number(stepMatch[1]) - 1;
      const s = steps[i];
      if (!s) return { text: `This problem has ${steps.length} steps. Which one would you like to look at?`, suggestions: steps.map((_, k) => `Explain step ${k + 1}`).slice(0, 4) };
      const parts = [`**Step ${i + 1}: ${s.title}.**`, young && s.simpler ? s.simpler : s.what, `**Why?** ${s.why}`];
      if (s.rule) parts.push(`**Rule:** ${s.rule}`);
      if (s.mistakes?.length) parts.push(`**Watch out:** ${s.mistakes[0]}`);
      if (s.checkpoint) parts.push(`Now you try: ${s.checkpoint.question}`);
      return { text: parts.join('\n\n'), visual: s.visual, action: { type: 'showStep', index: i }, suggestions: ['Show me visually', `Explain step ${Math.min(i + 2, steps.length)}`, 'Give me a hint'] };
    }

    // "Why did we divide by 3?"
    if (/^why|why (do|did|does|are|is|we|would)|how come/.test(msg)) {
      const named = steps.find((st) => msg.includes(st.title.toLowerCase()));
      if (named) {
        return {
          text: `Good question! We ${lowerFirst(named.title)} because ${lowerFirst(named.why)}${named.rule ? `\n\n**The rule:** ${named.rule}` : ''}`,
          visual: named.visual,
          suggestions: ['Show me visually', 'Give me a hint', 'Show me another example'],
        };
      }
      for (const [q, stepRe] of OPERATION_WORDS) {
        if (q.test(msg)) {
          const s = steps.find((st) => stepRe.test(st.math) || stepRe.test(st.what) || stepRe.test(st.title));
          if (s) {
            return {
              text: `Good question! In the step “${s.title}”: ${s.why}${s.rule ? `\n\n**The rule:** ${s.rule}` : ''}`,
              visual: s.visual,
              suggestions: ['Show me another example', 'Give me a hint', 'Explain this like I’m in grade ' + Math.max(1, ctx.grade - 2)],
            };
          }
        }
      }
      if (curStep) return { text: `We do “${curStep.title}” because ${lowerFirst(curStep.why)}${curStep.rule ? `\n\n**Rule:** ${curStep.rule}` : ''}`, visual: curStep.visual, suggestions: DEFAULT_SUGGESTIONS };
      if (skill) return { text: `${skill.teaching.concept.join(' ')}`, visual: skill.teaching.conceptVisual, suggestions: DEFAULT_SUGGESTIONS };
    }

    if (/visual|picture|draw|show me|see it|diagram|model/.test(msg) && !/example|answer/.test(msg)) {
      const v = curStep?.visual ?? steps.find((s) => s.visual)?.visual ?? problem?.visual ?? skill?.teaching.conceptVisual;
      if (v) return { text: young ? 'Here’s a picture! Look carefully at the colored parts.' : 'Here’s a visual model of the idea. Compare it with the numbers in the step.', visual: v, suggestions: ['Why does this step work?', 'Give me a hint'] };
      return { text: 'I don’t have a picture for this one yet, but try sketching it: draw each quantity and label it.' };
    }

    if (/easier|too hard|simpler problem/.test(msg)) {
      return { text: 'No problem — let’s build confidence with an easier one. Try the first step on your own!', action: { type: 'newProblem', change: 'easier' } };
    }
    if (/harder|challenge|too easy|more difficult/.test(msg)) {
      return { text: 'Love the ambition! Here’s a tougher one. Remember: slow and steady, one step at a time.', action: { type: 'newProblem', change: 'harder' } };
    }
    if (/another (example|one|problem)|new problem|more practice|different (example|problem)/.test(msg)) {
      return { text: 'Here’s another example. Before looking at the steps, what do you think the first move is?', action: { type: 'newProblem', change: 'same' } };
    }

    // Asking for the answer: teach instead.
    if (/(just )?(tell|give|show) me the answer|what.?s the answer|solution|answer is/.test(msg) && problem) {
      const asked = history.filter((h) => h.role === 'student' && /answer|solution/.test(h.text.toLowerCase())).length;
      const hint = this.nextHint(problem);
      return {
        text:
          asked >= 2
            ? `I know it’s tempting! You can press **Show Next Step** to reveal one step at a time. But first, here’s a push: ${hint}`
            : `I’d love for you to discover it — that’s how it sticks! Here’s a hint instead: ${hint}`,
        suggestions: ['Give me another hint', 'Explain step 1', 'Show me visually'],
      };
    }

    if (/hint|help|stuck|clue|nudge|where do i start|how do i start/.test(msg)) {
      if (!problem) return { text: 'Pick a problem in the workspace or type one here (like 3/4 + 1/2) and I’ll guide you.', suggestions: ['3/4 + 1/2', '2x + 5 = 17'] };
      return { text: `💡 ${this.nextHint(problem)}`, suggestions: ['Give me another hint', 'Why does this step work?', 'Show me visually'] };
    }

    // "Is it 5/4?" / "I got 7"
    const checkMatch = msg.match(/(?:is it|i got|my answer is|i think it.?s|is the answer|check)\s*:?\s*(.+?)\??$/);
    if (checkMatch && problem) {
      const guess = checkMatch[1];
      const ok = [problem.answer, ...(problem.accept ?? [])].some((a) => answersMatch(guess, a));
      return ok
        ? { text: `Yes! ${guess} is correct. 🎉 Can you explain to yourself *why* each step worked? That’s how you master it.`, suggestions: ['Give me a harder problem', 'Show me another example'] }
        : { text: `Not quite — but good try! Let’s find where it went off track. ${this.nextHint(problem)}`, suggestions: ['Explain step 1', 'Show me visually'] };
    }

    // Vocabulary: "what is a denominator"
    const defMatch = msg.match(/what(?:'s| is| are| does)?\s+(?:a |an |the )?([a-z ]+?)(?: mean)?\??$/);
    if (defMatch) {
      const term = defMatch[1].trim().replace(/s$/, '');
      const fromSkill = [skill, ...SKILLS].flatMap((s) => s?.teaching.keyVocabulary ?? []).find((v) => v.term.toLowerCase() === term);
      const def = fromSkill?.meaning ?? GLOSSARY[term] ?? GLOSSARY[term + 's'];
      if (def) return { text: def, suggestions: DEFAULT_SUGGESTIONS };
    }

    // A typed math problem.
    const solved = solve(raw);
    if (solved) {
      const first = solved.problem.steps[0];
      return {
        text: `That looks like **${solved.skill.name}**. Let’s start together.\n\n**Step 1: ${first.title}.** ${first.what}\n\n${first.checkpoint ? `Your turn: ${first.checkpoint.question}` : 'What do you think comes next?'}\n\n(Open **Solve a Problem** to walk through every step.)`,
        visual: first.visual,
        suggestions: ['Give me a hint', 'Why does this step work?'],
      };
    }

    if (/thank/.test(msg)) return { text: 'You’re welcome! Keep going — every step you take makes you stronger at math. 💪' };

    return {
      text: problem
        ? `Let’s think about “${problem.prompt}” together. You can ask me things like “Why did we do that?”, “I don’t understand step 2”, “Show me visually”, or “Give me an easier problem”.`
        : 'I can explain steps, give hints, show visuals, or make easier/harder problems. You can also type a math problem like “2x + 5 = 17”.',
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  private nextHint(problem: Problem): string {
    const i = this.hintIndex.get(problem.id) ?? 0;
    this.hintIndex.set(problem.id, i + 1);
    if (i < problem.hints.length) return `Hint ${i + 1}: ${problem.hints[i]}`;
    const step = problem.steps[Math.min(i - problem.hints.length, problem.steps.length - 1)];
    return `Let’s look at a step together — **${step.title}**: ${step.what}`;
  }

  private explainAtGrade(g: number, ctx: TutorContext): TutorReply {
    const s = ctx.stepIndex !== undefined ? ctx.problem?.steps[ctx.stepIndex] : undefined;
    const t = ctx.skill?.teaching;
    if (s) {
      const text =
        g <= 4
          ? `${s.simpler ?? s.what} ${s.visual ? 'Look at the picture to see it.' : ''}`
          : g <= 8
            ? `${s.what} ${s.why}`
            : `${s.what} ${s.why}${s.rule ? ` Formally: ${s.rule}` : ''}`;
      return { text: `Explaining for grade ${g}: ${text}`, visual: s.visual, suggestions: ['Show me visually', 'Give me a hint'] };
    }
    if (t) {
      const text = g <= 4 ? t.concept[0] + (t.realWorld ? ` Imagine: ${t.realWorld.scenes[0].text}` : '') : t.concept.join(' ');
      return { text: `Explaining for grade ${g}: ${text}`, visual: t.conceptVisual, suggestions: ['Show me another example', 'Give me a hint'] };
    }
    return { text: 'Tell me which problem or step you’d like explained, and I’ll make it simpler.' };
  }
}

/**
 * Optional server-backed tutor (e.g. an LLM behind your own API).
 * Set VITE_TUTOR_ENDPOINT at build time to enable it. The endpoint receives
 * `{ message, context, history }` and returns a `TutorReply`. The server is
 * responsible for keeping the tutor hint-first; API keys never ship to the browser.
 */
export class RemoteTutor implements TutorProvider {
  readonly name = 'StepWise Tutor (AI)';
  private readonly endpoint: string;
  private readonly fallback: TutorProvider;

  constructor(endpoint: string, fallback: TutorProvider) {
    this.endpoint = endpoint;
    this.fallback = fallback;
  }

  async reply(message: string, ctx: TutorContext, history: ChatTurn[]): Promise<TutorReply> {
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: history.slice(-12),
          context: {
            grade: ctx.grade,
            skill: ctx.skill?.name,
            lesson: ctx.lessonTitle,
            problem: ctx.problem?.prompt,
            steps: ctx.problem?.steps.map((s) => ({ title: s.title, math: s.math })),
            stepIndex: ctx.stepIndex,
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as TutorReply;
    } catch {
      return this.fallback.reply(message, ctx, history);
    }
  }
}

export function createTutor(): TutorProvider {
  const local = new LocalTutor();
  const endpoint = import.meta.env.VITE_TUTOR_ENDPOINT as string | undefined;
  return endpoint ? new RemoteTutor(endpoint, local) : local;
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
