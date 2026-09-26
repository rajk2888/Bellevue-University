import { useEffect, useId, useRef, useState } from 'react';
import { checkAnswer } from '../engine/answer';
import { getSkill } from '../engine/registry';
import type { CheckResult, Problem } from '../engine/types';
import { useProgress } from '../progress/store';
import type { AttemptSource } from '../progress/types';
import { FractionBuilder, MathKeypad, PointPlotter } from './Manipulatives';
import { MathBlock, RichText } from './ui';
import { VisualRenderer } from './visuals/Visuals';

interface Props {
  problem: Problem;
  lessonId?: string;
  source?: AttemptSource;
  young?: boolean;
  onSolved?: (firstTry: boolean) => void;
  onResolved?: (correct: boolean, hintsUsed: number) => void;
  onStepChange?: (i: number | undefined) => void;
  heading?: string;
}

const FRACTION_SKILLS = ['add-fractions', 'subtract-fractions', 'equivalent-fractions'];
const GRAPH_SKILLS = ['slope', 'systems', 'quadratics', 'linear-equations'];

/**
 * "Try It Yourself": the student solves; we check, give progressive hints,
 * reveal ONE step at a time on request, and explain *why* answers are wrong —
 * never dumping the full solution after a mistake.
 */
export function Workspace({ problem, lessonId, source = 'workspace', young, onSolved, onResolved, onStepChange, heading = 'Try It Yourself' }: Props) {
  const progress = useProgress();
  const skill = getSkill(problem.skillId);
  const [input, setInput] = useState('');
  const [work, setWork] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const [stepsShown, setStepsShown] = useState(0);
  const [whyFor, setWhyFor] = useState<number | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [solved, setSolved] = useState(false);
  const [tool, setTool] = useState<'none' | 'fractions' | 'graph'>('none');
  const recorded = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const answerId = useId();
  const workId = useId();

  const reset = () => {
    setInput('');
    setWork('');
    setHintsShown(0);
    setStepsShown(0);
    setWhyFor(null);
    setResult(null);
    setWrongCount(0);
    setSolved(false);
    recorded.current = false;
  };

  useEffect(reset, [problem.id]);
  const stepCb = useRef(onStepChange);
  stepCb.current = onStepChange;
  useEffect(() => stepCb.current?.(stepsShown ? stepsShown - 1 : undefined), [stepsShown]);

  const record = (correct: boolean) => {
    if (recorded.current) return;
    recorded.current = true;
    progress.recordAttempt({ skillId: problem.skillId, lessonId, correct, difficulty: problem.difficulty, hintsUsed: hintsShown + stepsShown, source });
    onResolved?.(correct, hintsShown + stepsShown);
  };

  const check = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (solved) return;
    const r = checkAnswer(problem, input, skill?.check);
    setResult(r);
    if (!input.trim()) return;
    if (r.correct) {
      setSolved(true);
      record(stepsShown < problem.steps.length);
      onSolved?.(wrongCount === 0);
    } else {
      const n = wrongCount + 1;
      setWrongCount(n);
      if (n >= 2) record(false);
    }
  };

  const hint = () => {
    if (hintsShown < problem.hints.length) setHintsShown((h) => h + 1);
    else showNextStep();
  };

  const showNextStep = () => setStepsShown((s) => Math.min(problem.steps.length, s + 1));

  const insert = (k: string) => {
    const el = inputRef.current;
    if (!el) return setInput((v) => v + k);
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + k + input.slice(end);
    setInput(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + k.length, start + k.length);
    });
  };

  const whyStep = whyFor !== null ? problem.steps[whyFor] : null;
  const toolsAvailable = [FRACTION_SKILLS.includes(problem.skillId) && 'fractions', GRAPH_SKILLS.includes(problem.skillId) && 'graph'].filter(Boolean) as ('fractions' | 'graph')[];

  return (
    <div className="workspace">
      <div className="ws-problem">
        <span className="tag">{heading}</span>
        {problem.story && <p className="story-text">{problem.story}</p>}
        <p className="problem-prompt" id={`${answerId}-prompt`}>
          {problem.prompt}
        </p>
        {problem.visual && <VisualRenderer visual={problem.visual} />}
      </div>

      <div className="ws-main">
        <form className="ws-answer" onSubmit={check}>
          <label htmlFor={answerId} className="ws-label">
            Your answer
          </label>
          <div className="row">
            <input
              id={answerId}
              ref={inputRef}
              className={`answer-input big${result ? (result.correct ? ' is-ok' : result.almost ? ' is-almost' : ' is-bad') : ''}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={problem.answerHint ?? 'Type your answer'}
              autoComplete="off"
              aria-describedby={`${answerId}-prompt ${answerId}-fb`}
              readOnly={solved}
            />
          </div>
          <MathKeypad kind={problem.answerKind} onKey={insert} />
          <div className="ws-buttons">
            <button type="submit" className="btn primary" disabled={solved}>
              ✔ Check My Answer
            </button>
            <button type="button" className="btn warm" onClick={hint} disabled={solved}>
              💡 Give Me a Hint
            </button>
            <button type="button" className="btn soft" onClick={showNextStep} disabled={stepsShown >= problem.steps.length}>
              👣 Show Next Step
            </button>
            <button type="button" className="btn soft" onClick={() => setWhyFor(Math.max(0, stepsShown - 1))}>
              ❓ Explain Why
            </button>
            <button type="button" className="btn ghost" onClick={reset}>
              ↺ Start Over
            </button>
          </div>
        </form>

        <div id={`${answerId}-fb`} aria-live="polite" className="ws-feedback">
          {result && (
            <div className={`feedback ${result.correct ? 'ok' : result.almost ? 'almost' : 'bad'}`}>
              <p className="feedback-title">
                {result.correct ? (young ? '🌟 ' : '✅ ') : result.almost ? '🟡 ' : '🔍 '}
                {result.message}
              </p>
              {result.misconception && (
                <p className="misconception">
                  <strong>Why that isn’t right:</strong> {result.misconception}
                </p>
              )}
              {!result.correct && wrongCount >= 2 && hintsShown === 0 && <p className="small">Tip: try “Give Me a Hint” — hints are how good mathematicians get unstuck!</p>}
              {result.correct && hintsShown + stepsShown > 0 && <p className="small">You used {hintsShown + stepsShown} hint{hintsShown + stepsShown === 1 ? '' : 's'} — that’s smart learning. Try the next one with one fewer!</p>}
            </div>
          )}
        </div>

        {hintsShown > 0 && (
          <ol className="hint-ladder" aria-label="Hints">
            {problem.hints.slice(0, hintsShown).map((h, i) => (
              <li key={i} className="hint pop">
                <span className="hint-num">Hint {i + 1}</span> {h}
              </li>
            ))}
            {hintsShown >= problem.hints.length && !solved && <li className="hint more">That’s all the hints! Press “Show Next Step” to see one step at a time.</li>}
          </ol>
        )}

        {stepsShown > 0 && (
          <div className="revealed-steps">
            {problem.steps.slice(0, stepsShown).map((s, i) => (
              <div key={i} className="mini-step pop">
                <div className="mini-step-title">
                  Step {i + 1}: {s.title}
                </div>
                <p>{s.what}</p>
                <MathBlock math={s.math} highlight={i === stepsShown - 1} />
                <button type="button" className="link-btn" onClick={() => setWhyFor(i)}>
                  Why?
                </button>
              </div>
            ))}
          </div>
        )}

        {whyStep && (
          <div className="why-box pop" role="note">
            <strong>Why “{whyStep.title}”?</strong> <RichText text={whyStep.why} />
            {whyStep.rule && (
              <p className="small">
                <strong>Rule:</strong> {whyStep.rule}
              </p>
            )}
            <button type="button" className="link-btn" onClick={() => setWhyFor(null)}>
              Close
            </button>
          </div>
        )}

        <details className="scratch">
          <summary>✏️ Scratch pad — show your work</summary>
          <label htmlFor={workId} className="sr-only">
            Scratch work
          </label>
          <textarea id={workId} value={work} onChange={(e) => setWork(e.target.value)} rows={5} placeholder={'Write each step on its own line, e.g.\n3/4 + 2/4\n= 5/4'} />
        </details>

        {toolsAvailable.length > 0 && (
          <div className="tools">
            <span className="small muted">Math tools:</span>
            {toolsAvailable.includes('fractions') && (
              <button type="button" className="btn tiny" aria-pressed={tool === 'fractions'} onClick={() => setTool((t) => (t === 'fractions' ? 'none' : 'fractions'))}>
                🍫 Fraction bars
              </button>
            )}
            {toolsAvailable.includes('graph') && (
              <button type="button" className="btn tiny" aria-pressed={tool === 'graph'} onClick={() => setTool((t) => (t === 'graph' ? 'none' : 'graph'))}>
                📈 Graph paper
              </button>
            )}
            {tool === 'fractions' && <FractionBuilder />}
            {tool === 'graph' && <PointPlotter />}
          </div>
        )}
      </div>
    </div>
  );
}
