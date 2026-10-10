import { useRef, useState } from 'react';
import { navigate } from '../../app/router';
import { Page } from '../../components/Page';
import {
  BACKUP_KEY_LABELS,
  backupFilename,
  buildBackup,
  KEY_VALIDATORS,
  MAX_IMPORT_BYTES,
  parseBackup,
  type ParsedBackup,
} from '../../lib/backup';
import { todayLocal } from '../../lib/dates';
import { clearPhotos, exportPhotos, putWeekPhoto } from '../../lib/photoStore';
import { clearAllStored, exportAll, removeStored, writeStored } from '../../lib/storage';

const DELETE_WORD = 'DELETE';
const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

function download(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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

  const reset = () => {
    setPending(null);
    if (input.current) input.current.value = '';
  };

  const choose = async (file: File | undefined) => {
    setPending(null);
    setMessage(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) return setMessage({ ok: false, text: 'Please choose a .json backup file.' });
    if (file.size > MAX_IMPORT_BYTES) return setMessage({ ok: false, text: 'This file is larger than 50 MB.' });
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
    const failures: string[] = [];
    for (const key of Object.keys(KEY_VALIDATORS)) {
      if (key in pending.accepted) {
        const r = writeStored(key, pending.accepted[key]);
        if (!r.ok) failures.push(BACKUP_KEY_LABELS[key] ?? key);
      } else removeStored(key);
    }
    let photoCount = 0;
    if (pending.photos.length > 0) {
      try {
        await clearPhotos();
        const today = todayLocal();
        for (const p of pending.photos) {
          await putWeekPhoto(p.blob, p.week, today);
          photoCount++;
        }
      } catch {
        failures.push('Bump photos');
      }
    }
    setBusy(false);
    reset();
    setMessage(
      failures.length
        ? { ok: false, text: `Imported, but these could not be saved: ${failures.join(', ')}.` }
        : { ok: true, text: `Imported ${count(Object.keys(pending.accepted).length, 'item')}${photoCount ? ` and ${count(photoCount, 'photo')}` : ''}.` },
    );
  };

  return (
    <section className="card" aria-labelledby="import-heading">
      <h2 id="import-heading">Restore from a backup</h2>
      <div className="field">
        <label className="field__label" htmlFor="import-file">
          Backup file (.json, up to 50 MB)
        </label>
        <input id="import-file" ref={input} type="file" accept=".json,application/json" onChange={(e) => void choose(e.target.files?.[0])} />
      </div>
      {message && (
        <p className={message.ok ? 'card card--success' : 'field__error'} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}
      {pending && (
        <div className="card card--warning" role="group" aria-label="Confirm import">
          <h3>Ready to import</h3>
          {pending.exportedAt && <p className="muted">Backup made {new Date(pending.exportedAt).toLocaleString()}.</p>}
          <ul className="bullets">
            {Object.keys(pending.accepted).map((k) => (
              <li key={k}>{BACKUP_KEY_LABELS[k] ?? k}</li>
            ))}
            {pending.photos.length > 0 && <li>{count(pending.photos.length, 'bump photo')}</li>}
          </ul>
          {(pending.skipped.length > 0 || pending.photosSkipped > 0) && (
            <p className="muted">
              Skipped: {[...pending.skipped.map((s) => `${BACKUP_KEY_LABELS[s.key] ?? 'unrecognised item'} (${s.reason})`), ...(pending.photosSkipped ? [`${count(pending.photosSkipped, 'invalid photo')}`] : [])].join('; ')}.
            </p>
          )}
          <p>
            <strong>This will replace the data on this device.</strong> Anything not in the backup will be removed.
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
  return (
    <Page title="Your data" icon="💾" back={{ to: '/more', label: 'More' }} health={false}>
      <section className="card card--soft" aria-label="Privacy">
        <p>
          <strong>Private by design.</strong> No accounts, no servers, no analytics. Your data lives only in this browser, and is lost if
          you clear your browser data, so keep a backup.
        </p>
      </section>
      <ExportSection />
      <ImportSection />
      <DeleteSection />
    </Page>
  );
}
