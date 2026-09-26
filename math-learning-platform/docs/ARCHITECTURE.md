# Architecture

```
src/
  lib/math/          exact Fraction arithmetic, linear-expression parser, seeded RNG
  engine/            the teaching engine (framework-free, fully unit-tested)
    types.ts         Skill, Problem, Step, Checkpoint, Visual, CheckResult
    skills/*.ts      one module per family of skills
    registry.ts      list of all skills
    solver.ts        typed problem → recognised skill → step-by-step Problem
    answer.ts        answer normalisation & comparison
    adaptive.ts      difficulty adjustment & prerequisite fallback
  curriculum/        Curriculum → Grade → Domain → Topic → Lesson (maps onto skills)
  progress/          learner state (localStorage today) + derived stats/badges/recommendations
  tutor/             TutorProvider interface, LocalTutor, RemoteTutor
  speech/            text-to-speech & speech-to-text wrappers (Web Speech API)
  components/        StepPlayer, Workspace, TutorChat, NarratedLesson, Quiz, PracticeSet, visuals…
  pages/             routed screens
```

## Core idea: everything is data

A **Skill** generates `Problem`s at four difficulty levels and can parse typed
problems. A `Problem` is plain data: prompt, answer, progressive `hints`, and
`steps`. Each `Step` carries *what / why / rule / math / simpler wording /
common mistakes / visual / checkpoint*. The UI only renders this data, so steps
could equally come from a server, a content team, or an AI generator.

### Adding a new skill

1. Implement `Skill` (see `src/engine/skills/applied.ts` for compact examples):
   `generate(difficulty, rng)`, optional `parse(text)` and `check(problem, input)`
   for misconception-aware feedback, and `teaching` content (concept, vocabulary,
   real-world story, summary).
2. Register it in `src/engine/registry.ts` (and `PARSE_ORDER` in `solver.ts` if
   it parses typed problems).
3. Reference it from a lesson in the curriculum (`skillId`, optional
   `workedExample`, `startDifficulty`, `standards`).

The generator test in `src/engine/engine.test.ts` automatically checks every
skill at every difficulty (answers self-check, hints exist, multiple-choice
options contain exactly one correct value).

### Adding a curriculum or standards framework

Create another `Curriculum` object (see `src/curriculum/commonCore.ts`) and add it
to `CURRICULA` in `src/curriculum/index.ts`. Lessons without a `skillId` render as
"coming soon" pages, so a curriculum can be mapped out before content exists.

### New visual models

Add a variant to the `Visual` union in `engine/types.ts`, render it in
`VisualRenderer`, and give it a text description in `describe()` for screen readers.

## Future-ready seams

| Future feature | Seam |
|---|---|
| Student / parent / teacher accounts, classrooms | `ProgressApi` in `progress/store.tsx` is the only persistence boundary; swap localStorage for an API. `Assignment` already records who assigned what. |
| LLM tutoring | `TutorProvider`. Set `VITE_TUTOR_ENDPOINT` to use `RemoteTutor` (server holds keys and keeps it hint-first); falls back to the on-device tutor. |
| AI-generated practice | Anything returning `Problem` objects plugs into Workspace/Quiz/Practice. |
| Photo / image problems | OCR → text → `solve(text)`; the Solve page already has the placeholder button. |
| Voice | `speech/speech.ts` (TTS narration + tutor microphone today). |
| Video lessons | `NarratedLesson` scenes can be replaced by recorded video per scene/chapter. |
| Multiple languages | All learner-facing strings live in skill `teaching`/`steps` and page components — ready for extraction to i18n catalogues. |
| Analytics, printable worksheets, certificates | `progress/stats.ts` derivations; print stylesheet already in place. |
