import { useMemo } from 'react';
import { Page } from '../../components/Page';
import { BAG_SECTIONS, bagDefaults, PLAN_SECTIONS, planDefaults } from '../../data/checklists';
import { parseChecklist, progress, type ChecklistItem } from '../../lib/checklists';
import { averagesLastHour, detect511, formatMmSs, parseContractionState, EMPTY_STATE, validSorted, type ContractionState } from '../../lib/contractions';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import { flaggedEntries, MOODS, parseJournalEntries, type JournalEntry } from '../../lib/journal';
import { formatDuration, parseKickSessions, sessionDurationMs, type KickSession } from '../../lib/kicks';
import { formatWeeksDays, gestationalAge } from '../../lib/pregnancy';
import type { PregnancyProfile } from '../../lib/profile';
import { MEASUREMENTS, parseScanEntries, scanTypeLabel, type ScanEntry } from '../../lib/scans';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { parsePrePregnancy, parseWeightEntries, sortByDate, type PrePregnancy, type WeightEntry } from '../../lib/weightGain';

const NO_WEIGHTS: WeightEntry[] = [];
const NO_SCANS: ScanEntry[] = [];
const NO_JOURNAL: JournalEntry[] = [];
const NO_KICKS: KickSession[] = [];
const parseBag = parseChecklist(BAG_SECTIONS);
const parsePlan = parseChecklist(PLAN_SECTIONS);
const dateTimeFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const RECENT_WEIGHTS = 6;
const RECENT_KICKS = 5;

