import { useEffect, useState } from 'react';
import { GuidanceCard } from '../../components/GuidanceCard';
import { Page } from '../../components/Page';
import { CONTACT_MIDWIFE, PATTERN_511, PRETERM } from '../../data/guidance';
import type { LocalDate } from '../../lib/dates';
import { gestationalAge } from '../../lib/pregnancy';
import type { PregnancyProfile } from '../../lib/profile';
import {
  averagesLastHour,
  detect511,
  durationMs,
  EMPTY_STATE,
  formatMmSs,
  formatSinceLast,
  intervalsMs,
  isSessionLive,
  isValidContraction,
  MAX_CONTRACTION_MS,
  MAX_STORED_CONTRACTIONS,
  parseContractionState,
  showPretermGuidance,
  validSorted,
  type ContractionState,
} from '../../lib/contractions';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });

const HISTORY_LIMIT = 20;

/** Current time, refreshed every second while `on`; otherwise read at render. */
function useNow(on: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (!on) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [on]);
  return on ? now : Date.now();
}

/** Keeps the screen on while `on`, if the browser supports it; fails silently otherwise. */
function useWakeLock(on: boolean): boolean {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        const l = await navigator.wakeLock.request('screen');
        if (cancelled) {
          l.release().catch(() => {});
          return;
        }
        lock = l;
        setHeld(true);
        l.addEventListener('release', () => setHeld(false));
      } catch {
        setHeld(false);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!lock || lock.released)) void acquire();
    };
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
      setHeld(false);
    };
  }, [on]);
  return held;
}

export function ContractionsPage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const weeks = gestationalAge(profile.dueDate, today).weeks;
  const [state, setState] = useStoredState<ContractionState>(STORAGE_KEYS.contractions, EMPTY_STATE, parseContractionState);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const active = state.activeStart !== null;
  // The 1 s timer and wake lock run while a session is live; the tick re-renders and switches them off after the gap.
  const live = isSessionLive(state, Date.now());
  const now = useNow(live);
  const wakeLockHeld = useWakeLock(live);

  const update = (next: ContractionState | ((prev: ContractionState) => ContractionState)) => {
    const r = setState(next);
    setSaveError(r.ok ? null : r.error);
  };

  function toggle() {
    const t = Date.now();
    if (state.activeStart === null) return update({ ...state, activeStart: t });
    const c = { start: state.activeStart, end: t };
    // Over-long or zero-length presses are discarded rather than stored.
    const contractions = isValidContraction(c) ? [...state.contractions, c].slice(-MAX_STORED_CONTRACTIONS) : state.contractions;
    update({ contractions, activeStart: null });
  }

  const sorted = validSorted(state.contractions);
  const intervals = intervalsMs(state.contractions);
  const rows = sorted.map((c, i) => ({ c, interval: intervals[i] ?? null })).reverse();
  const last = sorted[sorted.length - 1];
  const avgs = averagesLastHour(state.contractions, now);
  const pattern = detect511(state.contractions, state.activeStart ?? now);
  const elapsed = state.activeStart !== null ? now - state.activeStart : 0;
  const stale = active && elapsed > MAX_CONTRACTION_MS;
  const sinceLast = last ? now - (active ? last.start : last.end) : null;
  const preterm = showPretermGuidance(weeks, state);

  return (
    <Page title="Contractions" icon="⏱️" back={{ to: '/tools', label: 'Tools' }}>
      {saveError && (
        <p className="field__error" role="alert">
          {saveError}
        </p>
      )}

      <section className="timer-panel" aria-label="Contraction timer">
        <button type="button" className={`big-button${active ? ' big-button--active' : ''}`} aria-pressed={active} onClick={toggle}>
          {active ? 'Stop' : 'Start contraction'}
        </button>
        {(pattern || preterm) && (
          // Short line right under Start/Stop so it's seen without scrolling; the full guidance is below.
          <p className="alert-banner" style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 800 }}>
            {preterm ? 'Contact your midwife/LMC now.' : 'Time to call your midwife/LMC.'} Details below.
          </p>
        )}
        <p className="timer-readout">
          {active ? (
            <>
              Contraction: <strong>{formatMmSs(elapsed)}</strong>
            </>
          ) : (
            'Ready'
          )}
        </p>
        {stale && <p className="muted">This has run over 10 minutes and won’t be saved if you stop it. Tap Stop to reset.</p>}
        {sinceLast !== null && (
          <p className="muted">
            {active ? 'Since the last one started' : 'Since the last one ended'}: {formatSinceLast(sinceLast, live)}
          </p>
        )}
        {wakeLockHeld && <p className="muted">Screen will stay on</p>}
      </section>

      {pattern && <GuidanceCard g={PATTERN_511} alert />}
      {preterm && <GuidanceCard g={PRETERM} alert />}
      <GuidanceCard g={CONTACT_MIDWIFE} />

      <section className="card" aria-labelledby="c-summary">
        <h2 id="c-summary">Last hour</h2>
        {avgs.count === 0 ? (
          <p className="muted">No contractions in the last hour.</p>
        ) : (
          <dl className="details">
            <dt>Contractions</dt>
            <dd>{avgs.count}</dd>
            <dt>Average length</dt>
            <dd>{formatMmSs(avgs.avgDurationMs)}</dd>
            <dt>Average time between</dt>
            <dd>{avgs.avgIntervalMs === null ? '-' : formatMmSs(avgs.avgIntervalMs)}</dd>
          </dl>
        )}
      </section>

      <section aria-labelledby="c-history">
        <h2 id="c-history">History</h2>
        {rows.length === 0 ? (
          <p className="muted">No contractions timed yet.</p>
        ) : (
          <>
            <ul className="entry-list">
              {(showAll ? rows : rows.slice(0, HISTORY_LIMIT)).map(({ c, interval }) => (
                <li key={c.start} className="card entry">
                  <p className="entry__title">{timeFmt.format(c.start)}</p>
                  <p className="muted">
                    Length {formatMmSs(durationMs(c))} · Since previous start {interval === null ? '-' : formatMmSs(interval)}
                  </p>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => update((prev) => ({ ...prev, contractions: prev.contractions.filter((x) => x.start !== c.start) }))}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            <div className="button-row">
              {rows.length > HISTORY_LIMIT && (
                <button type="button" className="btn btn--ghost" onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show recent only' : `Show all (${rows.length})`}
                </button>
              )}
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  if (window.confirm('Clear all timed contractions for this session?')) update(EMPTY_STATE);
                }}
              >
                Clear session
              </button>
            </div>
          </>
        )}
      </section>
    </Page>
  );
}
