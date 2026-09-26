import { Link, useSearchParams } from 'react-router-dom';
import { SearchBox } from '../components/Layout';
import { search } from '../curriculum';
import { solve } from '../engine/solver';
import { useProgress } from '../progress/store';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const { state } = useProgress();
  const hits = search(q, state.profile.grade);
  const solved = solve(q);
  return (
    <div className="container narrow page-pad">
      <h1>Search</h1>
      <SearchBox big key={q} />
      {q && (
        <p className="muted" aria-live="polite">
          {hits.length} lesson{hits.length === 1 ? '' : 's'} for “{q}”
        </p>
      )}
      {solved && (
        <div className="callout">
          🧮 That looks like a <strong>{solved.skill.name}</strong> problem.{' '}
          <Link to={`/solve?q=${encodeURIComponent(q)}`} className="btn primary">
            Solve it step by step
          </Link>
        </div>
      )}
      <ul className="results">
        {hits.map((h) => (
          <li key={h.href}>
            <Link to={h.href} className="result">
              <strong>{h.title}</strong>
              <span className="small muted">{h.subtitle}</span>
            </Link>
          </li>
        ))}
      </ul>
      {q && !hits.length && !solved && (
        <p>
          No matches yet. Try words like “fractions”, “equations”, “area” or type a problem like <Link to="/solve?q=2x%20%2B%205%20%3D%2017">2x + 5 = 17</Link>.
        </p>
      )}
    </div>
  );
}
