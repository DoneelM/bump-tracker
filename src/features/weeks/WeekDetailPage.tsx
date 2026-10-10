import { Link } from '../../app/router';
import { Page } from '../../components/Page';
import { FIRST_GUIDE_WEEK, getWeekInfo, LAST_GUIDE_WEEK } from '../../data/weeks';

export function WeekDetailPage({ week }: { week: number }) {
  const info = getWeekInfo(week);
  const back = { to: '/weeks', label: 'All weeks' };

  return (
    <Page title={`Week ${week}`} icon={info?.sizeEmoji ?? '📖'} back={back}>
      {info ? (
        <>
          <section className="card">
            <h2>Size</h2>
            <p>About the size of {info.sizeObject}.</p>
            <dl className="details">
              <dt>Length ({info.lengthNote})</dt>
              <dd>{info.lengthCm !== null ? `${info.lengthCm} cm` : 'Not available yet'}</dd>
              <dt>Weight</dt>
              <dd>{info.weightG !== null ? `${info.weightG} g` : 'Not available yet'}</dd>
            </dl>
          </section>
          <section className="card">
            <h2>Baby’s development</h2>
            <ul className="bullets">
              {info.developing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="card">
            <h2>For you</h2>
            <ul className="bullets">
              {info.mother.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <section className="card card--soft">
          <p>The guide for week {week} hasn’t been written yet.</p>
          <p className="coming-soon">
            <span aria-hidden="true">🌱</span> Coming soon
          </p>
        </section>
      )}
      <nav className="pager" aria-label="Other weeks">
        {week > FIRST_GUIDE_WEEK ? (
          <Link to={`/weeks/${week - 1}`} className="btn btn--ghost">
            ‹ Week {week - 1}
          </Link>
        ) : (
          <span />
        )}
        {week < LAST_GUIDE_WEEK && (
          <Link to={`/weeks/${week + 1}`} className="btn btn--ghost">
            Week {week + 1} ›
          </Link>
        )}
      </nav>
    </Page>
  );
}
