import { useState, type FormEvent } from 'react';
import { FormField } from '../../components/FormField';
import { Page } from '../../components/Page';
import { formatDisplayDate, isPlausibleDate, type LocalDate } from '../../lib/dates';
import { FIRST_IDEAS, MAX_FIRST_NOTE, MAX_FIRST_TITLE, parseFirsts, type First } from '../../lib/firsts';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { newId } from '../../lib/validate';

const NONE: First[] = [];

/** A keepsake list of baby's firsts. A memory book, not a checklist: no ages, nothing is "due". */
export function FirstsPage({ today }: { today: LocalDate }) {
  const [firsts, setFirsts] = useStoredState<First[]>(STORAGE_KEYS.firsts, NONE, parseFirsts);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string>(today);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ title?: string; date?: string; save?: string }>({});
  const done = new Set(firsts.map((f) => f.title.toLowerCase()));

  const add = (ev: FormEvent) => {
    ev.preventDefault();
    const errs: typeof errors = {};
    if (!title.trim()) errs.title = 'What happened?';
    if (!isPlausibleDate(date) || date > today) errs.date = 'Choose a date up to today.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const r = setFirsts((prev) => parseFirsts([{ id: newId(), date, title: title.trim(), note: note.trim() }, ...prev]) ?? prev);
    if (!r.ok) return setErrors({ save: r.error });
    setTitle('');
    setNote('');
    setDate(today);
  };

  return (
    <Page title="Firsts" icon="⭐" back={{ to: '/', label: 'Home' }}>
      <p className="lead">A place to keep the little moments. Every baby does things in their own time.</p>

      <form className="card form" onSubmit={add} noValidate>
        <div className="chip-group" aria-label="Ideas">
          {FIRST_IDEAS.filter((i) => !done.has(i.toLowerCase())).map((i) => (
            <button key={i} type="button" className={`chip${title === i ? ' is-selected' : ''}`} onClick={() => setTitle(i)}>
              {i}
            </button>
          ))}
        </div>
        <FormField id="first-title" label="What happened" error={errors.title}>
          {(aria) => <input {...aria} className="input" maxLength={MAX_FIRST_TITLE} value={title} onChange={(e) => setTitle(e.target.value)} />}
        </FormField>
        <FormField id="first-date" label="When" error={errors.date}>
          {(aria) => <input {...aria} className="input" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} />}
        </FormField>
        <FormField id="first-note" label="Note (optional)">
          {(aria) => <textarea {...aria} className="input" rows={2} maxLength={MAX_FIRST_NOTE} value={note} onChange={(e) => setNote(e.target.value)} />}
        </FormField>
        {errors.save && (
          <p className="field__error" role="alert">
            {errors.save}
          </p>
        )}
        <div className="button-row">
          <button type="submit" className="btn btn--primary">
            Save
          </button>
        </div>
      </form>

      {firsts.length > 0 && (
        <ul className="entry-list">
          {firsts.map((f) => (
            <li key={f.id} className="card log-entry">
              <span>
                <strong>{f.title}</strong> <span className="muted">{formatDisplayDate(f.date)}</span>
                {f.note && <span className="log-entry__note">{f.note}</span>}
              </span>
              <span className="log-entry__actions">
                <button type="button" className="btn btn--ghost" aria-label={`Delete ${f.title}`} onClick={() => setFirsts((prev) => prev.filter((x) => x.id !== f.id))}>
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
