import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="container narrow page-pad center">
      <p className="huge" aria-hidden="true">🧭</p>
      <h1>We couldn’t find that page</h1>
      <p>Let’s get you back on track.</p>
      <div className="row center">
        <Link className="btn primary" to="/">
          Home
        </Link>
        <Link className="btn" to="/grades">
          Choose a grade
        </Link>
      </div>
    </div>
  );
}
