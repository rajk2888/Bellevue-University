import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { bandForGrade } from '../curriculum';
import { useProgress } from '../progress/store';

const ThemeGradeCtx = createContext<(g: number | undefined) => void>(() => {});

/** Pages call this to theme the UI for a grade (young → playful & large; high school → clean & academic). */
export function useGradeTheme(grade: number | undefined) {
  const setGrade = useContext(ThemeGradeCtx);
  useEffect(() => {
    setGrade(grade);
    return () => setGrade(undefined);
  }, [grade, setGrade]);
}

export function SearchBox({ big = false, autoFocus = false }: { big?: boolean; autoFocus?: boolean }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const id = useId();
  return (
    <form
      role="search"
      className={`searchbox${big ? ' big' : ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <label htmlFor={id} className={big ? 'search-label' : 'sr-only'}>
        What do you want to learn?
      </label>
      <div className="search-row">
        <span aria-hidden="true" className="search-icon">
          🔍
        </span>
        <input id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={big ? 'Try “adding fractions”, “slope” or “2x + 5 = 17”' : 'Search topics or type a problem'} autoFocus={autoFocus} />
        <button type="submit" className="btn primary">
          Search
        </button>
      </div>
    </form>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { state, setSettings } = useProgress();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const [pageGrade, setPageGrade] = useState<number | undefined>(undefined);
  const themeGrade = pageGrade ?? state.profile.grade;

  useEffect(() => {
    document.documentElement.dataset.band = bandForGrade(themeGrade);
  }, [themeGrade]);

  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.dataset.largeText = String(state.settings.largeText);
    document.documentElement.dataset.reduceMotion = String(state.settings.reduceMotion);
  }, [state.settings.largeText, state.settings.reduceMotion]);

  return (
    <ThemeGradeCtx.Provider value={setPageGrade}>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="container header-row">
          <Link to="/" className="logo" aria-label="StepWise Math home">
            <span className="logo-mark" aria-hidden="true">
              ➗
            </span>
            <span>
              Step<strong>Wise</strong> Math
            </span>
          </Link>
          <button type="button" className="btn icon menu-btn" aria-expanded={menu} aria-controls="main-nav" onClick={() => setMenu((m) => !m)}>
            <span aria-hidden="true">☰</span>
            <span className="sr-only">Menu</span>
          </button>
          <nav id="main-nav" className={`main-nav${menu ? ' open' : ''}`} aria-label="Main">
            <NavLink to="/grades">Learn</NavLink>
            <NavLink to="/solve">Solve a Problem</NavLink>
            <NavLink to="/dashboard">My Progress</NavLink>
            <NavLink to="/family">Parents &amp; Teachers</NavLink>
            <div className="header-search">
              <SearchBox />
            </div>
            <Link to="/dashboard" className="grade-chip" aria-label={`Current grade ${state.profile.grade}. Change in My Progress.`}>
              {state.profile.avatar} Grade {state.profile.grade}
            </Link>
            <button
              type="button"
              className="btn icon"
              aria-pressed={state.settings.largeText}
              onClick={() => setSettings({ largeText: !state.settings.largeText })}
              title="Larger text"
              aria-label="Larger text"
            >
              A+
            </button>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container footer-row">
          <p>
            <strong>StepWise Math</strong> — Understand → See → Follow → Try → Get Help → Practice → Master.
          </p>
          <p className="small muted">A digital math teacher, not an answer generator. Progress is saved privately in this browser.</p>
          <nav aria-label="Footer" className="footer-links">
            <Link to="/grades">All grades</Link>
            <Link to="/lesson/g5-add-fractions">Featured lesson</Link>
            <Link to="/family">For parents &amp; teachers</Link>
            <label className="small check">
              <input type="checkbox" checked={state.settings.reduceMotion} onChange={(e) => setSettings({ reduceMotion: e.target.checked })} /> Reduce motion
            </label>
          </nav>
        </div>
      </footer>
    </ThemeGradeCtx.Provider>
  );
}
