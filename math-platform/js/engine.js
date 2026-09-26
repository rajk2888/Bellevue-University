/* StepWise Math — step-by-step explanation engine.
 * Developed by Rajkumar Kuppuswami.
 *
 * Each engine turns a problem into teaching steps. The contract:
 *   generate(difficulty)   -> problem          (difficulty: easy|medium|hard|challenge)
 *   parse(text)            -> problem | null   (for "Enter a Math Problem")
 *   solve(problem)         -> { steps, answer, answerText }
 *   check(problem, input)  -> { correct, close, message }
 *   hints(problem)         -> [hint1, hint2, hint3]   (progressively more specific)
 *   text(problem)          -> printable problem string
 *
 * A step is:
 *   { title, what, why, rule, mistake, again, expr, visual, ask }
 * `ask` ({ prompt, answer, kind }) lets the student try the step before it is shown.
 * `visual` is a descriptor rendered by visuals.js.
 */
(function (SW) {
  "use strict";

  // ---------- rational arithmetic ----------
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  const R = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } return { n, d }; };
  const reduce = (f) => { const g = gcd(f.n, f.d); return R(f.n / g, f.d / g); };
  const eq = (a, b) => a.n * b.d === b.n * a.d;
  const fstr = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
  const mixed = (f) => {
    f = reduce(f);
    if (f.d === 1) return String(f.n);
    if (Math.abs(f.n) < f.d) return `${f.n}/${f.d}`;
    const sign = f.n < 0 ? "−" : "";
    const n = Math.abs(f.n);
    return `${sign}${Math.floor(n / f.d)} ${n % f.d}/${f.d}`;
  };
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const minus = (s) => String(s).replace(/-/g, "−");

  /** Parse a student's answer: "5/4", "1 1/4", "1.25", "-3", "x = 6". Returns a rational or null. */
  function parseNumber(raw) {
    if (raw == null) return null;
    let s = String(raw).trim().replace(/[−–]/g, "-").replace(/^[a-z]\s*=\s*/i, "")
      .replace(/\s*(m²|m2|cm²|square units|units?|cups?|m)\s*$/i, "").replace(/[$,%\s]+$/g, "").replace(/^\$/, "").replace(/,/g, "");
    if (!s) return null;
    let m;
    if ((m = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/))) {
      const w = +m[2], n = +m[3], d = +m[4];
      if (!d) return null;
      return R((m[1] ? -1 : 1) * (w * d + n), d);
    }
    if ((m = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/))) { if (+m[2] === 0) return null; return R(+m[1], +m[2]); }
    if ((m = s.match(/^-?\d*\.?\d+$/))) {
      const parts = s.split(".");
      if (parts.length === 1) return R(+s, 1);
      const d = 10 ** parts[1].length;
      return reduce(R(Math.round(+s * d), d));
    }
    return null;
  }

  // ---------- fraction addition / subtraction ----------
  function fractionEngine(op) {
    const sym = op === "+" ? "+" : "−";
    const verb = op === "+" ? "add" : "subtract";
    return {
      id: op === "+" ? "fractionAdd" : "fractionSub",
      answerKind: "fraction",
      text: (p) => `${fstr(p.a)} ${sym} ${fstr(p.b)}`,
      generate(level = "medium") {
        let a, b;
        for (let tries = 0; tries < 50; tries++) {
          if (level === "easy") { const d = pick([3, 4, 5, 6, 8, 10]); a = R(rnd(1, d - 1), d); b = R(rnd(1, d - 1), d); }
          else if (level === "medium") { const d1 = pick([2, 3, 4, 5]); const k = pick([2, 3]); a = R(rnd(1, d1 * k - 1), d1 * k); b = R(rnd(1, d1 - 1), d1); if (Math.random() < 0.5) [a, b] = [b, a]; }
          else if (level === "hard") { const [d1, d2] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 6], [6, 8], [4, 10]]); a = R(rnd(1, d1 - 1), d1); b = R(rnd(1, d2 - 1), d2); }
          else { const [d1, d2] = pick([[6, 8], [4, 6], [9, 12], [10, 15], [8, 12]]); a = R(rnd(d1 - 3, d1 - 1), d1); b = R(rnd(d2 - 4, d2 - 1), d2); }
          if (op === "-" && a.n * b.d < b.n * a.d) [a, b] = [b, a];
          if (op === "-" && eq(a, b)) continue;
          if (gcd(a.n, a.d) === 1 && gcd(b.n, b.d) === 1) break;
        }
        return { engine: this.id, a, b, op, level };
      },
      parse(text) {
        const s = text.replace(/[−–]/g, "-").replace(/\s+/g, "");
        const m = s.match(/^(\d+)\/(\d+)([+-])(\d+)\/(\d+)(=\??)?$/);
        if (!m || (m[3] === "+") !== (op === "+") || +m[2] === 0 || +m[5] === 0) return null;
        return { engine: this.id, a: R(+m[1], +m[2]), b: R(+m[4], +m[5]), op };
      },
      result(p) { return reduce(R(p.a.n * p.b.d + (op === "+" ? 1 : -1) * p.b.n * p.a.d, p.a.d * p.b.d)); },
      solve(p) {
        const { a, b } = p;
        const L = lcm(a.d, b.d);
        const ka = L / a.d, kb = L / b.d;
        const A = R(a.n * ka, L), B = R(b.n * kb, L);
        const sumN = op === "+" ? A.n + B.n : A.n - B.n;
        const raw = R(sumN, L);
        const red = reduce(raw);
        const steps = [];
        const same = a.d === b.d;
        steps.push({
          title: "Look at the denominators",
          what: `The denominators are ${a.d} and ${b.d}.`,
          why: "The denominator tells us the size of each piece. We can only " + verb + " pieces that are the same size.",
          rule: "Fractions can be added or subtracted directly only when their denominators match.",
          mistake: `Adding the denominators too: ${a.n}/${a.d} ${sym} ${b.n}/${b.d} is not ${a.n + (op === "+" ? b.n : -b.n)}/${a.d + b.d}.`,
          again: same ? `Both fractions are cut into ${a.d} equal pieces, so the pieces already match.` : `One fraction is cut into ${a.d} pieces and the other into ${b.d}. Those pieces are different sizes, like comparing big slices with small slices.`,
          expr: `${fstr(a)} ${sym} ${fstr(b)}`,
          visual: { kind: "fractionBars", rows: [a, b], label: "Different piece sizes" },
        });
        if (!same) {
          steps.push({
            title: "Find a common denominator",
            what: `The least common denominator of ${a.d} and ${b.d} is ${L}.`,
            why: `${L} is the smallest number that both ${a.d} and ${b.d} divide into evenly, so both fractions can be cut into ${L} equal pieces.`,
            rule: "Least common denominator = least common multiple of the denominators.",
            mistake: "Picking a number only one denominator divides into, or multiplying the denominators when a smaller number works (that still works, but you will need to simplify more).",
            again: `List multiples: ${a.d}: ${[1, 2, 3, 4, 5].map((i) => a.d * i).join(", ")}… and ${b.d}: ${[1, 2, 3, 4, 5].map((i) => b.d * i).join(", ")}… The first number on both lists is ${L}.`,
            expr: `LCD(${a.d}, ${b.d}) = ${L}`,
            visual: { kind: "multiples", a: a.d, b: b.d, lcm: L },
            ask: { prompt: `What is the least common denominator of ${a.d} and ${b.d}?`, answer: R(L), kind: "number" },
          });
          const conv = [];
          if (ka !== 1) conv.push(`${fstr(a)} = ${a.n}×${ka} / ${a.d}×${ka} = ${fstr(A)}`);
          if (kb !== 1) conv.push(`${fstr(b)} = ${b.n}×${kb} / ${b.d}×${kb} = ${fstr(B)}`);
          const target = kb !== 1 ? { f: b, F: B, k: kb } : { f: a, F: A, k: ka };
          steps.push({
            title: "Rename the fractions",
            what: conv.join(";  "),
            why: "Multiplying the top and bottom by the same number is multiplying by 1, so the amount stays the same. Only the piece size changes.",
            rule: "a/b = (a×k)/(b×k) for any k ≠ 0 (equivalent fractions).",
            mistake: "Multiplying only the denominator. That changes the amount.",
            again: `Cutting each of the ${target.f.d} pieces into ${target.k} smaller pieces gives ${target.F.d} pieces, and the ${target.f.n} you had become ${target.F.n}.`,
            expr: `${fstr(A)} ${sym} ${fstr(B)}`,
            visual: { kind: "fractionBars", rows: [a, A, b, B], pairs: true, label: "Same amount, smaller pieces" },
            ask: { prompt: `Rename ${fstr(target.f)} with denominator ${L}. What is the new numerator?`, answer: R(target.F.n), kind: "number" },
          });
        }
        steps.push({
          title: `${op === "+" ? "Add" : "Subtract"} the numerators`,
          what: `${fstr(A)} ${sym} ${fstr(B)} = ${sumN}/${L}`,
          why: `Now every piece is a ${L === 1 ? "whole" : "1/" + L}. We just count pieces: ${A.n} ${sym} ${B.n} = ${sumN}. The piece size (denominator) does not change.`,
          rule: `a/c ${sym} b/c = (a ${sym} b)/c`,
          mistake: `Changing the denominator: the answer is not ${sumN}/${op === "+" ? 2 * L : 0}. Pieces stay the same size.`,
          again: `Think of ${L === 4 ? "quarters" : "pieces"}: ${A.n} pieces ${op === "+" ? "plus" : "take away"} ${B.n} pieces is ${sumN} pieces, each still 1/${L}.`,
          expr: `${sumN}/${L}`,
          visual: { kind: "fractionBars", rows: [R(sumN, L)], label: "Count the shaded pieces" },
          ask: { prompt: `${fstr(A)} ${sym} ${fstr(B)} = ?/${L}. What is the numerator?`, answer: R(sumN), kind: "number" },
        });
        const needsSimplify = red.d !== L || Math.abs(red.n) >= red.d;
        steps.push({
          title: needsSimplify ? "Simplify" : "Check if it simplifies",
          what: needsSimplify
            ? `${sumN}/${L}${red.d !== L ? ` = ${fstr(red)} (divide top and bottom by ${gcd(sumN, L)})` : ""}${Math.abs(red.n) > red.d && red.d !== 1 ? ` = ${mixed(red)}` : ""}`
            : `${sumN}/${L} is already in simplest form.`,
          why: needsSimplify
            ? (Math.abs(red.n) >= red.d ? "The numerator is bigger than the denominator, so we have more than one whole. A mixed number shows the wholes and the leftover part." : "Dividing top and bottom by their greatest common factor gives the same amount with the smallest numbers.")
            : `${sumN} and ${L} share no factor bigger than 1.`,
          rule: "Divide numerator and denominator by their GCF; write improper fractions as mixed numbers when asked.",
          mistake: "Stopping at an improper or unsimplified fraction when the question asks for simplest form.",
          again: Math.abs(red.n) >= red.d && red.d !== 1 ? `${Math.abs(red.n)} ÷ ${red.d} = ${Math.floor(Math.abs(red.n) / red.d)} remainder ${Math.abs(red.n) % red.d}: that is ${Math.floor(Math.abs(red.n) / red.d)} whole and ${Math.abs(red.n) % red.d}/${red.d} left over.` : "Look for a number that divides both the top and bottom.",
          expr: mixed(red),
          visual: Math.abs(red.n) >= red.d ? { kind: "fractionCircles", value: red, label: mixed(red) } : { kind: "fractionBars", rows: [red] },
          ask: needsSimplify ? { prompt: `Write ${sumN}/${L} in simplest form (a mixed number is fine).`, answer: red, kind: "fraction" } : null,
        });
        return { steps, answer: red, answerText: mixed(red) };
      },
      check(p, input) {
        const v = parseNumber(input);
        const ans = this.result(p);
        if (!v) return { correct: false, message: "Type a fraction like 5/4, a mixed number like 1 1/4, or a whole number." };
        if (eq(v, ans)) {
          // v is built from the typed digits, so a common factor means the student did not simplify.
          const typed = String(input).trim().replace(/[−–]/g, "-");
          const m = typed.match(/(\d+)\s*\/\s*(\d+)\s*$/);
          if (m && gcd(+m[1], +m[2]) > 1) return { correct: true, close: true, message: `Right amount! ${m[1]}/${m[2]} can be simplified to ${mixed(ans)}.` };
          return { correct: true, message: `Correct! ${this.text(p)} = ${mixed(ans)}.` };
        }
        const { a, b } = p;
        const naiveN = op === "+" ? a.n + b.n : a.n - b.n;
        if (v.n === naiveN && v.d === (op === "+" ? a.d + b.d : a.d - b.d)) return { correct: false, message: `It looks like you ${verb}ed the denominators too. The denominator is the piece size, and pieces don't change size when you ${verb} them. First make the denominators match.` };
        if ((v.d === a.d || v.d === b.d) && v.n === naiveN && a.d !== b.d) return { correct: false, message: `You ${verb}ed the numerators ${a.n} and ${b.n} but the pieces were different sizes (${a.d}ths and ${b.d}ths). Rename both fractions with a common denominator first.` };
        return { correct: false, message: "Not quite. Check that both fractions have the same denominator before you " + verb + "." };
      },
      hints(p) {
        const L = lcm(p.a.d, p.b.d);
        if (p.a.d === p.b.d) return ["Look at the denominators. Are the pieces the same size?", `They are both ${p.a.d}ths, so just ${verb} the numerators.`, `${p.a.n} ${sym} ${p.b.n} = ${op === "+" ? p.a.n + p.b.n : p.a.n - p.b.n}. Keep the denominator ${p.a.d}, then simplify.`];
        const small = p.a.d < p.b.d ? p.a : p.b;
        return [
          "Look at the denominators.",
          `Can you find a number that both ${p.a.d} and ${p.b.d} divide into evenly?`,
          `Try ${L}. Convert ${fstr(small)} into ${L}ths: multiply top and bottom by ${L / small.d}.`,
        ];
      },
    };
  }

  // ---------- linear equations ax + b = c ----------
  const linear = {
    id: "linear",
    answerKind: "number",
    text: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : minus(p.a)}x ${p.b < 0 ? "−" : "+"} ${Math.abs(p.b)} = ${minus(p.c)}`,
    generate(level = "medium") {
      const x = level === "easy" ? rnd(1, 9) : rnd(-6, 12) || 3;
      const a = level === "easy" ? 1 : level === "medium" ? rnd(2, 5) : pick([2, 3, 4, 5, 6, -2, -3]);
      const b = level === "easy" ? rnd(1, 12) : rnd(-15, 20) || 4;
      return { engine: "linear", a, b, c: a * x + b, level };
    },
    parse(text) {
      const s = text.replace(/[−–]/g, "-").replace(/\s+/g, "").toLowerCase();
      let m = s.match(/^([+-]?\d*)\*?([a-z])([+-]\d+)?=([+-]?\d+)$/);
      if (m) {
        const a = m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : +m[1];
        if (a === 0) return null;
        return { engine: "linear", a, b: m[3] ? +m[3] : 0, c: +m[4], v: m[2] };
      }
      m = s.match(/^([+-]?\d+)\+([+-]?\d*)\*?([a-z])=([+-]?\d+)$/);
      if (m) {
        const a = m[2] === "" || m[2] === "+" ? 1 : m[2] === "-" ? -1 : +m[2];
        if (a === 0) return null;
        return { engine: "linear", a, b: +m[1], c: +m[4], v: m[3] };
      }
      return null;
    },
    solve(p) {
      const v = p.v || "x";
      const rhs = p.c - p.b;
      const x = reduce(R(rhs, p.a));
      const ax = `${p.a === 1 ? "" : p.a === -1 ? "−" : minus(p.a)}${v}`;
      const steps = [
        { title: "Understand the goal", what: `We want ${v} by itself on one side of ${this.text(p).replace(/x/g, v)}.`,
          why: "An equation is like a balanced scale. Whatever we do to one side, we must do to the other to keep it balanced.",
          rule: "Equality is preserved when both sides get the same operation.",
          mistake: "Changing only one side of the equation.",
          again: `Read it as: "${p.a} times a mystery number, ${p.b < 0 ? "minus" : "plus"} ${Math.abs(p.b)}, equals ${p.c}." We undo those operations in reverse order.`,
          expr: this.text(p).replace(/x/g, v), visual: { kind: "balance", left: `${ax} ${p.b < 0 ? "−" : "+"} ${Math.abs(p.b)}`, right: minus(p.c) } },
      ];
      if (p.b !== 0) steps.push({
        title: p.b > 0 ? `Subtract ${p.b} from both sides` : `Add ${-p.b} to both sides`,
        what: `${ax} ${p.b < 0 ? "−" : "+"} ${Math.abs(p.b)} ${p.b > 0 ? "− " + p.b : "+ " + -p.b} = ${minus(p.c)} ${p.b > 0 ? "− " + p.b : "+ " + -p.b}, so ${ax} = ${minus(rhs)}`,
        why: `${p.b > 0 ? "Subtracting" : "Adding"} ${Math.abs(p.b)} cancels the ${p.b > 0 ? "+" : "−"}${Math.abs(p.b)} on the left, leaving only the ${v}-term.`,
        rule: "Inverse operations: addition and subtraction undo each other.",
        mistake: `Doing it on the left only, or getting the sign wrong: ${minus(p.c)} ${p.b > 0 ? "−" : "+"} ${Math.abs(p.b)} = ${minus(rhs)}.`,
        again: `Take ${Math.abs(p.b)} ${p.b > 0 ? "off" : "onto"} both pans of the scale. It stays balanced, and the left side is now just ${ax}.`,
        expr: `${ax} = ${minus(rhs)}`, visual: { kind: "balance", left: ax, right: minus(rhs) },
        ask: { prompt: `After ${p.b > 0 ? "subtracting " + p.b : "adding " + -p.b} on both sides, ${ax} = ?`, answer: R(rhs), kind: "number" },
      });
      if (p.a !== 1) steps.push({
        title: `Divide both sides by ${minus(p.a)}`,
        what: `${ax} ÷ ${minus(p.a)} = ${minus(rhs)} ÷ ${minus(p.a)}, so ${v} = ${minus(mixed(x))}`,
        why: `${ax} means ${minus(p.a)} × ${v}. Dividing by ${minus(p.a)} undoes the multiplication.`,
        rule: "Inverse operations: multiplication and division undo each other.",
        mistake: p.a < 0 ? "Losing the negative sign when dividing by a negative number." : `Subtracting ${p.a} instead of dividing by it.`,
        again: `If ${minus(p.a)} equal groups make ${minus(rhs)}, each group is ${minus(rhs)} ÷ ${minus(p.a)}.`,
        expr: `${v} = ${minus(mixed(x))}`, visual: { kind: "balance", left: v, right: minus(mixed(x)) },
        ask: { prompt: `${ax} = ${minus(rhs)}. So ${v} = ?`, answer: x, kind: "fraction" },
      });
      steps.push({
        title: "Check the answer",
        what: `${minus(p.a)} × (${minus(mixed(x))}) ${p.b < 0 ? "−" : "+"} ${Math.abs(p.b)} = ${minus(p.c)} ✓`,
        why: "Substituting the answer back into the original equation proves it balances.",
        rule: "A solution makes the equation true.",
        mistake: "Skipping the check. It catches most sign errors.",
        again: `Put ${minus(mixed(x))} in place of ${v}. If both sides come out equal, you are right.`,
        expr: `${v} = ${minus(mixed(x))}`, visual: null,
      });
      return { steps, answer: x, answerText: `${v} = ${minus(mixed(x))}` };
    },
    check(p, input) {
      const v = parseNumber(input);
      const x = reduce(R(p.c - p.b, p.a));
      if (!v) return { correct: false, message: "Type a number, like 6 or −2." };
      if (eq(v, x)) return { correct: true, message: `Correct! x = ${minus(mixed(x))}. Check: ${p.a}(${minus(mixed(x))}) ${p.b < 0 ? "−" : "+"} ${Math.abs(p.b)} = ${p.c}.` };
      if (eq(v, reduce(R(p.c + p.b, p.a)))) return { correct: false, message: `Check the first move: to undo ${p.b > 0 ? "+" : "−"}${Math.abs(p.b)} you ${p.b > 0 ? "subtract" : "add"} ${Math.abs(p.b)} on both sides.` };
      if (eq(v, R(p.c - p.b))) return { correct: false, message: `Good start: ${p.a}x = ${p.c - p.b}. Now divide both sides by ${p.a}.` };
      return { correct: false, message: `Not quite. Try substituting your answer: ${p.a} × ${fstr(v)} ${p.b < 0 ? "−" : "+"} ${Math.abs(p.b)} = ${fstr(reduce(R(p.a * v.n + p.b * v.d, v.d)))}, not ${p.c}.` };
    },
    hints(p) {
      return [
        `What is being done to x? It is multiplied by ${p.a}${p.b ? ` and then ${p.b > 0 ? p.b + " is added" : -p.b + " is subtracted"}` : ""}.`,
        p.b ? `Undo the ${p.b > 0 ? "+" : "−"}${Math.abs(p.b)} first: ${p.b > 0 ? "subtract" : "add"} ${Math.abs(p.b)} on both sides.` : `Divide both sides by ${p.a}.`,
        `${p.a}x = ${p.c - p.b}. Now divide both sides by ${p.a}.`,
      ];
    },
  };

  // ---------- small engines for other topics ----------
  function simpleEngine(def) {
    return Object.assign({
      answerKind: "number",
      check(p, input) {
        const v = parseNumber(input);
        const ans = this.solve(p).answer;
        if (!v) return { correct: false, message: "Type a number." };
        if (eq(v, ans) || Math.abs(v.n / v.d - ans.n / ans.d) < 0.005) return { correct: true, message: `Correct! The answer is ${this.solve(p).answerText}.` };
        const diag = def.diagnose && def.diagnose(p, v);
        return { correct: false, message: diag || "Not quite. Try the hint, or work through the first step." };
      },
      parse: () => null,
    }, def);
  }

  const addition = simpleEngine({
    id: "addition",
    text: (p) => `${p.a} + ${p.b}`,
    generate(level) { const big = level === "easy" ? 9 : level === "medium" ? 20 : 99; return { engine: "addition", a: rnd(2, big), b: rnd(2, big) }; },
    parse(text) { const m = text.replace(/\s/g, "").match(/^(\d+)\+(\d+)(=\??)?$/); return m ? { engine: "addition", a: +m[1], b: +m[2] } : null; },
    solve(p) {
      const s = p.a + p.b;
      const steps = [];
      if (p.a < 10 && p.b < 10) {
        const big = Math.max(p.a, p.b), small = Math.min(p.a, p.b);
        steps.push({ title: "Start with the bigger number", what: `Start at ${big}.`, why: "Counting on from the bigger number means fewer counts.", rule: "Addition can be done in any order: a + b = b + a.", mistake: "Starting to count from 1 every time. It works but is slow and easy to lose track.", again: `Put ${big} in your head, then count up ${small} more.`, expr: `${big} + ${small}`, visual: { kind: "counters", a: big, b: small } });
        steps.push({ title: `Count on ${small}`, what: `${Array.from({ length: small }, (_, i) => big + i + 1).join(", ")}`, why: `Each count adds one. After ${small} counts we reach the total.`, rule: "Counting on", mistake: "Counting the starting number again.", again: `Use your fingers: hold up ${small} and say the next number for each one.`, expr: `${s}`, visual: { kind: "numberLine", from: 0, to: Math.max(20, s + 2), start: big, jumps: [small] }, ask: { prompt: `${big} + ${small} = ?`, answer: R(s), kind: "number" } });
      } else {
        const o = (p.a % 10) + (p.b % 10), t = Math.floor(p.a / 10) + Math.floor(p.b / 10);
        steps.push({ title: "Add the ones", what: `${p.a % 10} + ${p.b % 10} = ${o}`, why: "We line up by place value and start with the ones column.", rule: "Add digits in the same place value.", mistake: "Adding a tens digit to a ones digit.", again: `The ones digits are ${p.a % 10} and ${p.b % 10}.`, expr: `${o}`, visual: { kind: "baseTen", numbers: [p.a, p.b] }, ask: { prompt: `${p.a % 10} + ${p.b % 10} = ?`, answer: R(o), kind: "number" } });
        if (o >= 10) steps.push({ title: "Regroup ten ones", what: `${o} ones = 1 ten and ${o - 10} ones`, why: "Ten ones make one ten, so we carry 1 to the tens column.", rule: "10 ones = 1 ten", mistake: `Writing ${o} in the ones place.`, again: `Bundle 10 of the ${o} ones into a rod. ${o - 10} ones stay loose.`, expr: `carry 1`, visual: null });
        steps.push({ title: "Add the tens", what: `${Math.floor(p.a / 10)} + ${Math.floor(p.b / 10)}${o >= 10 ? " + 1 (carried)" : ""} = ${t + (o >= 10 ? 1 : 0)} tens`, why: "Now add the tens column, including any ten we carried.", rule: "Add digits in the same place value.", mistake: "Forgetting the carried 1.", again: "Count the rods.", expr: `${s}`, visual: null, ask: { prompt: `${p.a} + ${p.b} = ?`, answer: R(s), kind: "number" } });
      }
      return { steps, answer: R(s), answerText: String(s) };
    },
    hints: (p) => ["Start with the bigger number.", p.a + p.b > 10 ? "Try making a ten first." : "Count on one at a time.", `${Math.max(p.a, p.b)} + ${Math.min(p.a, p.b)}: count up ${Math.min(p.a, p.b)} from ${Math.max(p.a, p.b)}.`],
  });

  const subtraction = simpleEngine({
    id: "subtraction",
    text: (p) => `${p.a} − ${p.b}`,
    generate(level) { const a = rnd(level === "easy" ? 5 : 11, level === "easy" ? 10 : 20); return { engine: "subtraction", a, b: rnd(1, a - 1) }; },
    parse(text) { const m = text.replace(/\s/g, "").replace(/[−–]/g, "-").match(/^(\d+)-(\d+)(=\??)?$/); return m && +m[1] >= +m[2] ? { engine: "subtraction", a: +m[1], b: +m[2] } : null; },
    solve(p) {
      const d = p.a - p.b;
      return { answer: R(d), answerText: String(d), steps: [
        { title: "Start at the bigger number", what: `Start at ${p.a} on the number line.`, why: "Subtracting means moving back, or taking away.", rule: "a − b: start at a, move b steps left.", mistake: "Subtracting in the wrong order. 15 − 6 is not 6 − 15.", again: `Put your finger on ${p.a}.`, expr: `${p.a} − ${p.b}`, visual: { kind: "numberLine", from: 0, to: Math.max(20, p.a + 1), start: p.a, jumps: [-p.b] } },
        { title: `Count back ${p.b}`, what: `${p.a} − ${p.b} = ${d}`, why: `Each step back takes away one. After ${p.b} steps we land on ${d}.`, rule: "Counting back", mistake: "Counting the starting number as a step.", again: `Or count up from ${p.b} to ${p.a}: that is ${d} steps.`, expr: `${d}`, visual: { kind: "counters", a: p.a, b: 0, crossed: p.b }, ask: { prompt: `${p.a} − ${p.b} = ?`, answer: R(d), kind: "number" } },
      ] };
    },
    hints: (p) => ["Which number do you start from?", `Start at ${p.a} and move back.`, `Count back ${p.b} steps from ${p.a}.`],
  });

  const multiplication = simpleEngine({
    id: "multiplication",
    text: (p) => `${p.a} × ${p.b}`,
    generate(level) { const m = level === "easy" ? 5 : 10; return { engine: "multiplication", a: rnd(2, m), b: rnd(2, m) }; },
    parse(text) { const m = text.replace(/\s/g, "").match(/^(\d+)[x×*](\d+)(=\??)?$/i); return m ? { engine: "multiplication", a: +m[1], b: +m[2] } : null; },
    solve(p) {
      const s = p.a * p.b;
      return { answer: R(s), answerText: String(s), steps: [
        { title: "See equal groups", what: `${p.a} × ${p.b} means ${p.a} rows of ${p.b}.`, why: "Multiplication is a fast way to add equal groups.", rule: "a × b = b + b + … (a times)", mistake: `Adding instead: ${p.a} + ${p.b} = ${p.a + p.b}.`, again: `Picture ${p.a} bags, each with ${p.b} apples.`, expr: `${p.a} × ${p.b}`, visual: { kind: "array", rows: p.a, cols: p.b } },
        { title: "Skip count", what: Array.from({ length: p.a }, (_, i) => p.b * (i + 1)).join(", "), why: `Counting by ${p.b}s, ${p.a} times, gives the total.`, rule: "Skip counting", mistake: "Losing count of how many groups you have added.", again: `Count by ${p.b}s on your fingers until you have ${p.a} fingers up.`, expr: `${s}`, visual: { kind: "array", rows: p.a, cols: p.b, highlightRows: true }, ask: { prompt: `${p.a} × ${p.b} = ?`, answer: R(s), kind: "number" } },
      ] };
    },
    diagnose: (p, v) => (v.n === p.a + p.b && v.d === 1 ? "That is the sum. Multiplication means equal groups: count by " + p.b + "s, " + p.a + " times." : null),
    hints: (p) => ["How many rows? How many in each row?", `Skip count by ${p.b}.`, `${p.b}, ${2 * p.b}, ${3 * p.b}… keep going until you have ${p.a} numbers.`],
  });

  const equivalent = simpleEngine({
    id: "equivalent",
    text: (p) => `${p.n}/${p.d} = ?/${p.d * p.k}`,
    generate() { const d = pick([2, 3, 4, 5]); return { engine: "equivalent", n: rnd(1, d - 1), d, k: pick([2, 3, 4]) }; },
    solve(p) {
      const n = p.n * p.k;
      return { answer: R(n), answerText: String(n), steps: [
        { title: "Compare the denominators", what: `${p.d} × ${p.k} = ${p.d * p.k}`, why: "Find what the old denominator was multiplied by.", rule: "Equivalent fractions scale top and bottom together.", mistake: "Adding instead of multiplying.", again: `How many ${p.d}s make ${p.d * p.k}?`, expr: `× ${p.k}`, visual: null, ask: { prompt: `${p.d} × ? = ${p.d * p.k}`, answer: R(p.k), kind: "number" } },
        { title: "Scale the numerator", what: `${p.n} × ${p.k} = ${n}`, why: "Multiply the top by the same number so the amount is unchanged.", rule: "a/b = (a×k)/(b×k)", mistake: "Changing only the bottom.", again: `Each piece split into ${p.k} gives ${p.k} times as many shaded pieces.`, expr: `${p.n}/${p.d} = ${n}/${p.d * p.k}`, visual: { kind: "fractionBars", rows: [R(p.n, p.d), R(n, p.d * p.k)] }, ask: { prompt: `${p.n}/${p.d} = ?/${p.d * p.k}`, answer: R(n), kind: "number" } },
      ] };
    },
    hints: (p) => ["What was the denominator multiplied by?", `${p.d} × ${p.k} = ${p.d * p.k}.`, `Multiply the numerator by ${p.k} too.`],
  });

  const percentOf = simpleEngine({
    id: "percentOf",
    text: (p) => `${p.pct}% of ${p.n}`,
    generate(level) { return { engine: "percentOf", pct: pick(level === "easy" ? [10, 50, 25] : [5, 15, 20, 25, 30, 40, 75]), n: pick([20, 40, 60, 80, 120, 200]) }; },
    parse(text) { const m = text.replace(/\s+/g, " ").trim().match(/^(\d+(?:\.\d+)?)\s?%\s?of\s?\$?(\d+(?:\.\d+)?)\??$/i); return m ? { engine: "percentOf", pct: +m[1], n: +m[2] } : null; },
    solve(p) {
      const ans = (p.pct * p.n) / 100;
      return { answer: parseNumber(String(ans)), answerText: String(+ans.toFixed(2)), steps: [
        { title: "Write the percent as a fraction", what: `${p.pct}% = ${p.pct}/100${gcd(p.pct, 100) > 1 && Number.isInteger(p.pct) ? " = " + fstr(reduce(R(p.pct, 100))) : ""}`, why: "Percent means 'per hundred'.", rule: "p% = p/100", mistake: `Treating ${p.pct}% as ${p.pct}.`, again: `${p.pct}% means ${p.pct} out of every 100.`, expr: `${p.pct}/100`, visual: { kind: "hundredGrid", shaded: p.pct } },
        { title: "Multiply", what: `${p.pct}/100 × ${p.n} = ${+ans.toFixed(2)}`, why: "'Of' means multiply: we want that fraction of the whole amount.", rule: "p% of n = (p/100) × n", mistake: "Dividing by the percent instead of by 100.", again: `1% of ${p.n} is ${p.n / 100}. So ${p.pct}% is ${p.pct} × ${p.n / 100}.`, expr: `${+ans.toFixed(2)}`, visual: null, ask: { prompt: `${p.pct}% of ${p.n} = ?`, answer: parseNumber(String(ans)), kind: "number" } },
      ] };
    },
    hints: (p) => ["What does 'percent' mean?", `Find 1% of ${p.n} first, or write ${p.pct}% as a fraction.`, `${p.pct}/100 × ${p.n}.`],
  });

  const areaRect = simpleEngine({
    id: "areaRect",
    text: (p) => `Area of a ${p.w} m × ${p.h} m rectangle`,
    generate() { return { engine: "areaRect", w: rnd(2, 9), h: rnd(2, 7) }; },
    solve(p) {
      return { answer: R(p.w * p.h), answerText: `${p.w * p.h} m²`, steps: [
        { title: "Count one row", what: `One row has ${p.w} unit squares.`, why: "Area counts how many 1 m × 1 m squares cover the floor.", rule: "Area is measured in square units.", mistake: "Adding the sides (that is perimeter).", again: `Along the ${p.w} m side, lay ${p.w} tiles.`, expr: `${p.w}`, visual: { kind: "array", rows: p.h, cols: p.w, squares: true } },
        { title: "Multiply rows by columns", what: `${p.h} rows × ${p.w} = ${p.w * p.h} m²`, why: "Each row has the same number of squares, so multiply.", rule: "Area = length × width", mistake: "Forgetting the square units.", again: `${p.h} rows of ${p.w} tiles.`, expr: `${p.w * p.h} m²`, visual: null, ask: { prompt: `${p.w} × ${p.h} = ?`, answer: R(p.w * p.h), kind: "number" } },
      ] };
    },
    diagnose: (p, v) => (v.n === 2 * (p.w + p.h) ? "That is the perimeter (the distance around). Area counts the squares inside." : null),
    hints: (p) => ["How many squares fit along one side?", `There are ${p.h} rows of ${p.w}.`, `${p.w} × ${p.h}.`],
  });

  const ratio = simpleEngine({
    id: "ratio",
    text: (p) => `${p.a} cups for ${p.b} people. How many cups for ${p.c} people?`,
    generate() { const b = pick([2, 4, 6]); const a = pick([1, 2, 3]); return { engine: "ratio", a, b, c: b * pick([2, 3]) + (Math.random() < 0.5 ? b / 2 : 0) }; },
    solve(p) {
      const unit = reduce(R(p.a, p.b));
      const ans = reduce(R(p.a * p.c, p.b));
      return { answer: ans, answerText: mixed(ans), steps: [
        { title: "Find the amount for one person", what: `${p.a} ÷ ${p.b} = ${mixed(unit)} cup per person`, why: "A unit rate lets us scale to any number of people.", rule: "Unit rate = amount ÷ people", mistake: "Adding the difference in people instead of scaling.", again: `Share ${p.a} cups among ${p.b} people.`, expr: `${mixed(unit)}`, visual: null, ask: { prompt: `${p.a} ÷ ${p.b} = ?`, answer: unit, kind: "fraction" } },
        { title: "Scale up", what: `${mixed(unit)} × ${p.c} = ${mixed(ans)} cups`, why: "Each person needs the same amount.", rule: "Equivalent ratios scale both parts.", mistake: "Multiplying only one part of the ratio.", again: `${p.c} people each need ${mixed(unit)} cup.`, expr: `${mixed(ans)}`, visual: null, ask: { prompt: `Cups for ${p.c} people?`, answer: ans, kind: "fraction" } },
      ] };
    },
    hints: (p) => ["How much does one person need?", `${p.a} ÷ ${p.b}.`, `Multiply that by ${p.c}.`],
  });

  const integerAdd = simpleEngine({
    id: "integerAdd",
    text: (p) => `${minus(p.a)} + ${p.b < 0 ? "(" + minus(p.b) + ")" : p.b}`,
    generate() { return { engine: "integerAdd", a: rnd(-9, 9) || -3, b: rnd(-9, 9) || 5 }; },
    parse(text) { const m = text.replace(/\s/g, "").replace(/[−–]/g, "-").match(/^(-\d+)\+\(?(-?\d+)\)?(=\??)?$/); return m ? { engine: "integerAdd", a: +m[1], b: +m[2] } : null; },
    solve(p) {
      const s = p.a + p.b;
      return { answer: R(s), answerText: minus(s), steps: [
        { title: "Start at the first number", what: `Start at ${minus(p.a)}.`, why: "The number line shows negatives to the left of zero.", rule: "Integers on a number line", mistake: "Starting at the second number.", again: `${p.a < 0 ? "Below" : "Above"} zero by ${Math.abs(p.a)}.`, expr: `${minus(p.a)}`, visual: { kind: "numberLine", from: -12, to: 12, start: p.a, jumps: [] } },
        { title: `Move ${p.b >= 0 ? "right" : "left"} ${Math.abs(p.b)}`, what: `${this.text(p)} = ${minus(s)}`, why: "Adding a positive moves right; adding a negative moves left.", rule: "a + (−b) = a − b", mistake: "Moving the wrong way for a negative.", again: `Think of temperature ${p.b >= 0 ? "rising" : "falling"} by ${Math.abs(p.b)} degrees.`, expr: minus(s), visual: { kind: "numberLine", from: -12, to: 12, start: p.a, jumps: [p.b] }, ask: { prompt: `${this.text(p)} = ?`, answer: R(s), kind: "number" } },
      ] };
    },
    hints: (p) => ["Picture a number line.", `Start at ${minus(p.a)}.`, `Move ${Math.abs(p.b)} to the ${p.b >= 0 ? "right" : "left"}.`],
  });

  const probability = simpleEngine({
    id: "probability",
    answerKind: "fraction",
    text: (p) => `A bag has ${p.r} red, ${p.b} blue and ${p.g} green marbles. P(red) = ?`,
    generate() { return { engine: "probability", r: rnd(1, 5), b: rnd(1, 6), g: rnd(1, 4) }; },
    solve(p) {
      const tot = p.r + p.b + p.g;
      const ans = reduce(R(p.r, tot));
      return { answer: ans, answerText: fstr(ans), steps: [
        { title: "Count all outcomes", what: `${p.r} + ${p.b} + ${p.g} = ${tot} marbles`, why: "Each marble is one equally likely outcome.", rule: "Total outcomes", mistake: "Leaving out a color.", again: "Count every marble in the bag.", expr: `${tot}`, visual: { kind: "marbles", r: p.r, b: p.b, g: p.g }, ask: { prompt: "How many marbles in total?", answer: R(tot), kind: "number" } },
        { title: "Favorable ÷ total", what: `P(red) = ${p.r}/${tot}${ans.d !== tot ? " = " + fstr(ans) : ""}`, why: "Probability compares the outcomes we want with all outcomes.", rule: "P(event) = favorable ÷ total", mistake: `Comparing red with non-red (${p.r}/${tot - p.r}); that is odds, not probability.`, again: `${p.r} of the ${tot} marbles are red.`, expr: fstr(ans), visual: null, ask: { prompt: "P(red) = ?", answer: ans, kind: "fraction" } },
      ] };
    },
    diagnose: (p, v) => (v.n === p.r && v.d === p.b + p.g ? "That compares red with the other colors (odds). Probability divides by all the marbles." : null),
    hints: (p) => ["How many marbles are there altogether?", `There are ${p.r + p.b + p.g}. How many are red?`, `${p.r} out of ${p.r + p.b + p.g}.`],
  });

  const mean = simpleEngine({
    id: "mean",
    text: (p) => `Points scored: ${p.xs.join(", ")}. What is the mean?`,
    generate() { const n = 5; const xs = Array.from({ length: n }, () => rnd(4, 24)); const r = xs.reduce((a, b) => a + b, 0) % n; xs[0] += (n - r) % n; return { engine: "mean", xs }; },
    solve(p) {
      const s = p.xs.reduce((a, b) => a + b, 0);
      const ans = reduce(R(s, p.xs.length));
      return { answer: ans, answerText: mixed(ans), steps: [
        { title: "Add all the values", what: `${p.xs.join(" + ")} = ${s}`, why: "The mean shares the total equally among the games.", rule: "Mean = sum ÷ count", mistake: "Forgetting a value.", again: "Add the scores one at a time.", expr: `${s}`, visual: { kind: "bars", values: p.xs }, ask: { prompt: "What is the total?", answer: R(s), kind: "number" } },
        { title: "Divide by how many", what: `${s} ÷ ${p.xs.length} = ${mixed(ans)}`, why: `There are ${p.xs.length} games.`, rule: "Mean = sum ÷ count", mistake: "Picking the middle value (that is the median).", again: "Level the bars so they are all the same height.", expr: mixed(ans), visual: { kind: "bars", values: p.xs, meanLine: ans.n / ans.d }, ask: { prompt: `${s} ÷ ${p.xs.length} = ?`, answer: ans, kind: "fraction" } },
      ] };
    },
    hints: (p) => ["First find the total.", "Then share it equally.", `Divide the total by ${p.xs.length}.`],
  });

  const compound = simpleEngine({
    id: "compound",
    text: (p) => `$${p.P} at ${p.r}% per year, compounded yearly, for ${p.t} years`,
    generate() { return { engine: "compound", P: pick([500, 1000, 2000]), r: pick([3, 4, 5, 6]), t: pick([2, 3, 5]) }; },
    solve(p) {
      const A = p.P * (1 + p.r / 100) ** p.t;
      const rows = Array.from({ length: p.t + 1 }, (_, i) => +(p.P * (1 + p.r / 100) ** i).toFixed(2));
      return { answer: parseNumber(A.toFixed(2)), answerText: `$${A.toFixed(2)}`, steps: [
        { title: "Write the growth factor", what: `1 + ${p.r}/100 = ${1 + p.r / 100}`, why: "Each year the balance is multiplied by 1 plus the rate.", rule: "Growth factor = 1 + r", mistake: `Using ${p.r} instead of ${p.r / 100}.`, again: `Keeping 100% and adding ${p.r}% gives ${100 + p.r}%.`, expr: `${1 + p.r / 100}`, visual: null },
        { title: "Apply it each year", what: `A = ${p.P} × ${1 + p.r / 100}^${p.t} = ${A.toFixed(2)}`, why: "Interest earns interest, so we multiply, not add, each year.", rule: "A = P(1 + r)^t", mistake: `Simple interest: ${p.P} + ${p.t} × ${(p.P * p.r) / 100} = ${p.P + (p.t * p.P * p.r) / 100}.`, again: rows.map((v, i) => `Year ${i}: $${v}`).join(" · "), expr: `$${A.toFixed(2)}`, visual: { kind: "bars", values: rows, money: true }, ask: { prompt: "Balance after the last year (to the cent)?", answer: parseNumber(A.toFixed(2)), kind: "number" } },
      ] };
    },
    hints: (p) => ["What do you multiply by each year?", `The factor is ${1 + p.r / 100}.`, `${p.P} × ${1 + p.r / 100}^${p.t}.`],
  });

  const engines = {
    fractionAdd: fractionEngine("+"),
    fractionSub: fractionEngine("-"),
    linear, addition, subtraction, multiplication, equivalent, percentOf, areaRect, ratio, integerAdd, probability, mean, compound,
  };

  // Map engine -> the topic a parsed problem should open.
  const engineTopic = {
    fractionAdd: "add-fractions", fractionSub: "sub-fractions", linear: "linear-eq", addition: "add-2digit",
    subtraction: "sub-within-20", multiplication: "mult-facts", percentOf: "percent-intro", integerAdd: "integers",
  };

  SW.engine = {
    engines, engineTopic, parseNumber, fstr, mixed, reduce, eq, R, gcd, lcm,
    get: (id) => engines[id],
    /** Recognize a typed problem. Returns { engine, problem, topicId } or null. */
    recognize(text) {
      for (const id of ["fractionAdd", "fractionSub", "linear", "percentOf", "integerAdd", "multiplication", "addition", "subtraction"]) {
        const p = engines[id].parse(text);
        if (p) return { engine: id, problem: p, topicId: engineTopic[id] };
      }
      return null;
    },
    // Easier prerequisite for adaptive remediation.
    prerequisite: { fractionAdd: "equivalent", fractionSub: "equivalent", linear: "integerAdd", multiplication: "addition", mean: "addition" },
  };
})(window.StepWise = window.StepWise || {});
