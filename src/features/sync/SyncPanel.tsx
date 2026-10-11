import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import { download } from '../../lib/download';
import { SYNC_PAUSED_TOO_LARGE } from '../../lib/crypto';
import { reportSyncResult, runSync, syncAvailable, syncDeps, useSyncStatus } from '../../lib/sync/controller';
import { deleteSyncedCopy, startSetup, turnOff, unlock, type Conflict, type Resolutions, type SyncResult } from '../../lib/sync/engine';
import { isSignedIn, onAuthChange, signIn, signOut } from '../../lib/sync/googleAuth';
import { SignInRequiredError } from '../../lib/sync/provider';

const timeFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const errorText = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Try again.');

function useSignedIn(): boolean {
  return useSyncExternalStore(onAuthChange, isSignedIn, () => false);
}

/** Whether this device has sync turned on (state in IndexedDB); null while loading. */
function useSyncOn(): [boolean | null, number | null, () => void] {
  const [on, setOn] = useState<boolean | null>(null);
  const [last, setLast] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const { busy } = useSyncStatus();
  useEffect(() => {
    let live = true;
    void syncDeps.store
      .load()
      .then((s) => live && (setOn(s !== null), setLast(s?.lastSyncedAt ?? null)))
      .catch(() => live && setOn(false));
    return () => {
      live = false;
    };
  }, [tick, busy]);
  return [on, last, () => setTick((t) => t + 1)];
}

function ResultMessage({ result }: { result: SyncResult | null }) {
  if (!result) return null;
  if (result.status === 'synced') {
    const text = result.updated.length ? `Synced. Updated on this device: ${result.updated.join(', ')}.` : 'Synced. Everything is up to date.';
    return (
      <p className="card card--success" role="status">
        {text}
      </p>
    );
  }
  if (result.status === 'too-large') return <p className="field__error" role="alert">{SYNC_PAUSED_TOO_LARGE}</p>;
  if (result.status === 'gone') {
    return (
      <p className="field__error" role="alert">
        The synced copy was deleted or replaced from another device, so sync is off here. Your data on this device is safe.
      </p>
    );
  }
  return null;
}

