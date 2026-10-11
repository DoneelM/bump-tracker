import { Link } from '../app/router';
import { EMERGENCY, HEALTHLINE, type Helpline } from '../data/helplines';
import { CARE_ROLE_LABEL, CARE_ROLES, parseCareTeam, telHref, type CareTeam } from '../lib/careTeam';
import { STORAGE_KEYS } from '../lib/storage';
import { useStoredState } from '../lib/useStoredState';

const NO_TEAM: CareTeam = {};

export function useCareTeam() {
  return useStoredState<CareTeam>(STORAGE_KEYS.careTeam, NO_TEAM, parseCareTeam);
}

/**
 * One-tap calling: the user's own care team first, then fixed NZ lines. With no care team saved,
 * links to Settings to add one.
 */
export function CallCard({
  title = 'Need help?',
  lines = [HEALTHLINE, EMERGENCY],
  as: H = 'h2',
}: {
  title?: string;
  lines?: readonly Helpline[];
  as?: 'h2' | 'h3';
}) {
  const [team] = useCareTeam();
  const saved = CARE_ROLES.filter((r) => team[r]);
  return (
    <section className="card call-card" aria-label={title}>
      <H>{title}</H>
      <ul className="call-list">
        {saved.map((role) => {
          const c = team[role]!;
          return (
            <li key={role} className="call-list__item">
              <span>
                <span className="call-list__name">{CARE_ROLE_LABEL[role]}</span>
                {c.name && <span className="muted"> {c.name}</span>}
              </span>
              <a className="btn btn--primary" href={telHref(c.phone)}>
                Call {c.phone}
              </a>
            </li>
          );
        })}
        {lines.map((l) => (
          <li key={l.id} className="call-list__item">
            <span>
              <span className="call-list__name">{l.name}</span>
              <span className="muted"> {l.what}</span>
            </span>
            <span className="call-list__actions">
              {l.tel && (
                <a className={`btn ${l.id === '111' ? 'btn--danger' : 'btn--ghost'}`} href={l.tel}>
                  Call {l.number}
                </a>
              )}
              {l.sms && (
                <a className="btn btn--ghost" href={l.sms}>
                  Text {l.number}
                </a>
              )}
              {l.url && (
                <a className="btn btn--ghost" href={l.url} target="_blank" rel="noopener noreferrer">
                  Website
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
      {saved.length === 0 && (
        <Link to="/settings" className="text-link">
          Add your midwife’s number for one-tap calling
        </Link>
      )}
    </section>
  );
}

/** Compact Home row: call the midwife if saved, and a link to the full "When to call" page. */
export function HelpRow() {
  const [team] = useCareTeam();
  const lmc = team.lmc;
  return (
    <section className="card help-row" aria-label="Need help?">
      <p>
        <strong>Worried?</strong> Call your midwife/LMC. In an emergency, call 111.
      </p>
      <div className="button-row">
        {lmc && (
          <a className="btn btn--primary" href={telHref(lmc.phone)}>
            Call {lmc.name || 'midwife'}
          </a>
        )}
        <Link to="/more/warning-signs" className="btn btn--ghost">
          When to call
        </Link>
      </div>
    </section>
  );
}
