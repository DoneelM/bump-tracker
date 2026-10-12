import { useEffect, useState } from 'react';
import { Link } from '../../app/router';
import { CallCard } from '../../components/CallCard';
import { Page } from '../../components/Page';
import { EMERGENCY, HEALTHLINE, PLUNKETLINE } from '../../data/helplines';
import {
  ACTIVITIES,
  addEntry,
  addTombstones,
  dropTombstones,
  endSleep,
  formatClock,
  formatDuration,
  isOpen,
  last24h,
  MAX_BY,
  openOf,
  parseBabyLog,
  parseTombstones,
  pauseBreast,
  removeEntry,
  replaceEntry,
  resumeBreast,
  sideTimes,
  startBreast,
  stopBreast,
  stopTimer,
  switchSide,
  type ActivityKind,
  type BabyLogEntry,
  type EntryKind,
  type NappyKind,
  type Tombstone,
} from '../../lib/babyLog';
import { dayOf, entriesOn } from '../../lib/babyLogDays';
import { useCaregiver } from '../../lib/caregiver';
import { addDays } from '../../lib/dates';
import type { PregnancyProfile } from '../../lib/profile';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { newId } from '../../lib/validate';
import { EntryForm } from './EntryForm';
import { ACTIVITY_LABEL, clock, dayOfLabel, describe, hasRunning, KIND_LABEL, NAPPY_LABEL, statusLine } from './labels';

const NONE: BabyLogEntry[] = [];
const NO_TOMBS: Tombstone[] = [];
const MORE: readonly EntryKind[] = ['solids', 'medicine', 'temp', 'growth'];

export function useBabyLog() {
  return useStoredState<BabyLogEntry[]>(STORAGE_KEYS.babyLog, NONE, parseBabyLog);
}

/** Ticks so times stay current: every second while a timer runs, otherwise every minute. */
export function useNow(fast: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), fast ? 1000 : 60_000);
    return () => window.clearInterval(t);
  }, [fast]);
  return now;
}

/** Which group a deep link (`#/baby?log=feed`, from the home screen shortcuts) points at. */
function linkedGroup(): string | null {
  const q = window.location.hash.indexOf('?');
  return q < 0 ? null : new URLSearchParams(window.location.hash.slice(q + 1)).get('log');
}

type FormState = { kind: EntryKind; initial?: BabyLogEntry } | null;

