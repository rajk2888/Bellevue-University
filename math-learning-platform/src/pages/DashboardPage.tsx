import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Card, ProgressBar } from '../components/ui';
import { getLesson } from '../curriculum';
import { useProgress } from '../progress/store';
import { badges, overall, recommendations, skillStats, type MasteryLevel } from '../progress/stats';
import { Stat } from './HomePage';

const AVATARS = ['🦉', '🦊', '🐼', '🐯', '🐙', '🦄', '🚀', '🤖'];
export const LEVEL_TEXT: Record<MasteryLevel, string> = { new: 'New', practicing: 'Practicing', 'needs-help': 'Needs practice', mastered: 'Mastered' };

export function DashboardPage() {
  const { state, setProfile } = useProgress();
  const o = overall(state);
  const stats = skillStats(state);
  const recs = recommendations(state);
  const earned = badges(state);
  const nameId = useId();
  const gradeId = useId();
  const quizzes = Object.entries(state.lessons)
    .flatMap(([id, l]) => l.quizScores.map((q) => ({ ...q, lesson: getLesson(id)?.lesson.title ?? id })))
    .sort((a, b) => b.at - a.at)
    .slice(0, 6);

  return (
    <div className="container page-pad">
      <div className="dash-head">
        <span className="avatar-big" aria-hidden="true">
          {state.profile.avatar}
        </span>
        <div>
          <h1>{state.profile.name ? `Welcome back, ${state.profile.name}!` : 'My learning dashboard'}</h1>
          <p className="muted">
            Level {o.level} · {o.starsToNextLevel} more ⭐ to level {o.level + 1}
          </p>
          <ProgressBar value={20 - o.starsToNextLevel} max={20} label="Progress to next level" />
        </div>
      </div>

      <details className="profile-edit">
        <summary>Edit my profile</summary>
        <div className="row wrap">
          <label htmlFor={nameId}>
            Name{' '}
            <input id={nameId} value={state.profile.name} onChange={(e) => setProfile({ name: e.target.value })} maxLength={30} />
          </label>
          <label htmlFor={gradeId}>
            Grade{' '}
            <select id={gradeId} value={state.profile.grade} onChange={(e) => setProfile({ grade: Number(e.target.value) })}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Grade {i + 1}
                </option>
              ))}
            </select>
          </label>
          <div className="row" role="radiogroup" aria-label="Avatar">
            {AVATARS.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={state.profile.avatar === a} className={`avatar-pick${state.profile.avatar === a ? ' on' : ''}`} onClick={() => setProfile({ avatar: a })}>
                {a}
              </button>
            ))}
          </div>
        </div>
      </details>

      <div className="stat-row section">
        <Stat label="Lessons completed" value={String(o.lessonsCompleted)} />
        <Stat label="Problems attempted" value={String(o.attempts)} />
        <Stat label="Accuracy" value={o.accuracy === null ? '—' : `${Math.round(o.accuracy * 100)}%`} />
        <Stat label="Learning streak" value={`🔥 ${o.streak}`} sub={o.streak === 1 ? 'day' : 'days'} />
        <Stat label="Quiz average" value={o.quizAvg === null ? '—' : `${Math.round(o.quizAvg * 100)}%`} />
        <Stat label="Stars earned" value={`⭐ ${o.stars}`} />
      </div>

      <div className="two-col">
        <Card title="Recommended next" icon="🧭">
          <ul className="rec-list">
            {recs.map((r) => (
              <li key={r.lesson.lesson.id}>
                <Link to={`/lesson/${r.lesson.lesson.id}`} className="next-card">
                  <strong>{r.lesson.lesson.title}</strong>
                  <span className="small">
                    Grade {r.lesson.grade} · {r.reason}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Assignments" icon="📋">
          {state.assignments.length === 0 ? (
            <p className="muted">No assignments right now. When a teacher or parent assigns a lesson, it shows up here.</p>
          ) : (
            <ul className="rec-list">
              {state.assignments.map((a) => {
                const l = getLesson(a.lessonId);
                const done = state.lessons[a.lessonId]?.completedAt;
                return (
                  <li key={a.id}>
                    <Link to={`/lesson/${a.lessonId}`} className="next-card">
                      <strong>
                        {done ? '✅ ' : ''}
                        {l?.lesson.title}
                      </strong>
                      <span className="small">
                        From your {a.by}
                        {a.due ? ` · due ${a.due}` : ''}
                        {a.note ? ` · “${a.note}”` : ''}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Skills progress" icon="📈" className="section">
        {stats.length === 0 ? (
          <p className="muted">
            Start a lesson to see your skills grow. Try <Link to="/lesson/g5-add-fractions">Adding Fractions</Link>!
          </p>
        ) : (
          <ul className="skill-list">
            {stats.map((s) => (
              <li key={s.skillId} className={`skill-row lvl-${s.level}`}>
                <div className="row between">
                  <strong>{s.name}</strong>
                  <span className={`pill pill-${s.level}`}>
                    {s.level === 'mastered' ? '🎓 ' : s.level === 'needs-help' ? '🌱 ' : '🔄 '}
                    {LEVEL_TEXT[s.level]}
                  </span>
                </div>
                <ProgressBar value={s.progress} max={100} label={`${s.name} mastery`} />
                <span className="small muted">
                  {s.correct} of {s.attempts} correct · recent accuracy {Math.round(s.recentAccuracy * 100)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="two-col section">
        <Card title="Topics mastered" icon="🎓">
          <TopicList items={stats.filter((s) => s.level === 'mastered').map((s) => s.name)} empty="Keep practicing — mastery comes with a few correct answers in a row!" />
        </Card>
        <Card title="Topics to strengthen" icon="🌱">
          <TopicList items={stats.filter((s) => s.level === 'needs-help').map((s) => s.name)} empty="Nothing here — great work! 🎉" />
          <p className="small muted">Mistakes are how brains grow. We’ll suggest building-block lessons to help.</p>
        </Card>
      </div>

      <div className="two-col section">
        <Card title="Quiz performance" icon="🏁">
          {quizzes.length === 0 ? (
            <p className="muted">Mini quizzes you take will show up here.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Lesson</th>
                  <th scope="col">Score</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q, i) => (
                  <tr key={i}>
                    <td>{q.lesson}</td>
                    <td>
                      {q.score}/{q.total} {q.score === q.total ? '🏆' : ''}
                    </td>
                    <td>{new Date(q.at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="Badges" icon="🏅">
          <ul className="badge-grid">
            {earned.map((b) => (
              <li key={b.id} className={`badge-item${b.earned ? ' earned' : ''}`} title={b.description}>
                <span className="badge-emoji" aria-hidden="true">
                  {b.emoji}
                </span>
                <strong>{b.name}</strong>
                <span className="small">{b.earned ? 'Earned!' : b.description}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function TopicList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="muted">{empty}</p>;
  return (
    <ul className="chips-static">
      {items.map((i) => (
        <li key={i} className="chip">
          {i}
        </li>
      ))}
    </ul>
  );
}
