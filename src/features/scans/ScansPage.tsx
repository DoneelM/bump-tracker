import { lazy, Suspense, useState, type FormEvent } from 'react';
import { FormField } from '../../components/FormField';
import { Page } from '../../components/Page';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import { describeEfw } from '../../lib/fetalGrowth';
import { formatWeeksDays, gestationalAge, lmpFromDueDate } from '../../lib/pregnancy';
import type { PregnancyProfile } from '../../lib/profile';
import {
  latestScanDate,
  MAX_SCAN_NOTES_LENGTH,
  MEASUREMENTS,
  parseMeasurement,
  parseScanEntries,
  SCAN_TYPES,
  scanTypeLabel,
  validateMeasurementsDate,
  validateScanDate,
  validateScanNotes,
  type MeasurementKey,
  type ScanEntry,
  type ScanType,
} from '../../lib/scans';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { newId } from '../../lib/validate';

// Recharts is large, so the chart loads as its own chunk.
const ScanChart = lazy(() => import('./ScanChart').then((m) => ({ default: m.ScanChart })));

const NO_ENTRIES: ScanEntry[] = [];
const byDate = (a: ScanEntry, b: ScanEntry) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

export function ScansPage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const [stored, setEntries] = useStoredState<ScanEntry[]>(STORAGE_KEYS.scanEntries, NO_ENTRIES, parseScanEntries);
  const entries = [...stored].sort(byDate);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const report = (r: { ok: boolean; error?: string }) => {
    setSaveError(r.ok ? null : (r.error ?? 'Could not save.'));
    return r.ok;
  };

  const withEfw = entries.filter((e) => e.efwG !== null);
  const points = withEfw.map((e) => ({ days: gestationalAge(profile.dueDate, e.date).totalDays, efwG: e.efwG! }));
  const latest = withEfw.length ? withEfw[withEfw.length - 1]! : null;

  return (
    <Page title="Scans & appointments" icon="🩺" back={{ to: '/tools', label: 'Tools' }}>
      {saveError && (
        <p className="field__error" role="alert">
          {saveError}
        </p>
      )}

      <section className="card" aria-labelledby="efw-heading">
        <h2 id="efw-heading">Estimated weight from your scans</h2>
        {withEfw.length === 0 ? (
          <p className="muted">Add a scan with an estimated fetal weight to see it on the chart.</p>
        ) : (
          <>
            <figure className="chart-figure">
              <Suspense fallback={<p className="muted">Loading chart...</p>}>
                <ScanChart points={points} />
              </Suspense>
              <figcaption className="muted">
                Typical range from the WHO Fetal Growth Charts (Kiserud et al., 2017). Scan weight estimates are
                approximate - your sonographer and midwife/LMC interpret your results.
              </figcaption>
            </figure>
            <p>{efwSummary(latest!, profile)}</p>
            {points.some((p) => p.days < 14 * 7 || p.days > 40 * 7) && (
              <p className="muted">Estimates outside 14 to 40 weeks aren’t shown, as the WHO chart doesn’t cover them.</p>
            )}
          </>
        )}
      </section>

      {adding ? (
        <ScanForm
          dueDate={profile.dueDate}
          today={today}
          onSave={(e) => report(setEntries((prev) => [...prev, e])) && setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
          + Add scan or appointment
        </button>
      )}

      <section aria-labelledby="scan-log-heading">
        <h2 id="scan-log-heading">Your scans and appointments</h2>
        {entries.length === 0 ? (
          <p className="muted">Nothing logged yet.</p>
        ) : (
          <ul className="entry-list">
            {entries
              .slice()
              .reverse()
              .map((e) => (
                <ScanRow
                  key={e.id}
                  entry={e}
                  profile={profile}
                  today={today}
                  onSave={(next) => report(setEntries((prev) => prev.map((p) => (p.id === e.id ? next : p))))}
                  onDelete={() => report(setEntries((prev) => prev.filter((p) => p.id !== e.id)))}
                />
              ))}
          </ul>
        )}
      </section>
    </Page>
  );
}

function efwSummary(e: ScanEntry, profile: PregnancyProfile): string {
  const ga = gestationalAge(profile.dueDate, e.date);
  return `Latest estimate: ${e.efwG} g at ${formatWeeksDays(ga.weeks, ga.days)} (${formatDisplayDate(e.date)}), ${describeEfw(e.efwG!, ga.totalDays)} of the WHO chart.`;
}

interface ScanFormProps {
  initial?: ScanEntry;
  dueDate: LocalDate;
  today: LocalDate;
  onSave: (e: ScanEntry) => void;
  onCancel?: () => void;
}

type Errors = Partial<Record<'date' | 'notes' | MeasurementKey, string>>;

