import { useUpdateReady } from '../lib/registerServiceWorker';

/** Offers a reload once a newer version of the app has installed in the background. */
export function UpdateBanner() {
  if (!useUpdateReady()) return null;
  return (
    <div className="update-banner" role="status">
      <span>A new version of Bump Tracker is ready.</span>
      <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  );
}
