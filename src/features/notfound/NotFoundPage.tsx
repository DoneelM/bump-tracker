import { Link } from '../../app/router';
import { Page } from '../../components/Page';

export function NotFoundPage() {
  return (
    <Page title="Page not found" icon="🧭" health={false}>
      <section className="card">
        <p>We couldn’t find that page.</p>
        <Link to="/" className="btn btn--primary">
          Go home
        </Link>
      </section>
    </Page>
  );
}
