import { Link } from 'react-router-dom';
import { activeCurriculum, GRADE_BANDS } from '../curriculum';
import { useProgress } from '../progress/store';

export function GradesPage() {
  const { state } = useProgress();
  return (
    <div className="container page-pad">
      <h1>Choose your grade</h1>
      <p className="lead">Every grade has lessons with simple explanations, visuals, worked examples and practice.</p>
      {GRADE_BANDS.map((b) => (
        <section key={b.label} className="section" aria-labelledby={`band-${b.grades[0]}`}>
          <h2 id={`band-${b.grades[0]}`}>
            <span aria-hidden="true">{b.emoji}</span> {b.label}
          </h2>
          <p className="muted">{b.blurb}</p>
          <div className="grade-grid">
            {b.grades.map((g) => {
              const grade = activeCurriculum.grades.find((x) => x.grade === g)!;
              const lessons = grade.domains.flatMap((d) => d.topics.flatMap((t) => t.lessons));
              const doneCount = lessons.filter((l) => state.lessons[l.id]?.completedAt).length;
              return (
                <Link key={g} to={`/grade/${g}`} className={`grade-card band-${b.id}${state.profile.grade === g ? ' current' : ''}`}>
                  <span className="grade-num">{g}</span>
                  <span>Grade {g}</span>
                  <span className="small muted">
                    {grade.domains.map((d) => d.icon).join(' ')} · {lessons.filter((l) => l.skillId).length} interactive lessons
                  </span>
                  {doneCount > 0 && <span className="small">✅ {doneCount} completed</span>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
