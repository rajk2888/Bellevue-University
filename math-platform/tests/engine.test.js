// Run with: node math-platform/tests/engine.test.js
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ["curriculum.js", "engine.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "../js", f), "utf8"), ctx);
const { engine: E, curriculum: C } = ctx.window.StepWise;
let n = 0;
const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

t("parses answers", () => {
  assert.deepStrictEqual({ ...E.parseNumber("1 1/4") }, { n: 5, d: 4 });
  assert.deepStrictEqual({ ...E.parseNumber("5/4") }, { n: 5, d: 4 });
  assert.deepStrictEqual({ ...E.parseNumber("x = −3") }, { n: -3, d: 1 });
  assert.deepStrictEqual({ ...E.parseNumber("1.25") }, { n: 5, d: 4 });
  assert.deepStrictEqual({ ...E.parseNumber("12 m²") }, { n: 12, d: 1 });
  assert.strictEqual(E.parseNumber("abc"), null);
  assert.strictEqual(E.parseNumber("3/0"), null);
});

t("3/4 + 1/2 walks the five taught steps to 1 1/4", () => {
  const eng = E.get("fractionAdd");
  const s = eng.solve({ a: E.R(3, 4), b: E.R(1, 2), op: "+" });
  assert.strictEqual(s.steps.map((x) => x.title).join("|"), ["Look at the denominators", "Find a common denominator", "Rename the fractions", "Add the numerators", "Simplify"].join("|"));
  assert.strictEqual(s.answerText, "1 1/4");
  for (const st of s.steps) for (const k of ["what", "why", "rule", "mistake", "again", "expr"]) assert.ok(st[k], `${st.title} missing ${k}`);
});

t("fraction check diagnoses common mistakes without revealing the answer", () => {
  const eng = E.get("fractionAdd"), p = { a: E.R(3, 4), b: E.R(1, 2), op: "+" };
  assert.ok(eng.check(p, "1 1/4").correct);
  assert.ok(eng.check(p, "5/4").correct);
  const unsimplified = eng.check(p, "10/8");
  assert.ok(unsimplified.correct && unsimplified.close);
  const naive = eng.check(p, "4/6");
  assert.ok(!naive.correct && /denominators/.test(naive.message) && !/1 1\/4/.test(naive.message));
  assert.ok(!eng.check(p, "4/4").correct);
});

t("generated problems are solvable at every level", () => {
  for (const id of Object.keys(E.engines)) for (const lvl of ["easy", "medium", "hard", "challenge"]) for (let i = 0; i < 30; i++) {
    const eng = E.get(id), p = eng.generate(lvl), s = eng.solve(p);
    assert.ok(s.steps.length >= 2, id);
    assert.ok(eng.check(p, s.answerText).correct, `${id} ${lvl} ${eng.text(p)} -> ${s.answerText}`);
    assert.strictEqual(eng.hints(p).length, 3);
    for (const st of s.steps) if (st.ask) assert.ok(st.ask.answer && typeof st.ask.answer.n === "number", `${id} ask answer`);
  }
});

t("subtraction never goes negative", () => {
  for (let i = 0; i < 200; i++) { const eng = E.get("fractionSub"), p = eng.generate(["easy", "medium", "hard", "challenge"][i % 4]); assert.ok(eng.result(p).n > 0); }
});

t("recognizes typed problems", () => {
  const cases = { "2x + 5 = 17": ["linear", "6"], "3/4 + 1/2": ["fractionAdd", "1 1/4"], "5/6 - 1/3": ["fractionSub", "1/2"], "25% of 60": ["percentOf", "15"], "-4 + 9": ["integerAdd", "5"], "7 × 8": ["multiplication", "56"], "38 + 27": ["addition", "65"], "3x - 4 = 11": ["linear", "5"], "-2x + 1 = 9": ["linear", "-4"] };
  for (const [q, [id, ans]] of Object.entries(cases)) {
    const r = E.recognize(q);
    assert.ok(r, q); assert.strictEqual(r.engine, id, q);
    assert.ok(E.get(id).check(r.problem, ans).correct, `${q} = ${ans}`);
  }
  assert.strictEqual(E.recognize("hello"), null);
});

t("linear check spots sign errors", () => {
  const eng = E.get("linear"), p = { a: 2, b: 5, c: 17 };
  assert.match(eng.check(p, "11").message, /subtract/);
  assert.match(eng.check(p, "12").message, /divide/);
});

t("every engine named by the curriculum exists; every grade 1-12 has topics", () => {
  for (const tp of C.active.topics) if (tp.engine) assert.ok(E.get(tp.engine), tp.id);
  for (let g = 1; g <= 12; g++) assert.ok(C.topicsForGrade(g).length > 0, "grade " + g);
});

t("Grade 1-2 explanations use real numbers, not letters", () => {
  const add = E.get("addition"), sub = E.get("subtraction");
  for (let i = 0; i < 200; i++) {
    const lvl = ["easy", "medium", "hard", "challenge"][i % 4];
    const p = add.generate(lvl, { maxSum: 20 });
    assert.ok(p.a + p.b <= 20 && p.a < 10 && p.b < 10, "grade 1 sums stay within 20");
    const q = add.generate(lvl, { twoDigit: true });
    assert.ok(q.a >= 10 && q.b >= 10 && q.a + q.b <= 99, "grade 2 two-digit sums stay under 100");
    const r = sub.generate(lvl);
    assert.ok(r.a - r.b >= 1 && r.a <= 20);
    for (const sol of [add.solve(p), add.solve(q), sub.solve(r)]) for (const st of sol.steps)
      for (const k of ["what", "why", "rule", "mistake", "again"]) assert.ok(!/\b[ab] [+−-] [ab]\b|\ba\b.*\bb\b steps/.test(st[k]), `${st.title}.${k}: ${st[k]}`);
  }
  const s = add.solve({ a: 8, b: 5 });
  assert.match(s.steps[1].what, /9, 10, 11, 12, 13/);
  assert.match(s.steps[0].rule, /8 \+ 5 and 5 \+ 8/);
});

console.log(`\n${n} tests passed`);
