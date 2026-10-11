import { BottomNav } from '../components/BottomNav';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { NotFoundPage } from '../features/notfound/NotFoundPage';
import { PartnerViewPage } from '../features/partner/PartnerViewPage';
import { RestorePage } from '../features/data/RestorePage';
import { useProfile } from '../lib/useProfile';
import { useToday } from '../lib/useToday';
import { useRoutePath } from './router';
import { resolveRoute } from './routes';

export function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [profile] = useProfile();
  const path = useRoutePath();
  const today = useToday();

  // Read-only shared snapshot: works without a profile and never writes to storage.
  // Restore: works without a profile, so a new device can import a backup before onboarding.
  if (path === '/partner-view' || path === '/restore') {
    return (
      <div className="app">
        <main id="main" className="app-main app-main--standalone">
          {path === '/restore' ? <RestorePage /> : <PartnerViewPage />}
        </main>
      </div>
    );
  }

  if (!profile) return <OnboardingPage />;

  const match = resolveRoute(path);

  return (
    <div className="app">
      {/* A button, not href="#main": hash changes are routes in this app. */}
      <button type="button" className="skip-link" onClick={() => document.getElementById('main')?.focus()}>
        Skip to content
      </button>
      <header className="app-header">
        <span className="app-header__logo" aria-hidden="true">
          🤰
        </span>
        <span className="app-header__name">Bump Tracker</span>
      </header>
      <main id="main" className="app-main" tabIndex={-1}>
        {match ? match.route.render({ params: match.params, profile, today }) : <NotFoundPage />}
      </main>
      <BottomNav active={match?.route.tab ?? null} />
    </div>
  );
}
