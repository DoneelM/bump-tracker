import { Link } from '../../app/router';
import { last24h } from '../../lib/babyLog';
import { useBabyLog, useNow } from './BabyLogPage';
import { hasRunning, statusLine } from './labels';

/** Baby log at a glance on Home: what's happening now and the last day's counts. */
export function BabyLogCard() {
  const [log] = useBabyLog();
  const now = useNow(hasRunning(log));
  const day = last24h(log, now);
  return (
    <section className="card" aria-labelledby="home-log-h">
      <h2 id="home-log-h">{statusLine(log, now)}</h2>
      <p className="muted">
        Last 24 hours: {day.feeds} {day.feeds === 1 ? 'feed' : 'feeds'}, {day.nappies} {day.nappies === 1 ? 'nappy' : 'nappies'}
      </p>
      <div className="button-row">
        <Link to="/baby" className="btn btn--primary">
          {hasRunning(log) ? 'Open the timer' : 'Log a feed, nappy or sleep'}
        </Link>
      </div>
    </section>
  );
}
