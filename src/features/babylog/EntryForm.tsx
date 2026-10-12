import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from '../../app/router';
import { FormField } from '../../components/FormField';
import {
  ACTIVITIES,
  BOTTLE_TYPES,
  ENTRY_KINDS,
  MAX_BOTTLE_ML,
  MAX_NOTE,
  MAX_PUMP_ML,
  MAX_TEXT,
  NAPPIES,
  parseBabyLog,
  SIDES,
  SOLIDS_AMOUNTS,
  TEMP_MAX,
  TEMP_MIN,
  type ActivityKind,
  type BabyLogEntry,
  type BottleType,
  type EntryKind,
  type FeedSide,
  type NappyKind,
  type SolidsAmount,
} from '../../lib/babyLog';
import { newId, parseNumberInput } from '../../lib/validate';
import { ACTIVITY_LABEL, BOTTLE_LABEL, fromLocalInput, KIND_LABEL, NAPPY_LABEL, SIDE_LABEL, SOLIDS_LABEL, toLocalInput } from './labels';

const MIN = 60_000;
type Errors = Partial<Record<string, string>>;

/** Optional number field: null when empty, undefined when invalid. */
function num(raw: string, min: number, max: number, integer = false): number | null | undefined {
  const { value, error } = parseNumberInput(raw);
  if (error) return undefined;
  if (value === null) return null;
  if (value < min || value > max || (integer && !Number.isInteger(value))) return undefined;
  return value;
}

function Chips<T extends string>({ name, legend, options, labels, value, onChange }: {
  name: string;
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="chip-group">
      <legend className="field__label">{legend}</legend>
      {options.map((o) => (
        <label key={o} className={`chip${value === o ? ' is-selected' : ''}`}>
          <input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} />
          {labels[o]}
        </label>
      ))}
    </fieldset>
  );
}

const str = (v: number | null | undefined) => (v == null ? '' : String(v));

/**
 * Add an entry with details (or at an earlier time), or edit one. Builds the raw entry and runs it through
 * the same validator as stored data, so the form can't save anything storage would reject.
 */
