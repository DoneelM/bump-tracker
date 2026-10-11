import { lazy, Suspense, useState, type FormEvent } from 'react';
import { CallCard } from '../../components/CallCard';
import { FormField } from '../../components/FormField';
import { Page } from '../../components/Page';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import {
  glucoseAboveTarget,
  glucoseContextLabel,
  GLUCOSE_CONTEXTS,
  isValidTime,
  MAX_READING_NOTE_LENGTH,
  MAX_READINGS,
  newestFirst,
  parseGlucoseReadings,
  parseTargets,
  roundMmol,
  validateGlucose,
  validateReadingDate,
  type GlucoseContext,
  type GlucoseReading,
  type MonitoringTargets,
} from '../../lib/monitoring';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { newId, parseNumberInput } from '../../lib/validate';
import { useTargets } from './BpPage';
import { AboveTargetNote, epoch, MonitoringIntro, timeNow } from './shared';

const MonitorChart = lazy(() => import('./MonitorChart').then((m) => ({ default: m.MonitorChart })));
const NONE: GlucoseReading[] = [];
const TARGET_CONTEXTS = ['fasting', '1h', '2h'] as const;

export function GlucosePage({ today }: { today: LocalDate }) {
  const [readings, setReadings] = useStoredState<GlucoseReading[]>(STORAGE_KEYS.glucoseReadings, NONE, parseGlucoseReadings);
  const [targets, setTargets] = useTargets();
  const sorted = newestFirst(readings);
  const latest = sorted[0];
  const [error, setError] = useState<string | null>(null);
  const rows = [...sorted].reverse().map((r) => ({ t: epoch(r), [r.context]: r.mmol }));
  const limits = TARGET_CONTEXTS.flatMap((c) => (targets.glucoseMax[c] !== undefined ? [{ value: targets.glucoseMax[c]!, label: `${glucoseContextLabel(c)} limit ${targets.glucoseMax[c]}` }] : []));
  const shown = GLUCOSE_CONTEXTS.filter((c) => readings.some((r) => r.context === c.value));

  return (
    <Page title="Glucose" icon="🩸" back={{ to: '/tools', label: 'Tools' }}>
      <MonitoringIntro what="blood glucose (sugar)" sourceId="healthnz-diabetes-testing" topic="diabetes in pregnancy" />
      {latest && glucoseAboveTarget(latest, targets) && (
        <AboveTargetNote>
          <CallCard title="Call your care team" as="h3" />
        </AboveTargetNote>
      )}
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <GlucoseForm
        today={today}
        full={readings.length >= MAX_READINGS}
        onAdd={(r) => {
          const res = setReadings((prev) => [...prev, r]);
          setError(res.ok ? null : res.error);
          return res.ok;
        }}
      />
      <GlucoseTargets targets={targets} onSave={setTargets} />
      {rows.length > 1 && (
        <section className="card" aria-labelledby="g-chart">
          <h2 id="g-chart">Over time</h2>
          <Suspense fallback={<p className="muted">Loading chart...</p>}>
            <MonitorChart
              rows={rows}
              unit="mmol/L"
              limits={limits}
              series={shown.map((c, i) => ({ key: c.value, name: c.label, className: i % 2 ? 'chart-alt' : 'chart-you' }))}
            />
          </Suspense>
        </section>
      )}
      <section aria-labelledby="g-list">
        <h2 id="g-list">Your readings</h2>
        {sorted.length === 0 ? (
          <p className="muted">No readings yet.</p>
        ) : (
          <ul className="question-list">
            {sorted.map((r) => {
              const above = glucoseAboveTarget(r, targets);
              return (
                <li key={r.id} className={`card question${above ? ' reading--above' : ''}`}>
                  <span>
                    <strong>{r.mmol.toFixed(1)}</strong> mmol/L, {glucoseContextLabel(r.context).toLowerCase()}
                    {above && <span className="tag tag--warn">Above your target</span>}
                    <br />
                    <span className="muted">
                      {formatDisplayDate(r.date)}
                      {r.time && ` ${r.time}`}
                    </span>
                    {r.note && <span className="entry__note"> {r.note}</span>}
                  </span>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => {
                      if (window.confirm('Delete this reading?')) setReadings((prev) => prev.filter((x) => x.id !== r.id));
                    }}
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Page>
  );
}

function GlucoseForm({ today, full, onAdd }: { today: LocalDate; full: boolean; onAdd: (r: GlucoseReading) => boolean }) {
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(timeNow);
  const [mmol, setMmol] = useState('');
  const [context, setContext] = useState<GlucoseContext>('fasting');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (full) return setError('You have the maximum number of readings. Delete some old ones first.');
    const m = parseNumberInput(mmol);
    if (m.error) return setError(m.error);
    const v = validateGlucose(m.value);
    if (!v.ok) return setError(v.error);
    const dv = validateReadingDate(date, today);
    if (!dv.ok) return setError(dv.error);
    if (!isValidTime(time)) return setError('Please enter a valid time.');
    if (onAdd({ id: newId(), date, time, context, mmol: roundMmol(m.value!), note: note.trim() })) {
      setMmol('');
      setNote('');
      setTime(timeNow());
      setError(null);
    }
  };

  return (
    <form className="card form" onSubmit={submit} noValidate aria-labelledby="g-add">
      <h2 id="g-add">Add a reading</h2>
      <FormField id="g-mmol" label="Reading (mmol/L)">
        {(aria) => <input {...aria} className="input input--short" inputMode="decimal" value={mmol} onChange={(e) => setMmol(e.target.value)} />}
      </FormField>
      <fieldset className="choice">
        <legend className="field__label">When</legend>
        <div className="chip-group">
          {GLUCOSE_CONTEXTS.map((c) => (
            <label key={c.value} className={`chip${context === c.value ? ' is-selected' : ''}`}>
              <input type="radio" name="g-context" checked={context === c.value} onChange={() => setContext(c.value)} />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="inline-inputs">
        <FormField id="g-date" label="Date">
          {(aria) => <input {...aria} type="date" className="input" max={today} value={date} onChange={(e) => setDate(e.target.value)} />}
        </FormField>
        <FormField id="g-time" label="Time">
          {(aria) => <input {...aria} type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />}
        </FormField>
      </div>
      <FormField id="g-note" label="Note (optional)">
        {(aria) => <input {...aria} className="input" maxLength={MAX_READING_NOTE_LENGTH} value={note} onChange={(e) => setNote(e.target.value)} />}
      </FormField>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row">
        <button type="submit" className="btn btn--primary">
          Save reading
        </button>
      </div>
    </form>
  );
}

function GlucoseTargets({ targets, onSave }: { targets: MonitoringTargets; onSave: (t: MonitoringTargets) => { ok: boolean; error?: string } }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(TARGET_CONTEXTS.map((c) => [c, targets.glucoseMax[c]?.toString() ?? ''])),
  );
  const [error, setError] = useState<string | null>(null);
  const set = TARGET_CONTEXTS.filter((c) => targets.glucoseMax[c] !== undefined);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const glucoseMax: MonitoringTargets['glucoseMax'] = {};
    for (const c of TARGET_CONTEXTS) {
      const p = parseNumberInput(draft[c] ?? '');
      if (p.error) return setError(p.error);
      if (p.value !== null) glucoseMax[c] = p.value;
    }
    const next = { ...targets, glucoseMax };
    if (parseTargets(next) === null) return setError('Those limits don’t look right. Check them against what your team gave you.');
    const r = onSave(next);
    if (!r.ok) return setError(r.error ?? 'Could not save.');
    setError(null);
    setEditing(false);
  };

  return (
    <section className="card" aria-labelledby="g-targets">
      <h2 id="g-targets">Your targets</h2>
      {!editing ? (
        <>
          <p>
            {set.length === 0
              ? 'None entered. Add the upper limits your care team gave you, if they gave you any.'
              : `Upper limits from your care team: ${set.map((c) => `${glucoseContextLabel(c).toLowerCase()} ${targets.glucoseMax[c]}`).join(', ')} mmol/L.`}
          </p>
          <button type="button" className="btn btn--ghost" onClick={() => setEditing(true)}>
            Edit targets
          </button>
        </>
      ) : (
        <form className="form" onSubmit={save} noValidate>
          <p className="muted">Only enter numbers your care team gave you, in mmol/L. Leave blank if they didn’t give one.</p>
          {TARGET_CONTEXTS.map((c) => (
            <FormField key={c} id={`t-${c}`} label={`${glucoseContextLabel(c)}: no higher than`}>
              {(aria) => (
                <input {...aria} className="input input--short" inputMode="decimal" value={draft[c] ?? ''} onChange={(e) => setDraft({ ...draft, [c]: e.target.value })} />
              )}
            </FormField>
          ))}
          {error && (
            <p className="field__error" role="alert">
              {error}
            </p>
          )}
          <div className="button-row">
            <button type="submit" className="btn btn--primary">
              Save targets
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
