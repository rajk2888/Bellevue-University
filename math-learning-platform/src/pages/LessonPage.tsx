import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FractionBuilder, PointPlotter } from '../components/Manipulatives';
import { NarratedLesson } from '../components/NarratedLesson';
import { PracticeSet } from '../components/PracticeSet';
import { Quiz } from '../components/Quiz';
import { RealWorldStory } from '../components/RealWorldStory';
import { StepPlayer } from '../components/StepPlayer';
import { TutorChat } from '../components/TutorChat';
import { Card, ProgressBar } from '../components/ui';
import { VisualRenderer } from '../components/visuals/Visuals';
import { Workspace } from '../components/Workspace';
import { useGradeTheme } from '../components/Layout';
import { bandForGrade, getLesson, nextLesson } from '../curriculum';
import { getSkill } from '../engine/registry';
import { DIFFICULTIES, type Difficulty, type Problem } from '../engine/types';
import { createRng } from '../lib/math/rng';
import { useProgress } from '../progress/store';
import type { TutorAction } from '../tutor/tutor';
import { NotFoundPage } from './NotFoundPage';

const SECTIONS = [
  { id: 'learn', label: 'Learn the idea', icon: '💡' },
  { id: 'visual', label: 'See it', icon: '👀' },
  { id: 'story', label: 'Real world', icon: '🌍' },
  { id: 'example', label: 'Worked example', icon: '👣' },
  { id: 'try', label: 'Try it yourself', icon: '✏️' },
  { id: 'practice', label: 'Practice', icon: '🏋️' },
  { id: 'quiz', label: 'Mini quiz', icon: '🏁' },
  { id: 'summary', label: 'Summary', icon: '⭐' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

export function LessonPage() {
  const { lessonId = '' } = useParams();
  const ctx = getLesson(lessonId);
  useGradeTheme(ctx?.grade);
  if (!ctx) return <NotFoundPage />;
  if (!ctx.lesson.skillId) return <ComingSoon lessonId={lessonId} />;
  return <InteractiveLesson key={lessonId} lessonId={lessonId} />;
}

function InteractiveLesson({ lessonId }: { lessonId: string }) {
  const ctx = getLesson(lessonId)!;
  const { lesson, grade, domain, topic } = ctx;
  const skill = getSkill(lesson.skillId!)!;
  const t = skill.teaching;
  const progress = useProgress();
  const young = bandForGrade(grade) === 'early' || bandForGrade(grade) === 'elementary';
  const start: Difficulty = progress.state.difficulty[skill.id] ?? lesson.startDifficulty ?? 'medium';
  const rng = useMemo(() => createRng(), []);

  const [example, setExample] = useState<Problem>(() => (lesson.workedExample && skill.parse?.(lesson.workedExample)) || skill.generate(lesson.startDifficulty ?? 'medium', rng));
  const [tryProblem, setTryProblem] = useState<Problem>(() => skill.generate(start, rng));
  const [tryDifficulty, setTryDifficulty] = useState<Difficulty>(start);
  const [activeProblem, setActiveProblem] = useState<Problem>(example);
  const [stepIndex, setStepIndex] = useState<number | undefined>(0);
  const [jumpTo, setJumpTo] = useState<number | undefined>(undefined);
  const [watch, setWatch] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const done = new Set(progress.state.lessons[lessonId]?.sectionsDone ?? []);
  const completed = !!progress.state.lessons[lessonId]?.completedAt;
  const next = nextLesson(lessonId);
  const startedAt = useRef(Date.now());

  const markRef = useRef(progress.markSection);
  markRef.current = progress.markSection;
  const mark = useCallback((s: SectionId) => markRef.current(lessonId, s), [lessonId]);

  // Track time spent learning (for the parent/teacher dashboard).
  useEffect(() => {
    const flush = () => {
      const secs = Math.round((Date.now() - startedAt.current) / 1000);
      if (secs > 5) progress.addPracticeTime(Math.min(secs, 3600));
      startedAt.current = Date.now();
    };
    const id = window.setInterval(flush, 60_000);
    return () => {
      window.clearInterval(id);
      flush();
    };
  }, []);

  // Mark reading sections as seen when they scroll into view.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && ['learn', 'visual', 'summary'].includes(e.target.id) && mark(e.target.id as SectionId)),
      { threshold: 0.6 },
    );
    ['learn', 'visual', 'summary'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [mark]);

  useEffect(() => {
    if (!completed && ['example', 'try', 'quiz'].every((s) => done.has(s))) progress.completeLesson(lessonId);
  });

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const onTutorAction = (a: TutorAction) => {
    if (a.type === 'showStep') {
      setActiveProblem(example);
      setJumpTo(a.index);
      scrollTo('example');
      return;
    }
    const idx = DIFFICULTIES.indexOf(tryDifficulty);
    const d = a.change === 'easier' ? DIFFICULTIES[Math.max(0, idx - 1)] : a.change === 'harder' ? DIFFICULTIES[Math.min(3, idx + 1)] : tryDifficulty;
    const p = skill.generate(d, rng);
    setTryDifficulty(d);
    setTryProblem(p);
    setActiveProblem(p);
    scrollTo('try');
  };

  const pct = Math.round((SECTIONS.filter((s) => done.has(s.id)).length / SECTIONS.length) * 100);
  const hasFractionTool = ['add-fractions', 'subtract-fractions', 'equivalent-fractions'].includes(skill.id);
  const hasGraphTool = ['slope', 'systems'].includes(skill.id);

  return (
    <div className="lesson-page">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/grades">Grades</Link> › <Link to={`/grade/${grade}`}>Grade {grade}</Link> › <span>{domain.name}</span> › <span>{topic.name}</span>
        </nav>
        <header className="lesson-hero">
          <div>
            <p className="eyebrow">
              Grade {grade} · {domain.icon} {domain.name}
            </p>
            <h1>{lesson.title}</h1>
            <p className="lead">{t.summary}</p>
            <div className="row wrap">
              <button type="button" className="btn primary" onClick={() => scrollTo('learn')}>
                Start the lesson
              </button>
              <button
                type="button"
                className="btn warm"
                onClick={() => {
                  setWatch(true);
                  scrollTo('watch');
                }}
              >
                ▶ Watch Explanation
              </button>
              <button type="button" className="btn soft" onClick={() => scrollTo('try')}>
                ✏️ Jump to practice
              </button>
            </div>
            {lesson.standards && <p className="small muted standards">Standards: {lesson.standards.join(', ')}</p>}
          </div>
          <div className="lesson-progress-box" aria-label="Lesson progress">
            <div className="ring" style={{ ['--pct' as string]: pct }} role="img" aria-label={`${pct}% of lesson complete`}>
              <span>{pct}%</span>
            </div>
            <p className="small">{completed ? '🎉 Lesson complete!' : 'Lesson progress'}</p>
          </div>
        </header>
      </div>

      <div className="container lesson-layout">
        <nav className="lesson-nav" aria-label="Lesson sections">
          <ProgressBar value={pct} max={100} label="Lesson progress" />
          <ol>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(s.id);
                  }}
                  className={done.has(s.id) ? 'done' : ''}
                >
                  <span aria-hidden="true">{done.has(s.id) ? '✅' : s.icon}</span> {s.label}
                  {done.has(s.id) && <span className="sr-only"> (done)</span>}
                </a>
              </li>
            ))}
          </ol>
          <p className="small muted philosophy">Understand → See → Follow → Try → Get Help → Practice → Master</p>
        </nav>

        <div className="lesson-content">
          <Card id="learn" title="What you will learn" icon="💡">
            <ul className="learn-list">
              {t.whatYouWillLearn.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <h3>The idea, simply</h3>
            {t.concept.map((c, i) => (
              <p key={i} className="concept-p">
                {c}
              </p>
            ))}
            {t.keyVocabulary && (
              <dl className="vocab">
                {t.keyVocabulary.map((v) => (
                  <div key={v.term}>
                    <dt>{v.term}</dt>
                    <dd>{v.meaning}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card id="visual" title="See it visually" icon="👀">
            {t.conceptVisual && <VisualRenderer visual={t.conceptVisual} caption="A picture of the big idea" />}
            {hasFractionTool && (
              <>
                <h3>Explore with fraction bars</h3>
                <FractionBuilder />
              </>
            )}
            {hasGraphTool && (
              <>
                <h3>Explore on graph paper</h3>
                <PointPlotter />
              </>
            )}
          </Card>

          <Card id="watch" title="Watch the explanation" icon="🎬" actions={!watch && <button type="button" className="btn warm" onClick={() => setWatch(true)}>▶ Open player</button>}>
            {watch ? (
              <NarratedLesson title={lesson.title} teaching={t} example={example} rate={progress.state.settings.narrationRate} />
            ) : (
              <p className="muted">A narrated whiteboard lesson with animated equations, diagrams, captions and speed control.</p>
            )}
          </Card>

          <Card id="story" title="Real-world example" icon="🌍">
            <RealWorldStory story={t.realWorld} skillId={skill.id} lessonId={lessonId} />
            <button type="button" className="link-btn" onClick={() => mark('story')}>
              {done.has('story') ? '✅ Done' : 'Mark story as done'}
            </button>
          </Card>

          <Card
            id="example"
            title="Step-by-step worked example"
            icon="👣"
            actions={
              <button
                type="button"
                className="btn soft"
                onClick={() => {
                  const p = skill.generate(lesson.startDifficulty ?? 'medium', rng);
                  setExample(p);
                  setActiveProblem(p);
                }}
              >
                🔄 Another example
              </button>
            }
          >
            <p className="problem-prompt big">{example.prompt}</p>
            <StepPlayer
              problem={example}
              young={young}
              jumpTo={jumpTo}
              onStepChange={(i) => {
                setActiveProblem(example);
                setStepIndex(i);
              }}
              onFinish={() => mark('example')}
              onCheckpoint={(ok) => progress.recordAttempt({ skillId: skill.id, lessonId, correct: ok, difficulty: example.difficulty, hintsUsed: 0, source: 'checkpoint' })}
            />
          </Card>

          <Card id="try" title="Try it yourself" icon="✏️">
            <Workspace
              problem={tryProblem}
              lessonId={lessonId}
              young={young}
              onResolved={() => mark('try')}
              onStepChange={(i) => {
                setActiveProblem(tryProblem);
                setStepIndex(i);
              }}
            />
            <div className="row end">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  const p = skill.generate(tryDifficulty, rng);
                  setTryProblem(p);
                  setActiveProblem(p);
                }}
              >
                New problem
              </button>
            </div>
          </Card>

          <Card id="practice" title="Practice problems" icon="🏋️">
            <p className="muted">Choose a level, or let the difficulty adjust as you go. If something is tricky, we’ll suggest a building-block skill first.</p>
            <PracticeSet skill={skill} lessonId={lessonId} startDifficulty={start} young={young} onComplete={() => mark('practice')} onProblemChange={setActiveProblem} />
          </Card>

          <Card id="quiz" title="Mini quiz" icon="🏁">
            <Quiz skill={skill} lessonId={lessonId} difficulty={lesson.startDifficulty ?? 'medium'} young={young} onDone={() => mark('quiz')} />
          </Card>

          <Card id="summary" title="Lesson summary" icon="⭐">
            <ul className="summary-list">
              {t.lessonSummary.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            {next && (
              <div className="next-lesson">
                <span className="small muted">Next recommended lesson</span>
                <Link to={`/lesson/${next.lesson.id}`} className="next-card">
                  <strong>{next.lesson.title}</strong>
                  <span className="small">
                    Grade {next.grade} · {next.topic.name} →
                  </span>
                </Link>
              </div>
            )}
          </Card>
        </div>

        <aside className={`tutor-panel${tutorOpen ? ' open' : ''}`} aria-label="AI Math Tutor">
          <button type="button" className="btn icon tutor-close" onClick={() => setTutorOpen(false)} aria-label="Close tutor">
            ✕
          </button>
          <TutorChat context={{ grade, skill, problem: activeProblem, stepIndex, lessonTitle: lesson.title }} onAction={onTutorAction} />
        </aside>
        <button type="button" className="btn primary tutor-fab" onClick={() => setTutorOpen(true)} aria-expanded={tutorOpen}>
          🦉 Ask the Tutor
        </button>
      </div>
    </div>
  );
}

function ComingSoon({ lessonId }: { lessonId: string }) {
  const { lesson, grade, domain, topic } = getLesson(lessonId)!;
  const ready = domain.topics.flatMap((t) => t.lessons).filter((l) => l.skillId);
  return (
    <div className="container narrow page-pad">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/grades">Grades</Link> › <Link to={`/grade/${grade}`}>Grade {grade}</Link> › <span>{topic.name}</span>
      </nav>
      <h1>{lesson.title}</h1>
      <p className="lead">{lesson.description}</p>
      <Card title="This interactive lesson is on its way" icon="🛠️">
        <p>We’re building the step-by-step explanations, visuals and practice for this topic. Meanwhile, try these lessons from {domain.name}:</p>
        <ul className="lesson-links">
          {ready.map((l) => (
            <li key={l.id}>
              <Link to={`/lesson/${l.id}`}>{l.title}</Link>
            </li>
          ))}
          {!ready.length && (
            <li>
              <Link to={`/grade/${grade}`}>Browse all Grade {grade} lessons</Link>
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
