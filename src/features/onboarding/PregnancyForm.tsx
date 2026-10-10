import { useState, type FormEvent } from 'react';
import { FormField } from '../../components/FormField';
import { addDays, formatDisplayDate, type LocalDate } from '../../lib/dates';
import {
  daysUntilDue,
  formatWeeksDays,
  gestationalAge,
  MAX_LMP_AGE_DAYS,
  trimester,
  validateLMP,
  validateScanDate,
  validateScanGA,
} from '../../lib/pregnancy';
import {
  createProfile,
  dueDateFor,
  MAX_NICKNAME_LENGTH,
  validateDating,
  validateNickname,
  type DatingInput,
  type PregnancyProfile,
} from '../../lib/profile';
import { parseNumberInput } from '../../lib/validate';

type Method = DatingInput['method'];

interface FormErrors {
  lmp?: string;
  scanDate?: string;
  scanGa?: string;
  nickname?: string;
}

interface PregnancyFormProps {
  today: LocalDate;
  initial: PregnancyProfile | null;
  submitLabel: string;
  onSave: (profile: PregnancyProfile) => string | null;
  onCancel?: () => void;
}

/**
 * Two-step form: enter LMP or dating-scan details, then confirm the calculated due date.
 * `onSave` returns an error message if saving failed.
 */
