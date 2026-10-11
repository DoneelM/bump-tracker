import { useState, type FormEvent } from 'react';
import { Page } from '../../components/Page';
import {
  hasName,
  MAX_NAME_LENGTH,
  MAX_NAMES,
  MAX_NOTE_LENGTH,
  parseBabyNames,
  sortNames,
  toggleFavourite,
  type BabyName,
} from '../../lib/babyNames';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { newId } from '../../lib/validate';

const NONE: BabyName[] = [];

/** A private name shortlist: you add the names (no name database), star favourites, and it stays on this device. */
export function BabyNamesPage() {
  const [names, setNames] = useStoredState<BabyName[]>(STORAGE_KEYS.babyNames, NONE, parseBabyNames);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const sorted = sortNames(names);
  const favourites = names.filter((n) => n.favourite).length;

  const save = (fn: (prev: BabyName[]) => BabyName[]) => {
    const r = setNames(fn);
    setError(r.ok ? null : r.error);
    return r.ok;
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    const t = name.trim();
    if (!t) return setError('Type a name first.');
    if (hasName(names, t)) return setError(`${t} is already on your list.`);
    if (names.length >= MAX_NAMES) return setError('The list is full. Delete some names first.');
    if (save((prev) => [...prev, { id: newId(), name: t, note: note.trim(), favourite: false }])) {
      setName('');
      setNote('');
    }
  };

  const remove = (id: string) => save((prev) => prev.filter((n) => n.id !== id));

  return (
    <Page title="Baby names" icon="🏷️" back={{ to: '/tools', label: 'Tools' }} health={false}>
      <p className="lead">Your shortlist. It stays on this device, so add as many as you like.</p>

      <form className="card form" onSubmit={add}>
        <div className="field">
          <label className="field__label" htmlFor="name-text">
            Name
          </label>
          <input
            id="name-text"
            className="input"
            maxLength={MAX_NAME_LENGTH}
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="name-note">
            Note (optional)
          </label>
          <p className="field__hint" id="name-note-hint">
            A meaning, a family link, or why you like it.
          </p>
          <input
            id="name-note"
            className="input"
            maxLength={MAX_NOTE_LENGTH}
            autoComplete="off"
            aria-describedby="name-note-hint"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <div className="button-row">
          <button type="submit" className="btn btn--primary">
            Add name
          </button>
        </div>
      </form>

      <section aria-labelledby="names-heading">
        <h2 id="names-heading">
          Your list ({names.length}
          {favourites > 0 && `, ${favourites} ${favourites === 1 ? 'favourite' : 'favourites'}`})
        </h2>
        {names.length === 0 ? (
          <p className="muted">No names yet. Favourites move to the top.</p>
        ) : (
          <ul className="name-list">
            {sorted.map((n) => (
              <li key={n.id} className={`card name-item${n.favourite ? ' name-item--favourite' : ''}`}>
                <span className="name-item__text">
                  <span className="name-item__name">{n.name}</span>
                  {n.note && <span className="muted">{n.note}</span>}
                </span>
                <span className="name-item__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    aria-pressed={n.favourite}
                    aria-label={`Favourite: ${n.name}`}
                    onClick={() => save((prev) => toggleFavourite(prev, n.id))}
                  >
                    <span aria-hidden="true">{n.favourite ? '★' : '☆'}</span> Favourite
                  </button>
                  <button type="button" className="btn btn--ghost" aria-label={`Delete: ${n.name}`} onClick={() => remove(n.id)}>
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
