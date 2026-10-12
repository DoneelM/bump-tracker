import { useEffect, useRef, useState, type FormEvent } from 'react';
import { navigate } from '../../app/router';
import { FormField } from '../../components/FormField';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import {
  MAX_BABY_NAME_LENGTH,
  MAX_BIRTH_WEIGHT_G,
  MIN_BIRTH_WEIGHT_G,
  validateEndingDate,
  type PregnancyEnding,
  type PregnancyProfile,
} from '../../lib/profile';
import { useProfile } from '../../lib/useProfile';

/** Marks the pregnancy as ended (baby born, or pregnancy ended) so the app stops pregnancy updates; can be undone. */
export function EndingSection({
  profile,
  today,
  startBorn = false,
}: {
  profile: PregnancyProfile;
  today: LocalDate;
  /** Opened from Home's "Has your baby arrived?": show the birth form straight away, then go Home on save. */
  startBorn?: boolean;
}) {
  const [, setProfile] = useProfile();
  const [form, setForm] = useState<'born' | 'ended' | null>(startBorn && !profile.ending ? 'born' : null);
  const sectionRef = useRef<HTMLElement>(null);

  // Page scrolls to the top and focuses its heading after its children mount, so do this just after.
  useEffect(() => {
    if (!startBorn) return;
    const id = window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ block: 'start' });
      sectionRef.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(id);
  }, [startBorn]);
  const [date, setDate] = useState<string>(today);
  const [name, setName] = useState(profile.nickname);
  const [weight, setWeight] = useState('');
  const [errors, setErrors] = useState<{ date?: string; weight?: string; save?: string }>({});

  const write = (ending: PregnancyEnding | undefined) => {
    const next: PregnancyProfile = { ...profile, updatedAt: new Date().toISOString() };
    if (ending) next.ending = ending;
    else delete next.ending;
    const r = setProfile(next);
    if (!r.ok) setErrors({ save: r.error });
    else if (startBorn && ending?.kind === 'born') navigate('/');
    else setForm(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const d = validateEndingDate(date, profile.dueDate, today, form === 'born');
    const errs: typeof errors = {};
    if (!d.ok) errs.date = d.error;
    let weightG: number | null = null;
    if (form === 'born' && weight.trim()) {
      weightG = Number(weight.trim());
      if (!Number.isInteger(weightG) || weightG < MIN_BIRTH_WEIGHT_G || weightG > MAX_BIRTH_WEIGHT_G) {
        errs.weight = `Enter the weight in grams, between ${MIN_BIRTH_WEIGHT_G} and ${MAX_BIRTH_WEIGHT_G}.`;
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    write(form === 'born' ? { kind: 'born', date, name: name.trim(), weightG } : { kind: 'ended', date: date || null });
  };

  const ending = profile.ending;
  if (ending) {
    return (
      <section className="card" aria-labelledby="ending-heading">
        <h2 id="ending-heading">{ending.kind === 'born' ? 'Your baby’s birth' : 'Your pregnancy has ended'}</h2>
        {ending.kind === 'born' ? (
          <dl className="details">
            <dt>Born</dt>
            <dd>{formatDisplayDate(ending.date)}</dd>
            <dt>Name</dt>
            <dd>{ending.name || 'Not set'}</dd>
            <dt>Weight</dt>
            <dd>{ending.weightG ? `${ending.weightG} g` : 'Not set'}</dd>
          </dl>
        ) : (
          <p>{ending.date ? `Ended ${formatDisplayDate(ending.date)}.` : 'Pregnancy updates are turned off.'}</p>
        )}
        <div className="button-row">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              if (window.confirm('Undo this and show pregnancy updates again?')) write(undefined);
            }}
          >
            Undo
          </button>
        </div>
        {errors.save && (
          <p className="field__error" role="alert">
            {errors.save}
          </p>
        )}
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="card ending-section" aria-labelledby="ending-heading">
      <h2 id="ending-heading">{startBorn ? 'Your baby’s birth' : 'When your pregnancy ends'}</h2>
      {!form ? (
        <>
          <p className="muted">The app stops showing pregnancy updates. Everything you’ve logged stays, and you can undo this.</p>
          <div className="button-row">
            <button type="button" className="btn btn--ghost" onClick={() => setForm('born')}>
              Baby’s here
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setDate('');
                setForm('ended');
              }}
            >
              My pregnancy has ended
            </button>
          </div>
        </>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
          {form === 'ended' && (
            <p>
              We’re so sorry. The app will stop showing pregnancy updates. Your data stays on this device until you choose to delete it.
            </p>
          )}
          <FormField id="ending-date" label={form === 'born' ? 'Date of birth' : 'Date (optional)'} error={errors.date}>
            {(aria) => <input {...aria} type="date" className="input" max={today} value={date} onChange={(e) => setDate(e.target.value)} />}
          </FormField>
          {form === 'born' && (
            <>
              <FormField id="ending-name" label="Baby’s name (optional)">
                {(aria) => (
                  <input {...aria} className="input" maxLength={MAX_BABY_NAME_LENGTH} value={name} onChange={(e) => setName(e.target.value)} />
                )}
              </FormField>
              <FormField id="ending-weight" label="Birth weight in grams (optional)" error={errors.weight}>
                {(aria) => (
                  <input
                    {...aria}
                    type="number"
                    inputMode="numeric"
                    className="input input--short"
                    min={MIN_BIRTH_WEIGHT_G}
                    max={MAX_BIRTH_WEIGHT_G}
                    step={1}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                )}
              </FormField>
            </>
          )}
          {errors.save && (
            <p className="field__error" role="alert">
              {errors.save}
            </p>
          )}
          <div className="button-row">
            <button type="submit" className="btn btn--primary">
              {form === 'born' ? 'Save' : 'Turn off pregnancy updates'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