function ConflictForm({ conflicts, onDone }: { conflicts: Conflict[]; onDone: () => void }) {
  const [choice, setChoice] = useState<Resolutions>({});
  const ready = conflicts.every((c) => choice[c.key]);
  return (
    <form
      className="card card--warning"
      onSubmit={(e) => {
        e.preventDefault();
        void runSync(choice).then(onDone);
      }}
    >
      <h3>Changed on both devices</h3>
      <p>These were changed here and on another device since the last sync. Choose which version to keep for each.</p>
      {conflicts.map((c) => (
        <fieldset key={c.key} className="choice">
          <legend className="field__label">{c.label}</legend>
          <div className="chip-group">
            {(['local', 'remote'] as const).map((side) => (
              <label key={side} className={`chip${choice[c.key] === side ? ' is-selected' : ''}`}>
                <input type="radio" name={`conflict-${c.key}`} checked={choice[c.key] === side} onChange={() => setChoice({ ...choice, [c.key]: side })} />
                {side === 'local' ? 'This device' : 'Synced copy'}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="button-row">
        <button type="submit" className="btn btn--primary" disabled={!ready}>
          Keep these and sync
        </button>
      </div>
    </form>
  );
}

function SetupFlow({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState<{ code: string; finish: () => Promise<SyncResult> } | null>(null);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastGroup = pending?.code.split('-').at(-1) ?? '';

  const begin = async () => {
    setBusy(true);
    setError(null);
    try {
      setPending(await startSetup(syncDeps));
    } catch (err) {
      setError(err instanceof SignInRequiredError ? 'Please sign in with Google again.' : errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      reportSyncResult(await pending.finish());
      onDone();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  if (!pending) {
    return (
      <div>
        <div className="button-row">
          <button type="button" className="btn btn--primary" onClick={() => void begin()} disabled={busy}>
            Turn on sync
          </button>
        </div>
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
  return (
    <form className="card card--warning" onSubmit={(e) => void confirm(e)}>
      <h3>Your recovery code</h3>
      <p>
        You’ll need this code to use sync on another device. <strong>Keep it somewhere safe.</strong> We can’t show it again or reset it: without it, the
        synced copy can’t be opened by anyone. Your data on this device is never affected.
      </p>
      <p className="recovery-code" aria-label="Recovery code">
        {pending.code}
      </p>
      <div className="button-row">
        <button type="button" className="btn btn--ghost" onClick={() => download('bump-tracker-recovery-code.txt', `Bump Tracker sync recovery code\n\n${pending.code}\n`, 'text/plain')}>
          Download code
        </button>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="rc-confirm">
          To confirm you’ve kept it, type the last group ({lastGroup.length} characters)
        </label>
        <input id="rc-confirm" className="input" autoComplete="off" autoCapitalize="characters" value={typed} onChange={(e) => setTyped(e.target.value)} />
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row">
        <button type="submit" className="btn btn--primary" disabled={busy || typed.trim().toUpperCase() !== lastGroup}>
          {busy ? 'Turning on…' : 'I’ve kept it, turn on sync'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setPending(null)} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function UnlockFlow({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      reportSyncResult(await unlock(syncDeps, code));
      onDone();
    } catch (err) {
      setError(err instanceof SignInRequiredError ? 'Please sign in with Google again.' : errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={(e) => void submit(e)}>
      <div className="field">
        <label className="field__label" htmlFor="rc-unlock">
          Recovery code from your other device
        </label>
        <input id="rc-unlock" className="input" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row">
        <button type="submit" className="btn btn--primary" disabled={busy || !code.trim()}>
          {busy ? 'Unlocking…' : 'Use sync on this device'}
        </button>
      </div>
    </form>
  );
}

function SignInButton({ then }: { then?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <div className="button-row">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setError(null);
            signIn().then(then, (err: unknown) => setError(errorText(err)));
          }}
        >
          Sign in with Google
        </button>
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Sync with the user's own Google Drive: turn on, unlock on another device, sync, resolve conflicts, turn off. */
export function SyncPanel({ newDevice = false }: { newDevice?: boolean }) {
  const signedIn = useSignedIn();
  const status = useSyncStatus();
  const [on, last, refresh] = useSyncOn();
  const [mode, setMode] = useState<'setup' | 'unlock'>(newDevice ? 'unlock' : 'setup');
  const [opError, setOpError] = useState<string | null>(null);

  useEffect(() => {
    if (status.result?.status === 'gone') void turnOff(syncDeps).then(refresh);
  }, [status.result, refresh]);

  if (!syncAvailable) {
    return (
      <section className="card card--soft">
        <p>Sync isn’t available in this version of the app. Use “Your data” to back up and restore instead.</p>
      </section>
    );
  }
  if (on === null) return <p className="muted">Loading…</p>;

  const conflicts = status.result?.status === 'conflict' ? status.result.conflicts : null;

  if (!on) {
    return (
      <section className="card" aria-labelledby="sync-heading">
        <h2 id="sync-heading">{newDevice ? 'Restore from Google Drive sync' : 'Sync with Google Drive'}</h2>
        <ul className="bullets">
          <li>Keeps your details, logs, journal and checklists the same on your devices. Photos stay on each device.</li>
          <li>Everything is encrypted on this device first. It’s stored in a hidden app folder in your own Google Drive, and only your devices can read it.</li>
          <li>Google sees that you use Bump Tracker and when you sync, but not what you’ve written. We store nothing.</li>
          <li>You get a recovery code to use sync on another device. Lose it, and the synced copy can’t be opened.</li>
        </ul>
        {!signedIn ? (
          <SignInButton />
        ) : (
          <>
            {!newDevice && (
              <div className="chip-group" role="radiogroup" aria-label="Sync setup">
                <label className={`chip${mode === 'setup' ? ' is-selected' : ''}`}>
                  <input type="radio" name="sync-mode" checked={mode === 'setup'} onChange={() => setMode('setup')} />
                  First device
                </label>
                <label className={`chip${mode === 'unlock' ? ' is-selected' : ''}`}>
                  <input type="radio" name="sync-mode" checked={mode === 'unlock'} onChange={() => setMode('unlock')} />
                  I already sync another device
                </label>
              </div>
            )}
            {mode === 'setup' ? <SetupFlow onDone={refresh} /> : <UnlockFlow onDone={refresh} />}
          </>
        )}
        {conflicts && <ConflictForm conflicts={conflicts} onDone={refresh} />}
        <ResultMessage result={status.result} />
      </section>
    );
  }

  const confirmThen = (question: string, op: () => Promise<void>) => {
    if (!window.confirm(question)) return;
    setOpError(null);
    op().then(
      () => {
        reportSyncResult(null);
        refresh();
      },
      (err: unknown) => setOpError(err instanceof SignInRequiredError ? 'Please sign in with Google first.' : errorText(err)),
    );
  };

  return (
    <section className="card" aria-labelledby="sync-heading">
      <h2 id="sync-heading">Sync is on</h2>
      <p className="muted">{last ? `Last synced ${timeFmt.format(last)}.` : 'Not synced yet.'}</p>
      {!signedIn || status.needsSignIn ? (
        <>
          <p>Sign in to sync. Changes are kept on this device until then.</p>
          <SignInButton then={() => void runSync()} />
        </>
      ) : (
        <div className="button-row">
          <button type="button" className="btn btn--primary" onClick={() => void runSync()} disabled={status.busy}>
            {status.busy ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
      )}
      {status.error && (
        <p className="field__error" role="alert">
          {status.error}
        </p>
      )}
      {conflicts && <ConflictForm conflicts={conflicts} onDone={refresh} />}
      <ResultMessage result={status.result} />
      <div className="button-row">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() =>
            confirmThen('Turn off sync on this device? Your data stays here, and the synced copy stays in Google Drive.', async () => {
              await turnOff(syncDeps);
              signOut();
            })
          }
        >
          Turn off sync on this device
        </button>
        <button
          type="button"
          className="btn btn--danger"
          disabled={!signedIn}
          onClick={() =>
            confirmThen('Delete the synced copy from your Google Drive? Data on your devices is not affected. Other devices will stop syncing.', () => deleteSyncedCopy(syncDeps))
          }
        >
          Delete synced copy
        </button>
      </div>
      {opError && (
        <p className="field__error" role="alert">
          {opError}
        </p>
      )}
    </section>
  );
}