/** After-birth log. Records only; no targets, no judging the numbers. */
export function BabyLogPage({ profile }: { profile: PregnancyProfile }) {
  const [log, setLog] = useBabyLog();
  const [, setTombs] = useStoredState<Tombstone[]>(STORAGE_KEYS.babyLogDeleted, NO_TOMBS, parseTombstones);
  const now = useNow(hasRunning(log));
  const [by, setBy] = useCaregiver();
  const [form, setForm] = useState<FormState>(null);
  const [status, setStatus] = useState<{ text: string; undo?: BabyLogEntry[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);

  useEffect(() => {
    const g = linkedGroup();
    if (g) document.getElementById(`log-${g}`)?.scrollIntoView({ block: 'center' });
  }, []);

  if (profile.ending?.kind !== 'born') {
    return (
      <Page title="Baby log" icon="🍼" back={{ to: '/', label: 'Home' }}>
        <p className="lead">The baby log opens once your baby is here.</p>
        <Link to="/settings" className="text-link">
          Add the birth in Settings
        </Link>
      </Page>
    );
  }

  const me = by || undefined;
  const save = (next: BabyLogEntry[], text: string) => {
    const before = log;
    const r = setLog(next);
    if (!r.ok) return setError(r.error);
    setError(null);
    setStatus({ text, undo: before });
  };
  const stamp = <T extends BabyLogEntry>(e: T): T => (me ? { ...e, by: me } : e);
  const add = (e: BabyLogEntry) => save(addEntry(log, stamp(e)), `${describe(e, Date.now())} added at ${clock(e.at)}.`);
  const nappy = (n: NappyKind) => add({ id: newId(), kind: 'nappy', at: Date.now(), nappy: n });

  const feeding = openOf(log, 'feed');
  const asleep = openOf(log, 'sleep');
  const pumping = openOf(log, 'pump');
  const active = openOf(log, 'activity');
  const updateFeed = (f: NonNullable<typeof feeding>, text: string) => save(replaceEntry(log, f, Date.now()), text);
  const remove = (id: string) => {
    save(removeEntry(log, id), 'Deleted.');
    setTombs((t) => addTombstones(t, [id], Date.now()));
  };

  const saveForm = (e: BabyLogEntry) => {
    const editing = !!form?.initial;
    save(editing ? replaceEntry(log, e, Date.now()) : addEntry(log, e), `${describe(e, Date.now())} ${editing ? 'saved' : 'added'}.`);
    setForm(null);
  };

  const last = last24h(log, now);
  const today = dayOf(now);
  const shown = day ?? today;
  const entries = entriesOn(log, shown, now);
  const firstDay = log.length ? dayOf(log[log.length - 1]!.at) : today;

  return (
    <Page title="Baby log" icon="🍼" back={{ to: '/', label: 'Home' }}>
      <section className="card hero" aria-labelledby="log-now">
        <h2 id="log-now" className="hero__ga hero__ga--log">
          {statusLine(log, now)}
        </h2>
        <p className="muted">
          Last 24 hours: {last.feeds} {last.feeds === 1 ? 'feed' : 'feeds'}, {last.nappies} {last.nappies === 1 ? 'nappy' : 'nappies'},{' '}
          {formatDuration(last.sleepMinutes)} sleep
        </p>
      </section>

      {feeding && (
        <section className="card log-timer" aria-labelledby="log-feeding">
          <h2 id="log-feeding">{feeding.sideSince == null ? 'Feed paused' : `Feeding on the ${feeding.side}`}</h2>
          <p className="log-timer__sides" aria-live="off">
            <span className={feeding.side === 'left' ? 'is-current' : undefined}>Left {formatClock(sideTimes(feeding, now).leftMs)}</span>
            <span className={feeding.side === 'right' ? 'is-current' : undefined}>Right {formatClock(sideTimes(feeding, now).rightMs)}</span>
          </p>
          <div className="log-buttons">
            <button type="button" className="btn btn--ghost" onClick={() => updateFeed(switchSide(feeding, Date.now()), `Switched to ${feeding.side === 'left' ? 'right' : 'left'}.`)}>
              Switch side
            </button>
            {feeding.sideSince == null ? (
              <button type="button" className="btn btn--ghost" onClick={() => updateFeed(resumeBreast(feeding, Date.now()), 'Feed resumed.')}>
                Resume
              </button>
            ) : (
              <button type="button" className="btn btn--ghost" onClick={() => updateFeed(pauseBreast(feeding, Date.now()), 'Feed paused.')}>
                Pause
              </button>
            )}
            <button type="button" className="btn btn--primary" onClick={() => {
              const done = stopBreast(feeding, Date.now());
              updateFeed(done, `${describe(done, Date.now())} saved.`);
            }}>
              Done
            </button>
          </div>
        </section>
      )}

      {(pumping || active) && (
        <section className="card log-timer" aria-label="Running">
          {[pumping, active].map(
            (t) =>
              t && (
                <div key={t.id} className="log-timer__row">
                  <span>
                    {t.kind === 'pump' ? 'Pumping' : ACTIVITY_LABEL[t.activity]} <strong>{formatClock(now - t.at)}</strong>
                  </span>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => {
                      const next = stopTimer(log, t.kind, Date.now());
                      save(next, `${t.kind === 'pump' ? 'Pumping' : ACTIVITY_LABEL[t.activity]} stopped.`);
                      // Pumping: straight on to the amounts.
                      const stopped = next.find((x) => x.id === t.id);
                      if (t.kind === 'pump' && stopped) setForm({ kind: 'pump', initial: stopped });
                    }}
                  >
                    Stop
                  </button>
                </div>
              ),
          )}
        </section>
      )}

      {form && (
        <EntryForm
          key={form.initial?.id ?? 'new'}
          kind={form.kind}
          initial={form.initial}
          by={me}
          onKind={form.initial ? undefined : (kind) => setForm({ kind })}
          onSave={saveForm}
          onCancel={() => setForm(null)}
        />
      )}

      <section className="card" aria-labelledby="log-add">
        <h2 id="log-add">Add</h2>

        <h3 id="log-feed" className="log-group">
          Feed
        </h3>
        <div className="log-buttons">
          <button type="button" className="btn btn--ghost" disabled={!!feeding} onClick={() => save(addEntry(log, startBreast(newId(), 'left', Date.now(), me)), 'Feed started on the left.')}>
            Left
          </button>
          <button type="button" className="btn btn--ghost" disabled={!!feeding} onClick={() => save(addEntry(log, startBreast(newId(), 'right', Date.now(), me)), 'Feed started on the right.')}>
            Right
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setForm({ kind: 'feed', initial: undefined })}>
            Bottle
          </button>
        </div>
        <p className="muted">Left or Right starts a timer.</p>

        <h3 id="log-nappy" className="log-group">
          Nappy
        </h3>
        <div className="log-buttons log-buttons--4">
          {(['wet', 'dirty', 'both', 'dry'] as const).map((n) => (
            <button key={n} type="button" className="btn btn--ghost" aria-label={`Nappy: ${NAPPY_LABEL[n].toLowerCase()}`} onClick={() => nappy(n)}>
              {n === 'both' ? 'Both' : NAPPY_LABEL[n]}
            </button>
          ))}
        </div>

        <h3 id="log-sleep" className="log-group">
          Sleep
        </h3>
        <div className="log-buttons">
          {asleep ? (
            <button type="button" className="btn btn--primary" onClick={() => save(endSleep(log, Date.now()), `Awake at ${clock(Date.now())}.`)}>
              Baby’s awake
            </button>
          ) : (
            <button type="button" className="btn btn--ghost" onClick={() => add({ id: newId(), kind: 'sleep', at: Date.now(), end: null })}>
              Baby’s asleep
            </button>
          )}
        </div>

        <h3 id="log-activity" className="log-group">
          Activity
        </h3>
        <div className="log-buttons">
          {ACTIVITIES.map((a: ActivityKind) => (
            <button key={a} type="button" className="btn btn--ghost" disabled={!!active} onClick={() => add({ id: newId(), kind: 'activity', at: Date.now(), activity: a, end: null })}>
              {ACTIVITY_LABEL[a]}
            </button>
          ))}
        </div>

        <h3 id="log-more" className="log-group">
          More
        </h3>
        <div className="log-buttons">
          <button type="button" className="btn btn--ghost" disabled={!!pumping} onClick={() => add({ id: newId(), kind: 'pump', at: Date.now(), end: null, leftMl: null, rightMl: null })}>
            Start pumping
          </button>
          {MORE.map((k) => (
            <button key={k} type="button" className="btn btn--ghost" onClick={() => setForm({ kind: k })}>
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>

        <div role="status" className="log-status">
          {status && (
            <>
              {status.text}{' '}
              {status.undo && (
                <button
                  type="button"
                  className="text-link log-undo"
                  onClick={() => {
                    const back = status.undo!;
                    const r = setLog(back);
                    if (r.ok) setTombs((t) => dropTombstones(t, new Set(back.map((x) => x.id))));
                    setStatus(r.ok ? { text: 'Undone.' } : null);
                  }}
                >
                  Undo
                </button>
              )}
            </>
          )}
        </div>
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
      </section>

      <CaregiverName by={by} setBy={setBy} />

      <section aria-labelledby="log-today">
        <div className="log-list-head">
          <h2 id="log-today">{dayOfLabel(shown, today)}</h2>
          <div className="log-day-nav">
            <button type="button" className="btn btn--ghost" disabled={shown <= firstDay} aria-label="Previous day" onClick={() => setDay(addDays(shown, -1))}>
              ‹
            </button>
            <button type="button" className="btn btn--ghost" disabled={shown >= today} aria-label="Next day" onClick={() => setDay(addDays(shown, 1) >= today ? null : addDays(shown, 1))}>
              ›
            </button>
          </div>
        </div>
        {entries.length === 0 ? (
          <p className="muted">Nothing logged {shown === today ? 'today yet' : 'this day'}.</p>
        ) : (
          <ul className="entry-list">
            {entries.map((e) => (
              <li key={e.id} className="card log-entry">
                <span>
                  <span className="log-entry__time">{clock(e.at)}</span> {describe(e, now)}
                  {e.by && <span className="muted"> · {e.by}</span>}
                  {e.note && <span className="log-entry__note">{e.note}</span>}
                </span>
                <span className="log-entry__actions">
                  {!isOpen(e) && (
                    <button type="button" className="btn btn--ghost" aria-label={`Edit ${describe(e, now)} at ${clock(e.at)}`} onClick={() => setForm({ kind: e.kind, initial: e })}>
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--ghost"
                    aria-label={`Delete ${describe(e, now)} at ${clock(e.at)}`}
                    onClick={() => remove(e.id)}
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="button-row">
          <button type="button" className="btn btn--ghost" onClick={() => setForm({ kind: 'feed' })}>
            Add earlier entry
          </button>
          <Link to="/baby/trends" className="btn btn--ghost">
            Trends and export
          </Link>
        </div>
      </section>

      <CallCard title="Help with your baby" lines={[PLUNKETLINE, HEALTHLINE, EMERGENCY]} />
    </Page>
  );
}

/** "Who's logging on this phone?", so two caregivers can tell their entries apart. Asked once, per device. */
function CaregiverName({ by, setBy }: { by: string | null; setBy: (name: string) => void }) {
  const [editing, setEditing] = useState(by === null);
  const [draft, setDraft] = useState(by ?? '');
  if (!editing) {
    return (
      <p className="muted log-by">
        {by ? `Logging as ${by} on this phone.` : 'No name set on this phone.'}{' '}
        <button type="button" className="text-link log-undo" onClick={() => setEditing(true)}>
          {by ? 'Change' : 'Add a name'}
        </button>
      </p>
    );
  }
  return (
    <section className="card card--soft" aria-labelledby="log-by-h">
      <h2 id="log-by-h">Who’s logging on this phone?</h2>
      <p className="muted">Optional. If two of you log, each entry shows who added it. Saved on this phone only.</p>
      <div className="inline-inputs">
        <label className="visually-hidden" htmlFor="log-by">
          Your name
        </label>
        <input id="log-by" className="input" maxLength={MAX_BY} value={draft} placeholder="For example: Mum, Sam" onChange={(e) => setDraft(e.target.value)} />
        <button type="button" className="btn btn--primary" onClick={() => { setBy(draft); setEditing(false); }}>
          Save
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => { setBy(by ?? ''); setEditing(false); }}>
          {by === null ? 'Skip' : 'Cancel'}
        </button>
      </div>
    </section>
  );
}
