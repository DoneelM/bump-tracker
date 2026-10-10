import { Link } from '../../app/router';
import { Page } from '../../components/Page';
import { SizeComparison } from '../../components/SizeComparison';
import { FIRST_GUIDE_WEEK, getWeekInfo, LAST_GUIDE_WEEK } from '../../data/weeks';
import { TRIMESTER_LABEL, trimester } from '../../lib/pregnancy';

const MEASURE_NOTE = {
  'crown-rump': 'Crown–rump: measured from the top of the head to the bottom, as the legs are curled up.',
  'crown-heel': 'Head to heel: measured from the top of the head to the heel, with legs straightened.',
} as const;

function formatWeight(g: number | null): string {
  if (g === null) return 'Too small to weigh meaningfully - length is the usual measure';
  return g >= 1000 ? `about ${(g / 1000).toFixed(1)} kg` : `about ${g} g`;
}

export function WeekDetailPage({ week }: { week: number }) {
  const info = getWeekInfo(week);
  const back = { to: '/weeks', label: 'All weeks' };

  return (
    <Page title={`Week ${week}`} icon={info?.sizeEmoji ?? '📖'} back={back}>
      {info ? (
        <>
          <p className="lead">{TRIMESTER_LABEL[trimester(week * 7)]}</p>
          <section className="card" aria-labelledby="size-heading">
            <h2 id="size-heading">Size comparison</h2>
            <SizeComparison info={info} size={200} />
            <dl className="details">
              <dt>Typical length</dt>
              <dd>{info.lengthCm} cm</dd>
              <dt>Typical weight</dt>
              <dd>{formatWeight(info.weightG)}</dd>
            </dl>
            <p className="muted">{MEASURE_NOTE[info.lengthNote]}</p>
            <p className="muted">Every baby grows at their own pace - these are typical averages, not targets.</p>
          </section>
          <section className="card">
            <h2>What’s developing</h2>
            <ul className="bullets">
              {info.developing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="card">
            <h2>What you might notice</h2>
            <ul className="bullets">
              {info.mother.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <p className="muted">
            Source:{' '}
            <a href={info.sourceUrl} target="_blank" rel="noopener noreferrer">
              NHS week-by-week guide, week {week}
            </a>{' '}
            (paraphrased). Size data: WHO fetal growth charts. See <Link to="/more/sources">Sources</Link>.
          </p>
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
