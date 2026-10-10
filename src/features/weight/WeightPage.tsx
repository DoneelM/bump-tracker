import { useState, type FormEvent } from 'react';
import { FormField } from '../../components/FormField';
import { Page } from '../../components/Page';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import { formatWeeksDays, gestationalAge, lmpFromDueDate } from '../../lib/pregnancy';
import type { PregnancyProfile } from '../../lib/profile';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { newId, parseNumberInput } from '../../lib/validate';
import {
  bmi,
  bmiCategory,
  BMI_CATEGORY_LABEL,
  formatBmi,
  parsePrePregnancy,
  parseWeightEntries,
  rangeText,
  recommendedRangeAtWeek,
  sortByDate,
  TOTAL_GAIN_KG,
  validateEntryDate,
  validateHeight,
  validateWeight,
  validateWeightNote,
  MAX_WEIGHT_NOTE_LENGTH,
  type PrePregnancy,
  type WeightEntry,
} from '../../lib/weightGain';
import { WeightChart } from './WeightChart';

const NO_ENTRIES: WeightEntry[] = [];
const round1 = (n: number) => Math.round(n * 10) / 10;

export function WeightPage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const lmp = lmpFromDueDate(profile.dueDate);
  const [pre, setPre] = useStoredState<PrePregnancy | null>(STORAGE_KEYS.prePregnancy, null, parsePrePregnancy);
  const [stored, setEntries] = useStoredState<WeightEntry[]>(STORAGE_KEYS.weightEntries, NO_ENTRIES, parseWeightEntries);
  const entries = sortByDate(stored);

  const [saveError, setSaveError] = useState<string | null>(null);
  const report = (r: { ok: boolean; error?: string }) => setSaveError(r.ok ? null : (r.error ?? 'Could not save.'));

  const category = pre ? bmiCategory(bmi(pre.heightCm, pre.weightKg)) : null;
  const points = entries.map((e) => ({
    week: gestationalAge(profile.dueDate, e.date).totalDays / 7,
    value: pre ? e.weightKg - pre.weightKg : e.weightKg,
  }));
  const latest = entries.length ? entries[entries.length - 1]! : null;

  return (
    <Page title="Weight" icon="⚖️" back={{ to: '/tools', label: 'Tools' }}>
      {saveError && (
        <p className="field__error" role="alert">
          {saveError}
        </p>
      )}

      <PrePregnancySection pre={pre} onSave={(v) => report(setPre(v))} />

      <EntryForm key="new" lmp={lmp} today={today} onSave={(e) => report(setEntries((prev) => [...prev, e]))} />

      <section className="card" aria-labelledby="chart-heading">
        <h2 id="chart-heading">{pre ? 'Weight gain by week' : 'Weight by week'}</h2>
        {entries.length === 0 ? (
          <p className="muted">Add a weight entry above to see your chart.</p>
        ) : (
          <>
            <figure className="chart-figure">
              <WeightChart points={points} category={category} gain={pre !== null} />
              <figcaption className="muted">
                {pre
                  ? 'Your gain compared with your pre-pregnancy weight. The shaded band is an approximation drawn from the Institute of Medicine (2009) total-gain guidance, not an official week-by-week range.'
                  : 'Your weight in kg. Add your pre-pregnancy height and weight above to see gain and the recommended band. Without them there is no starting point to measure gain from, so no band is shown.'}
              </figcaption>
            </figure>
            <p>{summary(latest!, pre, profile, category)}</p>
          </>
        )}
        <p className="muted">
          Ranges apply to singleton pregnancies only. Your midwife/LMC may give you different advice.
        </p>
      </section>

      <section aria-labelledby="log-heading">
        <h2 id="log-heading">Your entries</h2>
        {entries.length === 0 ? (
          <p className="muted">Nothing logged yet.</p>
        ) : (
          <ul className="entry-list">
            {entries.map((e) => (
              <WeightRow
                key={e.id}
                entry={e}
                pre={pre}
                profile={profile}
                lmp={lmp}
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

function summary(latest: WeightEntry, pre: PrePregnancy | null, profile: PregnancyProfile, category: ReturnType<typeof bmiCategory> | null): string {
  const ga = gestationalAge(profile.dueDate, latest.date);
  const when = `${formatWeeksDays(ga.weeks, ga.days)} (${formatDisplayDate(latest.date)})`;
  if (!pre || !category) return `Latest entry: ${latest.weightKg} kg at ${when}. There is no pre-pregnancy weight, so no gain or band is shown.`;
  const gain = round1(latest.weightKg - pre.weightKg);
  const band = recommendedRangeAtWeek(category, ga.totalDays / 7);
  return `Latest entry: ${latest.weightKg} kg at ${when}, a change of ${gain} kg from your pre-pregnancy weight. The approximate band at that week is ${round1(band.low)} to ${round1(band.high)} kg.`;
}

function PrePregnancySection({ pre, onSave }: { pre: PrePregnancy | null; onSave: (v: PrePregnancy | null) => void }) {
  const [open, setOpen] = useState(pre === null);
  const [height, setHeight] = useState(pre ? String(pre.heightCm) : '');
  const [weight, setWeight] = useState(pre ? String(pre.weightKg) : '');
  const [errors, setErrors] = useState<{ height?: string; weight?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const h = validateHeight(height);
    const w = validateWeight(weight);
    setErrors({ height: h.ok ? undefined : h.error, weight: w.ok ? undefined : w.error });
    if (!h.ok || !w.ok) return;
    onSave({ heightCm: Number(height), weightKg: Number(weight) });
    setOpen(false);
  }

  const b = pre ? bmi(pre.heightCm, pre.weightKg) : null;
  const cat = b === null ? null : bmiCategory(b);

  return (
    <section className="card" aria-labelledby="pre-heading">
      <h2 id="pre-heading">Before pregnancy (optional)</h2>
      <p className="muted">
        Your height and weight <strong>before pregnancy</strong> are used only to show the Institute of Medicine
        recommended gain range. They stay on this device.
      </p>
      {pre && b !== null && cat && !open && (
        <>
          <p>
            Before pregnancy: {pre.heightCm} cm, {pre.weightKg} kg. BMI {formatBmi(b)}, which is {BMI_CATEGORY_LABEL[cat]}.
          </p>
          <p className="muted">
            For this range, the recommended total gain is about {rangeText(TOTAL_GAIN_KG[cat])}. BMI is only a rough
            guide and doesn’t describe your health.
          </p>
          <div className="button-row">
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(true)}>
              Edit
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => onSave(null)}>
              Remove
            </button>
          </div>
        </>
      )}
      {open && (
        <form className="form" onSubmit={submit} noValidate>
          <FormField id="pre-height" label="Height (cm)" error={errors.height}>
            {(aria) => <input {...aria} type="number" inputMode="decimal" step="any" className="input input--short" value={height} onChange={(e) => setHeight(e.target.value)} />}
          </FormField>
          <FormField id="pre-weight" label="Weight before pregnancy (kg)" error={errors.weight}>
            {(aria) => <input {...aria} type="number" inputMode="decimal" step="any" className="input input--short" value={weight} onChange={(e) => setWeight(e.target.value)} />}
          </FormField>
          <div className="button-row">
            <button type="submit" className="btn btn--primary">
              Save
            </button>
            {pre && (
              <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

interface EntryFormProps {
  initial?: WeightEntry;
  lmp: LocalDate;
  today: LocalDate;
  onSave: (e: WeightEntry) => void;
  onCancel?: () => void;
}

function EntryForm({ initial, lmp, today, onSave, onCancel }: EntryFormProps) {
  const [date, setDate] = useState(initial?.date ?? today);
  const [weight, setWeight] = useState(initial ? String(initial.weightKg) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [errors, setErrors] = useState<{ date?: string; weight?: string; note?: string }>({});
  const id = initial?.id ?? 'new';

  function submit(e: FormEvent) {
    e.preventDefault();
    const d = validateEntryDate(date, lmp, today);
    const w = validateWeight(weight);
    const n = validateWeightNote(note);
    setErrors({ date: d.ok ? undefined : d.error, weight: w.ok ? undefined : w.error, note: n.ok ? undefined : n.error });
    if (!d.ok || !w.ok || !n.ok) return;
    onSave({ id: initial?.id ?? newId(), date, weightKg: parseNumberInput(weight).value!, note: note.trim() });
    if (!initial) {
      setWeight('');
      setNote('');
    }
  }

  return (
    <form className={initial ? 'form' : 'card form'} onSubmit={submit} noValidate>
      {!initial && <h2>Log your weight</h2>}
      <FormField id={`w-date-${id}`} label="Date" error={errors.date}>
        {(aria) => <input {...aria} type="date" className="input" value={date} min={lmp} max={today} onChange={(e) => setDate(e.target.value)} />}
      </FormField>
      <FormField id={`w-kg-${id}`} label="Weight (kg)" error={errors.weight}>
        {(aria) => <input {...aria} type="number" inputMode="decimal" step="any" className="input input--short" value={weight} onChange={(e) => setWeight(e.target.value)} />}
      </FormField>
      <FormField id={`w-note-${id}`} label="Note (optional)" error={errors.note}>
        {(aria) => <input {...aria} type="text" className="input" value={note} maxLength={MAX_WEIGHT_NOTE_LENGTH} autoComplete="off" onChange={(e) => setNote(e.target.value)} />}
      </FormField>
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

interface WeightRowProps {
  entry: WeightEntry;
  pre: PrePregnancy | null;
  profile: PregnancyProfile;
  lmp: LocalDate;
  today: LocalDate;
  onSave: (e: WeightEntry) => void;
  onDelete: () => void;
}

function WeightRow({ entry, pre, profile, lmp, today, onSave, onDelete }: WeightRowProps) {
  const [editing, setEditing] = useState(false);
  const ga = gestationalAge(profile.dueDate, entry.date);

  if (editing) {
    return (
      <li className="card entry">
        <EntryForm
          initial={entry}
          lmp={lmp}
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
  return (
    <li className="card entry">
      <p className="entry__title">
        {entry.weightKg} kg
        {pre && <span className="muted"> ({round1(entry.weightKg - pre.weightKg) >= 0 ? '+' : ''}{round1(entry.weightKg - pre.weightKg)} kg)</span>}
      </p>
      <p className="muted">
        {formatDisplayDate(entry.date)} · {formatWeeksDays(ga.weeks, ga.days)}
      </p>
      {entry.note && <p className="entry__note">{entry.note}</p>}
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
