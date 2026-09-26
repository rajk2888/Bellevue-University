/* StepWise Math — application shell and views.
 * Developed by Rajkumar Kuppuswami.
 *
 * Views: home, learn (grade → domain → topic), lesson, solve, progress, grownups.
 * Navigation uses plain hash tokens (#learn, #lesson.add-fractions) so the back
 * button works and links can point at a view.
 */
(function (SW) {
  "use strict";
  const C = SW.curriculum, E = SW.engine, V = SW.visuals, P = SW.progress;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const main = () => $("#main");
  const LEVEL_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard", challenge: "Challenge" };

  // Shared tutor context: whatever problem the student is looking at right now.
  const tutorCtx = { solution: null, problemText: "", stepIndex: 0, grade: 5, onAction: null };
  let cleanup = [];

  // ---------- theming by grade band ----------
  function setBand(grade) {
    const b = C.bandForGrade(grade);
    document.documentElement.dataset.band = b ? b.band : "young";
    tutorCtx.grade = grade;
    const chip = $("#grade-chip");
    if (chip) chip.textContent = `Grade ${grade}`;
  }

  // Encouragement tuned to age, never competitive.
  const praise = () => {
    const band = document.documentElement.dataset.band;
    const young = ["Great thinking!", "You did it!", "Super work!", "Nice job!"];
    const middle = ["Nice work.", "Correct. Well reasoned.", "That's it.", "Solid."];
    const high = ["Correct.", "Well done.", "Exactly right.", "Correct: clean reasoning."];
    const set = band === "young" ? young : band === "middle" ? middle : high;
    return set[Math.floor(Math.random() * set.length)];
  };

  function toast(html, tone = "good") {
    const t = document.createElement("div");
    t.className = `toast ${tone}`;
    t.setAttribute("role", "status");
    t.innerHTML = html;
    $("#toasts").appendChild(t);
    setTimeout(() => t.classList.add("out"), 3600);
    setTimeout(() => t.remove(), 4200);
  }
  const badgeToast = (b) => b && toast(`<strong>New badge: ${esc(b.name)}</strong><span>${esc(b.desc)}</span>`, "badge");

  // ---------- router ----------
  function go(hash) { if (location.hash === "#" + hash) route(); else location.hash = hash; }
  function route() {
    cleanup.forEach((fn) => fn()); cleanup = [];
    const h = location.hash.slice(1) || "home";
    const [view, arg] = h.split(".");
    $$(".nav a").forEach((a) => a.setAttribute("aria-current", a.getAttribute("href") === "#" + view ? "page" : "false"));
    tutorCtx.solution = null;
    const views = { home, learn, lesson, solve, progress, grownups };
    (views[view] || home)(arg);
    main().focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }

  // =====================================================================
  // Step-by-step explanation component
  // =====================================================================
  /**
   * Renders a solution one step at a time. When a step has `ask`, the student
   * is invited to try it before it is revealed.
   */
  function Stepper(root, solution, { problemText, tryFirst = true, onDone } = {}) {
    let i = 0;
    const revealed = new Set();
    const shownVisual = new Set();
    const shownAgain = new Set();
    const n = solution.steps.length;

    function render() {
      const st = solution.steps[i];
      tutorCtx.solution = solution; tutorCtx.problemText = problemText; tutorCtx.stepIndex = i;
      const needsTry = tryFirst && st.ask && !revealed.has(i);
      root.innerHTML = `
        <div class="stepper">
          <div class="step-track" role="list" aria-label="Steps">
            ${solution.steps.map((s, k) => `<span role="listitem" class="dot ${k < i ? "done" : k === i ? "now" : ""}" aria-label="Step ${k + 1}${k < i ? " done" : k === i ? " current" : ""}">${k + 1}</span>`).join("")}
            <span class="dot final ${i === n - 1 && !needsTry ? "now" : ""}" aria-label="Answer">✓</span>
          </div>
          <div class="step-card" aria-live="polite">
            <p class="eyebrow">Step ${i + 1} of ${n}</p>
            <h4 class="step-title">${esc(st.title)}</h4>
            ${needsTry ? `
              <div class="try-first">
                <p><strong>Your turn first:</strong> ${esc(st.ask.prompt)}</p>
                <form class="inline-answer" data-form="try">
                  <label class="sr-only" for="try-${root.id}-${i}">Your answer for step ${i + 1}</label>
                  <input id="try-${root.id}-${i}" class="answer-input" inputmode="text" autocomplete="off" placeholder="${st.ask.kind === "fraction" ? "e.g. 5/4 or 1 1/4" : "your answer"}">
                  <button class="btn primary" type="submit">Check</button>
                  <button class="btn ghost" type="button" data-act="reveal">Show me this step</button>
                </form>
                <p class="feedback" role="status"></p>
              </div>` : `
              <div class="expr" aria-label="Current calculation">${esc(st.expr)}</div>
              <dl class="step-parts">
                <div><dt>What we are doing</dt><dd>${esc(st.what)}</dd></div>
                <div><dt>Why</dt><dd>${esc(st.why)}</dd></div>
                <div><dt>The rule</dt><dd class="rule">${esc(st.rule)}</dd></div>
                <div class="mistake"><dt>Common mistake</dt><dd>${esc(st.mistake)}</dd></div>
              </dl>
              ${shownAgain.has(i) ? `<div class="again"><strong>Another way to think about it:</strong> ${esc(st.again)}</div>` : ""}
              ${shownVisual.has(i) && st.visual ? `<div class="visual-box">${V.render(st.visual)}</div>` : ""}
              <div class="step-tools">
                <button class="btn soft" data-act="again" aria-pressed="${shownAgain.has(i)}">Explain This Step Again</button>
                ${st.visual ? `<button class="btn soft" data-act="visual" aria-pressed="${shownVisual.has(i)}">${shownVisual.has(i) ? "Hide Picture" : "Show Me Visually"}</button>` : ""}
              </div>`}
          </div>
          ${i === n - 1 && !needsTry ? `<div class="answer-banner"><span>Answer</span><strong>${esc(solution.answerText)}</strong></div>` : ""}
          <div class="step-nav">
            <button class="btn" data-act="prev" ${i === 0 ? "disabled" : ""}>← Previous Step</button>
            <button class="btn primary" data-act="next" ${i === n - 1 ? "disabled" : ""}>Next Step →</button>
          </div>
        </div>`;
      if (i === n - 1 && !needsTry && onDone) onDone();
    }

    root.onclick = (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (!act) return;
      if (act === "prev" && i > 0) i--;
      else if (act === "next" && i < n - 1) { revealed.add(i); i++; }
      else if (act === "reveal") revealed.add(i);
      else if (act === "again") shownAgain.has(i) ? shownAgain.delete(i) : shownAgain.add(i);
      else if (act === "visual") shownVisual.has(i) ? shownVisual.delete(i) : shownVisual.add(i);
      else return;
      render();
      if (act === "next" || act === "prev") root.querySelector(".step-card")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    root.onsubmit = (e) => {
      if (e.target.dataset.form !== "try") return;
      e.preventDefault();
      const st = solution.steps[i];
      const input = e.target.querySelector("input").value;
      const v = E.parseNumber(input);
      const fb = e.target.parentElement.querySelector(".feedback");
      if (v && E.eq(v, st.ask.answer)) {
        fb.className = "feedback good"; fb.textContent = praise();
        setTimeout(() => { revealed.add(i); shownVisual.add(i); render(); }, 700);
      } else {
        fb.className = "feedback try"; fb.textContent = v ? "Not yet. Look at the step title for a clue, or press “Show me this step”." : "Type a number or fraction.";
      }
    };
    render();
    return {
      goTo(k) { i = Math.max(0, Math.min(n - 1, k)); render(); },
      showVisual() { shownVisual.add(i); revealed.add(i); render(); },
      get index() { return i; },
    };
  }

  // =====================================================================
  // Try-It-Yourself workspace
  // =====================================================================
  function Workspace(root, { topic, engineId, problem, onResult, compact = false, title = "Try It Yourself" }) {
    const eng = E.get(engineId);
    const sol = eng.solve(problem);
    let hintN = 0, stepN = 0, usedHint = false, solved = false;
    const text = eng.text(problem);
    const uid = "ws" + Math.random().toString(36).slice(2, 7);

    function render() {
      root.innerHTML = `
        <div class="workspace ${compact ? "compact" : ""}">
          <div class="ws-head">
            <h4>${esc(title)}</h4>
            <div class="ws-problem" aria-label="Problem">${esc(text)}${/=|\?$/.test(text) ? "" : " = ?"}</div>
          </div>
          <div class="ws-body">
            <form class="ws-answer" data-form="check">
              <label for="${uid}-ans">Your answer</label>
              <div class="ans-row">
                <input id="${uid}-ans" class="answer-input big" autocomplete="off" inputmode="text" placeholder="${eng.answerKind === "fraction" ? "e.g. 1 1/4" : "type your answer"}" aria-describedby="${uid}-fb">
              </div>
              <div class="keypad" aria-label="Math keypad">
                ${["7", "8", "9", "/", "4", "5", "6", "−", "1", "2", "3", "space", "0", ".", "⌫", "clear"].map((k) => `<button type="button" class="key" data-key="${k}" aria-label="${k === "⌫" ? "Delete" : k === "space" ? "Space (for mixed numbers)" : k === "/" ? "Fraction bar" : k}">${k === "space" ? "␣" : k === "clear" ? "C" : k}</button>`).join("")}
              </div>
              ${compact ? "" : `<label for="${uid}-work" class="work-label">Show your work (optional)</label><textarea id="${uid}-work" class="scratch" rows="3" placeholder="Write your steps here, e.g. 1/2 = 2/4"></textarea>`}
            </form>
            <div class="ws-actions">
              <button class="btn primary" data-act="check">Check My Answer</button>
              <button class="btn soft" data-act="hint">Give Me a Hint</button>
              <button class="btn soft" data-act="step">Show Next Step</button>
              <button class="btn soft" data-act="why">Explain Why</button>
              <button class="btn ghost" data-act="reset">Start Over</button>
            </div>
            <p class="feedback" id="${uid}-fb" role="status" aria-live="polite"></p>
            <ol class="hint-list" aria-label="Hints"></ol>
            <ol class="ws-steps" aria-label="Steps shown"></ol>
          </div>
        </div>`;
    }
    function feedback(msg, tone) { const fb = root.querySelector(".feedback"); fb.className = `feedback ${tone}`; fb.innerHTML = msg; }

    root.onclick = (e) => {
      const key = e.target.closest("[data-key]")?.dataset.key;
      const inp = root.querySelector(".answer-input");
      if (key) {
        if (key === "⌫") inp.value = inp.value.slice(0, -1);
        else if (key === "clear") inp.value = "";
        else inp.value += key === "space" ? " " : key;
        inp.focus();
        return;
      }
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (!act) return;
      if (act === "check") check();
      if (act === "hint") {
        const hints = eng.hints(problem);
        if (hintN < hints.length) {
          usedHint = true;
          root.querySelector(".hint-list").insertAdjacentHTML("beforeend", `<li><span class="hint-n">Hint ${hintN + 1}</span> ${esc(hints[hintN])}</li>`);
          hintN++;
          if (hintN === hints.length) feedback("That was the last hint. If you're still stuck, press “Show Next Step”.", "info");
        } else feedback("No more hints. Try “Show Next Step” to see one step of the solution.", "info");
      }
      if (act === "step") {
        if (hintN === 0 && stepN === 0) { feedback("Try a hint first. You might not need the step!", "info"); return; }
        if (stepN < sol.steps.length - 1) {
          const st = sol.steps[stepN];
          root.querySelector(".ws-steps").insertAdjacentHTML("beforeend", `<li><strong>${esc(st.title)}:</strong> ${esc(st.what)}${st.visual ? `<div class="visual-box small">${V.render(st.visual)}</div>` : ""}</li>`);
          stepN++;
          tutorCtx.stepIndex = stepN - 1;
        } else feedback("You've seen every step except the last one. You can finish it!", "info");
      }
      if (act === "why") {
        const st = sol.steps[Math.max(0, stepN - 1)];
        feedback(`<strong>Why it works:</strong> ${esc(stepN ? st.why : topic.concept)} <span class="rule-inline">${esc(stepN ? st.rule : sol.steps[0].rule)}</span>`, "info");
      }
      if (act === "reset") { hintN = 0; stepN = 0; solved = false; render(); }
    };
    root.onsubmit = (e) => { if (e.target.dataset.form === "check") { e.preventDefault(); check(); } };

    function check() {
      const val = root.querySelector(".answer-input").value;
      if (!val.trim()) { feedback("Type your answer first.", "info"); return; }
      const r = eng.check(problem, val);
      tutorCtx.lastAnswer = val; tutorCtx.lastCorrect = r.correct;
      if (r.correct) {
        feedback(`<strong>${esc(r.close ? "Almost perfect!" : praise())}</strong> ${esc(r.message)}`, r.close ? "info" : "good");
        if (!solved && !r.close) { solved = true; onResult && onResult(true, { usedHint }); }
      } else {
        feedback(esc(r.message), "try");
        onResult && onResult(false, { usedHint });
      }
    }
    render();
    tutorCtx.solution = sol; tutorCtx.problemText = text; tutorCtx.stepIndex = 0;
    return { problem, solution: sol };
  }

  // =====================================================================
  // Views
  // =====================================================================
  function home() {
    setBand(P.get().grade || 5);
    const popular = ["add-fractions", "linear-eq", "percent-intro", "mult-facts", "integers", "compound-interest"].map((id) => C.topic(id));
    const demo = E.get("fractionAdd").solve({ a: E.R(3, 4), b: E.R(1, 2), op: "+" });
    main().innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Grades 1–12 · step-by-step math</p>
          <h1>Math Made Easy — <span class="hl">One Step at a Time.</span></h1>
          <p class="lede">Learn mathematics through simple explanations, interactive examples, visual lessons, and guided practice from Grade 1 through Grade 12.</p>
          <div class="cta-row">
            <a class="btn primary lg" href="#lesson.add-fractions">Start Learning</a>
            <a class="btn lg" href="#learn">Choose Your Grade</a>
            <a class="btn soft lg" href="#solve">Try a Math Problem</a>
          </div>
          <form class="search" role="search" data-form="search">
            <label for="home-search">What do you want to learn?</label>
            <div class="search-row">
              <input id="home-search" type="search" placeholder="Try “fractions”, “percent” or 2x + 5 = 17" autocomplete="off">
              <button class="btn primary" type="submit">Go</button>
            </div>
            <div class="search-results" aria-live="polite"></div>
          </form>
        </div>
        <div class="hero-demo" aria-label="Interactive example: 3/4 + 1/2">
          <p class="eyebrow">Interactive example</p>
          <div class="demo-eq">3/4 + 1/2 = ?</div>
          <div id="demo-stepper"></div>
        </div>
      </section>

      <section class="band-grid" aria-labelledby="grades-h">
        <h2 id="grades-h">Choose your grade group</h2>
        <div class="grades">
          ${C.bands.map((b) => `
            <a class="grade-card ${b.band}" href="#learn.${b.grades[0]}">
              <span class="g-label">${b.label}</span>
              <span class="g-blurb">${esc(b.blurb)}</span>
              <span class="g-grades">${b.grades.map((g) => `<span>${g}</span>`).join("")}</span>
            </a>`).join("")}
        </div>
      </section>

      <section aria-labelledby="pop-h">
        <h2 id="pop-h">Popular topics</h2>
        <div class="topic-grid">${popular.map(topicCard).join("")}</div>
      </section>

      <section class="how" aria-labelledby="how-h">
        <h2 id="how-h">How it works</h2>
        <p class="sub">Every lesson follows the same path, so students always know what comes next.</p>
        <ol class="path">
          ${[["Understand", "A short, plain explanation of the idea."], ["See", "Pictures and models: pizzas, bars, number lines."], ["Follow", "A worked example, one step at a time."], ["Try", "Your own problem in the workspace."], ["Get Help", "Hints first, then the next step, and a tutor."], ["Practice", "More problems that adjust to you."], ["Master", "A mini quiz and your progress."]]
            .map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join("")}
        </ol>
      </section>

      <section class="split" aria-label="Progress and grown-ups">
        <div class="panel">
          <h2>Your progress</h2>
          ${progressSnapshot()}
          <a class="btn" href="#progress">Open my dashboard</a>
        </div>
        <div class="panel">
          <h2>For parents and teachers</h2>
          <p>See what your student has practiced, where they are stuck, and what to try next. Teachers can assign lessons, and assignments show up on the student's dashboard.</p>
          <ul class="ticks"><li>Skills mastered and areas of difficulty</li><li>Practice time and quiz results</li><li>Recommended next topics</li></ul>
          <a class="btn" href="#grownups">Open the parent &amp; teacher view</a>
        </div>
      </section>`;
    Stepper($("#demo-stepper"), demo, { problemText: "3/4 + 1/2", tryFirst: false });
    wireSearch($("[data-form=search]"));
  }

  function progressSnapshot() {
    const s = P.get();
    if (P.isEmpty()) return `<p class="muted">Solve your first problem and your stars, streak and skills will show up here.</p>`;
    return `<div class="mini-stats">
      <div><strong class="tabular">${Object.keys(s.lessons).length}</strong><span>lessons done</span></div>
      <div><strong class="tabular">${s.attempts}</strong><span>problems tried</span></div>
      <div><strong class="tabular">${P.accuracy()}%</strong><span>accuracy</span></div>
      <div><strong class="tabular">${P.streak()}</strong><span>day streak</span></div></div>`;
  }

  function topicCard(t) {
    const full = !!t.engine;
    return `<a class="topic-card" href="#lesson.${t.id}">
      <span class="t-grade">Grade ${t.grade} · ${esc(t.domain)}</span>
      <span class="t-title">${esc(t.title)}</span>
      <span class="t-story">${esc(t.story)}</span>
      <span class="pill ${full ? "full" : "preview"}">${t.flagship ? "Featured lesson" : full ? "Interactive" : "Preview"}</span>
    </a>`;
  }

  function wireSearch(form) {
    const input = form.querySelector("input"), out = form.querySelector(".search-results");
    const show = () => {
      const q = input.value.trim();
      if (!q) { out.innerHTML = ""; return; }
      const rec = E.recognize(q);
      const hits = C.search(q).slice(0, 6);
      out.innerHTML = (rec ? `<a class="result solve-hit" href="#solve" data-q="${esc(q)}"><strong>Solve “${esc(q)}” step by step</strong><span>Recognized: ${esc(C.topic(rec.topicId)?.title || rec.engine)}</span></a>` : "")
        + hits.map((t) => `<a class="result" href="#lesson.${t.id}"><strong>${esc(t.title)}</strong><span>Grade ${t.grade} · ${esc(t.domain)}</span></a>`).join("")
        + (!rec && !hits.length ? `<p class="muted">No match yet. Try a topic like “ratios” or a problem like 3/4 + 1/2.</p>` : "");
    };
    input.addEventListener("input", show);
    out.addEventListener("click", (e) => { const a = e.target.closest(".solve-hit"); if (a) pendingSet("solveQ", a.dataset.q); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      if (E.recognize(q)) { pendingSet("solveQ", q); go("solve"); return; }
      const hit = C.search(q)[0];
      if (hit) go("lesson." + hit.id); else show();
    });
  }
  // Hands a typed problem from the search box to the Solve view.
  const pending = {};
  const pendingSet = (k, v) => { pending[k] = v; };
  const pendingTake = (k) => { const v = pending[k]; delete pending[k]; return v; };

  function learn(arg) {
    const grade = +arg || P.get().grade || 5;
    P.setProfile({ grade });
    setBand(grade);
    const domains = C.domainsForGrade(grade);
    main().innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span>›</span><span aria-current="page">Grade ${grade}</span></nav>
      <h1 class="page-h">Grade ${grade} math</h1>
      <div class="grade-tabs" role="tablist" aria-label="Choose grade">
        ${Array.from({ length: 12 }, (_, k) => k + 1).map((g) => `<a role="tab" aria-selected="${g === grade}" class="gtab ${g === grade ? "on" : ""}" href="#learn.${g}">${g}</a>`).join("")}
      </div>
      <p class="sub">${esc(C.bandForGrade(grade).blurb)} Topics marked <span class="pill full">Interactive</span> have full practice; <span class="pill preview">Preview</span> topics show the idea and a real-world example while their lessons are being built.</p>
      ${domains.size ? [...domains].map(([d, ts]) => `
        <section class="domain">
          <h2>${esc(d)}</h2>
          <div class="topic-grid">${ts.map(topicCard).join("")}</div>
        </section>`).join("") : `<p>No topics yet for this grade. Try a nearby grade.</p>`}
      ${nearbyGrades(grade)}`;
  }
  function nearbyGrades(grade) {
    const b = C.bandForGrade(grade);
    const others = C.active.topics.filter((t) => b.grades.includes(t.grade) && t.grade !== grade);
    return others.length ? `<section class="domain"><h2>Also in ${b.label}</h2><div class="topic-grid">${others.slice(0, 6).map(topicCard).join("")}</div></section>` : "";
  }

  // ---------- Lesson page ----------
  function lesson(id) {
    const topic = C.topic(id) || C.topic("add-fractions");
    setBand(topic.grade);
    const eng = topic.engine && E.get(topic.engine);
    const sections = eng
      ? [["learn", "What You Will Learn"], ["concept", "The Idea"], ["see", "See It"], ["story", "Real-World Story"], ["example", "Worked Example"], ["watch", "Watch Explanation"], ["try", "Try It Yourself"], ["practice", "Practice"], ["quiz", "Mini Quiz"], ["summary", "Summary"]]
      : [["learn", "What You Will Learn"], ["concept", "The Idea"], ["story", "Real-World Story"], ["next", "Keep Going"]];
    const done = new Set();
    const isFractionAdd = topic.engine === "fractionAdd" || topic.engine === "fractionSub";
    const example = eng ? (topic.id === "add-fractions" ? { engine: "fractionAdd", a: E.R(3, 4), b: E.R(1, 2), op: "+" } : eng.generate(topic.level || "medium")) : null;
    const exSol = eng ? eng.solve(example) : null;
    const exText = eng ? eng.text(example) : "";

    main().innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="#home">Home</a><span>›</span><a href="#learn.${topic.grade}">Grade ${topic.grade}</a><span>›</span><span>${esc(topic.domain)}</span><span>›</span><span aria-current="page">${esc(topic.title)}</span>
      </nav>
      <div class="lesson">
        <aside class="lesson-nav" aria-label="Lesson progress">
          <p class="eyebrow">Lesson progress</p>
          <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${sections.length}" aria-valuenow="0" aria-label="Sections completed"><span></span></div>
          <ol>${sections.map(([k, t]) => `<li><a href="#lesson.${topic.id}" data-jump="${k}" data-sec="${k}">${t}</a></li>`).join("")}</ol>
        </aside>
        <article class="lesson-body">
          <header class="lesson-head">
            <p class="eyebrow">Grade ${topic.grade} · ${esc(topic.domain)}${topic.standards?.ccss ? ` · CCSS ${esc(topic.standards.ccss)}` : ""}</p>
            <h1 class="page-h">${esc(topic.title)}</h1>
            ${eng ? "" : `<p class="notice">This topic is a preview: the idea and a real-world story are ready, and the interactive practice for it is being built. Related interactive lessons are below.</p>`}
          </header>

          <section id="sec-learn" data-section="learn" class="lsec">
            <h2>What you will learn</h2>
            <ul class="ticks">${learnGoals(topic).map((g) => `<li>${esc(g)}</li>`).join("")}</ul>
          </section>

          <section id="sec-concept" data-section="concept" class="lsec">
            <h2>The idea</h2>
            <p class="concept">${esc(topic.concept)}</p>
          </section>

          ${eng ? `
          <section id="sec-see" data-section="see" class="lsec">
            <h2>See it</h2>
            ${isFractionAdd ? fractionExplorer() : `<div class="visual-box">${V.render(exSol.steps.find((s) => s.visual)?.visual)}</div><p class="caption-note">${esc(exSol.steps.find((s) => s.visual)?.what || "")}</p>`}
          </section>` : ""}

          <section id="sec-story" data-section="story" class="lsec">
            <h2>Real-world story</h2>
            ${topic.id === "add-fractions" ? pizzaStory() : `<div class="story"><p>${esc(topic.story)}</p></div>`}
          </section>

          ${eng ? `
          <section id="sec-example" data-section="example" class="lsec">
            <h2>Worked example: ${esc(exText)}</h2>
            <p class="sub">Go one step at a time. Where you see “Your turn first”, try the step before it's shown.</p>
            <div id="lesson-stepper"></div>
          </section>

          <section id="sec-watch" data-section="watch" class="lsec">
            <h2>Watch explanation</h2>
            <p class="sub">A narrated lesson: the whiteboard animates each step while captions${"speechSynthesis" in window ? " and a voice" : ""} explain it.</p>
            <div id="player-slot"><button class="btn primary" data-act="open-player">Watch Explanation</button></div>
          </section>

          <section id="sec-try" data-section="try" class="lsec">
            <h2>Try it yourself</h2>
            <div id="try-ws"></div>
          </section>

          <section id="sec-practice" data-section="practice" class="lsec">
            <h2>Practice more</h2>
            <div id="practice"></div>
          </section>

          <section id="sec-quiz" data-section="quiz" class="lsec">
            <h2>Mini quiz</h2>
            <div id="quiz"><p>Five questions. No time limit. You'll see how you did at the end.</p><button class="btn primary" data-act="start-quiz">Start the quiz</button></div>
          </section>

          <section id="sec-summary" data-section="summary" class="lsec">
            <h2>Lesson summary</h2>
            <div class="summary">
              <ul class="ticks">${exSol.steps.map((s) => `<li><strong>${esc(s.title)}.</strong> ${esc(s.rule)}</li>`).join("")}</ul>
            </div>
            <div class="next-up">${nextLessonCard(topic)}</div>
            <button class="btn primary" data-act="complete">Mark lesson complete</button>
          </section>` : `
          <section id="sec-next" data-section="next" class="lsec">
            <h2>Keep going</h2>
            <div class="topic-grid">${related(topic).map(topicCard).join("")}</div>
          </section>`}
        </article>
      </div>`;

    const body = $(".lesson-body");
    // Section progress: mark sections as they are reached.
    const meter = $(".meter");
    const markDone = (k) => {
      if (done.has(k)) return;
      done.add(k);
      $(`.lesson-nav [data-sec="${k}"]`)?.classList.add("done");
      meter.querySelector("span").style.width = `${(done.size / sections.length) * 100}%`;
      meter.setAttribute("aria-valuenow", done.size);
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) markDone(en.target.dataset.section); }), { rootMargin: "0px 0px -45% 0px" });
      $$(".lsec", body).forEach((s) => io.observe(s));
      cleanup.push(() => io.disconnect());
    }
    $(".lesson-nav").addEventListener("click", (e) => {
      const k = e.target.closest("[data-jump]")?.dataset.jump;
      if (!k) return;
      e.preventDefault();
      $("#sec-" + k).scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });

    if (!eng) return;
    if (isFractionAdd) wireFractionExplorer();
    if (topic.id === "add-fractions") wirePizzaStory();

    const stepper = Stepper($("#lesson-stepper"), exSol, { problemText: exText });
    tutorCtx.onAction = (it) => {
      if (it.action === "visual") stepper.showVisual();
      if (it.action === "step") stepper.goTo(it.n === -1 ? exSol.steps.length - 1 : it.n - 1);
      if (it.action === "easier" || it.action === "harder" || it.action === "example") {
        const cur = P.level(topic.id);
        const L = P.LEVELS, idx = L.indexOf(cur);
        const lvl = it.action === "easier" ? L[Math.max(0, idx - 1)] : it.action === "harder" ? L[Math.min(L.length - 1, idx + 1)] : cur;
        P.setLevel(topic.id, lvl);
        practice.next(lvl);
        $("#sec-practice").scrollIntoView({ behavior: "smooth" });
      }
    };
    cleanup.push(() => { tutorCtx.onAction = null; });

    // Try it yourself: a fresh problem at the student's level.
    const tryProblem = topic.id === "add-fractions" ? { engine: "fractionAdd", a: E.R(2, 3), b: E.R(1, 6), op: "+" } : eng.generate(P.level(topic.id));
    Workspace($("#try-ws"), { topic, engineId: topic.engine, problem: tryProblem, onResult: (ok, o) => { const r = P.record(topic.id, ok, { usedHint: o.usedHint, title: topic.title }); r.newBadges.forEach(badgeToast); } });

    const practice = Practice($("#practice"), topic);

    body.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "open-player") {
        const scenes = SW.narrator.scenesFor(topic, exSol, exText);
        const p = SW.narrator.mount($("#player-slot"), scenes);
        cleanup.push(() => p.destroy());
      }
      if (act === "start-quiz") Quiz($("#quiz"), topic);
      if (act === "complete") {
        badgeToast(P.completeLesson(topic.id, topic.title));
        sections.forEach(([k]) => markDone(k));
        toast(`<strong>Lesson complete.</strong><span>${esc(topic.title)} is saved to your dashboard.</span>`);
      }
    });
  }

  function learnGoals(t) {
    if (t.id === "add-fractions") return ["Why fractions need the same denominator before you add", "How to find a least common denominator", "How to rename fractions without changing their value", "How to add and simplify, including mixed numbers"];
    return [`What “${t.title.toLowerCase()}” means and when you use it`, "The rule behind each step, not only the steps", "How to spot and fix the most common mistake", "How it shows up in real life"];
  }
  function related(t) {
    return C.active.topics.filter((x) => x.id !== t.id && x.engine && (x.domain === t.domain || Math.abs(x.grade - t.grade) <= 1)).slice(0, 3);
  }
  function nextLessonCard(t) {
    const n = C.active.topics.filter((x) => x.engine && x.id !== t.id && x.grade >= t.grade).sort((a, b) => (a.domain === t.domain ? -1 : 0) - (b.domain === t.domain ? -1 : 0) || a.grade - b.grade)[0];
    return n ? `<p class="eyebrow">Next recommended lesson</p>${topicCard(n)}` : "";
  }

  // Fraction explorer: pick two fractions and watch the bars line up.
  function fractionExplorer() {
    const opt = (sel) => [2, 3, 4, 5, 6, 8].map((d) => `<option ${d === sel ? "selected" : ""}>${d}</option>`).join("");
    return `<div class="explorer">
      <div class="explorer-controls">
        <fieldset><legend>First fraction</legend>
          <label>Top <input type="number" id="fx-an" min="1" max="7" value="3"></label>
          <label>Bottom <select id="fx-ad">${opt(4)}</select></label></fieldset>
        <fieldset><legend>Second fraction</legend>
          <label>Top <input type="number" id="fx-bn" min="1" max="7" value="1"></label>
          <label>Bottom <select id="fx-bd">${opt(2)}</select></label></fieldset>
        <button class="btn soft" data-act="fx-common" type="button" aria-pressed="false">Cut into same-size pieces</button>
      </div>
      <div class="visual-box" id="fx-out"></div>
      <p class="caption-note" id="fx-note"></p>
    </div>`;
  }
  function wireFractionExplorer() {
    let common = false;
    const draw = () => {
      const ad = +$("#fx-ad").value, bd = +$("#fx-bd").value;
      const an = Math.max(1, Math.min(ad, +$("#fx-an").value || 1)), bn = Math.max(1, Math.min(bd, +$("#fx-bn").value || 1));
      const L = E.lcm(ad, bd);
      const rows = common ? [E.R(an * (L / ad), L), E.R(bn * (L / bd), L)] : [E.R(an, ad), E.R(bn, bd)];
      const sum = E.reduce(E.R(an * bd + bn * ad, ad * bd));
      $("#fx-out").innerHTML = V.bars(rows, { label: common ? "Same-size pieces" : "Different piece sizes" }) + (common ? V.bars([E.R(rows[0].n + rows[1].n, L)], { label: "Together" }) : "");
      $("#fx-note").textContent = common
        ? `Both are now cut into ${L}ths: ${rows[0].n}/${L} + ${rows[1].n}/${L} = ${rows[0].n + rows[1].n}/${L}${E.mixed(sum) !== `${rows[0].n + rows[1].n}/${L}` ? " = " + E.mixed(sum) : ""}.`
        : `${an}/${ad} and ${bn}/${bd} use different piece sizes, so we can't just count pieces yet. Press “Cut into same-size pieces”.`;
    };
    ["#fx-an", "#fx-ad", "#fx-bn", "#fx-bd"].forEach((s) => $(s).addEventListener("input", draw));
    $("[data-act=fx-common]").addEventListener("click", (e) => { common = !common; e.currentTarget.setAttribute("aria-pressed", common); e.currentTarget.textContent = common ? "Show original pieces" : "Cut into same-size pieces"; draw(); });
    draw();
  }

  // The pizza story is a short interactive: the student makes choices.
  function pizzaStory() {
    return `<div class="story pizza-story">
      <div class="pizzas" aria-hidden="false">
        <figure>${V.pizza(3, 4)}<figcaption>Maya ate <strong>3/4</strong></figcaption></figure>
        <figure id="leo-pizza">${V.pizza(1, 2, "b")}<figcaption>Leo ate <strong>1/2</strong></figcaption></figure>
      </div>
      <div class="story-text">
        <p>Maya and Leo each ordered a pizza. Maya ate 3 of her 4 slices. Leo's pizza was cut into only 2 big slices, and he ate 1.</p>
        <p class="q">How much pizza did they eat together?</p>
        <div class="choices" role="group" aria-label="Pick a first move">
          <button class="btn soft" data-story="add">Add 3 + 1 slices = 4 slices</button>
          <button class="btn soft" data-story="cut">Cut Leo's slices so they match Maya's</button>
        </div>
        <p class="story-out" role="status" aria-live="polite"></p>
      </div>
    </div>`;
  }
  function wirePizzaStory() {
    const out = $(".story-out");
    $(".pizza-story").addEventListener("click", (e) => {
      const c = e.target.closest("[data-story]")?.dataset.story;
      if (c === "add") { out.className = "story-out try"; out.textContent = "Careful! Leo's slices are twice as big as Maya's. Counting a big slice the same as a small one isn't fair. Try the other choice."; }
      if (c === "cut") {
        $("#leo-pizza").innerHTML = `${V.pizza(2, 4, "b")}<figcaption>Leo ate <strong>2/4</strong></figcaption>`;
        out.className = "story-out good";
        out.textContent = "Now every slice is a fourth. Maya ate 3 fourths and Leo ate 2 fourths: 3/4 + 2/4 = 5/4. That's one whole pizza and 1/4 more, or 1 1/4 pizzas.";
      }
    });
  }

  // ---------- Practice with personalized difficulty ----------
  function Practice(root, topic) {
    const eng = E.get(topic.engine);
    let auto = true, current = null, remedial = null, solvedCount = 0;
    root.innerHTML = `
      <div class="practice-head">
        <div class="seg" role="radiogroup" aria-label="Difficulty">
          ${["auto", ...P.LEVELS].map((l) => `<button role="radio" class="seg-btn" data-level="${l}" aria-checked="false">${l === "auto" ? "Adapt to me" : LEVEL_LABEL[l]}</button>`).join("")}
        </div>
        <p class="level-note" aria-live="polite"></p>
      </div>
      <div class="remedial" hidden></div>
      <div id="practice-ws"></div>
      <div class="practice-foot"><span class="tabular solved-count"></span><button class="btn" data-act="new">New problem</button></div>`;
    const note = root.querySelector(".level-note");
    const syncSeg = () => $$(".seg-btn", root).forEach((b) => b.setAttribute("aria-checked", auto ? b.dataset.level === "auto" : b.dataset.level === P.level(topic.id)));
    const updateCount = () => { root.querySelector(".solved-count").textContent = `${solvedCount} solved this session`; };

    function next(level) {
      level = level || P.level(topic.id, topic.level || "medium");
      if (!P.get().topics[topic.id]?.level) P.setLevel(topic.id, level);
      current = eng.generate(level);
      note.textContent = `Level: ${LEVEL_LABEL[level]}${auto ? " (adjusts as you go)" : ""}`;
      syncSeg();
      Workspace(root.querySelector("#practice-ws"), {
        topic, engineId: topic.engine, problem: current, compact: true, title: `Practice · ${LEVEL_LABEL[level]}`,
        onResult(ok, o) {
          const r = P.record(topic.id, ok, { usedHint: o.usedHint, title: topic.title });
          r.newBadges.forEach(badgeToast);
          if (ok) { solvedCount++; updateCount(); }
          if (auto && r.levelChange) {
            note.textContent = r.levelChange.dir === "up" ? `Three in a row! Moving up to ${LEVEL_LABEL[r.levelChange.level]}.` : `Let's make it a little easier: ${LEVEL_LABEL[r.levelChange.level]}.`;
          }
          if (!auto && r.levelChange) P.setLevel(topic.id, root.querySelector(".seg-btn[aria-checked=true]")?.dataset.level || level);
          if (r.suggestPrereq && E.prerequisite[topic.engine]) offerRemedial();
          if (ok) setTimeout(() => { if (root.isConnected) next(); }, 1600);
        },
      });
    }
    function offerRemedial() {
      const pre = E.prerequisite[topic.engine];
      const preEng = E.get(pre);
      const preTopic = C.active.topics.find((t) => t.engine === pre);
      const box = root.querySelector(".remedial");
      box.hidden = false;
      remedial = preEng.generate("easy");
      box.innerHTML = `<p><strong>Quick warm-up.</strong> These problems use ${esc(preTopic ? preTopic.title.toLowerCase() : "a skill")} first. Let's practice that, then come back.</p><div id="remedial-ws"></div><button class="btn ghost" data-act="close-remedial">Back to ${esc(topic.title.toLowerCase())}</button>`;
      Workspace(box.querySelector("#remedial-ws"), { topic: preTopic || topic, engineId: pre, problem: remedial, compact: true, title: "Warm-up", onResult(ok) { if (ok) { P.record(preTopic ? preTopic.id : pre, true, { title: preTopic?.title }); toast("<strong>Warm-up done.</strong><span>Now try the main problem again.</span>"); } } });
    }
    root.addEventListener("click", (e) => {
      const l = e.target.closest("[data-level]")?.dataset.level;
      if (l) { auto = l === "auto"; if (!auto) P.setLevel(topic.id, l); next(); return; }
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "new") next();
      if (act === "close-remedial") { root.querySelector(".remedial").hidden = true; const t = P.get().topics[topic.id]; if (t) t.streakWrong = 0; }
    });
    updateCount();
    next();
    return { next };
  }

  // ---------- Mini quiz ----------
  function Quiz(root, topic) {
    const eng = E.get(topic.engine);
    const levels = ["easy", "medium", "medium", "hard", "hard"];
    const qs = levels.map((lvl, k) => {
      const p = topic.id === "add-fractions" && k === 0 ? { engine: "fractionAdd", a: E.R(1, 5), b: E.R(2, 5), op: "+" } : eng.generate(lvl);
      const sol = eng.solve(p);
      const mc = k % 2 === 1;
      let options = null;
      if (mc) {
        // Distractors come from real mistakes where we know them, then nearby values.
        const A = sol.answer, dec = /\./.test(sol.answerText);
        const fmt = (v) => (dec ? (v.n / v.d).toFixed(2) : E.mixed(v).replace("-", "−"));
        const correct = fmt(A);
        const wrong = new Set();
        if (p.a && p.a.d) wrong.add(`${p.a.n + (p.op === "+" ? p.b.n : -p.b.n)}/${p.a.d + p.b.d}`);
        [E.R(A.n + A.d, A.d), E.R(2 * A.n, A.d), E.R(A.n - A.d, A.d), E.R(A.n + 1, A.d), E.R(-A.n, A.d)]
          .map(E.reduce).forEach((v) => { if (v.n !== 0 && (A.n < 0 || v.n > 0)) wrong.add(fmt(v)); });
        wrong.delete(correct);
        options = [correct, ...[...wrong].slice(0, 3)].sort(() => Math.random() - 0.5);
      }
      return { p, sol, text: eng.text(p), options, answer: null, correct: null };
    });
    let i = 0;
    function render() {
      if (i >= qs.length) return finish();
      const q = qs[i];
      root.innerHTML = `
        <div class="quiz">
          <div class="quiz-top"><span class="eyebrow">Question ${i + 1} of ${qs.length}</span>
            <span class="quiz-dots" aria-hidden="true">${qs.map((x, k) => `<span class="${x.correct === true ? "ok" : x.correct === false ? "no" : k === i ? "now" : ""}"></span>`).join("")}</span></div>
          <p class="quiz-q">${esc(q.text)}${/=|\?$/.test(q.text) ? "" : " = ?"}</p>
          ${q.options
            ? `<div class="choices" role="radiogroup" aria-label="Answer choices">${q.options.map((o) => `<button role="radio" aria-checked="false" class="btn soft choice" data-choice="${esc(o)}">${esc(o)}</button>`).join("")}</div>`
            : `<form data-form="quiz" class="inline-answer"><label class="sr-only" for="quiz-in">Your answer</label><input id="quiz-in" class="answer-input" autocomplete="off" placeholder="your answer"><button class="btn primary">Submit</button></form>`}
          <p class="feedback" role="status" aria-live="polite"></p>
        </div>`;
      root.querySelector("input")?.focus();
    }
    function answer(val) {
      const q = qs[i];
      const r = eng.check(q.p, val);
      q.answer = val; q.correct = r.correct;
      const fb = root.querySelector(".feedback");
      fb.className = `feedback ${r.correct ? "good" : "try"}`;
      fb.textContent = r.correct ? praise() : `Not this time. ${r.message} The answer is ${q.sol.answerText}.`;
      P.record(topic.id, r.correct, { title: topic.title });
      $$("button, input", root).forEach((b) => (b.disabled = true));
      root.querySelector(".quiz").insertAdjacentHTML("beforeend", `<button class="btn primary" data-act="quiz-next">${i === qs.length - 1 ? "See my results" : "Next question"}</button>`);
      root.querySelector("[data-act=quiz-next]").focus();
    }
    function finish() {
      const score = qs.filter((q) => q.correct).length;
      const stars = score === 5 ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0;
      badgeToast(P.recordQuiz(topic.id, score, qs.length, topic.title));
      root.innerHTML = `
        <div class="quiz-result">
          <div class="stars" aria-label="${stars} of 3 stars">${[0, 1, 2].map((k) => `<span class="${k < stars ? "on" : ""}">★</span>`).join("")}</div>
          <p class="big-score tabular">${score} / ${qs.length}</p>
          <p>${score === 5 ? "Every one right. You've got this!" : score >= 3 ? "Good work. Review the ones you missed below." : "Keep practicing. Each try teaches your brain something."}</p>
          <ol class="review">${qs.map((q) => `<li class="${q.correct ? "ok" : "no"}"><span>${esc(q.text)}</span><span>${q.correct ? "✓" : "✗"} ${esc(q.sol.answerText)}</span></li>`).join("")}</ol>
          <button class="btn" data-act="start-quiz">Try a new quiz</button>
        </div>`;
    }
    root.onclick = (e) => {
      const c = e.target.closest("[data-choice]");
      if (c && !c.disabled) { c.setAttribute("aria-checked", "true"); answer(c.dataset.choice); return; }
      if (e.target.closest("[data-act=quiz-next]")) { i++; render(); }
    };
    root.onsubmit = (e) => { e.preventDefault(); const v = root.querySelector("#quiz-in").value; if (v.trim()) answer(v); };
    render();
  }

  // ---------- Solve a Problem ----------
  function solve() {
    setBand(P.get().grade || 7);
    const examples = ["2x + 5 = 17", "3/4 + 1/2", "5/6 - 1/3", "25% of 60", "-4 + 9", "7 × 8", "38 + 27"].filter((x) => E.recognize(x));
    main().innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span>›</span><span aria-current="page">Solve a Problem</span></nav>
      <h1 class="page-h">Enter a math problem</h1>
      <p class="sub">Type a problem and we'll work through it together, one step at a time. You'll be asked to try each step before it's shown.</p>
      <form class="solve-form" data-form="solve">
        <label for="solve-in" class="sr-only">Math problem</label>
        <input id="solve-in" class="answer-input big" placeholder="e.g. 2x + 5 = 17" autocomplete="off">
        <button class="btn primary lg">Explain it</button>
      </form>
      <div class="chips" aria-label="Examples">${examples.map((x) => `<button class="chip" data-ex="${esc(x)}">${esc(x)}</button>`).join("")}</div>
      <p class="muted small">Works today with fraction addition and subtraction, one- and two-step linear equations, percent of a number, integer addition, and whole-number arithmetic. Photo and handwriting upload is planned.</p>
      <div id="solve-out"></div>`;
    const out = $("#solve-out");
    const run = (q) => {
      $("#solve-in").value = q;
      const rec = E.recognize(q);
      if (!rec) {
        out.innerHTML = `<div class="notice">I couldn't recognize that yet. Try the format of one of the examples above, like <code>3/4 + 1/2</code> or <code>2x + 5 = 17</code>. You can also search for the topic from the home page.</div>`;
        return;
      }
      const eng = E.get(rec.engine), sol = eng.solve(rec.problem), topic = C.topic(rec.topicId);
      out.innerHTML = `
        <div class="solve-result">
          <p class="eyebrow">Recognized topic</p>
          <h2>${esc(topic ? topic.title : rec.engine)}${topic ? ` <a class="small-link" href="#lesson.${topic.id}">Open the full lesson →</a>` : ""}</h2>
          <div class="demo-eq">${esc(eng.text(rec.problem))}</div>
          <div id="solve-stepper"></div>
        </div>`;
      const st = Stepper($("#solve-stepper"), sol, { problemText: eng.text(rec.problem) });
      tutorCtx.onAction = (it) => {
        if (it.action === "visual") st.showVisual();
        if (it.action === "step") st.goTo(it.n === -1 ? sol.steps.length - 1 : it.n - 1);
      };
    };
    $("[data-form=solve]").addEventListener("submit", (e) => { e.preventDefault(); const q = $("#solve-in").value.trim(); if (q) run(q); });
    $(".chips").addEventListener("click", (e) => { const x = e.target.closest("[data-ex]"); if (x) run(x.dataset.ex); });
    cleanup.push(() => { tutorCtx.onAction = null; });
    run(pendingTake("solveQ") || "2x + 5 = 17");
  }

  // ---------- Student dashboard ----------
  function progress() {
    const s = P.get();
    setBand(s.grade || 5);
    const cls = P.classify();
    const empty = P.isEmpty();
    const topicRows = Object.entries(s.topics).map(([id, t]) => ({ t: C.topic(id), stats: t })).filter((r) => r.t);
    const rec = recommendNext();
    main().innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span>›</span><span aria-current="page">My Progress</span></nav>
      <div class="dash-head">
        <h1 class="page-h">${s.name ? esc(s.name) + "'s" : "My"} progress</h1>
        <form class="name-form" data-form="name"><label for="nm">Your name</label><input id="nm" value="${esc(s.name)}" placeholder="optional" maxlength="30"><button class="btn ghost">Save</button></form>
      </div>
      ${empty ? `<div class="notice">You haven't solved anything yet, so this is a fresh dashboard. Start with the <a href="#lesson.add-fractions">Adding Fractions lesson</a>. Your stars, streak and skills will fill in as you practice.</div>` : ""}
      <div class="stat-row">
        ${stat("Lessons completed", Object.keys(s.lessons).length)}
        ${stat("Problems attempted", s.attempts)}
        ${stat("Accuracy", s.attempts ? P.accuracy() + "%" : "–")}
        ${stat("Learning streak", P.streak() + (P.streak() === 1 ? " day" : " days"))}
      </div>
      <div class="dash-grid">
        <section class="panel">
          <h2>Recommended next</h2>
          ${rec ? topicCard(rec) : "<p>Pick any lesson to begin.</p>"}
        </section>
        <section class="panel">
          <h2>Assigned by your teacher</h2>
          ${s.assignments.length ? `<ul class="assign-list">${s.assignments.map((a) => { const t = C.topic(a.topicId); return `<li class="${a.done ? "done" : ""}"><a href="#lesson.${a.topicId}">${esc(t ? t.title : a.topicId)}</a>${a.note ? `<span>${esc(a.note)}</span>` : ""}<span class="pill ${a.done ? "full" : "preview"}">${a.done ? "Done" : "To do"}</span></li>`; }).join("")}</ul>` : `<p class="muted">Nothing assigned right now.</p>`}
        </section>
        <section class="panel wide">
          <h2>Skills by topic</h2>
          ${topicRows.length ? `<ul class="skill-bars">${topicRows.map(({ t, stats }) => `<li><span class="sk-name">${esc(t.title)}</span><span class="sk-bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${P.accuracy(stats)}" aria-label="${esc(t.title)} accuracy"><span style="width:${P.accuracy(stats)}%"></span></span><span class="sk-num tabular">${P.accuracy(stats)}% · ${stats.attempts} tries</span></li>`).join("")}</ul>` : `<p class="muted">Skills appear after your first practice problem.</p>`}
        </section>
        <section class="panel">
          <h2>Topics mastered</h2>
          ${chipList(cls.mastered, "full", "Master a topic by getting 5 or more problems right at 80% or better.")}
          <h2 class="mt">Keep practicing</h2>
          ${chipList(cls.needs, "warn", "Nothing flagged. Nice!")}
        </section>
        <section class="panel">
          <h2>Quizzes</h2>
          ${s.quizzes.length ? `<ul class="quiz-list">${s.quizzes.slice(-6).reverse().map((q) => `<li><span>${esc(C.topic(q.topicId)?.title || q.topicId)}</span><span class="tabular">${q.score}/${q.total}</span></li>`).join("")}</ul>` : `<p class="muted">Take a mini quiz at the end of a lesson.</p>`}
        </section>
        <section class="panel wide">
          <h2>Badges</h2>
          <div class="badges">${Object.entries(P.BADGES).map(([id, b]) => `<div class="badge ${s.badges.includes(id) ? "earned" : ""}"><span class="medal" aria-hidden="true">★</span><strong>${esc(b.name)}</strong><span>${esc(b.desc)}</span><em>${s.badges.includes(id) ? "Earned" : "Not yet"}</em></div>`).join("")}</div>
        </section>
      </div>
      <p class="muted small">Progress is saved in this browser. <button class="linkish" data-act="reset">Reset my progress</button></p>
      <div class="confirm" hidden><p>Erase all progress on this device?</p><button class="btn" data-act="reset-yes">Yes, erase</button><button class="btn ghost" data-act="reset-no">Keep it</button></div>`;
    $("[data-form=name]").addEventListener("submit", (e) => { e.preventDefault(); P.setProfile({ name: $("#nm").value.trim() }); progress(); toast("<strong>Saved.</strong>"); });
    main().addEventListener("click", onResetClick);
    cleanup.push(() => main().removeEventListener("click", onResetClick));
  }
  function onResetClick(e) {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "reset") $(".confirm").hidden = false;
    if (act === "reset-no") $(".confirm").hidden = true;
    if (act === "reset-yes") { P.reset(); route(); toast("<strong>Progress erased.</strong>"); }
  }
  const stat = (label, value) => `<div class="stat"><span class="stat-v tabular">${esc(value)}</span><span class="stat-l">${esc(label)}</span></div>`;
  const chipList = (ids, tone, empty) => (ids.length ? `<div class="chips">${ids.map((id) => `<a class="chip ${tone}" href="#lesson.${id}">${esc(C.topic(id)?.title || id)}</a>`).join("")}</div>` : `<p class="muted">${esc(empty)}</p>`);

  function recommendNext() {
    const s = P.get(), cls = P.classify();
    const assigned = s.assignments.find((a) => !a.done);
    if (assigned) return C.topic(assigned.topicId);
    if (cls.needs.length) return C.topic(cls.needs[0]);
    const g = s.grade || 5;
    return C.active.topics.filter((t) => t.engine && !s.lessons[t.id]).sort((a, b) => Math.abs(a.grade - g) - Math.abs(b.grade - g) || (b.flagship ? 1 : 0) - (a.flagship ? 1 : 0))[0];
  }

  // ---------- Parent & teacher view ----------
  function grownups(arg) {
    const role = arg === "teacher" ? "teacher" : "parent";
    const s = P.get();
    setBand(9);
    const cls = P.classify();
    const mins = Math.round(s.practiceSeconds / 60);
    const days = Object.entries(s.daily || {}).sort().slice(-14);
    main().innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span>›</span><span aria-current="page">Parents &amp; Teachers</span></nav>
      <h1 class="page-h">Parent &amp; teacher view</h1>
      <div class="seg" role="tablist" aria-label="Role">
        <a role="tab" class="seg-btn" aria-selected="${role === "parent"}" href="#grownups.parent">Parent</a>
        <a role="tab" class="seg-btn" aria-selected="${role === "teacher"}" href="#grownups.teacher">Teacher</a>
      </div>
      <p class="sub">${role === "parent" ? "A calm summary of what your child has been learning on this device." : "Assign lessons and see where this student needs support. Classroom rosters and accounts are planned; for now this view covers the student using this device."}</p>
      ${P.isEmpty() ? `<div class="notice">No activity recorded on this device yet. Once the student practices, progress appears here.</div>` : ""}
      <div class="stat-row">
        ${stat("Practice time", mins < 1 ? "under 1 min" : mins + " min")}
        ${stat("Problems attempted", s.attempts)}
        ${stat("Accuracy", s.attempts ? P.accuracy() + "%" : "–")}
        ${stat("Quizzes taken", s.quizzes.length)}
      </div>
      <div class="dash-grid">
        <section class="panel wide">
          <h2>Improvement over time</h2>
          ${days.length >= 1 ? trendChart(days) : `<p class="muted">Daily accuracy appears after the first day of practice.</p>`}
        </section>
        <section class="panel">
          <h2>Skills mastered</h2>${chipList(cls.mastered, "full", "None yet: mastery needs 5+ problems at 80% or better.")}
        </section>
        <section class="panel">
          <h2>Areas of difficulty</h2>${chipList(cls.needs, "warn", "No topic is below 60% accuracy.")}
        </section>
        <section class="panel">
          <h2>Quiz results</h2>
          ${s.quizzes.length ? `<ul class="quiz-list">${s.quizzes.slice(-8).reverse().map((q) => `<li><span>${esc(C.topic(q.topicId)?.title || q.topicId)}</span><span class="tabular">${q.score}/${q.total}</span></li>`).join("")}</ul>` : `<p class="muted">No quizzes yet.</p>`}
        </section>
        <section class="panel">
          <h2>Recent activity</h2>
          ${s.activity.length ? `<ul class="activity">${s.activity.slice(0, 8).map((a) => `<li><time>${new Date(a.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>${esc(a.text)}</li>`).join("")}</ul>` : `<p class="muted">Nothing yet.</p>`}
        </section>
        <section class="panel">
          <h2>Recommended topics</h2>
          ${[...cls.needs.map((id) => C.topic(id)), recommendNext()].filter(Boolean).slice(0, 3).map((t) => `<p><a href="#lesson.${t.id}">${esc(t.title)}</a> <span class="muted">Grade ${t.grade}</span></p>`).join("") || `<p class="muted">Start with any lesson.</p>`}
        </section>
        ${role === "teacher" ? `
        <section class="panel wide">
          <h2>Assign a lesson</h2>
          <form class="assign-form" data-form="assign">
            <label for="as-topic">Lesson</label>
            <select id="as-topic">${C.active.topics.filter((t) => t.engine).map((t) => `<option value="${t.id}">Grade ${t.grade} · ${esc(t.title)}</option>`).join("")}</select>
            <label for="as-note">Note for the student</label>
            <input id="as-note" maxlength="80" placeholder="e.g. Finish by Friday">
            <button class="btn primary">Assign</button>
          </form>
          ${s.assignments.length ? `<ul class="assign-list">${s.assignments.map((a, k) => `<li class="${a.done ? "done" : ""}"><span>${esc(C.topic(a.topicId)?.title || a.topicId)}</span>${a.note ? `<span>${esc(a.note)}</span>` : ""}<span class="pill ${a.done ? "full" : "preview"}">${a.done ? "Completed" : "Assigned"}</span><button class="linkish" data-unassign="${k}">Remove</button></li>`).join("")}</ul>` : ""}
        </section>` : ""}
      </div>`;
    const f = $("[data-form=assign]");
    if (f) {
      f.addEventListener("submit", (e) => { e.preventDefault(); P.assign($("#as-topic").value, $("#as-note").value.trim()); grownups("teacher"); toast("<strong>Assigned.</strong><span>It now shows on the student's dashboard.</span>"); });
      const un = (e) => { const k = e.target.closest("[data-unassign]")?.dataset.unassign; if (k != null) { P.removeAssignment(+k); cleanup.forEach((fn) => fn()); cleanup = []; grownups("teacher"); } };
      main().addEventListener("click", un);
      cleanup.push(() => main().removeEventListener("click", un));
    }
  }

  function trendChart(days) {
    const W = 520, H = 160, pad = 32;
    const pts = days.map(([d, v], k) => ({ d, acc: v.a ? Math.round((100 * v.c) / v.a) : 0, a: v.a, x: days.length === 1 ? W / 2 : pad + (k * (W - 2 * pad)) / (days.length - 1) }));
    const Y = (acc) => H - 24 - (acc / 100) * (H - 48);
    const line = pts.map((p, k) => `${k ? "L" : "M"}${p.x},${Y(p.acc)}`).join(" ");
    const area = `${line} L${pts[pts.length - 1].x},${Y(0)} L${pts[0].x},${Y(0)} Z`;
    return `<div class="chart-wrap"><svg class="viz trend" viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily accuracy: ${pts.map((p) => `${p.d} ${p.acc}%`).join(", ")}">
      ${[0, 50, 100].map((v) => `<line x1="${pad}" x2="${W - pad}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${pad - 6}" y="${Y(v) + 4}" text-anchor="end" class="t-small">${v}%</text>`).join("")}
      ${pts.length > 1 ? `<path d="${area}" class="area"/><path d="${line}" class="stroke-a" fill="none" stroke-width="2.5"/>` : ""}
      ${pts.map((p, k) => `<circle cx="${p.x}" cy="${Y(p.acc)}" r="${k === pts.length - 1 ? 5 : 3}" class="fill-a"/>`).join("")}
      ${pts.map((p, k) => (k === 0 || k === pts.length - 1) ? `<text x="${p.x}" y="${H - 4}" text-anchor="middle" class="t-small">${p.d.slice(5)}</text>` : "").join("")}
    </svg></div>`;
  }

  // =====================================================================
  // Tutor drawer
  // =====================================================================
  function initTutor() {
    const drawer = $("#tutor"), log = $("#tutor-log"), form = $("#tutor-form"), input = $("#tutor-in"), prov = $("#tutor-provider");
    const history = [];
    let ctl = null;
    const open = (v) => {
      drawer.hidden = !v; $("#tutor-toggle").setAttribute("aria-expanded", v);
      if (v) input.focus();
    };
    $("#tutor-toggle").addEventListener("click", () => open(drawer.hidden));
    $("#tutor-close").addEventListener("click", () => { open(false); $("#tutor-toggle").focus(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) { open(false); $("#tutor-toggle").focus(); } });
    SW.tutor.claudeAvailable().then((ok) => { prov.textContent = ok ? "Answers by Claude, with your permission" : "Built-in tutor"; });
    const add = (who, text) => {
      const el = document.createElement("div");
      el.className = `msg ${who}`;
      el.textContent = text;
      log.appendChild(el); log.scrollTop = log.scrollHeight;
      return el;
    };
    add("bot", "Hi! I'm your math tutor. I'll help you understand each step, and I'll give hints before answers. What would you like to know?");
    $("#tutor-chips").addEventListener("click", (e) => { const c = e.target.closest("[data-q]"); if (c) { input.value = c.dataset.q; form.requestSubmit(); } });
    $("#tutor-stop").addEventListener("click", () => ctl && ctl.abort());
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const q = input.value.trim(); if (!q) return;
      input.value = "";
      add("me", q);
      const bot = add("bot", "Thinking…");
      ctl = new AbortController();
      $("#tutor-stop").hidden = false;
      const res = await SW.tutor.ask(q, tutorCtx, { history, signal: ctl.signal, onText: ({ text }) => { bot.textContent = text; log.scrollTop = log.scrollHeight; } });
      $("#tutor-stop").hidden = true;
      bot.textContent = res.text || (res.cancelled ? "(stopped)" : "");
      if (res.provider === "claude") { history.push({ role: "user", content: q }, { role: "assistant", content: res.text }); }
      if (res.fallback === "not_granted") prov.textContent = "Built-in tutor";
      if (tutorCtx.onAction && res.action) tutorCtx.onAction(res.action);
      else if (["easier", "harder", "example"].includes(res.action.action)) bot.textContent += " Open a lesson to get practice problems.";
    });
  }

  // =====================================================================
  // Boot
  // =====================================================================
  function boot() {
    initTutor();
    window.addEventListener("hashchange", route);
    // Count practice time only while the page is visible.
    setInterval(() => { if (document.visibilityState === "visible" && /lesson|solve/.test(location.hash)) P.addSeconds(15); }, 15000);
    route();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})(window.StepWise = window.StepWise || {});