const kg = (n: number) => `${Math.round(n * 10) / 10} kg`;
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${kg(Math.abs(n))}`;

export function PrintPage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const [pre] = useStoredState<PrePregnancy | null>(STORAGE_KEYS.prePregnancy, null, parsePrePregnancy);
  const [weights] = useStoredState<WeightEntry[]>(STORAGE_KEYS.weightEntries, NO_WEIGHTS, parseWeightEntries);
  const [scans] = useStoredState<ScanEntry[]>(STORAGE_KEYS.scanEntries, NO_SCANS, parseScanEntries);
  const [journal] = useStoredState<JournalEntry[]>(STORAGE_KEYS.journal, NO_JOURNAL, parseJournalEntries);
  const [kicks] = useStoredState<KickSession[]>(STORAGE_KEYS.kickSessions, NO_KICKS, parseKickSessions);
  const [contractions] = useStoredState<ContractionState>(STORAGE_KEYS.contractions, EMPTY_STATE, parseContractionState);
  const bagFallback = useMemo(bagDefaults, []);
  const planFallback = useMemo(planDefaults, []);
  const [bag] = useStoredState<ChecklistItem[]>(STORAGE_KEYS.bagChecklist, bagFallback, parseBag);
  const [plan] = useStoredState<ChecklistItem[]>(STORAGE_KEYS.birthPlan, planFallback, parsePlan);

  const ga = gestationalAge(profile.dueDate, today);
  const recentWeights = sortByDate(weights).slice(-RECENT_WEIGHTS).reverse();
  const scansNewest = [...scans].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const flagged = flaggedEntries(journal);
  const doneKicks = kicks.filter((s) => s.end !== undefined).slice(-RECENT_KICKS).reverse();
  const timed = validSorted(contractions.contractions);
  const lastStart = timed.at(-1)?.start;
  const avgs = lastStart === undefined ? null : averagesLastHour(timed, lastStart);
  const bagProgress = progress(bag);
  const answers = plan.filter((i) => i.answer || i.done);

  return (
    <Page title="Print summary" icon="🖨️" back={{ to: '/more', label: 'More' }}>
      <div className="no-print">
        <p>A one-page summary of your dates and logs to bring to appointments. Check it over first: it includes personal details.</p>
        <div className="button-row">
          <button type="button" className="btn btn--primary" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="print-sheet">
        <h2 className="print-only">Pregnancy summary</h2>
        <p className="muted">Prepared {formatDisplayDate(today)}</p>

        <section className="card print-card" aria-labelledby="pr-profile">
          <h2 id="pr-profile">Pregnancy details</h2>
          <dl className="details">
            <dt>Estimated due date</dt>
            <dd>{formatDisplayDate(profile.dueDate)}</dd>
            <dt>Gestational age today</dt>
            <dd>{ga.weeks < 0 ? 'Not started yet' : formatWeeksDays(ga.weeks, ga.days)}</dd>
            <dt>Dating method</dt>
            <dd>
              {profile.dating.method === 'lmp'
                ? `Last period starting ${formatDisplayDate(profile.dating.lmp)}`
                : `Scan on ${formatDisplayDate(profile.dating.scanDate)} showing ${profile.dating.gaWeeks}w${profile.dating.gaDays}d`}
            </dd>
          </dl>
        </section>

        <section className="card print-card" aria-labelledby="pr-weight">
          <h2 id="pr-weight">Weight</h2>
          {recentWeights.length === 0 ? (
            <p className="muted">No weights logged.</p>
          ) : (
            <>
              {pre && <p>Pre-pregnancy: {kg(pre.weightKg)} at {pre.heightCm} cm</p>}
              <ul className="plain-list">
                {recentWeights.map((w) => (
                  <li key={w.id}>
                    {formatDisplayDate(w.date)}: {kg(w.weightKg)}
                    {pre && ` (${signed(w.weightKg - pre.weightKg)} vs pre-pregnancy)`}
                    {w.note && ` - ${w.note}`}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="card print-card" aria-labelledby="pr-scans">
          <h2 id="pr-scans">Scans and appointments</h2>
          {scansNewest.length === 0 ? (
            <p className="muted">Nothing logged.</p>
          ) : (
            <ul className="plain-list">
              {scansNewest.map((s) => {
                const measures = MEASUREMENTS.filter((m) => s[m.key] !== null).map((m) => `${m.label}: ${s[m.key]} ${m.unit}`);
                return (
                  <li key={s.id}>
                    <strong>{formatDisplayDate(s.date)}</strong> - {scanTypeLabel(s.type)}
                    {measures.length > 0 && <div>{measures.join('; ')}</div>}
                    {s.notes && <div className="entry__note">{s.notes}</div>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card print-card" aria-labelledby="pr-journal">
          <h2 id="pr-journal">To mention to my midwife</h2>
          {flagged.length === 0 ? (
            <p className="muted">No flagged journal entries.</p>
          ) : (
            <ul className="plain-list">
              {flagged.map((e) => (
                <li key={e.id}>
                  <strong>{formatDisplayDate(e.date)}</strong> - mood: {MOODS.find((m) => m.value === e.mood)?.label}
                  {e.symptoms.length > 0 && `; symptoms: ${e.symptoms.join(', ')}`}
                  {e.notes && <div className="entry__note">{e.notes}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {(doneKicks.length > 0 || avgs) && (
          <section className="card print-card" aria-labelledby="pr-movement">
            <h2 id="pr-movement">Movements and contractions</h2>
            {doneKicks.length > 0 && (
              <>
                <h3>Recent baby movement sessions</h3>
                <ul className="plain-list">
                  {doneKicks.map((s) => (
                    <li key={s.id}>
                      {dateTimeFmt.format(s.start)}: {s.count} movements in {formatDuration(sessionDurationMs(s, s.end!))}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {avgs && lastStart !== undefined && (
              <>
                <h3>Latest contraction timing</h3>
                <p>
                  {avgs.count} contractions in the hour to {dateTimeFmt.format(lastStart)}; average length {formatMmSs(avgs.avgDurationMs)}, average gap{' '}
                  {formatMmSs(avgs.avgIntervalMs)} (mm:ss).
                  {detect511(timed) && ' The 5-1-1 pattern was met: call your midwife/LMC or maternity unit.'}
                </p>
              </>
            )}
          </section>
        )}

        <section className="card print-card" aria-labelledby="pr-bag">
          <h2 id="pr-bag">Hospital bag</h2>
          <p>
            {bagProgress.done} of {bagProgress.total} items packed
          </p>
        </section>

        <section className="card print-card" aria-labelledby="pr-plan">
          <h2 id="pr-plan">Birth plan</h2>
          {answers.length === 0 ? (
            <p className="muted">No birth plan answers yet.</p>
          ) : (
            <ul className="plain-list">
              {answers.map((i) => (
                <li key={i.id}>
                  <strong>{i.text}</strong>
                  {i.answer ? `: ${i.answer}` : ' (noted)'}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Page>
  );
}
