import { lazy, Suspense, useState } from 'react';
import { Link } from '../../app/router';
import { Page } from '../../components/Page';
import { formatDuration, type GrowthEntry } from '../../lib/babyLog';
import { averages, dayTotals, lastDays, toCsv, type DayTotals } from '../../lib/babyLogDays';
import { formatDisplayDate, todayLocal } from '../../lib/dates';
import { download } from '../../lib/download';
import type { PregnancyProfile } from '../../lib/profile';
import { useBabyLog } from './BabyLogPage';
import { dayOfLabel } from './labels';

const TrendsChart = lazy(() => import('./TrendsChart').then((m) => ({ default: m.TrendsChart })));
const MonitorChart = lazy(() => import('../monitoring/MonitorChart').then((m) => ({ default: m.MonitorChart })));

type Metric = 'sleep' | 'feeds' | 'nappies';
const METRICS: { id: Metric; label: string; unit: string; value: (t: DayTotals) => number }[] = [
  { id: 'sleep', label: 'Sleep', unit: 'hours', value: (t) => Math.round((t.sleepMinutes / 60) * 10) / 10 },
  { id: 'feeds', label: 'Feeds', unit: 'feeds', value: (t) => t.feeds },
  { id: 'nappies', label: 'Nappies', unit: 'nappies', value: (t) => t.nappies },
];
const one = (n: number | null, unit: string) => (n === null ? 'nothing logged' : `${Math.round(n * 10) / 10} ${unit}`);

/** Daily totals over the last week or two, growth over time, and the CSV export. Averages only; no targets. */
export function TrendsPage({ profile }: { profile: PregnancyProfile }) {
  const [log] = useBabyLog();
  const [span, setSpan] = useState<7 | 14>(7);
  const [metric, setMetric] = useState<Metric>('sleep');
  const now = Date.now();
  const today = todayLocal();
  const totals = lastDays(today, span).map((d) => dayTotals(log, d, now));
  const avg = averages(totals);
  const m = METRICS.find((x) => x.id === metric)!;
  const growth = log.filter((e): e is GrowthEntry => e.kind === 'growth').reverse();
  const weights = growth.filter((g) => g.weightG !== null).map((g) => ({ t: g.at, weight: (g.weightG ?? 0) / 1000 }));
  if (profile.ending?.kind === 'born' && profile.ending.weightG) weights.unshift({ t: new Date(`${profile.ending.date}T12:00:00`).getTime(), weight: profile.ending.weightG / 1000 });

  return (
    <Page title="Trends" icon="📈" back={{ to: '/baby', label: 'Baby log' }}>
      <div className="chip-group" role="radiogroup" aria-label="How many days">
        {([7, 14] as const).map((n) => (
          <label key={n} className={`chip${span === n ? ' is-selected' : ''}`}>
            <input type="radio" name="span" checked={span === n} onChange={() => setSpan(n)} />
            Last {n} days
          </label>
        ))}
      </div>

      <section className="card" aria-labelledby="tr-avg">
        <h2 id="tr-avg">Daily average</h2>
        {avg.days === 0 ? (
          <p className="muted">Nothing logged in the last {span} days.</p>
        ) : (
          <>
            <dl className="details">
              <dt>Sleep</dt>
              <dd>{avg.sleepMinutes === null ? 'nothing logged' : formatDuration(avg.sleepMinutes)}</dd>
              <dt>Feeds</dt>
              <dd>{one(avg.feeds, 'a day')}</dd>
              <dt>Nappies</dt>
              <dd>{one(avg.nappies, 'a day')}</dd>
            </dl>
            <p className="muted">
              Over the {avg.days} {avg.days === 1 ? 'day' : 'days'} with something logged. Every baby is different; your midwife or Well
              Child nurse can tell you what’s right for yours.
            </p>
          </>
        )}
      </section>

      <section className="card" aria-labelledby="tr-chart">
        <h2 id="tr-chart">Day by day</h2>
        <div className="chip-group" role="radiogroup" aria-label="What to show">
          {METRICS.map((x) => (
            <label key={x.id} className={`chip${metric === x.id ? ' is-selected' : ''}`}>
              <input type="radio" name="metric" checked={metric === x.id} onChange={() => setMetric(x.id)} />
              {x.label}
            </label>
          ))}
        </div>
        <Suspense fallback={<p className="muted">Loading chart...</p>}>
          <TrendsChart rows={totals.map((t) => ({ day: t.day, value: m.value(t) }))} unit={m.unit} />
        </Suspense>
        <table className="data-table">
          <caption className="visually-hidden">{m.label} by day</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Sleep</th>
              <th scope="col">Feeds</th>
              <th scope="col">Nappies</th>
            </tr>
          </thead>
          <tbody>
            {[...totals].reverse().map((t) => (
              <tr key={t.day}>
                <th scope="row">{dayOfLabel(t.day, today, true)}</th>
                <td>{formatDuration(t.sleepMinutes)}</td>
                <td>{t.feeds}</td>
                <td>{t.nappies}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" aria-labelledby="tr-growth">
        <h2 id="tr-growth">Growth</h2>
        {growth.length === 0 ? (
          <p className="muted">
            Add weight, length or head size from the baby log (More, then Growth), for example after a Well Child check.
          </p>
        ) : (
          <>
            {weights.length >= 2 && (
              <Suspense fallback={<p className="muted">Loading chart...</p>}>
                <MonitorChart rows={weights} series={[{ key: 'weight', name: 'Weight', className: 'chart-you' }]} limits={[]} unit="kg" />
              </Suspense>
            )}
            <ul className="plain-list">
              {[...growth].reverse().map((g) => (
                <li key={g.id}>
                  {formatDisplayDate(todayLocal(new Date(g.at)))}:{' '}
                  {[g.weightG !== null && `${(g.weightG / 1000).toFixed(2)} kg`, g.lengthCm !== null && `${g.lengthCm} cm long`, g.headCm !== null && `head ${g.headCm} cm`]
                    .filter(Boolean)
                    .join(', ')}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="muted">Your Well Child Tamariki Ora book has the growth charts your nurse uses.</p>
      </section>

      <section className="card" aria-labelledby="tr-export">
        <h2 id="tr-export">Export</h2>
        <p>Download the whole log as a spreadsheet (CSV). It saves to this device; nothing is sent anywhere.</p>
        <div className="button-row">
          <button type="button" className="btn btn--ghost" disabled={log.length === 0} onClick={() => download(`hey-baby-log-${today}.csv`, toCsv(log), 'text/csv')}>
            Download CSV
          </button>
          <Link to="/more/print" className="btn btn--ghost">
            Print summary
          </Link>
        </div>
      </section>
    </Page>
  );
}
