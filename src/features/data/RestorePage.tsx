import { Link } from '../../app/router';
import { Page } from '../../components/Page';
import { useProfile } from '../../lib/useProfile';
import { SyncPanel } from '../sync/SyncPanel';
import { ImportSection } from './DataPage';

/**
 * Restore on a new device, reached from onboarding. Rendered standalone whether or not a profile exists, so the
 * import isn't unmounted when it writes the profile (and a rollback message stays on screen).
 */
export function RestorePage() {
  const [profile] = useProfile();
  return (
    <Page title="Restore your data" icon="💾" health={false}>
      <SyncPanel newDevice />
      <ImportSection />
      <Link to="/" className="text-link">
        {profile ? 'Open Hey Baby' : 'Back to set up'}
      </Link>
    </Page>
  );
}
