import { useState } from 'react';
import { Link } from '../../app/router';
import { syncAvailable, useSyncEnabled } from '../../lib/sync/controller';

/** Per-device "Not now" flag. Not a registered storage key: never exported, backed up or synced. */
const DISMISSED_KEY = 'bt:ui:sync-promo-dismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Home card pointing to sync, shown only while sync is off on this device and until dismissed. */
export function SyncPromo() {
  const { on } = useSyncEnabled();
  const [dismissed, setDismissed] = useState(readDismissed);
  if (!syncAvailable || on !== false || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Storage blocked: hide it for this visit only.
    }
    setDismissed(true);
  };

  return (
    <section className="card card--soft" aria-labelledby="sync-promo-heading">
      <h2 id="sync-promo-heading">Use Hey Baby on more than one device?</h2>
      <p>Sync it through your own Google Drive. It’s encrypted on this device first, so only your devices can read it.</p>
      <div className="button-row">
        <Link to="/more/sync" className="btn btn--primary">
          Set up sync
        </Link>
        <button type="button" className="btn btn--ghost" onClick={dismiss}>
          Not now
        </button>
      </div>
    </section>
  );
}
