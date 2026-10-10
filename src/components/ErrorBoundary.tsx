import { Component, type ReactNode } from 'react';
import { backupFilename, buildBackup } from '../lib/backup';
import { todayLocal } from '../lib/dates';
import { download } from '../lib/download';
import { clearPhotos } from '../lib/photoStore';
import { clearAllStored, exportAll } from '../lib/storage';

/**
 * Last line of defence: a render error (bad stored data, or a lazy chunk that failed to load) shows a recovery
 * screen instead of a blank page, so the user can always reload, save a backup or wipe their data.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; notice: string }> {
  override state = { failed: false, notice: '' };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  backup = () => {
    try {
      download(backupFilename(todayLocal()), JSON.stringify(buildBackup(exportAll(), new Date())));
      this.setState({ notice: 'Backup downloaded.' });
    } catch {
      this.setState({ notice: 'Could not create a backup.' });
    }
  };

  wipe = async () => {
    if (!window.confirm('Delete all your data from this browser? This can’t be undone.')) return;
    try {
      clearAllStored();
      await clearPhotos();
    } catch {
      // reload anyway: the stored details are cleared even if the photo store is unavailable
    }
    window.location.reload();
  };

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="app-main app-main--standalone" role="alert">
        <section className="card">
          <h1>Something went wrong</h1>
          <p>The app hit a problem. Reloading usually fixes it. If it keeps happening, save a backup and then delete your data.</p>
          <div className="button-row">
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              Reload
            </button>
            <button type="button" className="btn btn--ghost" onClick={this.backup}>
              Download a backup
            </button>
            <button type="button" className="btn btn--danger" onClick={() => void this.wipe()}>
              Delete all my data
            </button>
          </div>
          {this.state.notice && <p role="status">{this.state.notice}</p>}
        </section>
      </main>
    );
  }
}
