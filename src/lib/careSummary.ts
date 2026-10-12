/**
 * "Share with my midwife": plain text built only from what the user ticked (journal entries, open questions,
 * recent readings, the baby log's last days). The user sends it themselves (share sheet, copy or print), so it
 * never passes through us. Readings are listed with the user's own limits and nothing is interpreted. Pure.
 */
import type { DayTotals } from './babyLogDays';
import { formatDuration } from './babyLog';
import { formatDisplayDate, type LocalDate } from './dates';
import { MOODS, type JournalEntry } from './journal';
import { glucoseContextLabel, type BpReading, type GlucoseReading, type MonitoringTargets } from './monitoring';
import type { Question } from './questions';

export interface CareSummaryInput {
  today: LocalDate;
  /** "Due 6 January 2027" or "Baby born 1 October 2026 (2 weeks old)". */
  context: string;
  journal: readonly JournalEntry[];
  questions: readonly Question[];
  bp: readonly BpReading[];
  glucose: readonly GlucoseReading[];
  targets: MonitoringTargets;
  babyDays: readonly DayTotals[];
}

const moodLabel = (m: number) => MOODS.find((x) => x.value === m)?.label ?? '';
const when = (date: LocalDate, time: string) => `${formatDisplayDate(date)}${time ? ` ${time}` : ''}`;

export function buildCareSummary(i: CareSummaryInput): string {
  const out: string[] = [`Notes for my midwife or care team`, i.context, `Prepared ${formatDisplayDate(i.today)} in the Hey Baby app.`];
  const section = (title: string, lines: string[]) => {
    if (lines.length) out.push('', title.toUpperCase(), ...lines);
  };

  section(
    'Journal',
    [...i.journal]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .flatMap((e) => [
        `${formatDisplayDate(e.date)}: feeling ${moodLabel(e.mood).toLowerCase()}${e.flagged ? ' (flagged to mention)' : ''}`,
        ...(e.symptoms.length ? [`  Symptoms: ${e.symptoms.join(', ')}`] : []),
        ...(e.notes ? [`  ${e.notes.replace(/\s*\n\s*/g, ' ')}`] : []),
      ]),
  );

  section('Questions', i.questions.map((q) => `- ${q.text}`));

  const bpLimit = [i.targets.bpSystolicMax, i.targets.bpDiastolicMax].every((n) => n !== null)
    ? `My care team's limits: ${i.targets.bpSystolicMax}/${i.targets.bpDiastolicMax}`
    : null;
  section('Blood pressure', [
    ...(i.bp.length && bpLimit ? [bpLimit] : []),
    ...i.bp.map((r) => `${when(r.date, r.time)}: ${r.systolic}/${r.diastolic}${r.pulse ? `, pulse ${r.pulse}` : ''}${r.note ? ` (${r.note})` : ''}`),
  ]);

  const gLimits = Object.entries(i.targets.glucoseMax)
    .map(([c, v]) => `${glucoseContextLabel(c as GlucoseReading['context']).toLowerCase()} ${v}`)
    .join(', ');
  section('Blood glucose (mmol/L)', [
    ...(i.glucose.length && gLimits ? [`My care team's limits: ${gLimits}`] : []),
    ...i.glucose.map((r) => `${when(r.date, r.time)}: ${r.mmol} (${glucoseContextLabel(r.context).toLowerCase()})${r.note ? ` (${r.note})` : ''}`),
  ]);

  section(
    'Baby log',
    i.babyDays.map(
      (t) =>
        `${formatDisplayDate(t.day)}: ${t.feeds} feeds${t.bottleMl ? ` (${t.bottleMl} ml from bottles)` : ''}, ${t.wet} wet and ${t.dirty} dirty nappies, ${formatDuration(t.sleepMinutes)} sleep`,
    ),
  );

  return out.join('\n');
}
