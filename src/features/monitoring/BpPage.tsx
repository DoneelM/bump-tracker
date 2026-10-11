import { lazy, Suspense, useState, type FormEvent } from 'react';
import { CallCard } from '../../components/CallCard';
import { FormField } from '../../components/FormField';
import { GuidanceCard } from '../../components/GuidanceCard';
import { Page } from '../../components/Page';
import { PRE_ECLAMPSIA } from '../../data/guidance';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import {
  bpAboveTarget,
  isValidTime,
  MAX_READING_NOTE_LENGTH,
  MAX_READINGS,
  newestFirst,
  NO_TARGETS,
  parseBpReadings,
  parseTargets,
  validateBp,
  validateReadingDate,
  type BpReading,
  type MonitoringTargets,
} from '../../lib/monitoring';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { newId, parseNumberInput } from '../../lib/validate';
import { AboveTargetNote, epoch, MonitoringIntro, timeNow } from './shared';

const MonitorChart = lazy(() => import('./MonitorChart').then((m) => ({ default: m.MonitorChart })));
const NONE: BpReading[] = [];

export function useTargets() {
  return useStoredState<MonitoringTargets>(STORAGE_KEYS.monitoringTargets, NO_TARGETS, parseTargets);
}


export function BpPage({ today }: { today: LocalDate }) {
  const [readings, setReadings] = useStoredState<BpReading[]>(STORAGE_KEYS.bpReadings, NONE, parseBpReadings);
  const [targets, setTargets] = useTargets();
  const sorted = newestFirst(readings);
  const latest = sorted[0];
  const [error, setError] = useState<string | null>(null);

  const rows = [...sorted].reverse().map((r) => ({ t: epoch(r), sys: r.systolic, dia: r.diastolic }));
  const limits = [
    ...(targets.bpSystolicMax !== null ? [{ value: targets.bpSystolicMax, label: `Top limit ${targets.bpSystolicMax}` }] : []),
    ...(targets.bpDiastolicMax !== null ? [{ value: targets.bpDiastolicMax, label: `Bottom limit ${targets.bpDiastolicMax}` }] : []),
  ];

  return (
    <Page title="Blood pressure" icon="💓" back={{ to: '/tools', label: 'Tools' }}>
      <MonitoringIntro what="blood pressure" sourceId="healthnz-pre-eclampsia" topic="high blood pressure and pre-eclampsia" />
      {latest && bpAboveTarget(latest, targets) && (
        <AboveTargetNote>
          <CallCard title="Call your care team" as="h3" />
        </AboveTargetNote>
      )}
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <BpForm
        today={today}
        full={readings.length >= MAX_READINGS}
        onAdd={(r) => {
          const res = setReadings((prev) => [...prev, r]);
          setError(res.ok ? null : res.error);
          return res.ok;
        }}
      />
      <BpTargets targets={targets} onSave={(t) => setTargets(t)} />
      {rows.length > 1 && (
        <section className="card" aria-labelledby="bp-chart">
          <h2 id="bp-chart">Over time</h2>
          <Suspense fallback={<p className="muted">Loading chart...</p>}>
            <MonitorChart
              rows={rows}
              unit="mmHg"
              limits={limits}
              series={[
                { key: 'sys', name: 'Top (systolic)', className: 'chart-you' },
                { key: 'dia', name: 'Bottom (diastolic)', className: 'chart-alt' },
              ]}
            />
          </Suspense>
        </section>
      )}
      <section aria-labelledby="bp-list">
        <h2 id="bp-list">Your readings</h2>
        {sorted.length === 0 ? (
          <p className="muted">No readings yet.</p>
        ) : (
          <ul className="question-list">
            {sorted.map((r) => {
              const above = bpAboveTarget(r, targets);
              return (
                <li key={r.id} className={`card question${above ? ' reading--above' : ''}`}>
                  <span>
                    <strong>
                      {r.systolic}/{r.diastolic}
                    </strong>{' '}
                    mmHg{r.pulse !== null && `, pulse ${r.pulse}`}
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
      <GuidanceCard g={PRE_ECLAMPSIA} />
    </Page>
  );
}

function BpForm({ today, full, onAdd }: { today: LocalDate; full: boolean; onAdd: (r: BpReading) => boolean }) {
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(timeNow);
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [pulse, setPulse] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (full) return setError('You have the maximum number of readings. Delete some old ones first.');
    const s = parseNumberInput(sys);
    const d = parseNumberInput(dia);
    const p = parseNumberInput(pulse);
    const err = s.error ?? d.error ?? p.error;
    if (err) return setError(err);
    const v = validateBp(s.value, d.value, p.value);
    if (!v.ok) return setError(v.error);
    const dv = validateReadingDate(date, today);
    if (!dv.ok) return setError(dv.error);
    if (!isValidTime(time)) return setError('Please enter a valid time.');
    const ok = onAdd({ id: newId(), date, time, systolic: s.value!, diastolic: d.value!, pulse: p.value, note: note.trim() });
    if (ok) {
      setSys('');
      setDia('');
      setPulse('');
      setNote('');
      setTime(timeNow());
      setError(null);
    }
  };

  return (
    <form className="card form" onSubmit={submit} noValidate aria-labelledby="bp-add">
      <h2 id="bp-add">Add a reading</h2>
      <div className="inline-inputs">
        <FormField id="bp-sys" label="Top (systolic)">
          {(aria) => <input {...aria} className="input input--short" inputMode="numeric" value={sys} onChange={(e) => setSys(e.target.value)} />}
        </FormField>
        <FormField id="bp-dia" label="Bottom (diastolic)">
          {(aria) => <input {...aria} className="input input--short" inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value)} />}
        </FormField>
        <FormField id="bp-pulse" label="Pulse (optional)">
          {(aria) => <input {...aria} className="input input--short" inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value)} />}
        </FormField>
      </div>
      <div className="inline-inputs">
        <FormField id="bp-date" label="Date">
          {(aria) => <input {...aria} type="date" className="input" max={today} value={date} onChange={(e) => setDate(e.target.value)} />}
        </FormField>
        <FormField id="bp-time" label="Time">
          {(aria) => <input {...aria} type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />}
        </FormField>
      </div>
      <FormField id="bp-note" label="Note (optional)">
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

function BpTargets({ targets, onSave }: { targets: MonitoringTargets; onSave: (t: MonitoringTargets) => { ok: boolean; error?: string } }) {
  const [editing, setEditing] = useState(false);
  const [sys, setSys] = useState(targets.bpSystolicMax?.toString() ?? '');
  const [dia, setDia] = useState(targets.bpDiastolicMax?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const s = parseNumberInput(sys);
    const d = parseNumberInput(dia);
    const err = s.error ?? d.error;
    if (err) return setError(err);
    const next = { ...targets, bpSystolicMax: s.value, bpDiastolicMax: d.value };
    if (parseTargets(next) === null) return setError('Those limits don’t look right. Check them against what your team gave you.');
    const r = onSave(next);
    if (!r.ok) return setError(r.error ?? 'Could not save.');
    setError(null);
    setEditing(false);
  };

  return (
    <section className="card" aria-labelledby="bp-targets">
      <h2 id="bp-targets">Your targets</h2>
      {!editing ? (
        <>
          <p>
            {targets.bpSystolicMax === null && targets.bpDiastolicMax === null
              ? 'None entered. Add the upper limits your care team gave you, if they gave you any.'
              : `Upper limits from your care team: top ${targets.bpSystolicMax ?? 'not set'}, bottom ${targets.bpDiastolicMax ?? 'not set'}.`}
          </p>
          <button type="button" className="btn btn--ghost" onClick={() => setEditing(true)}>
            Edit targets
          </button>
        </>
      ) : (
        <form className="form" onSubmit={save} noValidate>
          <p className="muted">Only enter numbers your care team gave you. Leave blank if they didn’t give one.</p>
          <div className="inline-inputs">
            <FormField id="t-sys" label="Top no higher than">
              {(aria) => <input {...aria} className="input input--short" inputMode="numeric" value={sys} onChange={(e) => setSys(e.target.value)} />}
            </FormField>
            <FormField id="t-dia" label="Bottom no higher than">
              {(aria) => <input {...aria} className="input input--short" inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value)} />}
            </FormField>
          </div>
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
