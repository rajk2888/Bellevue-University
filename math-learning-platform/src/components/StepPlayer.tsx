import { useEffect, useId, useRef, useState } from 'react';
import { answersMatch } from '../engine/answer';
import type { Problem } from '../engine/types';
import { speak, stopSpeaking, ttsSupported } from '../speech/speech';
import { MathBlock, ProgressBar, RichText } from './ui';
import { VisualRenderer } from './visuals/Visuals';

interface Props {
  problem: Problem;
  /** Ask the student to try each checkpoint before the step is revealed. */
  guided?: boolean;
  young?: boolean;
  onStepChange?: (index: number) => void;
  onCheckpoint?: (correct: boolean) => void;
  onFinish?: () => void;
  /** Externally requested step (e.g. from the tutor). */
  jumpTo?: number;
}

/**
 * The step-by-step explanation engine UI. Moves through a solution one step
 * at a time: what we do, why, the rule, a visual, common mistakes — and, in
 * guided mode, asks the student to predict the step before revealing it.
 */
export function StepPlayer({ problem, guided = true, young = false, onStepChange, onCheckpoint, onFinish, jumpTo }: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [simpler, setSimpler] = useState(false);
  const [showVisual, setShowVisual] = useState(true);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputId = useId();
  const step = problem.steps[index];
  const total = problem.steps.length;
  const isRevealed = !guided || !step.checkpoint || revealed.has(index);
  const done = index === total - 1 && isRevealed;

  useEffect(() => {
    setIndex(0);
    setRevealed(new Set());
    setFeedback(null);
    setGuess('');
  }, [problem.id]);

  useEffect(() => {
    if (jumpTo !== undefined && jumpTo >= 0 && jumpTo < total) {
      setIndex(jumpTo);
      setRevealed((r) => new Set(r).add(jumpTo));
    }
  }, [jumpTo, total]);

  useEffect(() => {
    onStepChange?.(index);
    setSimpler(false);
    setFeedback(null);
    setGuess('');
    stopSpeaking();
    setSpeaking(false);
  }, [index]);

  useEffect(() => {
    if (done) onFinish?.();
  }, [done]);

  useEffect(() => () => stopSpeaking(), []);

  const go = (i: number) => {
    setIndex(Math.max(0, Math.min(total - 1, i)));
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const reveal = () => setRevealed((r) => new Set(r).add(index));

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const cp = step.checkpoint!;
    const ok = [cp.answer, ...(cp.accept ?? [])].some((a) => answersMatch(guess, a));
    onCheckpoint?.(ok);
    if (ok) {
      setFeedback({ ok: true, text: young ? '⭐ Yes! You figured it out!' : 'Correct — you predicted the step!' });
      reveal();
    } else {
      setFeedback({ ok: false, text: cp.nudge ? `Not quite. ${cp.nudge}` : 'Not quite — give it another try, or reveal the step.' });
    }
  };

  const readAloud = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    const text = `${step.title}. ${simpler && step.simpler ? step.simpler : step.what} ${isRevealed ? `${step.math}. Why? ${step.why}` : step.checkpoint?.question ?? ''}`;
    speak(text, { onEnd: () => setSpeaking(false) });
  };

  return (
    <div className="step-player">
      <div className="step-top">
        <div className="step-count" aria-live="polite">
          Step {index + 1} of {total}
        </div>
        <ProgressBar value={index + (isRevealed ? 1 : 0.5)} max={total} label="Solution progress" />
        <ol className="step-dots" aria-label="Jump to step">
          {problem.steps.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className={`dot${i === index ? ' current' : ''}${i < index || revealed.has(i) ? ' done' : ''}`}
                onClick={() => go(i)}
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === index ? 'step' : undefined}
              >
                {i + 1}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <article className="step-card" key={`${problem.id}-${index}`}>
        <h3 tabIndex={-1} ref={headingRef} className="step-title">
          <span className="step-num">Step {index + 1}</span> {step.title}
        </h3>

        {(isRevealed || simpler) && (
          <div className="step-section what">
            <span className="tag">What we’re doing</span>
            <p>
              <RichText text={simpler && step.simpler ? step.simpler : step.what} />
            </p>
          </div>
        )}

        {!isRevealed && step.checkpoint && (
          <form className="checkpoint" onSubmit={submitGuess}>
            <p className="checkpoint-q">
              <span aria-hidden="true">🤔 </span>
              <strong>Your turn first:</strong> {step.checkpoint.question}
            </p>
            <div className="row">
              <label htmlFor={inputId} className="sr-only">
                Your answer
              </label>
              <input id={inputId} className="answer-input" value={guess} onChange={(e) => setGuess(e.target.value)} autoComplete="off" inputMode="text" />
              <button type="submit" className="btn primary" disabled={!guess.trim()}>
                Check
              </button>
              <button type="button" className="btn ghost" onClick={reveal}>
                Just show me
              </button>
            </div>
          </form>
        )}

        {feedback && (
          <p className={`feedback ${feedback.ok ? 'ok' : 'bad'}`} role="status">
            {feedback.text}
          </p>
        )}

        {isRevealed && (
          <div className="reveal">
            <MathBlock math={step.math} />
            <div className="step-grid">
              <div className="step-section why">
                <span className="tag">Why we do it</span>
                <p>
                  <RichText text={step.why} />
                </p>
              </div>
              {step.rule && (
                <div className="step-section rule">
                  <span className="tag">The rule</span>
                  <p>{step.rule}</p>
                </div>
              )}
            </div>
            {step.mistakes && step.mistakes.length > 0 && (
              <details className="mistakes">
                <summary>⚠️ Common mistakes</summary>
                <ul>
                  {step.mistakes.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {step.visual && showVisual && isRevealed && <VisualRenderer visual={step.visual} />}

        <div className="step-tools">
          {step.simpler && (
            <button type="button" className="btn soft" onClick={() => setSimpler((s) => !s)} aria-pressed={simpler}>
              🔁 {simpler ? 'Back to regular explanation' : 'Explain This Step Again'}
            </button>
          )}
          {step.visual && (
            <button
              type="button"
              className="btn soft"
              onClick={() => {
                if (!isRevealed) reveal();
                setShowVisual((v) => !v || !isRevealed);
              }}
              aria-pressed={showVisual && isRevealed}
            >
              🖼️ {showVisual && isRevealed ? 'Hide Visual' : 'Show Me Visually'}
            </button>
          )}
          {ttsSupported() && (
            <button type="button" className="btn soft" onClick={readAloud} aria-pressed={speaking}>
              {speaking ? '⏹ Stop reading' : '🔊 Read aloud'}
            </button>
          )}
        </div>
      </article>

      <div className="step-nav">
        <button type="button" className="btn" onClick={() => go(index - 1)} disabled={index === 0}>
          ← Previous Step
        </button>
        {index < total - 1 ? (
          <button type="button" className="btn primary" onClick={() => (isRevealed ? go(index + 1) : reveal())}>
            {isRevealed ? 'Next Step →' : 'Reveal Step'}
          </button>
        ) : isRevealed ? (
          <div className="final-answer" role="status">
            Answer: <strong>{problem.answer}</strong> 🎉
          </div>
        ) : (
          <button type="button" className="btn primary" onClick={reveal}>
            Reveal Step
          </button>
        )}
      </div>
    </div>
  );
}
