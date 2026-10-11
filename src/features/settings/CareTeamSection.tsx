import { useState, type FormEvent } from 'react';
import { useCareTeam } from '../../components/CallCard';
import { FormField } from '../../components/FormField';
import { CARE_ROLE_LABEL, CARE_ROLES, isValidPhone, MAX_CONTACT_NAME_LENGTH, MAX_PHONE_LENGTH, type CareRole, type CareTeam } from '../../lib/careTeam';

type Draft = Record<CareRole, { name: string; phone: string }>;

const toDraft = (team: CareTeam): Draft =>
  Object.fromEntries(CARE_ROLES.map((r) => [r, { name: team[r]?.name ?? '', phone: team[r]?.phone ?? '' }])) as Draft;

/** Phone numbers for the user's own care team, used by the call cards. Stored on this device (and synced, if on). */
export function CareTeamSection() {
  const [team, setTeam] = useCareTeam();
  const [draft, setDraft] = useState<Draft>(() => toDraft(team));
  const [errors, setErrors] = useState<Partial<Record<CareRole, string>>>({});
  const [status, setStatus] = useState<string | null>(null);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const next: CareTeam = {};
    const errs: Partial<Record<CareRole, string>> = {};
    for (const r of CARE_ROLES) {
      const name = draft[r].name.trim();
      const phone = draft[r].phone.trim();
      if (!phone) {
        if (name) errs[r] = 'Add a phone number, or clear the name.';
        continue;
      }
      if (!isValidPhone(phone)) errs[r] = 'Use digits, spaces, + ( ) or - only.';
      else next[r] = { name, phone };
    }
    setErrors(errs);
    if (Object.keys(errs).length) return setStatus(null);
    const result = setTeam(next);
    setStatus(result.ok ? 'Saved.' : result.error);
  };

  return (
    <section className="card" aria-labelledby="care-heading">
      <h2 id="care-heading">Care team numbers</h2>
      <p className="muted">For one-tap calling from Home, the contraction timer and the kick counter. Leave any blank.</p>
      <form className="form" onSubmit={save} noValidate>
        {CARE_ROLES.map((r) => (
          <fieldset key={r} className="care-fieldset">
            <legend className="field__label">{CARE_ROLE_LABEL[r]}</legend>
            <FormField id={`care-${r}-name`} label="Name (optional)">
              {(aria) => (
                <input
                  {...aria}
                  className="input"
                  maxLength={MAX_CONTACT_NAME_LENGTH}
                  value={draft[r].name}
                  onChange={(e) => setDraft({ ...draft, [r]: { ...draft[r], name: e.target.value } })}
                />
              )}
            </FormField>
            <FormField id={`care-${r}-phone`} label="Phone" error={errors[r]}>
              {(aria) => (
                <input
                  {...aria}
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  className="input"
                  maxLength={MAX_PHONE_LENGTH}
                  value={draft[r].phone}
                  onChange={(e) => setDraft({ ...draft, [r]: { ...draft[r], phone: e.target.value } })}
                />
              )}
            </FormField>
          </fieldset>
        ))}
        {status && (
          <p className={status === 'Saved.' ? 'card card--success' : 'field__error'} role="status">
            {status}
          </p>
        )}
        <div className="button-row">
          <button type="submit" className="btn btn--primary">
            Save numbers
          </button>
        </div>
      </form>
    </section>
  );
}
