import { useState, type FormEvent } from 'react';
import { FormField } from '../../components/FormField';
import { Page } from '../../components/Page';
import { formatDisplayDate, isLocalDate, todayLocal, type LocalDate } from '../../lib/dates';
import {
  flaggedEntries,
  MAX_JOURNAL_ENTRIES,
  MAX_NOTES_LENGTH,
  MOODS,
  parseJournalEntries,
  sortNewestFirst,
  SYMPTOMS,
  type JournalEntry,
} from '../../lib/journal';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { newId } from '../../lib/validate';

const NO_ENTRIES: JournalEntry[] = [];
const moodOf = (v: number) => MOODS.find((m) => m.value === v)!;

export function JournalPage() {
  const [entries, setEntries] = useStoredState<JournalEntry[]>(STORAGE_KEYS.journal, NO_ENTRIES, parseJournalEntries);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const shown = onlyFlagged ? flaggedEntries(entries) : sortNewestFirst(entries);

  const save = (fn: (prev: JournalEntry[]) => JournalEntry[]) => {
    const r = setEntries(fn);
    setSaveError(r.ok ? null : r.error);
    return r.ok;
  };

  return (
    <Page title="Journal" icon="📔">
      <div className="card card--warning" role="note">
        <p>
          Some symptoms need prompt attention - for example bleeding, severe headache, blurred vision, sudden swelling,
          severe tummy pain, fluid leaking, or itching (especially of hands and feet). Contact your midwife/LMC straight
          away, or call 111 in an emergency.
        </p>
      </div>

      {saveError && (
        <p className="field__error" role="alert">
          {saveError}
        </p>
      )}

      {adding || editing ? (
        <EntryForm
          key={editing?.id ?? 'new'}
          initial={editing}
          full={!editing && entries.length >= MAX_JOURNAL_ENTRIES}
          onCancel={() => {
            setEditing(null);
            setAdding(false);
          }}
          onSave={(e) => {
            if (save((prev) => (prev.some((x) => x.id === e.id) ? prev.map((x) => (x.id === e.id ? e : x)) : [...prev, e]))) {
              setEditing(null);
              setAdding(false);
            }
          }}
        />
      ) : (
        <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
          + New entry
        </button>
      )}

      <section aria-labelledby="j-list">
        <h2 id="j-list">Entries</h2>
        <label className="chip">
          <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} />
          Flagged for midwife only
        </label>
        {shown.length === 0 ? (
          <p className="muted">{onlyFlagged ? 'No flagged entries.' : 'No entries yet.'}</p>
        ) : (
          <ul className="entry-list">
            {shown.map((e) => {
              const mood = moodOf(e.mood);
              return (
                <li key={e.id} className="card entry">
                  <p className="entry__title">
                    {formatDisplayDate(e.date)} · <span aria-hidden="true">{mood.emoji}</span> {mood.label}
                    {e.flagged && ' · 🚩 Mention to midwife'}
                  </p>
                  {e.symptoms.length > 0 && <p>{e.symptoms.join(', ')}</p>}
                  {e.notes && <p className="entry__note">{e.notes}</p>}
                  <div className="button-row">
                    <button type="button" className="btn btn--ghost" onClick={() => setEditing(e)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => {
                        if (window.confirm('Delete this entry?')) save((prev) => prev.filter((x) => x.id !== e.id));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Page>
  );
}

function EntryForm({
  initial,
  full,
  onSave,
  onCancel,
}: {
  initial: JournalEntry | null;
  full: boolean;
  onSave: (e: JournalEntry) => void;
  onCancel?: () => void;
}) {
  const [date, setDate] = useState<string>(initial?.date ?? todayLocal());
  const [mood, setMood] = useState(initial?.mood ?? 0);
  const [symptoms, setSymptoms] = useState<string[]>(initial?.symptoms ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [flagged, setFlagged] = useState(initial?.flagged ?? false);
  const [errors, setErrors] = useState<{ date?: string; mood?: string; notes?: string }>({});

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const next: typeof errors = {};
    if (!isLocalDate(date)) next.date = 'Please enter a valid date.';
    if (!mood) next.mood = 'Please pick how you’re feeling.';
    if (notes.trim().length > MAX_NOTES_LENGTH) next.notes = `Notes can be up to ${MAX_NOTES_LENGTH} characters.`;
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSave({ id: initial?.id ?? newId(), date: date as LocalDate, mood, symptoms, notes: notes.trim(), flagged });
    if (!initial) {
      setMood(0);
      setSymptoms([]);
      setNotes('');
      setFlagged(false);
    }
  }

  return (
    <form className="card form" onSubmit={submit} noValidate aria-labelledby="j-form">
      <h2 id="j-form">{initial ? 'Edit entry' : 'New entry'}</h2>
      {full && <p className="field__error">The journal is full. Delete an old entry to add more.</p>}
      <FormField id="j-date" label="Date" error={errors.date}>
        {(aria) => <input {...aria} type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />}
      </FormField>

      <fieldset className="choice" aria-describedby={errors.mood ? 'j-mood-error' : undefined}>
        <legend className="field__label">How are you feeling?</legend>
        <div className="chip-group" role="radiogroup" aria-label="Mood">
          {MOODS.map((m) => (
            <label key={m.value} className={`chip${mood === m.value ? ' is-selected' : ''}`}>
              <input type="radio" name="j-mood" value={m.value} checked={mood === m.value} onChange={() => setMood(m.value)} />
              <span aria-hidden="true">{m.emoji}</span> {m.label}
            </label>
          ))}
        </div>
        {errors.mood && (
          <p id="j-mood-error" className="field__error" role="alert">
            {errors.mood}
          </p>
        )}
      </fieldset>

      <fieldset className="choice">
        <legend className="field__label">Symptoms</legend>
        <div className="chip-group">
          {SYMPTOMS.map((s) => (
            <label key={s} className={`chip${symptoms.includes(s) ? ' is-selected' : ''}`}>
              <input
                type="checkbox"
                checked={symptoms.includes(s)}
                onChange={(e) => setSymptoms((prev) => (e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)))}
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <FormField id="j-notes" label="Notes" hint={`${notes.length}/${MAX_NOTES_LENGTH}`} error={errors.notes}>
        {(aria) => (
          <textarea {...aria} className="input" rows={4} maxLength={MAX_NOTES_LENGTH} value={notes} onChange={(e) => setNotes(e.target.value)} />
        )}
      </FormField>

      <label className="chip">
        <input type="checkbox" checked={flagged} onChange={(e) => setFlagged(e.target.checked)} />
        Mention to midwife
      </label>

      <div className="button-row">
        <button type="submit" className="btn btn--primary" disabled={full}>
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
