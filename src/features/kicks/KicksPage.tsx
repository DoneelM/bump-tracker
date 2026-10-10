import { useEffect, useState } from 'react';
import { GuidanceCard } from '../../components/GuidanceCard';
import { Page } from '../../components/Page';
import { WORRIED_ABOUT_MOVEMENTS } from '../../data/guidance';
import type { LocalDate } from '../../lib/dates';
import {
  addMovement,
  endSession,
  formatDuration,
  KICKS_UNLOCK_WEEK,
  MAX_STORED_SESSIONS,
  parseKickSessions,
  sessionGuidanceLevel,
  sessionDurationMs,
  type KickSession,
} from '../../lib/kicks';
import { gestationalAge } from '../../lib/pregnancy';
import type { PregnancyProfile } from '../../lib/profile';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { newId } from '../../lib/validate';

const NO_SESSIONS: KickSession[] = [];
const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const HEALTHNZ_URL =
  'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/having-a-healthy-pregnancy/pregnancy-and-your-babys-movements';
const NHS_URL = 'https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/';

export function KicksPage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const [sessions, setSessions] = useStoredState<KickSession[]>(STORAGE_KEYS.kickSessions, NO_SESSIONS, parseKickSessions);
  const [override, setOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [worried, setWorried] = useState(false);
  const [endedId, setEndedId] = useState<string | null>(null);
  const weeks = gestationalAge(profile.dueDate, today).weeks;
  const unlocked = weeks >= KICKS_UNLOCK_WEEK || override;
  const current = sessions.find((s) => s.end === undefined);
  const past = sessions.filter((s) => s.end !== undefined).reverse();
  const currentId = current?.id;
  // Guidance for the session just ended; a new session replaces it.
  const ended = current ? undefined : past.find((s) => s.id === endedId);

  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!currentId) return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [currentId]);

  const save = (fn: (prev: KickSession[]) => KickSession[]) => {
    const r = setSessions(fn);
    setError(r.ok ? null : r.error);
  };

  const start = () =>
    save((prev) =>
      [...prev.filter((s) => s.end !== undefined), { id: newId(), start: Date.now(), count: 0, events: [] }].slice(-MAX_STORED_SESSIONS),
    );

  function tap() {
    navigator.vibrate?.(30);
    save((prev) => prev.map((s) => (s.id === currentId ? addMovement(s, Date.now()) : s)));
  }

  return (
    <Page title="Kicks" icon="👣" back={{ to: '/tools', label: 'Tools' }}>
      <div className="card card--warning" role="note">
        <p>
          <strong>
            Get to know your baby’s usual pattern of movements. If you think your baby’s movements have slowed down,
            stopped or changed, contact your midwife/LMC or birthing centre or hospital straight away - day or night. Do not
            wait until the next day. The NHS says there’s no set number of movements to count, and not to use a home
            heartbeat monitor to check on your baby.
          </strong>
        </p>
        <p>
          <a href={HEALTHNZ_URL} target="_blank" rel="noopener noreferrer">
            Health NZ: Pregnancy and your baby’s movements
          </a>
          {' · '}
          <a href={NHS_URL} target="_blank" rel="noopener noreferrer">
            NHS: Your baby’s movements
          </a>
        </p>
        <p>This counter is a personal log only. It is not a safety tool and can’t tell you whether your baby is well.</p>
      </div>

      <div className="button-row">
        <button type="button" className="btn btn--ghost" aria-expanded={worried} onClick={() => setWorried(!worried)}>
          I’m worried about my baby’s movements
        </button>
      </div>
      {worried && <GuidanceCard g={WORRIED_ABOUT_MOVEMENTS} />}

      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}

      {!unlocked ? (
        <section className="card">
          <h2>Unlocks at {KICKS_UNLOCK_WEEK} weeks</h2>
          <p>
            The movement log is available from {KICKS_UNLOCK_WEEK} weeks. You can still get to know your baby’s movements
            before then, and you should contact your midwife/LMC if you’re worried about them.
          </p>
          <div className="button-row">
            <button type="button" className="btn btn--ghost" onClick={() => setOverride(true)}>
              Use anyway
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="timer-panel" aria-label="Movement counter">
            {current ? (
              <>
                <button type="button" className="big-button" onClick={tap}>
                  Movement
                </button>
                <p className="timer-readout">
                  <strong>{current.count}</strong> {current.count === 1 ? 'movement' : 'movements'} in{' '}
                  {formatDuration(sessionDurationMs(current, now))}
                </p>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    save((prev) => prev.map((s) => (s.id === current.id ? endSession(s, Date.now()) : s)));
                    setEndedId(current.id);
                  }}
                >
                  End session
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--primary" onClick={start}>
                Start session
              </button>
            )}
          </section>

          {ended && <GuidanceCard g={WORRIED_ABOUT_MOVEMENTS} alert={sessionGuidanceLevel(ended.count) === 'alert'} />}

          <section aria-labelledby="k-history">
            <h2 id="k-history">Past sessions</h2>
            {past.length === 0 ? (
              <p className="muted">No sessions yet.</p>
            ) : (
              <ul className="entry-list">
                {past.map((s) => (
                  <li key={s.id} className="card entry">
                    <p className="entry__title">{dateFmt.format(s.start)}</p>
                    <p className="muted">
                      {s.count} {s.count === 1 ? 'movement' : 'movements'} in {formatDuration(sessionDurationMs(s, s.start))}
                    </p>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => {
                        if (window.confirm('Delete this session?')) save((prev) => prev.filter((x) => x.id !== s.id));
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Page>
  );
}
