# StepWise Math

An interactive mathematics learning platform for Grades 1–12. It teaches
**how and why** each step works instead of generating answers:

> Understand → See → Follow → Try → Get Help → Practice → Master

It is a static web app with no build step and no dependencies (Google Fonts only).

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
cd math-platform
python3 -m http.server 8000   # then open http://localhost:8000
```

Run the engine tests:

```bash
node math-platform/tests/engine.test.js
```

## What works in version 1

| Area | What it does |
|---|---|
| **Home** | Hero, "What do you want to learn?" search (finds topics *and* recognizes typed problems), grade groups, popular topics, how it works, a live 3/4 + 1/2 stepper, progress snapshot, parent/teacher info |
| **Learn** | Grade 1–12 tabs → domains → topics. 40 topics across all grades; 15 with full interactive practice, the rest shown as previews with concept and real-world story |
| **Reference lesson: Grade 5 · Adding Fractions** | What you will learn → idea → fraction-bar explorer → interactive pizza story → worked example with try-first steps → narrated whiteboard lesson → Try It Yourself workspace → adaptive practice → 5-question mini quiz → summary → next lesson. A progress meter tracks the sections |
| **Step engine** | Every step has *what*, *why*, *the rule*, *a common mistake*, "Explain This Step Again", "Show Me Visually", and Previous/Next. Students are asked to try a step before it is revealed |
| **Workspace** | Answer box with a touch keypad (fractions, mixed numbers, negatives), optional scratch area, and Check My Answer / Give Me a Hint / Show Next Step / Explain Why / Start Over. Hints are progressive (three levels) before any step is shown, and wrong answers get a diagnosis (for example "you added the denominators") without revealing the answer |
| **Visual models** | Fraction bars, fraction circles (pizzas), multiples lists, balance scales, number lines with jumps, counters, base-ten blocks, arrays, hundred grids, marbles, bar charts. All are SVG, theme-aware, and have text alternatives |
| **Watch Explanation** | A narrated lesson on a digital chalkboard: animated equations and diagrams per scene, captions, text-to-speech when the browser supports it, play/pause, previous/next, and 0.75×–1.5× speed |
| **AI Math Tutor** | Chat drawer with suggested questions. It understands "Why did we…", "I don't understand step 4", "Explain like I'm in Grade 5", "Show me visually", "Easier/harder problem" and "Another example", and acts on the page where it can. Inside a Claude artifact viewer it answers with Claude (the viewer consents first); anywhere else a built-in tutor teaches from the lesson's step data. Both give hints before answers |
| **Personalized difficulty** | Easy / Medium / Hard / Challenge or "Adapt to me": three correct in a row moves up a level; two misses moves down; three misses offers a prerequisite warm-up (for example equivalent fractions before adding fractions) |
| **Solve a Problem** | Type `2x + 5 = 17`, `3/4 + 1/2`, `5/6 - 1/3`, `25% of 60`, `-4 + 9`, `7 × 8` or `38 + 27`. The topic is recognized and explained step by step |
| **Student dashboard** | Lessons completed, problems attempted, accuracy, streak, skills by topic, mastered / keep practicing, quizzes, badges, recommended next lesson, teacher assignments |
| **Parent & teacher view** | Practice time, accuracy trend over time, skills mastered, areas of difficulty, quiz results, recent activity, recommended topics; teachers can assign lessons, and assignments appear on the student dashboard |
| **Design** | Grade-band theming (bigger and rounder for Grades 1–5, cleaner and more academic for 9–12), light and dark themes, responsive to phone width, keyboard navigable, screen-reader labels, reduced-motion support |

## Architecture

```
math-platform/
├── index.html          # shell: top bar, main view, tutor drawer
├── styles.css          # tokens (light/dark), grade-band variables, components, SVG classes
├── js/curriculum.js    # curriculum registry (data only): bands → domains → topics
├── js/engine.js        # step-by-step engines: generate, parse, solve, check, hints
├── js/visuals.js       # SVG visual models from step descriptors
├── js/progress.js      # progress store, adaptive levels, badges (localStorage today)
├── js/tutor.js         # tutor providers: Claude (when available) or built-in
├── js/narrator.js      # narrated whiteboard lesson player
├── js/app.js           # router and views
└── tests/engine.test.js
```

Each part sits behind a small interface so later features can plug in:

- **Curricula and standards:** topics are data. `StepWise.curriculum.register()` adds another curriculum; `standards` on a topic maps to frameworks such as CCSS.
- **New topics:** an engine implements `generate / parse / solve / check / hints / text`. Steps are plain objects (`what, why, rule, mistake, again, expr, visual, ask`), so an AI question generator can produce them in the same shape.
- **Accounts, classrooms and analytics:** views read and write progress only through `progress.js`. Swapping it for an API-backed store adds student, parent and teacher accounts without changing the views.
- **AI tutoring, voice and images:** `tutor.js` already selects between providers. Speech-to-text, problem photos, and multiple languages become new providers or `recognize()` inputs.
- **Video lessons:** narrator scenes can carry a `video` URL when recorded lessons exist.

## Roadmap

Student, parent and teacher accounts; classroom management; standards alignment
reports; AI-generated practice sets; speech-to-text and voice tutoring; photo
problem recognition; recorded video lessons; multiple languages; printable
worksheets; certificates; and interactive lessons for every preview topic.
