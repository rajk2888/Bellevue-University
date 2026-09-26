import { Link, useNavigate } from 'react-router-dom';
import { SearchBox } from '../components/Layout';
import { StepPlayer } from '../components/StepPlayer';
import { Card } from '../components/ui';
import { VisualRenderer } from '../components/visuals/Visuals';
import { getLesson, GRADE_BANDS, POPULAR_LESSONS } from '../curriculum';
import { solve } from '../engine/solver';
import { useProgress } from '../progress/store';
import { overall, recommendations } from '../progress/stats';

const HOW = [
  { icon: '💡', title: 'Understand', text: 'A short, simple explanation of the big idea.' },
  { icon: '👀', title: 'See', text: 'Pictures, number lines, fraction circles and graphs.' },
  { icon: '👣', title: 'Follow', text: 'A worked example, one step at a time — with the why.' },
  { icon: '✏️', title: 'Try', text: 'Solve it yourself in the interactive workspace.' },
  { icon: '🦉', title: 'Get Help', text: 'Progressive hints and a tutor that teaches, not tells.' },
  { icon: '🏋️', title: 'Practice', text: 'Problems that adapt to exactly where you are.' },
  { icon: '🏆', title: 'Master', text: 'Mini quizzes, stars and badges show your growth.' },
];

const demo = solve('3/4 + 1/2')!.problem;

export function HomePage() {
  const navigate = useNavigate();
  const { state } = useProgress();
  const stats = overall(state);
  const rec = recommendations(state)[0];

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1 className="hero-title">
              Math Made Easy — <span className="accent-text">One Step at a Time.</span>
            </h1>
            <p className="lead">Learn mathematics through simple explanations, interactive examples, visual lessons, and guided practice from Grade 1 through Grade 12.</p>
            <div className="row wrap hero-actions">
              <button type="button" className="btn primary big" onClick={() => navigate(rec ? `/lesson/${rec.lesson.lesson.id}` : '/lesson/g5-add-fractions')}>
                Start Learning
              </button>
              <Link to="/grades" className="btn big">
                Choose Your Grade
              </Link>
              <Link to="/solve" className="btn warm big">
                Try a Math Problem
              </Link>
            </div>
            <SearchBox big />
          </div>
          <div className="hero-art" aria-hidden="true">
            <VisualRenderer
              visual={{
                kind: 'fractionCircles',
                pizza: true,
                fractions: [
                  { n: 3, d: 4, label: '3/4' },
                  { n: 2, d: 4, label: '+ 2/4' },
                ],
              }}
            />
            <div className="hero-eq">
              3/4 + 1/2 = <span className="accent-text">1 1/4</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="section" aria-labelledby="grades-h">
          <h2 id="grades-h">Pick your grade</h2>
          <div className="band-grid">
            {GRADE_BANDS.map((b) => (
              <Link key={b.label} to={`/grade/${b.grades[0]}`} className={`band-card band-${b.id}`}>
                <span className="band-emoji" aria-hidden="true">
                  {b.emoji}
                </span>
                <strong>{b.label}</strong>
                <span className="small">{b.blurb}</span>
                <span className="band-grades" aria-hidden="true">
                  {b.grades.map((g) => (
                    <span key={g}>{g}</span>
                  ))}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="popular-h">
          <h2 id="popular-h">Popular topics</h2>
          <div className="topic-grid">
            {POPULAR_LESSONS.map((id) => {
              const l = getLesson(id)!;
              return (
                <Link key={id} to={`/lesson/${id}`} className="topic-card">
                  <span className="topic-icon" aria-hidden="true">
                    {l.domain.icon}
                  </span>
                  <strong>{l.lesson.title}</strong>
                  <span className="small muted">Grade {l.grade}</span>
                  {id === 'g5-add-fractions' && <span className="badge">Featured</span>}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="section" aria-labelledby="how-h">
          <h2 id="how-h">How it works</h2>
          <ol className="how-grid">
            {HOW.map((h, i) => (
              <li key={h.title} className="how-card">
                <span className="how-num">{i + 1}</span>
                <span className="how-icon" aria-hidden="true">
                  {h.icon}
                </span>
                <strong>{h.title}</strong>
                <span className="small">{h.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-labelledby="demo-h">
          <h2 id="demo-h">Interactive example</h2>
          <p className="muted">We don’t just show the answer. Try predicting each step before it’s revealed.</p>
          <Card>
            <p className="problem-prompt big">{demo.prompt}</p>
            <StepPlayer problem={demo} />
            <p className="small">
              Want the full lesson? <Link to="/lesson/g5-add-fractions">Grade 5 · Adding Fractions →</Link>
            </p>
          </Card>
        </section>

        <div className="two-col section">
          <Card title="Your progress" icon="📈">
            {stats.attempts === 0 ? (
              <p>Your stars, streaks and skills will appear here once you start. Everything is saved privately in this browser.</p>
            ) : (
              <div className="stat-row">
                <Stat label="Stars" value={`⭐ ${stats.stars}`} />
                <Stat label="Level" value={String(stats.level)} />
                <Stat label="Streak" value={`🔥 ${stats.streak} day${stats.streak === 1 ? '' : 's'}`} />
                <Stat label="Lessons done" value={String(stats.lessonsCompleted)} />
              </div>
            )}
            {rec && (
              <p>
                Recommended next: <Link to={`/lesson/${rec.lesson.lesson.id}`}>{rec.lesson.lesson.title}</Link> <span className="small muted">({rec.reason})</span>
              </p>
            )}
            <Link to="/dashboard" className="btn soft">
              Open my dashboard
            </Link>
          </Card>
          <Card title="For parents & teachers" icon="👪">
            <p>See skills mastered, areas of difficulty, practice time, quiz results and improvement over time. Teachers can assign lessons and practice sets.</p>
            <ul className="small">
              <li>No answer-dumping: students are guided with hints and “why” explanations.</li>
              <li>Common Core–aligned lessons from Grade 1 to Grade 12.</li>
              <li>Accessible: keyboard, screen reader, captions and read-aloud support.</li>
            </ul>
            <Link to="/family" className="btn soft">
              Parent &amp; teacher view
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="small muted">{sub}</div>}
    </div>
  );
}