export function PregnancyForm({ today, initial, submitLabel, onSave, onCancel }: PregnancyFormProps) {
  const init = initial?.dating;
  const [method, setMethod] = useState<Method>(init?.method ?? 'lmp');
  const [lmp, setLmp] = useState(init?.method === 'lmp' ? init.lmp : '');
  const [scanDate, setScanDate] = useState(init?.method === 'scan' ? init.scanDate : '');
  const [gaWeeks, setGaWeeks] = useState(init?.method === 'scan' ? String(init.gaWeeks) : '');
  const [gaDays, setGaDays] = useState(init?.method === 'scan' ? String(init.gaDays) : '0');
  const [nickname, setNickname] = useState(initial?.nickname ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState<DatingInput | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function collect(): { dating: DatingInput | null; errors: FormErrors } {
    const errs: FormErrors = {};
    const nick = validateNickname(nickname);
    if (!nick.ok) errs.nickname = nick.error;

    if (method === 'lmp') {
      const r = validateLMP(lmp, today);
      if (!r.ok) errs.lmp = r.error;
      return { dating: r.ok && nick.ok ? { method: 'lmp', lmp } : null, errors: errs };
    }

    const dateResult = validateScanDate(scanDate, today);
    if (!dateResult.ok) errs.scanDate = dateResult.error;
    const w = parseNumberInput(gaWeeks);
    const d = parseNumberInput(gaDays);
    if (w.error || w.value === null) {
      errs.scanGa = w.error ?? 'Please enter the weeks from your scan report.';
    } else if (d.error || d.value === null) {
      errs.scanGa = d.error ?? 'Please choose the days.';
    } else {
      const gaResult = validateScanGA(w.value, d.value);
      if (!gaResult.ok) errs.scanGa = gaResult.error;
    }
    if (errs.scanDate || errs.scanGa || errs.nickname) return { dating: null, errors: errs };

    const dating: DatingInput = { method: 'scan', scanDate, gaWeeks: w.value!, gaDays: d.value! };
    const whole = validateDating(dating, today);
    if (!whole.ok) return { dating: null, errors: { scanDate: whole.error } };
    return { dating, errors: errs };
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = collect();
    setErrors(result.errors);
    setPending(result.dating);
  }

  function handleConfirm() {
    if (!pending) return;
    const error = onSave(createProfile(pending, nickname));
    setSaveError(error);
  }

  if (pending) {
    const due = dueDateFor(pending);
    const ga = gestationalAge(due, today);
    const daysLeft = daysUntilDue(due, today);
    return (
      <section className="card confirm" aria-labelledby="confirm-heading">
        <h2 id="confirm-heading">Your estimated due date</h2>
        <p className="confirm__date">{formatDisplayDate(due)}</p>
        <ul className="confirm__facts">
          <li>
            Today you are <strong>{formatWeeksDays(ga.weeks, ga.days)}</strong> (trimester {trimester(ga.totalDays)}).
          </li>
          <li>
            {daysLeft >= 0
              ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to go.`
              : `Your due date was ${-daysLeft} ${daysLeft === -1 ? 'day' : 'days'} ago.`}
          </li>
          {nickname.trim() && (
            <li>
              Nickname: <strong>{nickname.trim()}</strong>
            </li>
          )}
        </ul>
        <p className="muted">
          This is an estimate. Your midwife/LMC may give you a different date, especially after a dating scan. You
          can change it any time in Settings.
        </p>
        {saveError && (
          <p className="field__error" role="alert">
            {saveError}
          </p>
        )}
        <div className="button-row">
          <button type="button" className="btn btn--primary" onClick={handleConfirm}>
            {submitLabel}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setPending(null)}>
            Change details
          </button>
        </div>
      </section>
    );
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <fieldset className="choice">
        <legend className="field__label">How would you like to work out your due date?</legend>
        <label className={`choice__option${method === 'lmp' ? ' is-selected' : ''}`}>
          <input type="radio" name="method" value="lmp" checked={method === 'lmp'} onChange={() => setMethod('lmp')} />
          <span>
            <strong>First day of my last period</strong>
            <span className="choice__desc">Also called LMP</span>
          </span>
        </label>
        <label className={`choice__option${method === 'scan' ? ' is-selected' : ''}`}>
          <input
            type="radio"
            name="method"
            value="scan"
            checked={method === 'scan'}
            onChange={() => setMethod('scan')}
          />
          <span>
            <strong>My dating scan</strong>
            <span className="choice__desc">Scan date and how many weeks + days it showed</span>
          </span>
        </label>
      </fieldset>

      {method === 'lmp' ? (
        <FormField id="lmp" label="First day of your last period" error={errors.lmp}>
          {(aria) => (
            <input
              {...aria}
              type="date"
              className="input"
              value={lmp}
              min={addDays(today, -MAX_LMP_AGE_DAYS)}
              max={today}
              onChange={(e) => setLmp(e.target.value)}
              required
            />
          )}
        </FormField>
      ) : (
        <>
          <FormField id="scan-date" label="Date of your scan" error={errors.scanDate}>
            {(aria) => (
              <input
                {...aria}
                type="date"
                className="input"
                value={scanDate}
                max={today}
                onChange={(e) => setScanDate(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField
            id="scan-weeks"
            label="Gestational age at the scan"
            hint="As written on your scan report, e.g. 12 weeks 3 days."
            error={errors.scanGa}
          >
            {(aria) => (
              <div className="inline-inputs">
                <input
                  {...aria}
                  type="number"
                  inputMode="numeric"
                  className="input input--short"
                  min={4}
                  max={42}
                  step={1}
                  value={gaWeeks}
                  onChange={(e) => setGaWeeks(e.target.value)}
                  required
                />
                <span>weeks</span>
                <select
                  aria-label="Days"
                  aria-invalid={aria['aria-invalid']}
                  className="input input--short"
                  value={gaDays}
                  onChange={(e) => setGaDays(e.target.value)}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span>days</span>
              </div>
            )}
          </FormField>
        </>
      )}

      <FormField
        id="nickname"
        label="Baby’s nickname (optional)"
        hint="Just for fun, e.g. “Peanut”."
        error={errors.nickname}
      >
        {(aria) => (
          <input
            {...aria}
            type="text"
            className="input"
            value={nickname}
            maxLength={MAX_NICKNAME_LENGTH}
            autoComplete="off"
            onChange={(e) => setNickname(e.target.value)}
          />
        )}
      </FormField>

      <div className="button-row">
        <button type="submit" className="btn btn--primary">
          Calculate due date
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
