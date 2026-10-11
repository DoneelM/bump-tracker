import { CallCard } from '../../components/CallCard';
import { LIFELINE, NEED_TO_TALK, PADA, PLUNKETLINE, SAMARITANS } from '../../data/helplines';
import {
  NOT_ALONE,
  PADA_SOURCE_ID,
  RECOVERY_ACTION,
  RECOVERY_INTRO,
  RECOVERY_SIGNS,
  RECOVERY_SOURCE_ID,
  SAFE_SLEEP_ABC,
  SAFE_SLEEP_SOURCE_ID,
  SAFE_SLEEP_TIPS,
  TALK_TO,
} from '../../data/parentSupport';
import { SOURCES } from '../../data/sources';
import { answer, FEELING_LABEL, FEELINGS, parseCheckIns, recentCheckIn, type CheckIn } from '../../lib/checkins';
import type { LocalDate } from '../../lib/dates';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';

const NONE: CheckIn[] = [];

function Source({ id }: { id: string }) {
  const s = SOURCES.find((x) => x.id === id);
  return s ? (
    <p className="muted">
      Source:{' '}
      <a href={s.url} target="_blank" rel="noopener noreferrer">
        {s.publisher}: {s.title}
      </a>
    </p>
  ) : null;
}

/** Lines for the parent's own wellbeing, from PADA's "Get help now". */
export function SupportForYou({ as: H = 'h2' }: { as?: 'h2' | 'h3' }) {
  return (
    <>
      <CallCard title="Support for you" as={H} lines={[NEED_TO_TALK, LIFELINE, SAMARITANS, PLUNKETLINE, PADA]} />
      <section className="card card--soft" aria-labelledby={`talk-to-${H}`}>
        <H id={`talk-to-${H}`}>Rather talk to someone who knows you?</H>
        <ul className="bullets">
          {TALK_TO.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <Source id={PADA_SOURCE_ID} />
      </section>
    </>
  );
}

/** Weekly "How are you going?": no scoring. "Struggling" brings the support lines up straight away. */
export function CheckInCard({ today }: { today: LocalDate }) {
  const [list, setList] = useStoredState<CheckIn[]>(STORAGE_KEYS.checkIns, NONE, parseCheckIns);
  const recent = recentCheckIn(list, today);

  return (
    <section className="card checkin" aria-labelledby="checkin-h">
      <h2 id="checkin-h">How are you going?</h2>
      {recent ? (
        <p>
          You said: <strong>{FEELING_LABEL[recent.feeling]}</strong>. Thanks for checking in. We’ll ask again next week.
        </p>
      ) : (
        <p className="muted">A quick check-in for you, once a week. Nothing is scored or shared.</p>
      )}
      <div className="checkin__options" role="group" aria-label="How are you going?">
        {FEELINGS.map((f) => (
          <button
            key={f}
            type="button"
            className={`btn ${recent?.feeling === f ? 'btn--primary' : 'btn--ghost'}`}
            aria-pressed={recent?.feeling === f}
            onClick={() => setList((prev) => answer(prev, today, f))}
          >
            {FEELING_LABEL[f]}
          </button>
        ))}
      </div>
      {recent && recent.feeling !== 'good' && (
        <div className="checkin__support" role="status">
          <p>
            <strong>{NOT_ALONE.charAt(0).toUpperCase() + NOT_ALONE.slice(1)}</strong>
          </p>
          <SupportForYou as="h3" />
        </div>
      )}
    </section>
  );
}

export function SafeSleepCard() {
  return (
    <section className="card card--soft" aria-labelledby="safe-sleep-h">
      <h2 id="safe-sleep-h">Safe sleep</h2>
      <ul className="safe-abc" aria-label="The A.B.C. for safe sleep">
        {SAFE_SLEEP_ABC.map((x) => (
          <li key={x.letter}>
            <span className="safe-abc__letter" aria-hidden="true">
              {x.letter}
            </span>
            <span>
              <span className="visually-hidden">{x.letter}: </span>
              {x.text}
            </span>
          </li>
        ))}
      </ul>
      <ul className="bullets">
        {SAFE_SLEEP_TIPS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <Source id={SAFE_SLEEP_SOURCE_ID} />
    </section>
  );
}

/** The parent's own warning signs after the birth (Healthify), for the Help tab. */
export function RecoveryCard() {
  return (
    <section className="card" aria-labelledby="recovery-h">
      <h2 id="recovery-h">After the birth: your health</h2>
      <p>{RECOVERY_INTRO}</p>
      <p>Things to look out for are:</p>
      <ul className="bullets">
        {RECOVERY_SIGNS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <p className="aid-note">{RECOVERY_ACTION}</p>
      <Source id={RECOVERY_SOURCE_ID} />
    </section>
  );
}
