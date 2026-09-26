import { useEffect, useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StepPlayer } from '../components/StepPlayer';
import { TutorChat } from '../components/TutorChat';
import { Card } from '../components/ui';
import { Workspace } from '../components/Workspace';
import { lessonForSkill } from '../curriculum';
import { solve, SOLVER_EXAMPLES, type SolveResult } from '../engine/solver';
import { useProgress } from '../progress/store';

export function SolvePage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [text, setText] = useState(initial);
  const [result, setResult] = useState<SolveResult | null>(() => (initial ? solve(initial) : null));
  const [tried, setTried] = useState(!!initial);
  const [mode, setMode] = useState<'guided' | 'self'>('guided');
  const [stepIndex, setStepIndex] = useState<number | undefined>(0);
  const { state } = useProgress();
  const id = useId();

  useEffect(() => {
    const q = params.get('q') ?? '';
    setText(q);
    setResult(q ? solve(q) : null);
    setTried(!!q);
  }, [params]);

  const run = (q: string) => setParams(q ? { q } : {});
  const lesson = result ? lessonForSkill(result.skill.id, state.profile.grade) : undefined;

  return (
    <div className="container page-pad">
      <h1>Enter a math problem</h1>
      <p className="lead">Type a problem and we’ll recognise the topic and teach you how to solve it — one step at a time.</p>
      <form
        className="solve-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(text.trim());
        }}
      >
        <label htmlFor={id} className="sr-only">
          Math problem
        </label>
        <input id={id} className="answer-input big" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. 2x + 5 = 17" autoComplete="off" spellCheck={false} />
        <button type="submit" className="btn primary big">
          Teach me
        </button>
        <button type="button" className="btn ghost" disabled title="Coming soon: photograph or upload a problem">
          📷 Photo (soon)
        </button>
      </form>
      <div className="chips" aria-label="Example problems">
        {SOLVER_EXAMPLES.map((ex) => (
          <button key={ex} type="button" className="chip" onClick={() => run(ex)}>
            {ex}
          </button>
        ))}
      </div>

      {tried && !result && (
        <div className="callout" role="status">
          Hmm, I don’t recognise that problem yet. I can currently solve arithmetic, fractions, decimals, percents, proportions, integers, linear equations, systems, quadratics, slope, area,
          Pythagorean theorem, mean, exponents/logarithms, compound interest and derivatives. Try one of the examples above!
        </div>
      )}

      {result && (
        <div className="solve-layout">
          <div>
            <Card title={result.problem.prompt} icon="🧮">
              <p className="small muted">
                Topic: <strong>{result.skill.name}</strong>
                {lesson && (
                  <>
                    {' '}
                    · <Link to={`/lesson/${lesson.lesson.id}`}>Open the full lesson</Link>
                  </>
                )}
              </p>
              <div className="segmented" role="radiogroup" aria-label="How do you want to learn it?">
                <button type="button" role="radio" aria-checked={mode === 'guided'} className={mode === 'guided' ? 'on' : ''} onClick={() => setMode('guided')}>
                  👣 Walk me through it
                </button>
                <button type="button" role="radio" aria-checked={mode === 'self'} className={mode === 'self' ? 'on' : ''} onClick={() => setMode('self')}>
                  ✏️ Let me try first
                </button>
              </div>
              {mode === 'guided' ? (
                <StepPlayer problem={result.problem} young={state.profile.grade <= 4} onStepChange={setStepIndex} />
              ) : (
                <Workspace problem={result.problem} source="solver" onStepChange={setStepIndex} young={state.profile.grade <= 4} />
              )}
            </Card>
          </div>
          <aside className="solve-tutor" aria-label="AI Math Tutor">
            <TutorChat
              compact
              context={{ grade: state.profile.grade, skill: result.skill, problem: result.problem, stepIndex }}
              onAction={(a) => {
                if (a.type !== 'newProblem') return;
                const order = ['easy', 'medium', 'hard', 'challenge'] as const;
                const i = order.indexOf(result.problem.difficulty);
                const d = order[Math.max(0, Math.min(3, i + (a.change === 'easier' ? -1 : a.change === 'harder' ? 1 : 0)))];
                setResult({ skill: result.skill, problem: result.skill.generate(d, Math.random) });
              }}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
