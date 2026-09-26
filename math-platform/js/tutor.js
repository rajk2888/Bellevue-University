/* StepWise Math — AI Math Tutor.
 * Developed by Rajkumar Kuppuswami.
 *
 * Two providers behind one interface:
 *   1. Claude, when the page runs inside a Claude artifact viewer that grants
 *      the `sample` capability (the viewer consents on first use).
 *   2. A built-in teaching tutor that works everywhere, offline, from the
 *      current lesson's step data.
 * Requests that change the page (easier/harder problem, show visually, go to a
 * step) are recognized locally first, so they work with either provider.
 */
(function (SW) {
  "use strict";
  let samplePromise = null;
  function getSample() {
    if (!samplePromise) {
      samplePromise = (window.claude && typeof window.claude.use === "function")
        ? window.claude.use("sample").catch(() => null)
        : Promise.resolve(null);
    }
    return samplePromise;
  }

  const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, first: 1, second: 2, third: 3, fourth: 4, fifth: 5, last: -1 };

  /** Recognize requests the page itself should act on. */
  function intent(q) {
    const s = q.toLowerCase();
    let m;
    if (/easier|too hard|simpler problem/.test(s)) return { action: "easier" };
    if (/harder|challenge|too easy|more difficult/.test(s)) return { action: "harder" };
    if (/show (me )?(it )?visual|picture|draw|diagram|see it/.test(s)) return { action: "visual" };
    if (/another example|new example|different example|one more example/.test(s)) return { action: "example" };
    if ((m = s.match(/step\s*(\d+)/)) || (m = s.match(/(first|second|third|fourth|fifth|last)\s+step/))) {
      const n = isNaN(+m[1]) ? NUM_WORDS[m[1]] : +m[1];
      return { action: "step", n };
    }
    if ((m = s.match(/(?:like|as if) i'?m in (?:grade|year)\s*(\d+)|grade\s*(\d+)/))) return { action: "grade", grade: +(m[1] || m[2]) };
    if (/just (tell|give)|what'?s the answer|the answer\??$/.test(s)) return { action: "answer" };
    return { action: "explain" };
  }

  function contextText(ctx) {
    if (!ctx || !ctx.solution) return "The student is browsing lessons.";
    const lines = [`Problem: ${ctx.problemText}`, `Grade: ${ctx.grade}`, `The student is on step ${ctx.stepIndex + 1} of ${ctx.solution.steps.length}.`];
    ctx.solution.steps.forEach((st, i) => lines.push(`Step ${i + 1} (${st.title}): ${st.what} Why: ${st.why} Rule: ${st.rule}`));
    if (ctx.lastAnswer) lines.push(`The student's last attempt: ${ctx.lastAnswer} (${ctx.lastCorrect ? "correct" : "incorrect"}).`);
    return lines.join("\n");
  }

  /** Built-in tutor: teaches from the step data, never jumps straight to the answer. */
  function localAnswer(q, it, ctx) {
    const sol = ctx && ctx.solution;
    if (!sol) return "Pick a lesson or type a problem in “Solve a Problem”, and I can walk through it with you step by step.";
    const steps = sol.steps;
    const cur = steps[Math.min(ctx.stepIndex, steps.length - 1)];
    const s = q.toLowerCase();
    if (it.action === "step") {
      const i = it.n === -1 ? steps.length - 1 : it.n - 1;
      const st = steps[i];
      if (!st) return `This problem has ${steps.length} steps. Which one should we look at?`;
      return `Step ${i + 1}: ${st.title}.\n\nWhat we do: ${st.what}\n\nWhy: ${st.why}\n\nAnother way to see it: ${st.again}\n\nWatch out: ${st.mistake}`;
    }
    if (it.action === "answer") {
      return `Let's get there together so you can do the next one on your own. Try this: ${cur.ask ? cur.ask.prompt : cur.what} If you're stuck, press “Give Me a Hint”.`;
    }
    if (it.action === "grade") {
      const g = it.grade;
      return g <= 4
        ? `Think of it with real things. ${cur.again}`
        : g <= 8
          ? `${cur.what} We do this because ${cur.why.charAt(0).toLowerCase() + cur.why.slice(1)}`
          : `${cur.rule} Applied here: ${cur.what}`;
    }
    if (/why/.test(s)) {
      const hit = steps.find((st) => s.split(/\W+/).some((w) => w.length > 3 && (st.what + st.title).toLowerCase().includes(w))) || cur;
      return `${hit.why}\n\nThe rule behind it: ${hit.rule}`;
    }
    if (/don'?t (get|understand)|confus|lost|help/.test(s)) {
      return `No problem. Let's slow down on “${cur.title}”.\n\n${cur.again}\n\nA common slip here: ${cur.mistake}\n\nWant me to show it visually? Just ask “show me visually”.`;
    }
    if (/mistake|wrong|error/.test(s)) return `The most common mistake here: ${cur.mistake}`;
    return `Here's the idea behind this step: ${cur.why}\n\nTry asking “Why did we do step 2?”, “Explain this like I'm in Grade 4”, or “Give me an easier problem”.`;
  }

  SW.tutor = {
    intent,
    /** Resolves to true when Claude can answer (checked without prompting the viewer). */
    async claudeAvailable() { return !!(await getSample()); },
    /**
     * Ask the tutor. Returns { text, action, provider }.
     * `history` is [{role, content}] for multi-turn chat with Claude.
     */
    async ask(question, ctx, { onText, signal, history = [], useClaude = true } = {}) {
      const it = intent(question);
      if (["easier", "harder", "visual", "example"].includes(it.action)) {
        const text = {
          easier: "Here's an easier one. Take it one step at a time.",
          harder: "Ready for more? Here's a harder one.",
          visual: "Here's a picture of this step.",
          example: "Here's another example to try.",
        }[it.action];
        return { text, action: it, provider: "local" };
      }
      const sample = useClaude ? await getSample() : null;
      if (sample) {
        const grade = (ctx && ctx.grade) || 5;
        const instructions = [
          `You are a patient math tutor for a Grade ${grade} student using StepWise Math.`,
          "Teach; do not just give answers. Explain why each step works, using words a student in this grade understands.",
          "If the student asks for the answer, guide them to the next step with a question or hint instead.",
          "Keep replies short (under 120 words), friendly and encouraging. Use plain text; write fractions like 3/4.",
          "Never shame mistakes. If the student is wrong, point to the exact step to re-check.",
          "",
          "Current lesson context:",
          contextText(ctx),
        ].join("\n");
        const turns = [...history.slice(-6), { role: "user", content: `${instructions}\n\nStudent: ${question}` }];
        try {
          const { text } = await sample(turns, { onText, signal, modelTier: "quick", cache: false });
          return { text, action: it, provider: "claude" };
        } catch (e) {
          if (e && e.code === "cancelled") return { text: e.text || "", action: it, provider: "claude", cancelled: true };
          // Any other failure (declined, rate limited, offline): fall back to the built-in tutor.
          return { text: localAnswer(question, it, ctx), action: it, provider: "local", fallback: e && e.code };
        }
      }
      return { text: localAnswer(question, it, ctx), action: it, provider: "local" };
    },
  };
})(window.StepWise = window.StepWise || {});