export function EntryForm({ kind, initial, by, onKind, onSave, onCancel }: {
  kind: EntryKind;
  initial?: BabyLogEntry;
  by?: string;
  /** When adding, lets the user change what they're adding. */
  onKind?: (k: EntryKind) => void;
  onSave: (e: BabyLogEntry) => void;
  onCancel: () => void;
}) {
  const i = initial as Partial<Record<string, unknown>> | undefined;
  const [when, setWhen] = useState(toLocalInput(initial?.at ?? Date.now()));
  const [end, setEnd] = useState(typeof i?.end === 'number' ? toLocalInput(i.end) : '');
  const [side, setSide] = useState<FeedSide>((i?.side as FeedSide) ?? 'bottle');
  const [bottle, setBottle] = useState<BottleType | null>((i?.bottle as BottleType) ?? null);
  const [amount, setAmount] = useState(str(i?.ml as number | null));
  const [leftMin, setLeftMin] = useState(typeof i?.leftMs === 'number' ? String(Math.round(i.leftMs / MIN)) : '');
  const [rightMin, setRightMin] = useState(typeof i?.rightMs === 'number' ? String(Math.round(i.rightMs / MIN)) : '');
  const [nappy, setNappy] = useState<NappyKind>((i?.nappy as NappyKind) ?? 'wet');
  const [leftMl, setLeftMl] = useState(str(i?.leftMl as number | null));
  const [rightMl, setRightMl] = useState(str(i?.rightMl as number | null));
  const [food, setFood] = useState((i?.food as string) ?? '');
  const [solids, setSolids] = useState<SolidsAmount | null>((i?.amount as SolidsAmount) ?? null);
  const [name, setName] = useState((i?.name as string) ?? '');
  const [dose, setDose] = useState((i?.dose as string) ?? '');
  const [celsius, setCelsius] = useState(str(i?.celsius as number));
  const [activity, setActivity] = useState<ActivityKind>((i?.activity as ActivityKind) ?? 'tummy');
  const [weightKg, setWeightKg] = useState(typeof i?.weightG === 'number' ? String(i.weightG / 1000) : '');
  const [lengthCm, setLengthCm] = useState(str(i?.lengthCm as number | null));
  const [headCm, setHeadCm] = useState(str(i?.headCm as number | null));
  const [note, setNote] = useState(initial?.note ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.scrollIntoView({ block: 'start' });
    headingRef.current?.focus({ preventScroll: true });
  }, [initial?.id]);

  const timed = kind === 'sleep' || kind === 'pump' || kind === 'activity';

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const errs: Errors = {};
    const at = fromLocalInput(when);
    if (at === null) errs.when = 'Enter a date and time.';
    else if (at > Date.now() + 5 * MIN) errs.when = 'That’s in the future.';
    let endMs: number | null = null;
    if (timed && end) {
      endMs = fromLocalInput(end);
      if (endMs === null || (at !== null && endMs < at)) errs.end = 'The end has to be after the start.';
    } else if (kind === 'sleep') errs.end = 'Enter when they woke up.';

    const raw: Record<string, unknown> = { id: initial?.id ?? newId(), kind, at, note: note.trim() || undefined, by: initial?.by ?? (by || undefined) };
    switch (kind) {
      case 'feed': {
        raw.side = side;
        if (side === 'bottle') {
          const ml = num(amount, 1, MAX_BOTTLE_ML, true);
          if (ml === undefined) errs.amount = `Whole millilitres from 1 to ${MAX_BOTTLE_ML}, or leave it empty.`;
          Object.assign(raw, { ml, bottle: bottle ?? undefined });
        } else {
          const l = num(leftMin, 0, 240, true);
          const r = num(rightMin, 0, 240, true);
          if (l === undefined) errs.leftMin = 'Whole minutes, or leave it empty.';
          if (r === undefined) errs.rightMin = 'Whole minutes, or leave it empty.';
          if (l || r) {
            const leftMs = (l ?? 0) * MIN;
            const rightMs = (r ?? 0) * MIN;
            Object.assign(raw, { leftMs, rightMs, sideSince: null, end: (at ?? 0) + leftMs + rightMs });
          }
        }
        break;
      }
      case 'nappy':
        raw.nappy = nappy;
        break;
      case 'sleep':
      case 'pump':
      case 'activity':
        if (endMs !== null) raw.end = endMs;
        if (kind === 'activity') raw.activity = activity;
        if (kind === 'pump') {
          const l = num(leftMl, 1, MAX_PUMP_ML, true);
          const r = num(rightMl, 1, MAX_PUMP_ML, true);
          if (l === undefined) errs.leftMl = `Whole millilitres from 1 to ${MAX_PUMP_ML}, or leave it empty.`;
          if (r === undefined) errs.rightMl = `Whole millilitres from 1 to ${MAX_PUMP_ML}, or leave it empty.`;
          Object.assign(raw, { leftMl: l, rightMl: r });
        }
        break;
      case 'solids':
        if (!food.trim()) errs.food = 'What did they try?';
        Object.assign(raw, { food, amount: solids });
        break;
      case 'medicine':
        if (!name.trim()) errs.name = 'Enter the medicine’s name.';
        Object.assign(raw, { name, dose });
        break;
      case 'temp': {
        const c = num(celsius, TEMP_MIN, TEMP_MAX);
        if (c == null) errs.celsius = `Enter a temperature in °C, between ${TEMP_MIN} and ${TEMP_MAX}.`;
        raw.celsius = c;
        break;
      }
      case 'growth': {
        const kg = num(weightKg, 0.3, 30);
        const len = num(lengthCm, 20, 130);
        const head = num(headCm, 20, 60);
        if (kg === undefined) errs.weightKg = 'Enter kilograms, like 4.25.';
        if (len === undefined) errs.lengthCm = 'Enter centimetres, like 54.5.';
        if (head === undefined) errs.headCm = 'Enter centimetres, like 36.';
        if (kg === null && len === null && head === null) errs.weightKg = 'Enter at least one measurement.';
        Object.assign(raw, { weightG: kg == null ? null : Math.round(kg * 1000), lengthCm: len, headCm: head });
        break;
      }
    }

    const entry = Object.keys(errs).length ? null : parseBabyLog([raw])?.[0];
    if (!entry) {
      setErrors(Object.keys(errs).length ? errs : { form: 'Something in this entry doesn’t look right. Check the times and amounts.' });
      return;
    }
    onSave(entry);
  };

  const text = (id: string, label: string, value: string, set: (v: string) => void, opts: { hint?: string; numeric?: boolean; max?: number } = {}) => (
    <FormField id={`log-${id}`} label={label} hint={opts.hint} error={errors[id]}>
      {(aria) => (
        <input
          {...aria}
          className={`input${opts.numeric ? ' input--short' : ''}`}
          inputMode={opts.numeric ? 'decimal' : undefined}
          maxLength={opts.max ?? MAX_TEXT}
          value={value}
          onChange={(e) => set(e.target.value)}
        />
      )}
    </FormField>
  );

  return (
    <section className="card" aria-labelledby="log-form-h">
      <h2 id="log-form-h" ref={headingRef} tabIndex={-1}>
        {initial ? `Edit: ${KIND_LABEL[kind].toLowerCase()}` : 'Add an entry'}
      </h2>
      <form className="form" onSubmit={submit} noValidate>
        {onKind && <Chips name="log-kind" legend="What" options={ENTRY_KINDS} labels={KIND_LABEL} value={kind} onChange={onKind} />}
        <FormField id="log-when" label={timed ? 'Started' : 'When'} error={errors.when}>
          {(aria) => <input {...aria} className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}
        </FormField>
        {timed && (
          <FormField id="log-end" label={kind === 'sleep' ? 'Woke up' : 'Finished (optional)'} error={errors.end}>
            {(aria) => <input {...aria} className="input" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />}
          </FormField>
        )}

        {kind === 'feed' && (
          <>
            <Chips name="log-side" legend="Feed" options={SIDES} labels={SIDE_LABEL} value={side} onChange={setSide} />
            {side === 'bottle' ? (
              <>
                {text('amount', 'Amount (ml, optional)', amount, setAmount, { numeric: true, max: 4 })}
                <Chips name="log-bottle" legend="Milk (optional)" options={BOTTLE_TYPES} labels={BOTTLE_LABEL} value={bottle} onChange={setBottle} />
              </>
            ) : (
              <div className="inline-inputs">
                {text('leftMin', 'Minutes on left (optional)', leftMin, setLeftMin, { numeric: true, max: 3 })}
                {text('rightMin', 'Minutes on right (optional)', rightMin, setRightMin, { numeric: true, max: 3 })}
              </div>
            )}
          </>
        )}
        {kind === 'nappy' && <Chips name="log-nappy" legend="Nappy" options={NAPPIES} labels={NAPPY_LABEL} value={nappy} onChange={setNappy} />}
        {kind === 'pump' && (
          <div className="inline-inputs">
            {text('leftMl', 'Left (ml, optional)', leftMl, setLeftMl, { numeric: true, max: 4 })}
            {text('rightMl', 'Right (ml, optional)', rightMl, setRightMl, { numeric: true, max: 4 })}
          </div>
        )}
        {kind === 'solids' && (
          <>
            {text('food', 'Food', food, setFood, { hint: 'For example: pumpkin, baby rice, avocado' })}
            <Chips name="log-solids" legend="How much they ate (optional)" options={SOLIDS_AMOUNTS} labels={SOLIDS_LABEL} value={solids} onChange={setSolids} />
          </>
        )}
        {kind === 'medicine' && (
          <>
            {text('name', 'Medicine', name, setName)}
            {text('dose', 'Dose (optional)', dose, setDose, { hint: 'As written on the label or by your doctor or pharmacist' })}
          </>
        )}
        {kind === 'temp' && (
          <>
            {text('celsius', 'Temperature (°C)', celsius, setCelsius, { numeric: true, max: 5 })}
            <p className="muted">
              Worried about a temperature? See <Link to="/help">when to get help</Link> on the Help tab.
            </p>
          </>
        )}
        {kind === 'activity' && <Chips name="log-activity" legend="Activity" options={ACTIVITIES} labels={ACTIVITY_LABEL} value={activity} onChange={setActivity} />}
        {kind === 'growth' && (
          <>
            {text('weightKg', 'Weight (kg, optional)', weightKg, setWeightKg, { numeric: true, max: 6 })}
            {text('lengthCm', 'Length (cm, optional)', lengthCm, setLengthCm, { numeric: true, max: 5 })}
            {text('headCm', 'Head (cm, optional)', headCm, setHeadCm, { numeric: true, max: 4 })}
          </>
        )}

        <FormField id="log-note" label="Note (optional)" error={errors.note}>
          {(aria) => <textarea {...aria} className="input" rows={2} maxLength={MAX_NOTE} value={note} onChange={(e) => setNote(e.target.value)} />}
        </FormField>

        {errors.form && (
          <p className="field__error" role="alert">
            {errors.form}
          </p>
        )}
        <div className="button-row">
          <button type="submit" className="btn btn--primary">
            Save
          </button>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
