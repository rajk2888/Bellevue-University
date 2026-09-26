import { useEffect, useMemo, useRef, useState } from 'react';
import type { Problem, SkillTeaching, Visual } from '../engine/types';
import { readingMs, speak, stopSpeaking, ttsSupported } from '../speech/speech';
import { MathBlock } from './ui';
import { VisualRenderer } from './visuals/Visuals';

interface Scene {
  chapter: string;
  title: string;
  narration: string;
  math?: string;
  visual?: Visual;
}

/** Build a narrated "video" script from lesson content — works for every lesson. */
export function buildScript(title: string, teaching: SkillTeaching, example?: Problem): Scene[] {
  const scenes: Scene[] = [
    { chapter: 'Intro', title, narration: `Welcome! In this lesson you will learn: ${teaching.whatYouWillLearn.join(', ')}.`, visual: teaching.conceptVisual },
    ...teaching.concept.map((c, i) => ({ chapter: 'Concept', title: i === 0 ? 'The big idea' : 'Keep going', narration: c, visual: teaching.conceptVisual })),
    ...teaching.realWorld.scenes.map((s) => ({ chapter: 'Real world', title: `${teaching.realWorld.emoji} ${teaching.realWorld.title}`, narration: s.text, visual: s.visual })),
  ];
  if (example) {
    scenes.push({ chapter: 'Example', title: 'Worked example', narration: `Let’s solve ${example.prompt.replace('= ?', '')} step by step.`, math: example.prompt, visual: example.visual });
    example.steps.forEach((s, i) =>
      scenes.push({ chapter: 'Example', title: `Step ${i + 1}: ${s.title}`, narration: `${s.what} ${s.why}`, math: s.math, visual: s.visual }),
    );
  }
  scenes.push({ chapter: 'Summary', title: 'Remember', narration: teaching.lessonSummary.join(' '), math: teaching.lessonSummary.map((l) => `• ${l}`).join('\n') });
  return scenes;
}

const SPEEDS = [0.75, 1, 1.25, 1.5];

function snapToWord(text: string, fraction: number): number {
  const i = Math.round(fraction * text.length);
  const space = text.indexOf(' ', i);
  return space < 0 ? text.length : space;
}

/**
 * Interactive narrated lesson ("Watch Explanation"): a digital whiteboard where
 * equations and diagrams animate scene by scene, synchronised with
 * text-to-speech narration and captions. Falls back to timed captions when
 * speech is unavailable. A real video file can later replace a scene.
 */
export function NarratedLesson({ title, teaching, example, rate: initialRate = 1 }: { title: string; teaching: SkillTeaching; example?: Problem; rate?: number }) {
  const scenes = useMemo(() => buildScript(title, teaching, example), [title, teaching, example]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(initialRate);
  const [captions, setCaptions] = useState(true);
  const [voice, setVoice] = useState(ttsSupported());
  const [charIdx, setCharIdx] = useState(-1);
  const timer = useRef<number | undefined>(undefined);
  const scene = scenes[i];

  useEffect(() => {
    setCharIdx(-1);
    if (!playing) return;
    const advance = () => {
      if (i < scenes.length - 1) setI((x) => x + 1);
      else setPlaying(false);
    };
    let cancel: () => void = () => {};
    if (voice) {
      cancel = speak(scene.narration, { rate, onEnd: () => (timer.current = window.setTimeout(advance, 600)), onBoundary: (f) => setCharIdx(snapToWord(scene.narration, f)) });
    } else {
      timer.current = window.setTimeout(advance, readingMs(scene.narration, rate));
    }
    return () => {
      cancel();
      window.clearTimeout(timer.current);
    };
  }, [i, playing, rate, voice, scene.narration, scenes.length]);

  useEffect(() => () => stopSpeaking(), []);

  const toggle = () => {
    if (!playing && i === scenes.length - 1) setI(0);
    setPlaying((p) => !p);
  };

  const chapters = Array.from(new Set(scenes.map((s) => s.chapter)));

  return (
    <div className="narrated" role="region" aria-label="Narrated lesson player">
      <div className="whiteboard" aria-live="off">
        <div className="wb-chapter">{scene.chapter}</div>
        <h3 className="wb-title" key={`t${i}`}>
          {scene.title}
        </h3>
        <div className="wb-content" key={`c${i}`}>
          {!scene.math && <p className="wb-text">{scene.narration}</p>}
          {scene.math && <MathBlock math={scene.math} />}
          {scene.visual && <VisualRenderer visual={scene.visual} />}
        </div>
      </div>

      {captions && (
        <p className="captions" aria-live="polite">
          {charIdx >= 0 ? (
            <>
              <span className="spoken">{scene.narration.slice(0, charIdx)}</span>
              {scene.narration.slice(charIdx)}
            </>
          ) : (
            scene.narration
          )}
        </p>
      )}

      <div className="timeline" aria-hidden="true">
        {scenes.map((s, k) => (
          <span key={k} className={`tl-seg${k < i ? ' done' : k === i ? ' now' : ''}`} title={s.title} />
        ))}
      </div>

      <div className="player-controls">
        <button type="button" className="btn" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} aria-label="Previous scene">
          ⏮
        </button>
        <button type="button" className="btn primary play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? '⏸ Pause' : i === scenes.length - 1 && !playing ? '▶ Replay' : '▶ Play'}
        </button>
        <button type="button" className="btn" onClick={() => setI((x) => Math.min(scenes.length - 1, x + 1))} disabled={i === scenes.length - 1} aria-label="Next scene">
          ⏭
        </button>
        <span className="small muted scene-count">
          {i + 1} / {scenes.length}
        </span>
        <label className="small">
          Speed{' '}
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
        <label className="small check">
          <input type="checkbox" checked={captions} onChange={(e) => setCaptions(e.target.checked)} /> Captions
        </label>
        {ttsSupported() && (
          <label className="small check">
            <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} /> Voice
          </label>
        )}
      </div>
      <nav className="chapters" aria-label="Chapters">
        {chapters.map((c) => (
          <button key={c} type="button" className={`chip${scene.chapter === c ? ' on' : ''}`} onClick={() => setI(scenes.findIndex((s) => s.chapter === c))}>
            {c}
          </button>
        ))}
      </nav>
    </div>
  );
}
