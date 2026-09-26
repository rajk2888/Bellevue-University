/* StepWise Math — learner progress and adaptive difficulty.
 *
 * Version 1 keeps progress in this browser (localStorage). The store is
 * accessed only through this module, so a future version can swap in student,
 * parent and teacher accounts backed by a server without touching the views.
 */
(function (SW) {
  "use strict";
  const KEY = "stepwise.progress.v1";
  const LEVELS = ["easy", "medium", "hard", "challenge"];
  const today = () => new Date().toISOString().slice(0, 10);

  const blank = () => ({
    v: 1, name: "", grade: 5, attempts: 0, correct: 0, practiceSeconds: 0,
    lessons: {}, topics: {}, daily: {}, quizzes: [], days: [], badges: [], activity: [], assignments: [],
  });

  let state = load();
  const listeners = new Set();

  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return Object.assign(blank(), s); } catch (e) { /* storage unavailable */ }
    return blank();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* keep working in memory */ }
    listeners.forEach((fn) => fn(state));
  }
  function topic(id) {
    if (!state.topics[id]) state.topics[id] = { attempts: 0, correct: 0, streakRight: 0, streakWrong: 0, level: null };
    return state.topics[id];
  }
  function touchDay() { const d = today(); if (!state.days.includes(d)) state.days.push(d); }
  function log(text) { state.activity.unshift({ at: Date.now(), text }); state.activity = state.activity.slice(0, 40); }

  const BADGES = {
    "first-step": { name: "First Step", desc: "Solved your first problem" },
    "on-a-roll": { name: "On a Roll", desc: "5 correct in a row" },
    "hint-hero": { name: "Hint Hero", desc: "Used a hint and then got it right" },
    "lesson-done": { name: "Lesson Complete", desc: "Finished a whole lesson" },
    "quiz-star": { name: "Quiz Star", desc: "Scored 4 or more on a mini quiz" },
    "three-days": { name: "Three-Day Streak", desc: "Practiced three days in a row" },
  };
  function award(id) {
    if (state.badges.includes(id)) return null;
    state.badges.push(id);
    log(`Earned the “${BADGES[id].name}” badge`);
    return BADGES[id];
  }

  SW.progress = {
    LEVELS, BADGES,
    get: () => state,
    onChange: (fn) => listeners.add(fn),
    isEmpty: () => state.attempts === 0 && !Object.keys(state.lessons).length,
    setProfile(p) { Object.assign(state, p); save(); },

    /** Record one answer. Returns { newBadges, levelChange, suggestPrereq }. */
    record(topicId, correct, { usedHint = false, title = topicId } = {}) {
      const t = topic(topicId);
      state.attempts++; t.attempts++;
      touchDay();
      const day = (state.daily[today()] = state.daily[today()] || { a: 0, c: 0 });
      day.a++; if (correct) day.c++;
      const newBadges = [];
      let levelChange = null, suggestPrereq = false;
      if (correct) {
        state.correct++; t.correct++; t.streakRight++; t.streakWrong = 0;
        const b1 = award("first-step"); if (b1) newBadges.push(b1);
        if (t.streakRight >= 5) { const b = award("on-a-roll"); if (b) newBadges.push(b); }
        if (usedHint) { const b = award("hint-hero"); if (b) newBadges.push(b); }
        if (t.streakRight >= 3 && t.level && LEVELS.indexOf(t.level) < LEVELS.length - 1) {
          t.level = LEVELS[LEVELS.indexOf(t.level) + 1]; t.streakRight = 0; levelChange = { dir: "up", level: t.level };
        }
      } else {
        t.streakWrong++; t.streakRight = 0;
        if (t.streakWrong >= 2 && t.level && LEVELS.indexOf(t.level) > 0) {
          t.level = LEVELS[LEVELS.indexOf(t.level) - 1]; levelChange = { dir: "down", level: t.level };
        }
        if (t.streakWrong >= 3) suggestPrereq = true;
      }
      if (this.streak() >= 3) { const b = award("three-days"); if (b) newBadges.push(b); }
      log(`${correct ? "Solved" : "Tried"} a ${title} problem`);
      save();
      return { newBadges, levelChange, suggestPrereq };
    },
    level(topicId, fallback = "medium") { return topic(topicId).level || fallback; },
    setLevel(topicId, level) { topic(topicId).level = level; topic(topicId).streakRight = 0; topic(topicId).streakWrong = 0; save(); },
    addSeconds(s) { state.practiceSeconds += s; save(); },
    completeLesson(topicId, title) {
      const first = !state.lessons[topicId];
      state.lessons[topicId] = { at: Date.now() };
      if (first) log(`Completed the lesson “${title}”`);
      const b = award("lesson-done");
      state.assignments.forEach((a) => { if (a.topicId === topicId) a.done = true; });
      save();
      return b;
    },
    recordQuiz(topicId, score, total, title) {
      state.quizzes.push({ topicId, score, total, at: Date.now() });
      log(`Scored ${score}/${total} on the ${title} quiz`);
      const b = score >= 4 ? award("quiz-star") : null;
      save();
      return b;
    },
    assign(topicId, note) { state.assignments.push({ topicId, note, at: Date.now(), done: !!state.lessons[topicId] }); log("A teacher assigned a lesson"); save(); },
    removeAssignment(i) { state.assignments.splice(i, 1); save(); },
    streak() {
      const set = new Set(state.days);
      let n = 0; const d = new Date();
      if (!set.has(today())) d.setDate(d.getDate() - 1);
      while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },
    accuracy(t = state) { return t.attempts ? Math.round((100 * t.correct) / t.attempts) : 0; },
    /** Mastered: ≥ 5 attempts at ≥ 80%. Needs help: ≥ 3 attempts under 60%. */
    classify() {
      const mastered = [], needs = [], learning = [];
      for (const [id, t] of Object.entries(state.topics)) {
        const acc = this.accuracy(t);
        if (t.attempts >= 5 && acc >= 80) mastered.push(id);
        else if (t.attempts >= 3 && acc < 60) needs.push(id);
        else learning.push(id);
      }
      return { mastered, needs, learning };
    },
    reset() { state = blank(); save(); },
  };
})(window.StepWise = window.StepWise || {});
