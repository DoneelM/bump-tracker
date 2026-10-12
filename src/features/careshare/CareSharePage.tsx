import { useMemo, useState } from 'react';
import { Page } from '../../components/Page';
import { formatBabyAge } from '../../lib/babyAge';
import { dayTotals, lastDays } from '../../lib/babyLogDays';
import { buildCareSummary } from '../../lib/careSummary';
import { copyText } from '../../lib/clipboard';
import { addDays, formatDisplayDate, type LocalDate } from '../../lib/dates';
import { MOODS, parseJournalEntries, type JournalEntry } from '../../lib/journal';
import { newestFirst, parseBpReadings, parseGlucoseReadings, type BpReading, type GlucoseReading } from '../../lib/monitoring';
import type { PregnancyProfile } from '../../lib/profile';
import { openQuestions } from '../../lib/questions';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { useBabyLog } from '../babylog/BabyLogPage';
import { useTargets } from '../monitoring/BpPage';
import { useQuestions } from '../questions/QuestionsPage';

const NO_JOURNAL: JournalEntry[] = [];
const NO_BP: BpReading[] = [];
const NO_GLUCOSE: GlucoseReading[] = [];
const RECENT_DAYS = 14;
const SHOW_ENTRIES = 30;

/**
 * Pick what to send to the midwife or care team, see exactly what it says, then share, copy or print it.
 * The user chooses who gets it; nothing goes through us.
 */
export function CareSharePage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const [journal] = useStoredState<JournalEntry[]>(STORAGE_KEYS.journal, NO_JOURNAL, parseJournalEntries);
  const [questions] = useQuestions();
  const [bpAll] = useStoredState<BpReading[]>(STORAGE_KEYS.bpReadings, NO_BP, parseBpReadings);
  const [gAll] = useStoredState<GlucoseReading[]>(STORAGE_KEYS.glucoseReadings, NO_GLUCOSE, parseGlucoseReadings);
  const [targets] = useTargets();
  const [babyLog] = useBabyLog();
  const born = profile.ending?.kind === 'born' ? profile.ending : null;

  const entries = useMemo(() => [...journal].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, SHOW_ENTRIES), [journal]);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(journal.filter((e) => e.flagged).map((e) => e.id)));
  const open = openQuestions(questions);
  const since = addDays(today, -RECENT_DAYS);
  const bp = newestFirst(bpAll).filter((r) => r.date > since);
  const glucose = newestFirst(gAll).filter((r) => r.date > since);
  const [withQs, setWithQs] = useState(open.length > 0);
  const [withBp, setWithBp] = useState(false);
  const [withGlucose, setWithGlucose] = useState(false);
  const [withBaby, setWithBaby] = useState(!!born && babyLog.length > 0);
  const [status, setStatus] = useState('');

  const context = born
    ? `Baby born ${formatDisplayDate(born.date)} (${formatBabyAge(born.date, today)})`
    : profile.ending
      ? `Pregnancy due ${formatDisplayDate(profile.dueDate)}`
      : `Due ${formatDisplayDate(profile.dueDate)}`;
  const text = buildCareSummary({
    today,
    context,
    journal: journal.filter((e) => picked.has(e.id)),
    questions: withQs ? open : [],
    bp: withBp ? bp : [],
    glucose: withGlucose ? glucose : [],
    targets,
    babyDays: withBaby ? lastDays(today, 7).map((d) => dayTotals(babyLog, d, Date.now())).reverse() : [],
  });
  const empty = text.split('\n').length <= 3;

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const canShare = typeof navigator.share === 'function';
  const share = async () => {
    try {
      await navigator.share({ title: 'Notes for my midwife', text });
    } catch {
      // Cancelled by the user, or not permitted: nothing to report.
    }
  };
  const copy = async () => setStatus((await copyText(text)) ? 'Copied. Paste it into an email or message.' : 'Couldn’t copy. Select the text below and copy it yourself.');

  const check = (label: string, checked: boolean, set: (v: boolean) => void, disabled = false) => (
    <label className="question__check">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => set(e.target.checked)} />
      <span>{label}</span>
    </label>
  );

  return (
    <Page title="Share with my midwife" icon="📤" back={{ to: '/journal', label: 'Journal' }} health={false}>
      <div className="no-print">
        <p className="lead">Choose what to include, check it, then send it the way you usually contact your midwife. Nothing goes through us.</p>

        <section className="card" aria-labelledby="cs-journal">
          <h2 id="cs-journal">Journal entries</h2>
          {entries.length === 0 ? (
            <p className="muted">No journal entries yet.</p>
          ) : (
            <>
              <p className="muted">Entries you flagged for your midwife are ticked.</p>
              {entries.map((e) => (
                <label key={e.id} className="question__check">
                  <input type="checkbox" checked={picked.has(e.id)} onChange={() => toggle(e.id)} />
                  <span>
                    {formatDisplayDate(e.date)} · {MOODS.find((m) => m.value === e.mood)?.label}
                    {e.flagged && ' · 🚩'}
                    {(e.symptoms.length > 0 || e.notes) && <span className="log-entry__note">{[e.symptoms.join(', '), e.notes].filter(Boolean).join(' · ')}</span>}
                  </span>
                </label>
              ))}
            </>
          )}
        </section>

        <section className="card" aria-labelledby="cs-more">
          <h2 id="cs-more">Also include</h2>
          {check(`Questions for my midwife (${open.length} open)`, withQs, setWithQs, open.length === 0)}
          {check(`Blood pressure, last ${RECENT_DAYS} days (${bp.length})`, withBp, setWithBp, bp.length === 0)}
          {check(`Blood glucose, last ${RECENT_DAYS} days (${glucose.length})`, withGlucose, setWithGlucose, glucose.length === 0)}
          {born && check('Baby log, last 7 days', withBaby, setWithBaby, babyLog.length === 0)}
        </section>

        <div className="button-row">
          {canShare && (
            <button type="button" className="btn btn--primary" disabled={empty} onClick={() => void share()}>
              Share
            </button>
          )}
          <button type="button" className={`btn ${canShare ? 'btn--ghost' : 'btn--primary'}`} disabled={empty} onClick={() => void copy()}>
            Copy
          </button>
          <button type="button" className="btn btn--ghost" disabled={empty} onClick={() => window.print()}>
            Print or save as PDF
          </button>
        </div>
        <p role="status" className="muted">
          {status}
        </p>
        <h2>What it says</h2>
      </div>
      <pre className="fb-info care-text">{empty ? 'Tick something above to include it.' : text}</pre>
    </Page>
  );
}
