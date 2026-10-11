import { useState } from 'react';
import { Link } from '../../app/router';
import { Page } from '../../components/Page';
import { FIRST_GUIDE_WEEK, getWeekInfo, LAST_GUIDE_WEEK } from '../../data/weeks';
import type { PregnancyEnding } from '../../lib/profile';

const WEEK_NUMBERS = Array.from({ length: LAST_GUIDE_WEEK - FIRST_GUIDE_WEEK + 1 }, (_, i) => FIRST_GUIDE_WEEK + i);

export function WeeksPage({ currentWeek, ending }: { currentWeek: number; ending?: PregnancyEnding['kind'] }) {
  // After a loss the guides stay available, but only when asked for: no baby sizes by default.
  const [showAfterLoss, setShowAfterLoss] = useState(false);

  if (ending === 'ended' && !showAfterLoss) {
    return (
      <Page title="Week by week" icon="📅">
        <section className="card">
          <p>Pregnancy updates are turned off.</p>
          <p className="muted">The week-by-week guides are still here if you want to look back at them.</p>
          <div className="button-row">
            <button type="button" className="btn btn--ghost" onClick={() => setShowAfterLoss(true)}>
              Show the week guides
            </button>
          </div>
        </section>
      </Page>
    );
  }

  // Once the pregnancy has ended there is no "this week".
  const current = ending ? null : currentWeek;
  return (
    <Page title="Week by week" icon="📅">
      <p className="lead">
        {ending ? 'Tap a week to look back at its guide.' : 'Tap a week to see what’s happening with you and baby.'}
      </p>
      <ol className="week-grid">
        {WEEK_NUMBERS.map((w) => {
          const isCurrent = w === current;
          return (
            <li key={w}>
              <Link
                to={`/weeks/${w}`}
                className={`week-grid__item${isCurrent ? ' is-current' : ''}${getWeekInfo(w) ? '' : ' is-empty'}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className="week-grid__num">{w}</span>
                <span className="visually-hidden">Week {w}{isCurrent ? ' (this week)' : ''}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Page>
  );
}
