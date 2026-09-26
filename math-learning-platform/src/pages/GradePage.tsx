import { Link, useParams } from 'react-router-dom';
import { useGradeTheme } from '../components/Layout';
import { getGrade } from '../curriculum';
import { getSkill } from '../engine/registry';
import { useProgress } from '../progress/store';
import { NotFoundPage } from './NotFoundPage';

export function GradePage() {
  const grade = Number(useParams().grade);
  const g = getGrade(grade);
  const { state, setProfile } = useProgress();
  useGradeTheme(g ? grade : undefined);
  if (!g) return <NotFoundPage />;
  return (
    <div className="container page-pad">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/grades">Grades</Link> › <span>Grade {grade}</span>
      </nav>
      <div className="row between wrap">
        <h1>Grade {grade} Math</h1>
        <div className="row">
          {grade > 1 && (
            <Link className="btn ghost" to={`/grade/${grade - 1}`}>
              ← Grade {grade - 1}
            </Link>
          )}
          {grade < 12 && (
            <Link className="btn ghost" to={`/grade/${grade + 1}`}>
              Grade {grade + 1} →
            </Link>
          )}
          {state.profile.grade !== grade && (
            <button type="button" className="btn soft" onClick={() => setProfile({ grade })}>
              Make this my grade
            </button>
          )}
        </div>
      </div>
      {g.domains.map((d) => (
        <section key={d.id} className="section domain" aria-labelledby={`d-${d.id}`}>
          <h2 id={`d-${d.id}`}>
            <span aria-hidden="true">{d.icon}</span> {d.name}
          </h2>
          <div className="topic-columns">
            {d.topics.map((t) => (
              <div key={t.id} className="topic-block">
                <h3>{t.name}</h3>
                <ul className="lesson-list">
                  {t.lessons.map((l) => {
                    const lp = state.lessons[l.id];
                    const skill = l.skillId ? getSkill(l.skillId) : undefined;
                    return (
                      <li key={l.id}>
                        <Link to={`/lesson/${l.id}`} className={`lesson-item${l.skillId ? '' : ' soon'}`}>
                          <span className="lesson-state" aria-hidden="true">
                            {lp?.completedAt ? '✅' : lp?.sectionsDone.length ? '🟡' : l.skillId ? '▶' : '🛠️'}
                          </span>
                          <span>
                            <strong>{l.title}</strong>
                            <span className="small muted block">{skill?.teaching.summary ?? `${l.description ?? ''} (coming soon)`}</span>
                          </span>
                          {lp?.completedAt && <span className="sr-only">(completed)</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
