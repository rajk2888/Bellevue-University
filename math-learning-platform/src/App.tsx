import { lazy, Suspense } from 'react';
import { HashRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { IS_EMBEDDED } from './env';
import { Layout } from './components/Layout';
import { ProgressProvider } from './progress/store';
import { GradePage } from './pages/GradePage';
import { GradesPage } from './pages/GradesPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SearchPage } from './pages/SearchPage';

// Heavier pages load on demand so the homepage stays fast.
const LessonPage = lazy(() => import('./pages/LessonPage').then((m) => ({ default: m.LessonPage })));
const SolvePage = lazy(() => import('./pages/SolvePage').then((m) => ({ default: m.SolvePage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const FamilyPage = lazy(() => import('./pages/FamilyPage').then((m) => ({ default: m.FamilyPage })));

// HashRouter keeps deep links working on any static host (GitHub Pages, S3, etc.).
// The embedded build keeps navigation in memory so it never touches the host page's URL.
const Router = IS_EMBEDDED ? MemoryRouter : HashRouter;

export function App() {
  return (
    <ProgressProvider>
      <Router>
        <Layout>
          <Suspense fallback={<p className="container page-pad muted">Loading…</p>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/grade/:grade" element={<GradePage />} />
            <Route path="/lesson/:lessonId" element={<LessonPage />} />
            <Route path="/solve" element={<SolvePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/family" element={<FamilyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ProgressProvider>
  );
}
