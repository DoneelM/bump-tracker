import type { Guidance } from '../data/guidance';
import { SOURCES } from '../data/sources';

/** A guidance block from `data/guidance.ts` with its "Source:" line. `alert` makes it the prominent, announced style. */
export function GuidanceCard({ g, alert = false, as: H = 'h2' }: { g: Guidance; alert?: boolean; as?: 'h2' | 'h3' }) {
  const sources = g.sources.map((id) => SOURCES.find((s) => s.id === id)).filter((s) => s !== undefined);
  return (
    <section className={alert ? 'alert-banner' : 'card card--warning'} role={alert ? 'alert' : undefined} aria-label={g.title}>
      <H className={alert ? 'alert-banner__title' : undefined}>{g.title}</H>
      {g.intro && <p>{g.intro}</p>}
      {g.bullets && (
        <ul className="bullets">
          {g.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
      {g.body && <p>{g.body}</p>}
      {g.closing && <p>{g.closing}</p>}
      <p className="muted">
        Source:{' '}
        {sources.map((s, i) => (
          <span key={s.id}>
            {i > 0 && ', '}
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.publisher}: {s.title}
            </a>
          </span>
        ))}
      </p>
    </section>
  );
}
