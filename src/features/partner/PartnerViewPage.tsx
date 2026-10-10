import { useSyncExternalStore } from 'react';
import { Link } from '../../app/router';
import { Page } from '../../components/Page';
import { SizeComparison } from '../../components/SizeComparison';
import { getWeekInfo } from '../../data/weeks';
import { formatDisplayDate } from '../../lib/dates';
import { payloadFromHash } from '../../lib/partner';
import { formatWeeksDays, TRIMESTER_LABEL, trimester } from '../../lib/pregnancy';
import { scanTypeLabel } from '../../lib/scans';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** Read-only view of a shared snapshot. Decodes and validates the URL; never touches storage. */
export function PartnerViewPage() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  const p = payloadFromHash(hash);

  if (!p) {
    return (
      <Page title="Partner view" icon="💞" health={false}>
        <section className="card card--warning" role="alert">
          <p>This link isn’t valid, or it was cut short when it was shared. Ask for a fresh link.</p>
        </section>
        <Link to="/" className="text-link">
          Open Bump Tracker
        </Link>
      </Page>
    );
  }

  const info = p.size === undefined ? undefined : getWeekInfo(p.size);
  return (
    <Page title="Pregnancy update" icon="💞">
      <p className="card card--soft" role="note">
        Read-only snapshot created on {formatDisplayDate(p.created)} - it won’t update.
      </p>

      {(p.due || p.ga) && (
        <section className="card" aria-label="Due date and week">
          {p.ga && (
            <>
              <p className="hero__eyebrow">{TRIMESTER_LABEL[trimester(p.ga.w * 7 + p.ga.d)]}</p>
              <p className="hero__ga">{formatWeeksDays(p.ga.w, p.ga.d)}</p>
            </>
          )}
          {p.due && <p>Due date: {formatDisplayDate(p.due)}</p>}
        </section>
      )}
      {info && (
        <section className="card week-card" aria-label="Baby’s size">
          <SizeComparison info={info} size={96} />
          <span>
            <span className="week-card__title">About the size of {info.sizeObject}</span>
            <span className="week-card__desc">at week {info.week}</span>
          </span>
        </section>
      )}
      {p.next && (
        <section className="card" aria-label="Next appointment">
          <h2>Next appointment</h2>
          <p>
            {scanTypeLabel(p.next.type)} on {formatDisplayDate(p.next.date)}
          </p>
        </section>
      )}
      {p.bag && (
        <section className="card" aria-label="Hospital bag">
          <h2>Hospital bag</h2>
          <p>
            {p.bag.done} of {p.bag.total} items packed
          </p>
        </section>
      )}
      {p.flagged !== undefined && (
        <section className="card" aria-label="Journal">
          <h2>Journal</h2>
          <p>{p.flagged} items flagged to mention to the midwife</p>
        </section>
      )}

      <section className="card" aria-label="About this link">
        <h2>About this page</h2>
        <ul className="bullets">
          <li>It’s a snapshot. It doesn’t update when things change.</li>
          <li>Anyone with the link can read it.</li>
          <li>Nothing is uploaded: everything shown is inside the link itself.</li>
        </ul>
      </section>
    </Page>
  );
}
