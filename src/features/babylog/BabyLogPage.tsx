import { useEffect, useState } from 'react';
import { Link } from '../../app/router';
import { CallCard } from '../../components/CallCard';
import { Page } from '../../components/Page';
import { EMERGENCY, HEALTHLINE, PLUNKETLINE } from '../../data/helplines';
import {
  addEntry,
  endSleep,
  formatDuration,
  last24h,
  lastOfKind,
  MAX_BOTTLE_ML,
  openSleep,
  parseBabyLog,
  type BabyLogEntry,
  type FeedSide,
  type NappyKind,
} from '../../lib/babyLog';
import type { PregnancyProfile } from '../../lib/profile';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { newId, parseNumberInput } from '../../lib/validate';

const NONE: BabyLogEntry[] = [];
const DAY = 24 * 3_600_000;
const SIDE_LABEL: Record<FeedSide, string> = { left: 'Left', right: 'Right', bottle: 'Bottle' };
const NAPPY_LABEL: Record<NappyKind, string> = { wet: 'Wet', dirty: 'Dirty', both: 'Wet and dirty' };
const clock = (ms: number) => new Date(ms).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' });

function describe(e: BabyLogEntry, now: number): string {
  if (e.kind === 'feed') return `Feed: ${SIDE_LABEL[e.side]}${e.ml ? `, ${e.ml} ml` : ''}`;
  if (e.kind === 'nappy') return `Nappy: ${NAPPY_LABEL[e.nappy].toLowerCase()}`;
  return e.end === null ? `Asleep (${formatDuration((now - e.at) / 60_000)} so far)` : `Sleep: ${formatDuration((e.end - e.at) / 60_000)}`;
}

/** Ticks once a minute so "ago" lines stay current. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** After-birth log of feeds, nappies and sleep. Records only; no targets, no judging the numbers. */
export function BabyLogPage({ profile }: { profile: PregnancyProfile }) {
  const [log, setLog] = useStoredState<BabyLogEntry[]>(STORAGE_KEYS.babyLog, NONE, parseBabyLog);
  const now = useNow();
  const [bottle, setBottle] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; undo?: BabyLogEntry[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const save = (next: BabyLogEntry[], text: string) => {
    const before = log;
    const r = setLog(next);
    if (!r.ok) return setError(r.error);
    setError(null);
    setStatus({ text, undo: before });
  };

  const add = (e: BabyLogEntry) => save(addEntry(log, e), `${describe(e, Date.now())} added at ${clock(e.at)}.`);
  const feed = (side: FeedSide, ml: number | null = null) => add({ id: newId(), kind: 'feed', at: Date.now(), side, ml });
  const nappy = (n: NappyKind) => add({ id: newId(), kind: 'nappy', at: Date.now(), nappy: n });
  const asleep = openSleep(log);

  const saveBottle = () => {
    const { value, error: err } = parseNumberInput(bottle ?? '');
    if (err || (value !== null && (!Number.isInteger(value) || value < 1 || value > MAX_BOTTLE_ML))) {
      return setError(`Enter whole millilitres from 1 to ${MAX_BOTTLE_ML}, or leave it empty.`);
    }
    feed('bottle', value);
    setBottle(null);
  };

  const lastFeed = lastOfKind(log, 'feed');
  const day = last24h(log, now);
  const recent = log.filter((e) => e.at >= now - DAY || (e.kind === 'sleep' && e.end === null));

  return (
    <Page title="Baby log" icon="🍼" back={{ to: '/', label: 'Home' }}>
      <section className="card hero" aria-labelledby="log-now">
        <h2 id="log-now" className="hero__ga hero__ga--log">
          {asleep
            ? `Asleep for ${formatDuration((now - asleep.at) / 60_000)}`
            : lastFeed
              ? `Last feed ${formatDuration((now - lastFeed.at) / 60_000)} ago`
              : 'Nothing logged yet'}
        </h2>
        <p className="muted">
          Last 24 hours: {day.feeds} {day.feeds === 1 ? 'feed' : 'feeds'}, {day.nappies} {day.nappies === 1 ? 'nappy' : 'nappies'},{' '}
          {formatDuration(day.sleepMinutes)} sleep
        </p>
      </section>

      <section className="card" aria-labelledby="log-add">
        <h2 id="log-add">Add</h2>

        <h3 className="log-group">Feed</h3>
        <div className="log-buttons">
          <button type="button" className="btn btn--ghost" onClick={() => feed('left')}>
            Left
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => feed('right')}>
            Right
          </button>
          <button type="button" className="btn btn--ghost" aria-expanded={bottle !== null} onClick={() => setBottle(bottle === null ? '' : null)}>
            Bottle
          </button>
        </div>
        {bottle !== null && (
          <div className="inline-inputs log-bottle">
            <label className="field__label" htmlFor="bottle-ml">
              Amount (ml, optional)
            </label>
            <input
              id="bottle-ml"
              className="input input--short"
              inputMode="numeric"
              value={bottle}
              onChange={(e) => setBottle(e.target.value)}
            />
            <button type="button" className="btn btn--primary" onClick={saveBottle}>
              Save bottle
            </button>
          </div>
        )}

        <h3 className="log-group">Nappy</h3>
        <div className="log-buttons">
          {(['wet', 'dirty', 'both'] as const).map((n) => (
            <button key={n} type="button" className="btn btn--ghost" aria-label={NAPPY_LABEL[n]} onClick={() => nappy(n)}>
              {n === 'both' ? 'Both' : NAPPY_LABEL[n]}
            </button>
          ))}
        </div>

        <h3 className="log-group">Sleep</h3>
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

        <div role="status" className="log-status">
          {status && (
            <>
              {status.text}{' '}
              {status.undo && (
                <button
                  type="button"
                  className="text-link log-undo"
                  onClick={() => {
                    const r = setLog(status.undo!);
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

      <section aria-labelledby="log-today">
        <h2 id="log-today">Last 24 hours</h2>
        {recent.length === 0 ? (
          <p className="muted">Entries from the last day show here.</p>
        ) : (
          <ul className="entry-list">
            {recent.map((e) => (
              <li key={e.id} className="card log-entry">
                <span>
                  <span className="log-entry__time">{clock(e.at)}</span> {describe(e, now)}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost"
                  aria-label={`Delete ${describe(e, now)} at ${clock(e.at)}`}
                  onClick={() => save(log.filter((x) => x.id !== e.id), 'Deleted.')}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CallCard title="Help with your baby" lines={[PLUNKETLINE, HEALTHLINE, EMERGENCY]} />
    </Page>
  );
}
