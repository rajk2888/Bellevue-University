import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { lessonForSkill } from '../curriculum';
import { nextDifficulty } from '../engine/adaptive';
import { getSkill } from '../engine/registry';
import type { Difficulty, Problem, Skill } from '../engine/types';
import { createRng } from '../lib/math/rng';
import { useProgress } from '../progress/store';
import { DifficultyPicker } from './ui';
import { Workspace } from './Workspace';

const SET_SIZE = 5;

/** Adaptive practice: difficulty follows the student, with prerequisite fallback. */
export function PracticeSet({ skill, lessonId, startDifficulty, young, onComplete, onProblemChange }: { skill: Skill; lessonId?: string; startDifficulty: Difficulty; young?: boolean; onComplete?: () => void; onProblemChange?: (p: Problem) => void }) {
  const progress = useProgress();
  const rng = useMemo(() => createRng(), []);
  const [difficulty, setDifficulty] = useState<Difficulty>(progress.state.difficulty[skill.id] ?? startDifficulty);
  const [auto, setAuto] = useState(true);
  const [problem, setProblem] = useState<Problem>(() => skill.generate(difficulty, rng));
  const [results, setResults] = useState<boolean[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [prereq, setPrereq] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  const newProblem = useCallback(
    (d: Difficulty) => {
      const p = skill.generate(d, rng);
      setProblem(p);
      setResolved(false);
      onProblemChange?.(p);
    },
    [skill, rng, onProblemChange],
  );

  const onResolved = (correct: boolean) => {
    setResolved(true);
    const res = [...results, correct];
    setResults(res);
    if (res.length === SET_SIZE) onComplete?.();
    if (!auto) return;
    const recent = progress.state.attempts.filter((a) => a.skillId === skill.id).map((a) => ({ correct: a.correct, difficulty: a.difficulty, hintsUsed: a.hintsUsed }));
    const decision = nextDifficulty(difficulty, [...recent, { correct, difficulty, hintsUsed: 0 }]);
    setMessage(decision.message ?? null);
    if (decision.suggestPrerequisite && skill.prerequisites?.length) setPrereq(skill.prerequisites[0]);
    if (decision.difficulty !== difficulty) {
      setDifficulty(decision.difficulty);
      progress.setDifficulty(skill.id, decision.difficulty);
    }
  };

  const prereqSkill = prereq ? getSkill(prereq) : undefined;
  const prereqLesson = prereq ? lessonForSkill(prereq, progress.state.profile.grade) : undefined;

  return (
    <div className="practice">
      <div className="practice-bar">
        <DifficultyPicker
          value={difficulty}
          onChange={(d) => {
            setDifficulty(d);
            setAuto(false);
            progress.setDifficulty(skill.id, d);
            newProblem(d);
          }}
        />
        <label className="small check">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Adjust automatically
        </label>
        <div className="set-dots" aria-label={`${results.filter(Boolean).length} correct out of ${results.length} this set`}>
          {Array.from({ length: SET_SIZE }, (_, i) => (
            <span key={i} className={`set-dot${i < results.length ? (results[i] ? ' ok' : ' miss') : ''}`} aria-hidden="true">
              {i < results.length ? (results[i] ? '★' : '•') : ''}
            </span>
          ))}
        </div>
      </div>

      {message && (
        <p className="adapt-msg" role="status">
          {message}
        </p>
      )}
      {prereqSkill && (
        <div className="prereq" role="note">
          🧱 Building block: <strong>{prereqSkill.name}</strong> will make this easier.{' '}
          {prereqLesson && <Link to={`/lesson/${prereqLesson.lesson.id}`}>Visit the {prereqSkill.name} lesson</Link>}{' '}
          <button type="button" className="link-btn" onClick={() => setPrereq(null)}>
            Keep going here
          </button>
        </div>
      )}

      <Workspace problem={problem} lessonId={lessonId} source="practice" young={young} onResolved={onResolved} heading={`Practice problem ${Math.min(results.length + (resolved ? 0 : 1), SET_SIZE)}${results.length >= SET_SIZE ? '+' : ` of ${SET_SIZE}`} · ${difficulty}`} />

      <div className="row end">
        <button type="button" className={`btn ${resolved ? 'primary' : 'ghost'}`} onClick={() => newProblem(difficulty)}>
          {resolved ? 'Next problem →' : 'Skip / new problem'}
        </button>
      </div>
    </div>
  );
}
