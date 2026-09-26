import { useId, useState } from 'react';
import { answersMatch } from '../engine/answer';
import type { RealWorldStory as Story } from '../engine/types';
import { useProgress } from '../progress/store';
import { VisualRenderer } from './visuals/Visuals';

/** A short interactive story: scenes one at a time, then the student answers. */
export function RealWorldStory({ story, skillId, lessonId }: { story: Story; skillId: string; lessonId: string }) {
  const progress = useProgress();
  const [scene, setScene] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<null | boolean>(null);
  const [tries, setTries] = useState(0);
  const id = useId();
  const atQuestion = scene >= story.scenes.length;
  const s = story.scenes[Math.min(scene, story.scenes.length - 1)];

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = [story.answer, ...(story.accept ?? [])].some((a) => answersMatch(answer, a));
    setResult(ok);
    const n = tries + 1;
    setTries(n);
    if (ok || n === 2) progress.recordAttempt({ skillId, lessonId, correct: ok && n === 1, difficulty: 'easy', hintsUsed: n - 1, source: 'story' });
  };

  return (
    <div className="story">
      <div className="story-head">
        <span className="story-emoji" aria-hidden="true">
          {story.emoji}
        </span>
        <h3>{story.title}</h3>
      </div>
      <div className="story-scene" key={scene} aria-live="polite">
        <p className="story-text">{s.text}</p>
        {s.visual && <VisualRenderer visual={s.visual} />}
      </div>
      <div className="row between">
        <span className="small muted">
          Scene {Math.min(scene + 1, story.scenes.length)} of {story.scenes.length}
        </span>
        <div className="row">
          <button type="button" className="btn" onClick={() => setScene((x) => Math.max(0, x - 1))} disabled={scene === 0}>
            ← Back
          </button>
          {!atQuestion && (
            <button type="button" className="btn primary" onClick={() => setScene((x) => x + 1)}>
              {scene === story.scenes.length - 1 ? 'What’s the question? →' : 'Next →'}
            </button>
          )}
        </div>
      </div>
      {atQuestion && (
        <form className="story-q pop" onSubmit={check}>
          <label htmlFor={id}>
            <strong>{story.question}</strong>
          </label>
          <div className="row">
            <input id={id} className="answer-input" value={answer} onChange={(e) => setAnswer(e.target.value)} autoComplete="off" readOnly={result === true} />
            <button type="submit" className="btn primary" disabled={!answer.trim() || result === true}>
              Check
            </button>
          </div>
          <div aria-live="polite">
            {result === true && <p className="feedback ok">✅ Yes! {story.explanation}</p>}
            {result === false && tries < 2 && <p className="feedback bad">Not quite — look back at the scenes and try once more.</p>}
            {result === false && tries >= 2 && <p className="feedback almost">Here’s how it works: {story.explanation}</p>}
          </div>
        </form>
      )}
    </div>
  );
}
