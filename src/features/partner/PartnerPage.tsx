import { useMemo, useState } from 'react';
import { copyText } from '../../lib/clipboard';
import { Page } from '../../components/Page';
import { BAG_SECTIONS, bagDefaults } from '../../data/checklists';
import { parseChecklist, progress, type ChecklistItem } from '../../lib/checklists';
import { flaggedEntries, parseJournalEntries, type JournalEntry } from '../../lib/journal';
import {
  buildPayload,
  DEFAULT_SECTIONS,
  encodePayload,
  isEmptyPayload,
  partnerLink,
  summaryText,
  type PartnerSections,
} from '../../lib/partner';
import type { PregnancyProfile } from '../../lib/profile';
import { nextAppointment, parseScanEntries, type ScanEntry } from '../../lib/scans';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import type { LocalDate } from '../../lib/dates';

const NO_SCANS: ScanEntry[] = [];
const NO_JOURNAL: JournalEntry[] = [];
const parseBag = parseChecklist(BAG_SECTIONS);

const OPTIONS: { key: keyof PartnerSections; label: string }[] = [
  { key: 'dueWeek', label: 'Due date and current week' },
  { key: 'size', label: 'Baby’s size this week' },
  { key: 'next', label: 'Next appointment (date and type only, no notes)' },
  { key: 'bag', label: 'Hospital bag progress' },
  { key: 'flagged', label: 'Number of journal items flagged for the midwife' },
];

export function PartnerPage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const [scans] = useStoredState<ScanEntry[]>(STORAGE_KEYS.scanEntries, NO_SCANS, parseScanEntries);
  const [journal] = useStoredState<JournalEntry[]>(STORAGE_KEYS.journal, NO_JOURNAL, parseJournalEntries);
  const bagFallback = useMemo(bagDefaults, []);
  const [bag] = useStoredState<ChecklistItem[]>(STORAGE_KEYS.bagChecklist, bagFallback, parseBag);
  const [sections, setSections] = useState<PartnerSections>(DEFAULT_SECTIONS);
  const [status, setStatus] = useState('');

  const next = nextAppointment(scans, today);
  const payload = buildPayload(sections, {
    dueDate: profile.dueDate,
    today,
    next: next ? { date: next.date, type: next.type } : null,
    bag: progress(bag),
    flaggedCount: flaggedEntries(journal).length,
  });
  const empty = isEmptyPayload(payload);
  const text = summaryText(payload);
  const encoded = encodePayload(payload);
  const link = encoded ? partnerLink(`${window.location.origin}${window.location.pathname}`, encoded) : '';

  const copy = async (what: string, value: string) => setStatus((await copyText(value)) ? `${what} copied.` : `Could not copy. Select the ${what.toLowerCase()} and copy it yourself.`);
  const canShare = typeof navigator.share === 'function';
  const share = async () => {
    try {
      await navigator.share({ title: 'Pregnancy update', text });
    } catch {
      // Cancelled by the user, or not permitted: nothing to report.
    }
  };

  if (profile.ending) {
    return (
      <Page title="Partner summary" icon="💞" back={{ to: '/more', label: 'More' }} health={false}>
        <p className="card card--soft">The partner summary shares pregnancy updates, so it’s turned off now your pregnancy has ended.</p>
      </Page>
    );
  }

  return (
    <Page title="Partner summary" icon="💞" back={{ to: '/more', label: 'More' }}>
      <section className="card card--soft">
        <p>
          Share a quick catch-up with your partner or whānau. There’s no account and nothing is uploaded: you choose what to include,
          then send the text or link yourself.
        </p>
      </section>

      <section className="card" aria-labelledby="include-heading">
        <h2 id="include-heading">What to include</h2>
        <div className="stack">
          {OPTIONS.map((o) => (
            <label key={o.key} className="chip">
              <input
                type="checkbox"
                checked={sections[o.key]}
                onChange={(e) => setSections((s) => ({ ...s, [o.key]: e.target.checked }))}
              />
              {o.label}
            </label>
          ))}
        </div>
        {sections.next && !next && <p className="muted">No upcoming appointment in your scans log yet.</p>}
      </section>

      <section className="card" aria-labelledby="text-heading">
        <h2 id="text-heading">Text summary</h2>
        {empty ? (
          <p className="muted">Tick at least one thing to include.</p>
        ) : (
          <>
            <pre className="summary-text">{text}</pre>
            <div className="button-row">
              <button type="button" className="btn btn--primary" onClick={() => void copy('Summary', text)}>
                Copy
              </button>
              {canShare && (
                <button type="button" className="btn btn--ghost" onClick={() => void share()}>
                  Share
                </button>
              )}
            </div>
          </>
        )}
      </section>

      <section className="card" aria-labelledby="link-heading">
        <h2 id="link-heading">Share link</h2>
        <p>
          The link contains only the fields ticked above, packed into the address itself. It’s a snapshot: it won’t update, anyone who
          has the link can read it, and nothing is uploaded anywhere.
        </p>
        {empty || !link ? (
          <p className="muted">Tick at least one thing to include.</p>
        ) : (
          <>
            <textarea className="input" readOnly rows={3} value={link} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} />
            <div className="button-row">
              <button type="button" className="btn btn--primary" onClick={() => void copy('Link', link)}>
                Copy link
              </button>
            </div>
          </>
        )}
      </section>
      <p className="muted" role="status" aria-live="polite">
        {status}
      </p>
    </Page>
  );
}
