import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card center-card">
        <h1>404</h1>
        <p>This page does not exist.</p>
        <Link className="primary-btn inline-btn" to="/">
          Return home
        </Link>
      </div>
    </div>
  );
}
