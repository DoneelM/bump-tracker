import type { MouseEvent } from 'react';
import { CallCard } from '../../components/CallCard';
import { Page } from '../../components/Page';
import {
  CHOKING,
  CHOKING_SOURCE_ID,
  CPR,
  CPR_SOURCE_ID,
  CPR_VIDEO_URL,
  FIRST_AID_COURSES_URL,
  SICK_SOURCE_ID,
  UNDER_3_MONTHS,
  WHEN_TO_GET_HELP,
} from '../../data/babyHelp';
import { EMERGENCY, HEALTHLINE, PLUNKETLINE } from '../../data/helplines';
import { SOURCES } from '../../data/sources';
import { RecoveryCard, SupportForYou } from '../support/ParentCards';

function Source({ id }: { id: string }) {
  const s = SOURCES.find((x) => x.id === id);
  if (!s) return null;
  return (
    <p className="muted">
      Source:{' '}
      <a href={s.url} target="_blank" rel="noopener noreferrer">
        {s.publisher}: {s.title}
      </a>
    </p>
  );
}

const Steps = ({ items }: { items: readonly string[] }) => (
  <ol className="aid-steps">
    {items.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </ol>
);

/**
 * Baby-mode Help tab: emergency first aid first (works offline, word for word from Health NZ and
 * Hato Hone St John), then when to get help, then who to call.
 */
export function HelpPage() {
  return (
    <Page title="Help" icon="🆘">
      <section className="aid-top" aria-label="Emergency">
        <a className="btn btn--danger aid-call" href={EMERGENCY.tel}>
          Call 111
        </a>
        <div className="aid-jump">
          <a className="btn btn--ghost" href="#aid-cpr" onClick={(e) => jump(e, 'aid-cpr')}>
            Not breathing
          </a>
          <a className="btn btn--ghost" href="#aid-choking" onClick={(e) => jump(e, 'aid-choking')}>
            Choking
          </a>
        </div>
      </section>

      <section id="aid-cpr" className="card aid-card" aria-labelledby="aid-cpr-h" tabIndex={-1}>
        <h2 id="aid-cpr-h">Baby not breathing</h2>
        <p>{CPR.intro}</p>
        <Steps items={CPR.quick} />
        <p className="aid-note">{CPR.quickNote}</p>
        <h3>30 pushes</h3>
        <Steps items={CPR.pushes} />
        <h3>Then 2 breaths</h3>
        <Steps items={CPR.breaths} />
        <p className="aid-then">{CPR.then}</p>
        <p>{CPR.alone}</p>
        <Source id={CPR_SOURCE_ID} />
      </section>

      <section id="aid-choking" className="card aid-card" aria-labelledby="aid-choking-h" tabIndex={-1}>
        <h2 id="aid-choking-h">Baby choking</h2>
        <p>{CHOKING.callFirst}</p>
        <p className="aid-note">{CHOKING.never}</p>
        <h3>5 back blows</h3>
        <Steps items={CHOKING.backBlows} />
        <h3>Then 5 chest thrusts</h3>
        <Steps items={CHOKING.chestThrusts} />
        <p className="aid-then">{CHOKING.then}</p>
        <Source id={CHOKING_SOURCE_ID} />
      </section>

      <p className="muted">
        These steps don’t replace a first aid course.{' '}
        <a href={CPR_VIDEO_URL} target="_blank" rel="noopener noreferrer">
          Watch the St John baby video
        </a>{' '}
        or{' '}
        <a href={FIRST_AID_COURSES_URL} target="_blank" rel="noopener noreferrer">
          find a course
        </a>
        .
      </p>

      <section className="card" aria-labelledby="aid-when">
        <h2 id="aid-when">When to get help</h2>
        {WHEN_TO_GET_HELP.map((g) => (
          <div key={g.title} className="aid-when">
            <h3>{g.title}:</h3>
            <ul className="bullets">
              {g.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
        <p className="aid-note">{UNDER_3_MONTHS}</p>
        <Source id={SICK_SOURCE_ID} />
      </section>

      <CallCard title="Who to call" lines={[PLUNKETLINE, HEALTHLINE, EMERGENCY]} />

      <RecoveryCard />
      <SupportForYou />
    </Page>
  );
}

/** In-page jump that doesn't change the hash (hash changes are routes here) and moves focus. */
function jump(e: MouseEvent, id: string) {
  e.preventDefault();
  const el = document.getElementById(id);
  el?.scrollIntoView({ block: 'start' });
  el?.focus({ preventScroll: true });
}
