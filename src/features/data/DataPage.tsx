import { useEffect, useRef, useState } from 'react';
import { navigate } from '../../app/router';
import { Page } from '../../components/Page';
import {
  applyBackup,
  appStorage,
  backupFilename,
  buildBackup,
  keyLabel,
  MAX_IMPORT_BYTES,
  parseBackup,
  type BackupEnvelope,
  type ParsedBackup,
} from '../../lib/backup';
import { todayLocal } from '../../lib/dates';
import { download } from '../../lib/download';
import { clearPhotos, exportPhotos, importPhotos, listPhotos, planPhotoRestore, replaceAllPhotos } from '../../lib/photoStore';
import { clearAllStored, exportAll } from '../../lib/storage';

const DELETE_WORD = 'DELETE';
const MAX_IMPORT_MB = MAX_IMPORT_BYTES / (1024 * 1024);
const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

function ExportSection() {
  const [withPhotos, setWithPhotos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const photos = withPhotos ? await exportPhotos() : undefined;
      const backup = buildBackup(exportAll(), new Date(), photos);
      download(backupFilename(todayLocal()), JSON.stringify(backup));
      setMessage({ ok: true, text: 'Backup downloaded. Keep it somewhere safe: it contains your personal details.' });
    } catch {
      setMessage({ ok: false, text: 'Could not create the backup. If you included photos, try again without them.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card" aria-labelledby="export-heading">
      <h2 id="export-heading">Back up your data</h2>
      <p>Download everything as one file you can restore later, or move to another device.</p>
      <label className="chip">
        <input type="checkbox" checked={withPhotos} onChange={(e) => setWithPhotos(e.target.checked)} />
        Include bump photos (larger file)
      </label>
      <div className="button-row">
        <button type="button" className="btn btn--primary" onClick={run} disabled={busy}>
          {busy ? 'Preparing…' : 'Download backup'}
        </button>
      </div>
      {message && (
        <p className={message.ok ? 'card card--success' : 'field__error'} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}
    </section>
  );
}

function ImportSection() {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [safety, setSafety] = useState<BackupEnvelope | null>(null);

  const reset = () => {
    setPending(null);
    if (input.current) input.current.value = '';
  };

  const choose = async (file: File | undefined) => {
    setPending(null);
    setMessage(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) return setMessage({ ok: false, text: 'Please choose a .json backup file.' });
    if (file.size > MAX_IMPORT_BYTES) return setMessage({ ok: false, text: `This file is larger than ${MAX_IMPORT_MB} MB.` });
    let text: string;
    try {
      text = await file.text();
    } catch {
      return setMessage({ ok: false, text: 'Could not read this file.' });
    }
    const result = parseBackup(text);
    if (!result.ok) return setMessage({ ok: false, text: result.error });
    setPending(result.backup);
  };

  const apply = async () => {
    if (!pending) return;
    setBusy(true);
    setSafety(null);
    // In-memory copy of the current details, offered for download if the import fails.
    const safetyBackup = buildBackup(exportAll(), new Date());
    try {
      let photoCount = 0;
      let photoSkipped = 0;
      let commit: (() => Promise<void>) | undefined;
      if (pending.photos.length > 0) {
        const prepared = await importPhotos(pending.photos);
        const existing = await listPhotos();
        const plan = planPhotoRestore(existing.map((p) => p.week!), prepared.ready.map((p) => p.week), prepared.skippedWeeks);
        photoCount = prepared.ready.length;
        photoSkipped = prepared.skippedWeeks.length;
        if (plan.replace) {
          if (
            photoSkipped > 0 &&
            !window.confirm(
              `${photoSkipped} of ${pending.photos.length} photos in this backup can’t be read. Your ${existing.length} current photos will be replaced by ${plan.finalCount} (weeks whose backup photo couldn’t be read keep their current photo). Continue?`,
            )
          )
            return;
          const kept = existing.filter((p) => plan.keptWeeks.includes(p.week!)).map((p) => ({ blob: p.blob, week: p.week!, takenOn: p.takenOn }));
          commit = () => replaceAllPhotos([...prepared.ready, ...kept]);
        }
      }
      const result = await applyBackup(pending, appStorage, commit);
      reset();
      const skippedNote = photoSkipped
        ? ` ${count(photoSkipped, 'photo')} could not be read and ${photoCount ? 'were skipped' : 'were skipped; your current photos were left as they are'}.`
        : '';
      if (!result.ok) setSafety(safetyBackup);
      setMessage(
        result.ok
          ? { ok: true, text: `Imported ${count(Object.keys(pending.accepted).length, 'item')}${photoCount ? ` and ${count(photoCount, 'photo')}` : ''}.${skippedNote}` }
          : { ok: false, text: result.error },
      );
    } catch {
      setSafety(safetyBackup);
      setMessage({ ok: false, text: 'The import failed unexpectedly. Your data may be unchanged; download the safety backup to be sure.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card" aria-labelledby="import-heading">
      <h2 id="import-heading">Restore from a backup</h2>
      <div className="field">
        <label className="field__label" htmlFor="import-file">
          Backup file (.json, up to {MAX_IMPORT_MB} MB)
        </label>
        <input id="import-file" ref={input} type="file" accept=".json,application/json" onChange={(e) => void choose(e.target.files?.[0])} />
      </div>
      {message && (
        <p className={message.ok ? 'card card--success' : 'field__error'} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}
      {safety && (
        <div className="button-row">
          <button type="button" className="btn btn--primary" onClick={() => download(backupFilename(todayLocal()), JSON.stringify(safety))}>
            Download safety backup
          </button>
        </div>
      )}
      {pending && (
        <div className="card card--warning" role="group" aria-label="Confirm import">
          <h3>Ready to import</h3>
          {pending.exportedAt && <p className="muted">Backup made {new Date(pending.exportedAt).toLocaleString()}.</p>}
          <ul className="bullets">
            {Object.keys(pending.accepted).map((k) => (
              <li key={k}>{keyLabel(k) ?? k}</li>
            ))}
            {pending.photos.length > 0 && <li>{count(pending.photos.length, 'bump photo')}</li>}
          </ul>
          {(pending.skipped.length > 0 || pending.photosSkipped > 0) && (
            <p className="muted">
              Skipped: {[...pending.skipped.map((s) => `${keyLabel(s.key) ?? 'unrecognised item'} (${s.reason})`), ...(pending.photosSkipped ? [`${count(pending.photosSkipped, 'invalid photo')}`] : [])].join('; ')}.
            </p>
          )}
          <p>
            <strong>This will replace the data on this device.</strong> Anything not in the backup will be removed, except skipped items above, which keep
            their current data. Photos on this device are kept unless the backup includes photos.
          </p>
          <div className="button-row">
            <button type="button" className="btn btn--primary" onClick={() => void apply()} disabled={busy}>
              Replace my data
            </button>
            <button type="button" className="btn btn--ghost" onClick={reset} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function DeleteSection() {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wipe = async () => {
    setBusy(true);
    clearAllStored();
    try {
      await clearPhotos();
    } catch {
      setError('Your details were deleted, but the photos could not be cleared. Clear this site’s data in your browser settings.');
      setBusy(false);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <section className="card card--danger" aria-labelledby="delete-heading">
      <h2 id="delete-heading">Delete all my data</h2>
      <p>
        This permanently removes your due date, logs, journal, checklists and bump photos from this browser. It can’t be undone, so
        download a backup first if you might want anything back. You’ll return to the start.
      </p>
      <div className="field">
        <label className="field__label" htmlFor="delete-confirm">
          Type {DELETE_WORD} to confirm
        </label>
        <input id="delete-confirm" className="input" type="text" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row">
        <button type="button" className="btn btn--danger" disabled={typed !== DELETE_WORD || busy} onClick={() => void wipe()}>
          Delete everything
        </button>
      </div>
    </section>
  );
}

export function DataPage() {
  const [unprotected, setUnprotected] = useState(false);
  useEffect(() => {
    void navigator.storage?.persisted?.().then((p) => setUnprotected(p === false));
  }, []);
  return (
    <Page title="Your data" icon="💾" back={{ to: '/more', label: 'More' }} health={false}>
      <section className="card card--soft" aria-label="Privacy">
        <p>
          <strong>Private by design.</strong> No accounts, no servers, no analytics. Your data lives only in this browser, and is lost if
          you clear your browser data, so keep a backup.
        </p>
      </section>
      {unprotected && (
        <p className="muted">Tip: this browser may clear your data when space runs low, so keep regular backups.</p>
      )}
      <ExportSection />
      <ImportSection />
      <DeleteSection />
    </Page>
  );
}