function ScanForm({ initial, dueDate, today, onSave, onCancel }: ScanFormProps) {
  const [date, setDate] = useState(initial?.date ?? today);
  const [type, setType] = useState<ScanType>(initial?.type ?? 'growth');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [meas, setMeas] = useState<Record<MeasurementKey, string>>(() => {
    const out = {} as Record<MeasurementKey, string>;
    for (const m of MEASUREMENTS) out[m.key] = initial?.[m.key] != null ? String(initial[m.key]) : '';
    return out;
  });
  const [errors, setErrors] = useState<Errors>({});
  const id = initial?.id ?? 'new';

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Errors = {};
    const lmp = lmpFromDueDate(dueDate);
    const d = validateScanDate(date, lmp, dueDate);
    if (!d.ok) errs.date = d.error;
    const n = validateScanNotes(notes);
    if (!n.ok) errs.notes = n.error;
    const values = {} as Record<MeasurementKey, number | null>;
    for (const m of MEASUREMENTS) {
      const p = parseMeasurement(meas[m.key], m);
      if (p.error) errs[m.key] = p.error;
      values[m.key] = p.value;
    }
    if (d.ok) {
      const f = validateMeasurementsDate(date, today, MEASUREMENTS.some((m) => values[m.key] !== null || meas[m.key].trim() !== ''));
      if (!f.ok) errs.date = f.error;
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave({ id: initial?.id ?? newId(), date, type, notes: notes.trim(), ...values });
    if (!initial) {
      setNotes('');
      setMeas({ efwG: '', bpdMm: '', hcMm: '', acMm: '', flMm: '' });
    }
  }

  return (
    <form className={initial ? 'form' : 'card form'} onSubmit={submit} noValidate>
      {!initial && <h2>Add a scan or appointment</h2>}
      <FormField id={`s-date-${id}`} label="Date" error={errors.date}>
        {(aria) => <input {...aria} type="date" className="input" value={date} min={lmpFromDueDate(dueDate)} max={latestScanDate(dueDate)} onChange={(e) => setDate(e.target.value)} />}
      </FormField>
      <FormField id={`s-type-${id}`} label="Type">
        {(aria) => (
          <select {...aria} className="input" value={type} onChange={(e) => setType(e.target.value as ScanType)}>
            {SCAN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        )}
      </FormField>
      <FormField id={`s-notes-${id}`} label="Notes (optional)" hint={`Up to ${MAX_SCAN_NOTES_LENGTH} characters.`} error={errors.notes}>
        {(aria) => <textarea {...aria} className="input" rows={4} value={notes} maxLength={MAX_SCAN_NOTES_LENGTH} onChange={(e) => setNotes(e.target.value)} />}
      </FormField>
      <fieldset className="choice">
        <legend className="field__label">Measurements (optional)</legend>
        <p className="field__hint">As written on your scan report.</p>
        {MEASUREMENTS.map((m) => (
          <FormField key={m.key} id={`s-${m.key}-${id}`} label={`${m.label} (${m.unit})`} error={errors[m.key]}>
            {(aria) => (
              <input {...aria} type="number" inputMode="decimal" step="any" className="input input--short" value={meas[m.key]} onChange={(e) => setMeas({ ...meas, [m.key]: e.target.value })} />
            )}
          </FormField>
        ))}
      </fieldset>
      <div className="button-row">
        <button type="submit" className="btn btn--primary">
          {initial ? 'Save changes' : 'Add entry'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

interface ScanRowProps {
  entry: ScanEntry;
  profile: PregnancyProfile;
  today: LocalDate;
  onSave: (e: ScanEntry) => void;
  onDelete: () => void;
}

function ScanRow({ entry, profile, today, onSave, onDelete }: ScanRowProps) {
  const [editing, setEditing] = useState(false);
  const ga = gestationalAge(profile.dueDate, entry.date);

  if (editing) {
    return (
      <li className="card entry">
        <ScanForm
          initial={entry}
          dueDate={profile.dueDate}
          today={today}
          onSave={(e) => {
            onSave(e);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }
  const measured = MEASUREMENTS.filter((m) => entry[m.key] !== null);
  return (
    <li className="card entry">
      <p className="entry__title">{scanTypeLabel(entry.type)}</p>
      <p className="muted">
        {formatDisplayDate(entry.date)} · {formatWeeksDays(ga.weeks, ga.days)}
      </p>
      {measured.length > 0 && (
        <ul className="entry__measures">
          {measured.map((m) => (
            <li key={m.key}>
              {m.label}: {entry[m.key]} {m.unit}
            </li>
          ))}
        </ul>
      )}
      {entry.notes && <p className="entry__note">{entry.notes}</p>}
      <div className="button-row">
        <button type="button" className="btn btn--ghost" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            if (window.confirm('Delete this entry?')) onDelete();
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
