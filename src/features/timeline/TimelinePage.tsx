import { Page } from '../../components/Page';
import { SOURCES } from '../../data/sources';
import { download } from '../../lib/download';
import { buildCalendar } from '../../lib/ics';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import type { PregnancyProfile } from '../../lib/profile';
import { parseScanEntries, scanTypeLabel, type ScanEntry } from '../../lib/scans';
import { STORAGE_KEYS } from '../../lib/storage';
import { placeMilestones, timelineEvents, type MilestoneStatus, type PlacedMilestone } from '../../lib/timeline';
import { useStoredState } from '../../lib/useStoredState';

const NO_SCANS: ScanEntry[] = [];
const sourceUrl = (id: string) => SOURCES.find((s) => s.id === id)?.url;

const GROUPS: { status: MilestoneStatus; title: string }[] = [
  { status: 'now', title: 'Now' },
  { status: 'soon', title: 'Coming up' },
  { status: 'done', title: 'Earlier' },
];

function MilestoneItem({ p }: { p: PlacedMilestone }) {
  const m = p.milestone;
  const sources = m.sources.map((id) => SOURCES.find((s) => s.id === id)).filter((s) => s !== undefined);
  return (
    <li className="card milestone">
      <h3>
        {m.title}
        {m.optional && <span className="tag">Optional</span>}
      </h3>
      <p className="milestone__when">{m.when}</p>
      {p.to && !m.untilBirth && (
        <p className="muted">
          {formatDisplayDate(p.from)} to {formatDisplayDate(p.to)}
        </p>
      )}
      <p>{m.note}</p>
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
    </li>
  );
}

/** The usual NZ antenatal milestones placed on this pregnancy's dates, with a calendar file to download. */
export function TimelinePage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const [scans] = useStoredState<ScanEntry[]>(STORAGE_KEYS.scanEntries, NO_SCANS, parseScanEntries);
  const placed = placeMilestones(profile.dueDate, today);

  const saveCalendar = () => {
    const appointments = scans.map((s) => ({ id: s.id, date: s.date, label: scanTypeLabel(s.type) }));
    const events = timelineEvents(profile.dueDate, today, appointments, sourceUrl);
    download('bump-tracker-timeline.ics', buildCalendar(events), 'text/calendar');
  };

  return (
    <Page title="Timeline" icon="🗓️" back={{ to: '/tools', label: 'Tools' }}>
      <p>
        The usual checks, tests and vaccines in a New Zealand pregnancy, from Health NZ. Your LMC will talk with you about what’s right for you, and
        the timing can differ.
      </p>
      {profile.ending ? (
        <p className="card card--soft">Your pregnancy has ended, so the timeline isn’t shown.</p>
      ) : (
        <>
          <section className="card" aria-labelledby="cal-heading">
            <h2 id="cal-heading">Add to your calendar</h2>
            <p className="muted">
              Downloads a calendar file with the milestones ahead and your upcoming appointments (type and date only, no notes). It’s made on this
              device; nothing is uploaded. If your calendar syncs online, the events will too.
            </p>
            <div className="button-row">
              <button type="button" className="btn btn--primary" onClick={saveCalendar}>
                Download calendar file
              </button>
            </div>
          </section>
          {GROUPS.map((g) => {
            const items = placed.filter((p) => p.status === g.status);
            if (!items.length) return null;
            const list = (
              <ul className="milestone-list">
                {items.map((p) => (
                  <MilestoneItem key={p.milestone.id} p={p} />
                ))}
              </ul>
            );
            return (
              <section key={g.status} aria-labelledby={`tl-${g.status}`}>
                {g.status === 'done' ? (
                  <details>
                    <summary>
                      <h2 id={`tl-${g.status}`} className="details-summary-heading">
                        {g.title} ({items.length})
                      </h2>
                    </summary>
                    {list}
                  </details>
                ) : (
                  <>
                    <h2 id={`tl-${g.status}`}>{g.title}</h2>
                    {list}
                  </>
                )}
              </section>
            );
          })}
        </>
      )}
    </Page>
  );
}
