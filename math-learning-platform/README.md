# StepWise Math — Math Made Easy, One Step at a Time

An interactive, child-friendly mathematics learning platform for **Grades 1–12**.
It is built to be a *digital math teacher*, not an answer generator: every
problem is explained one step at a time (what, why, the rule, a visual, common
mistakes), and students are asked to attempt each step before it is revealed.

> Understand → See → Follow → Try → Get Help → Practice → Master

## Quick start

```bash
cd math-learning-platform
npm install
npm run dev        # http://localhost:5173
npm test           # engine, solver, tutor & curriculum tests
npm run build      # static site in dist/ (works on any static host)
```

`npm run build:artifact` produces one self-contained page
(`dist-artifact/stepwise-math.html`, CSS and JS inlined, in-memory routing) for
hosts that serve a single sandboxed HTML file.

The build uses relative paths and hash routing, so `dist/` can be dropped onto
GitHub Pages, Netlify, S3, or opened from any web server.

## What's included

| Area | Where |
|---|---|
| Homepage (hero, search, grade groups, popular topics, how it works, live interactive example, progress, parent/teacher info) | `src/pages/HomePage.tsx` |
| Grade → Domain → Topic → Lesson browsing for Grades 1–12 | `src/pages/GradesPage.tsx`, `GradePage.tsx` |
| **Reference lesson: Grade 5 – Adding Fractions** (`#/lesson/g5-add-fractions`) | `src/pages/LessonPage.tsx` |
| Step-by-step explanation engine UI (prev/next, checkpoints, *Explain This Step Again*, *Show Me Visually*, read aloud) | `src/components/StepPlayer.tsx` |
| "Try It Yourself" workspace (keypad, scratch pad, fraction bars, graph paper, *Check / Hint / Show Next Step / Explain Why / Start Over*) | `src/components/Workspace.tsx` |
| Progressive hints + misconception feedback (e.g. "you added the denominators") | `src/engine/skills/*.ts` |
| Visual models (fraction bars/circles, pizza, number lines, counting objects, base-ten blocks, arrays, equal groups, balance scale, coordinate plane, parabolas, area grids, right triangles, marble bags, bar charts, percent bars, ratio tables, clocks, coins, shapes) | `src/components/visuals/Visuals.tsx` |
| Real-world interactive stories (pizza, shoe sale, recipe, flooring, phone plans, basketball, marbles, savings…) | `teaching.realWorld` in each skill |
| "Watch Explanation" narrated whiteboard lesson (TTS, captions with spoken-word highlight, speed, chapters, play/pause) | `src/components/NarratedLesson.tsx` |
| AI Math Tutor (hint-first; "why did we…", "step 4", "explain like I'm in grade 5", "show me visually", easier/harder, voice input) | `src/tutor/tutor.ts`, `src/components/TutorChat.tsx` |
| Adaptive practice (Easy/Medium/Hard/Challenge + automatic adjustment + prerequisite fallback) | `src/components/PracticeSet.tsx`, `src/engine/adaptive.ts` |
| Mini quiz with stars | `src/components/Quiz.tsx` |
| Search ("What do you want to learn?") and "Enter a Math Problem" solver | `src/pages/SearchPage.tsx`, `SolvePage.tsx`, `src/engine/solver.ts` |
| Student dashboard (lessons, attempts, accuracy, mastery, streak, quiz results, badges, recommendations, assignments) | `src/pages/DashboardPage.tsx` |
| Parent/teacher view (practice time, skills mastered, difficulties, quiz results, recent activity, weekly improvement, assign lessons, print) | `src/pages/FamilyPage.tsx` |

### Problems the solver understands

Whole-number + − × ÷, fractions (`3/4 + 1/2`), decimals, percents and discounts
(`$60 with 25% off`), proportions (`3/4 = x/12`), integers (`-7 + 12`), linear
equations incl. parentheses and variables on both sides (`3(x - 4) = 2x + 1`),
systems (`y = 2x + 1 and y = -x + 7`), quadratics (`x^2 - 5x + 6 = 0`, formula
for non-factorable ones), slope from two points, area, Pythagorean theorem,
mean, exponential equations/logs (`2^x = 32`), compound interest and
derivatives (`derivative of 3x^2 + 2x - 5`).

## Design

* **Grade-adaptive UI.** `data-band` on `<html>` switches between *early*
  (Grades 1–2: large controls, rounded font, playful colour), *elementary*,
  *middle* and *high* (clean academic look). Wording adapts via `simpler`
  step explanations and the tutor's grade-level mode.
* **Accessible.** Semantic landmarks, skip link, keyboard-operable everything
  (including the graph-paper tool), `aria-live` feedback, text descriptions for
  every visual, screen-reader tables behind charts, captions, read-aloud,
  larger-text toggle, reduced-motion support, dark mode, print styles.
* **Encouraging, not competitive.** Stars, levels and badges reward effort and
  learning from hints; there are no leaderboards.

## Architecture & extending

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
