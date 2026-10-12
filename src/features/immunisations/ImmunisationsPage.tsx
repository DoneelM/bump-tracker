import { Link } from '../../app/router';
import { Page } from '../../components/Page';
import { SourceNote } from '../../components/SourceNote';
import {
  FLU_LINE,
  FREE_LINE,
  IMMUNISATION_SOURCE_ID,
  MISSED_LINE,
  PERSONALISED_SCHEDULE_URL,
  PREMATURE_LINE,
  VISITS,
} from '../../data/immunisations';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import { download } from '../../lib/download';
import { buildCalendar } from '../../lib/ics';
import { dueDate, nextVisit, parseImmunisationsDone, type ImmunisationsDone } from '../../lib/immunisations';
import type { PregnancyProfile } from '../../lib/profile';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';

const NONE: ImmunisationsDone = {};

export function useImmunisationsDone() {
  return useStoredState<ImmunisationsDone>(STORAGE_KEYS.immunisations, NONE, parseImmunisationsDone);
}

/** The baby's immunisation visits with due dates from the birth date, a done tick, and a calendar file. */
export function ImmunisationsPage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const [done, setDone] = useImmunisationsDone();

  if (profile.ending?.kind !== 'born') {
    return (
      <Page title="Immunisations" icon="💉" back={{ to: '/', label: 'Home' }}>
        <p className="lead">Due dates show once your baby is here.</p>
        <Link to="/settings" className="text-link">
          Add the birth in Settings
        </Link>
      </Page>
    );
  }

  const born = profile.ending.date;
  const next = nextVisit(VISITS, born, done);

  const toggle = (id: string) =>
    setDone((prev) => {
      const { [id]: was, ...rest } = prev;
      return was ? rest : { ...prev, [id]: today };
    });

  const addToCalendar = () => {
    const events = VISITS.filter((v) => !done[v.id]).map((v) => ({
      uid: `immunisation-${v.id}-${born}@bump-tracker`,
      date: dueDate(born, v),
      title: `${v.label} immunisations due`,
      description: `${v.vaccines.join('; ')}. Book with your doctor or nurse. Dates may vary.`,
    }));
    download('bump-tracker-immunisations.ics', buildCalendar(events), 'text/calendar');
  };

  return (
    <Page title="Immunisations" icon="💉" back={{ to: '/', label: 'Home' }}>
      {next && (
        <section className="card hero" aria-labelledby="imm-next">
          <h2 id="imm-next" className="hero__ga hero__ga--log">
            Next: {next.visit.label}
          </h2>
          <p className="hero__tri">
            {next.due < today ? 'Was due' : 'Due'} {formatDisplayDate(next.due)}
          </p>
          <p className="muted">{FREE_LINE}</p>
        </section>
      )}

      <div className="button-row">
        <button type="button" className="btn btn--ghost" onClick={addToCalendar} disabled={!next}>
          Add due dates to my calendar
        </button>
        <a className="btn btn--ghost" href={PERSONALISED_SCHEDULE_URL} target="_blank" rel="noopener noreferrer">
          Health NZ schedule tool
        </a>
      </div>

      <ul className="entry-list">
        {VISITS.map((v) => {
          const d = done[v.id];
          return (
            <li key={v.id} className={`card imm-visit${d ? ' imm-visit--done' : ''}`}>
              <div className="imm-visit__head">
                <h2 className="imm-visit__title">{v.label}</h2>
                <span className="muted">{formatDisplayDate(dueDate(born, v))}</span>
              </div>
              <ul className="bullets">
                {v.vaccines.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <label className="question__check imm-visit__check">
                <input type="checkbox" checked={!!d} onChange={() => toggle(v.id)} />
                <span>{d ? `Done ${formatDisplayDate(d)}` : 'Mark as done'}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <section className="card card--soft" aria-labelledby="imm-more">
        <h2 id="imm-more">Good to know</h2>
        <p>{FLU_LINE}</p>
        <p>{PREMATURE_LINE}</p>
        <p>{MISSED_LINE}</p>
        <p>Dates may vary with earlier doses or health reasons. Your doctor, nurse or Well Child provider can confirm.</p>
        <SourceNote id={IMMUNISATION_SOURCE_ID} />
      </section>
    </Page>
  );
}
