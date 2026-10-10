import { Link } from '../../app/router';
import { Page } from '../../components/Page';
import { FIRST_GUIDE_WEEK, getWeekInfo, LAST_GUIDE_WEEK } from '../../data/weeks';

const WEEK_NUMBERS = Array.from({ length: LAST_GUIDE_WEEK - FIRST_GUIDE_WEEK + 1 }, (_, i) => FIRST_GUIDE_WEEK + i);

export function WeeksPage({ currentWeek }: { currentWeek: number }) {
  return (
    <Page title="Week by week" icon="📅">
      <p className="lead">Tap a week to see what’s happening with you and baby.</p>
      <ol className="week-grid">
        {WEEK_NUMBERS.map((w) => {
          const isCurrent = w === currentWeek;
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
