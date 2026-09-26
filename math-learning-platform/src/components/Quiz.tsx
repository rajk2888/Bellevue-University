import { useId, useMemo, useState } from 'react';
import { answersMatch, checkAnswer } from '../engine/answer';
import { createRng } from '../lib/math/rng';
import type { Difficulty, Problem, Skill } from '../engine/types';
import { DIFFICULTIES } from '../engine/types';
import { useProgress } from '../progress/store';
import { MathBlock, ProgressBar } from './ui';
import { VisualRenderer } from './visuals/Visuals';

const QUESTIONS = 5;

/** Five-question mini quiz: mixes multiple choice and typed answers, ramps difficulty. */
export function Quiz({ skill, lessonId, difficulty, young, onDone }: { skill: Skill; lessonId: string; difficulty: Difficulty; young?: boolean; onDone?: (score: number) => void }) {
  const progress = useProgress();
  const [seed, setSeed] = useState(() => Date.now());
  const questions = useMemo(() => {
    const rng = createRng(seed);
    const base = DIFFICULTIES.indexOf(difficulty);
    return Array.from({ length: QUESTIONS }, (_, i) => skill.generate(DIFFICULTIES[Math.min(3, base + (i >= 3 ? 1 : 0))], rng));
  }, [seed, skill, difficulty]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState<null | boolean>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const inputId = useId();
  const q: Problem = questions[i];
  const useChoices = !!q?.choices && i % 2 === 0;

  const submit = (value: string) => {
    if (checked !== null) return;
    const ok = skill.check ? skill.check(q, value).correct : checkAnswer(q, value).correct || answersMatch(value, q.answer);
    setChecked(ok);
    if (ok) setScore((s) => s + 1);
    progress.recordAttempt({ skillId: skill.id, lessonId, correct: ok, difficulty: q.difficulty, hintsUsed: 0, source: 'quiz' });
  };

  const next = () => {
    if (i === QUESTIONS - 1) {
      setFinished(true);
      progress.recordQuiz(lessonId, score, QUESTIONS);
      onDone?.(score);
    } else {
      setI(i + 1);
      setAnswer('');
      setChecked(null);
    }
  };

  const restart = () => {
    setSeed(Date.now());
    setI(0);
    setScore(0);
    setAnswer('');
    setChecked(null);
    setFinished(false);
  };

  if (finished) {
    const stars = score === QUESTIONS ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0;
    return (
      <div className="quiz-done" role="status">
        <div className="stars" aria-label={`${stars} of 3 stars`}>
          {'★'.repeat(stars)}
          <span className="dim">{'★'.repeat(3 - stars)}</span>
        </div>
        <p className="big-score">
          {score} / {QUESTIONS}
        </p>
        <p>
          {score === QUESTIONS
            ? young
              ? 'WOW! Every single one! 🎉'
              : 'Perfect score — you have mastered this quiz!'
            : score >= 3
              ? 'Great work! Review the ones you missed and try again to get them all.'
              : 'Good effort! Every mistake is a chance to learn. Try the worked example again, then retake the quiz.'}
        </p>
        <button type="button" className="btn primary" onClick={restart}>
          Take a new quiz
        </button>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="row between">
        <span className="small muted">
          Question {i + 1} of {QUESTIONS}
        </span>
        <span className="small">Score: {score}</span>
      </div>
      <ProgressBar value={i} max={QUESTIONS} label="Quiz progress" />
      <p className="problem-prompt">{q.prompt}</p>
      {q.visual && ['counting', 'clock', 'coins', 'shape', 'array', 'bag', 'barChart', 'coordinatePlane', 'rightTriangle', 'rectangleArea'].includes(q.visual.kind) && <VisualRenderer visual={q.visual} />}
      {useChoices ? (
        <div className="choices" role="radiogroup" aria-label="Answer choices">
          {q.choices!.map((c) => {
            const isRight = answersMatch(c, q.answer) || (q.accept ?? []).some((a) => answersMatch(c, a));
            const state = checked === null ? '' : isRight ? ' right' : answer === c ? ' wrong' : '';
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={answer === c}
                className={`choice${state}`}
                disabled={checked !== null}
                onClick={() => {
                  setAnswer(c);
                  submit(c);
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      ) : (
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            submit(answer);
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Your answer
          </label>
          <input id={inputId} className="answer-input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={q.answerHint ?? 'Your answer'} readOnly={checked !== null} autoComplete="off" />
          <button type="submit" className="btn primary" disabled={!answer.trim() || checked !== null}>
            Submit
          </button>
        </form>
      )}
      {checked !== null && (
        <div className={`feedback ${checked ? 'ok' : 'bad'}`} role="status">
          <p className="feedback-title">{checked ? '✅ Correct!' : `Not this time. The answer is ${q.answer}.`}</p>
          {!checked && (
            <details open>
              <summary>See how to solve it</summary>
              <ol className="quiz-steps">
                {q.steps.map((s, k) => (
                  <li key={k}>
                    <strong>{s.title}:</strong> {s.what}
                    <MathBlock math={s.math} highlight={false} />
                  </li>
                ))}
              </ol>
            </details>
          )}
          <button type="button" className="btn primary" onClick={next} autoFocus>
            {i === QUESTIONS - 1 ? 'See my score' : 'Next question →'}
          </button>
        </div>
      )}
    </div>
  );
}
