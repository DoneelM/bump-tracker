import { BottomNav } from '../components/BottomNav';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { UpdateBanner } from '../components/UpdateBanner';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { NotFoundPage } from '../features/notfound/NotFoundPage';
import { PartnerViewPage } from '../features/partner/PartnerViewPage';
import { RestorePage } from '../features/data/RestorePage';
import { appMode, usePing } from '../lib/ping';
import type { LocalDate } from '../lib/dates';
import type { PregnancyProfile } from '../lib/profile';
import { useProfile } from '../lib/useProfile';
import { useToday } from '../lib/useToday';
import { useRoutePath } from './router';
import { resolveRoute } from './routes';

export function App() {
  return (
    <ErrorBoundary>
      <UpdateBanner />
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
  const babyMode = profile.ending?.kind === 'born';

  return (
    <div className="app">
      {/* A button, not href="#main": hash changes are routes in this app. */}
      <button type="button" className="skip-link" onClick={() => document.getElementById('main')?.focus()}>
        Skip to content
      </button>
      <header className="app-header">
        <span className="app-header__logo" aria-hidden="true">
          {babyMode ? '👶' : '🤰'}
        </span>
        <span className="app-header__name">Hey Baby</span>
      </header>
      <main id="main" className="app-main" tabIndex={-1}>
        {match ? match.route.render({ params: match.params, profile, today }) : <NotFoundPage />}
      </main>
      <BottomNav active={match?.route.tab ?? null} babyMode={babyMode} />
      <Ping today={today} profile={profile} />
    </div>
  );
}

/** Anonymous daily count (src/lib/ping.ts). Renders nothing. */
function Ping({ today, profile }: { today: LocalDate; profile: PregnancyProfile }) {
  usePing(today, appMode(profile));
  return null;
}
