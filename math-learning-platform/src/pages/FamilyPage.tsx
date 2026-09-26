import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { MiniBarChart } from '../components/MiniBarChart';
import { IS_EMBEDDED } from '../env';
import { Card } from '../components/ui';
import { allLessons, getLesson } from '../curriculum';
import { today, useProgress } from '../progress/store';
import { overall, recentActivity, recommendations, skillStats, weeklyAccuracy } from '../progress/stats';
import { LEVEL_TEXT } from './DashboardPage';
import { Stat } from './HomePage';

/**
 * Parent / teacher view of one learner. In this version it reads the same
 * on-device progress; with accounts it would list linked students/classes.
 */
export function FamilyPage() {
  const progress = useProgress();
  const { state } = progress;
  const [role, setRole] = useState<'parent' | 'teacher'>('parent');
  const o = overall(state);
  const stats = skillStats(state);
  const weekly = weeklyAccuracy(state);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86_400_000);
    const key = today(d);
    return { label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), value: Math.round((state.practiceSeconds[key] ?? 0) / 60), tip: `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${Math.round((state.practiceSeconds[key] ?? 0) / 60)} min` };
  });
  const quizzes = Object.entries(state.lessons).flatMap(([id, l]) => l.quizScores.map((q) => ({ ...q, lesson: getLesson(id)?.lesson.title ?? id })));
  const empty = state.attempts.length === 0;

  return (
    <div className="container page-pad">
      <div className="row between wrap">
        <div>
          <h1>Parent &amp; Teacher view</h1>
          <p className="muted">
            Progress for <strong>{state.profile.name || 'this student'}</strong> · Grade {state.profile.grade}
          </p>
        </div>
        <div className="row wrap no-print">
          <div className="segmented" role="radiogroup" aria-label="View as">
            <button type="button" role="radio" aria-checked={role === 'parent'} className={role === 'parent' ? 'on' : ''} onClick={() => setRole('parent')}>
              👪 Parent
            </button>
            <button type="button" role="radio" aria-checked={role === 'teacher'} className={role === 'teacher' ? 'on' : ''} onClick={() => setRole('teacher')}>
              🍎 Teacher
            </button>
          </div>
          {!IS_EMBEDDED && (
            <button type="button" className="btn soft" onClick={() => window.print()}>
              🖨️ Print report
            </button>
          )}
        </div>
      </div>

      {empty && (
        <div className="callout no-print">
          No activity yet on this device. <button type="button" className="btn soft" onClick={progress.loadDemoData}>Load sample data to preview</button>
        </div>
      )}

      <div className="stat-row section">
        <Stat label="Practice time" value={`${o.totalMinutes} min`} sub="all time" />
        <Stat label="Lessons completed" value={String(o.lessonsCompleted)} />
        <Stat label="Problems attempted" value={String(o.attempts)} />
        <Stat label="Accuracy" value={o.accuracy === null ? '—' : `${Math.round(o.accuracy * 100)}%`} />
        <Stat label="Quiz average" value={o.quizAvg === null ? '—' : `${Math.round(o.quizAvg * 100)}%`} />
        <Stat label="Current streak" value={`${o.streak} day${o.streak === 1 ? '' : 's'}`} />
      </div>

      <div className="two-col">
        <Card title="Practice time — last 14 days (minutes)" icon="⏱️">
          <MiniBarChart bars={days} title="Minutes of practice per day, last 14 days" format={(v) => `${v} min`} />
        </Card>
        <Card title="Accuracy by week" icon="📈">
          <MiniBarChart
            bars={weekly.map((w) => ({ label: w.label, value: w.accuracy === null ? null : Math.round(w.accuracy * 100), tip: w.accuracy === null ? `${w.label}: no practice` : `${w.label}: ${Math.round(w.accuracy * 100)}% of ${w.attempts}` }))}
            max={100}
            title="Percent of problems correct each week"
            format={(v) => `${v}%`}
          />
        </Card>
      </div>

      <div className="two-col section">
        <Card title="Skills mastered" icon="🎓">
          <SkillTable rows={stats.filter((s) => s.level === 'mastered')} empty="No skills mastered yet." />
        </Card>
        <Card title="Areas of difficulty" icon="🌱">
          <SkillTable rows={stats.filter((s) => s.level === 'needs-help')} empty="No areas of difficulty right now." />
          {stats.some((s) => s.level === 'needs-help') && (
            <p className="small muted">The practice engine automatically lowers difficulty and suggests prerequisite skills for these topics.</p>
          )}
        </Card>
      </div>

      <div className="two-col section">
        <Card title="Quiz results" icon="🏁">
          {quizzes.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Lesson</th>
                  <th scope="col">Score</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {quizzes
                  .sort((a, b) => b.at - a.at)
                  .map((q, i) => (
                    <tr key={i}>
                      <td>{q.lesson}</td>
                      <td>
                        {q.score}/{q.total}
                      </td>
                      <td>{new Date(q.at).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No quizzes taken yet.</p>
          )}
        </Card>
        <Card title="Recent activity" icon="🕒">
          <ul className="activity">
            {recentActivity(state).map((a, i) => (
              <li key={i}>
                <span aria-hidden="true">{a.correct ? '✅' : '🔁'}</span> {a.skillName} <span className="small muted">· {a.source} · {a.difficulty} · {new Date(a.at).toLocaleString()}</span>
              </li>
            ))}
            {!state.attempts.length && <li className="muted">Nothing yet.</li>}
          </ul>
        </Card>
      </div>

      <Card title="Recommended topics" icon="🧭" className="section">
        <ul className="rec-list horizontal">
          {recommendations(state).map((r) => (
            <li key={r.lesson.lesson.id}>
              <Link to={`/lesson/${r.lesson.lesson.id}`} className="next-card">
                <strong>{r.lesson.lesson.title}</strong>
                <span className="small">{r.reason}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <AssignPanel role={role} />

      <Card title="Coming with accounts" icon="🔮" className="section no-print">
        <p className="small muted">
          This preview keeps data privately on this device. The architecture is ready for student, parent and teacher accounts, classroom rosters, curriculum-standard reports, printable worksheets and
          certificates.
        </p>
        <ResetButton onReset={progress.reset} />
      </Card>
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <button type="button" className="btn ghost" onClick={() => setAsking(true)}>
        Reset all progress
      </button>
    );
  return (
    <div className="row" role="alert">
      <span>Erase all progress on this device? This cannot be undone.</span>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          onReset();
          setAsking(false);
        }}
      >
        Yes, erase
      </button>
      <button type="button" className="btn ghost" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </div>
  );
}

function SkillTable({ rows, empty }: { rows: ReturnType<typeof skillStats>; empty: string }) {
  if (!rows.length) return <p className="muted">{empty}</p>;
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Skill</th>
          <th scope="col">Recent accuracy</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.skillId}>
            <td>{s.name}</td>
            <td>{Math.round(s.recentAccuracy * 100)}%</td>
            <td>{LEVEL_TEXT[s.level]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AssignPanel({ role }: { role: 'parent' | 'teacher' }) {
  const { state, addAssignment, removeAssignment } = useProgress();
  const lessons = allLessons().filter((l) => l.lesson.skillId);
  const [lessonId, setLessonId] = useState(lessons.find((l) => l.grade === state.profile.grade)?.lesson.id ?? lessons[0].lesson.id);
  const [note, setNote] = useState('');
  const [due, setDue] = useState('');
  const ids = { lesson: useId(), note: useId(), due: useId() };
  return (
    <Card title={role === 'teacher' ? 'Assign a lesson or practice set' : 'Suggest a lesson'} icon="📋" className="section no-print">
      <form
        className="assign-form"
        onSubmit={(e) => {
          e.preventDefault();
          addAssignment({ lessonId, note: note.trim() || undefined, due: due || undefined, by: role });
          setNote('');
        }}
      >
        <label htmlFor={ids.lesson}>Lesson</label>
        <select id={ids.lesson} value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
          {Array.from({ length: 12 }, (_, g) => (
            <optgroup key={g} label={`Grade ${g + 1}`}>
              {lessons
                .filter((l) => l.grade === g + 1)
                .map((l) => (
                  <option key={l.lesson.id} value={l.lesson.id}>
                    {l.lesson.title}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <label htmlFor={ids.note}>Note (optional)</label>
        <input id={ids.note} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Focus on the worked example" maxLength={120} />
        {role === 'teacher' && (
          <>
            <label htmlFor={ids.due}>Due date</label>
            <input id={ids.due} type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </>
        )}
        <button type="submit" className="btn primary">
          Assign
        </button>
      </form>
      {state.assignments.length > 0 && (
        <ul className="activity">
          {state.assignments.map((a) => (
            <li key={a.id}>
              {state.lessons[a.lessonId]?.completedAt ? '✅' : '⏳'} {getLesson(a.lessonId)?.lesson.title} <span className="small muted">· by {a.by}{a.due ? ` · due ${a.due}` : ''}</span>{' '}
              <button type="button" className="link-btn" onClick={() => removeAssignment(a.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
