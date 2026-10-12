import { useState, type FormEvent } from 'react';
import { Page } from '../../components/Page';
import { SourceNote } from '../../components/SourceNote';
import { SUPPLEMENT_FREE_LINE, SUPPLEMENT_INFO, SUPPLEMENT_SOURCE_ID } from '../../data/supplements';
import { type LocalDate } from '../../lib/dates';
import { download } from '../../lib/download';
import { buildCalendar, isTimeOfDay } from '../../lib/ics';
import { STORAGE_KEYS } from '../../lib/storage';
import {
  addSupplement,
  DEFAULT_SUPPLEMENTS,
  hasSupplement,
  isTaken,
  lastDays,
  MAX_SUPPLEMENT_NAME,
  MAX_SUPPLEMENTS,
  parseSupplements,
  removeSupplement,
  toggleTaken,
  type SupplementState,
} from '../../lib/supplements';
import { useStoredState } from '../../lib/useStoredState';
import { newId } from '../../lib/validate';

const weekday = (d: LocalDate) => new Date(`${d}T12:00:00`).toLocaleDateString('en-NZ', { weekday: 'short' });

/** Tick off supplements each day, see the last week, and put a daily reminder in your own calendar. */
export function SupplementsPage({ today }: { today: LocalDate }) {
  const [state, setState] = useStoredState<SupplementState>(STORAGE_KEYS.supplements, DEFAULT_SUPPLEMENTS, parseSupplements);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const week = lastDays(today, 7);

  const save = (fn: (prev: SupplementState) => SupplementState) => {
    const r = setState(fn);
    setError(r.ok ? null : r.error);
    return r.ok;
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return setError('Type a name first.');
    if (hasSupplement(state, name)) return setError(`${name} is already on your list.`);
    if (state.list.length >= MAX_SUPPLEMENTS) return setError('The list is full. Remove one first.');
    if (save((prev) => addSupplement(prev, newId(), name))) setNewName('');
  };

  const addReminder = () => {
    const names = state.list.map((s) => s.name).join(', ');
    const ics = buildCalendar([
      {
        uid: `supplements-${newId()}@bump-tracker`,
        date: today,
        time: state.reminderTime,
        rrule: 'FREQ=DAILY',
        alert: true,
        title: 'Supplements',
        description: `Time for: ${names}. Tick them off in Hey Baby.`,
      },
    ]);
    download('bump-tracker-supplements.ics', ics, 'text/calendar');
  };

  const shownInfo = state.list.filter((s): s is typeof s & { id: keyof typeof SUPPLEMENT_INFO } => s.id in SUPPLEMENT_INFO);

  return (
    <Page title="Supplements" icon="💊" back={{ to: '/tools', label: 'Tools' }}>
      <section className="card" aria-labelledby="supp-today">
        <h2 id="supp-today">Today</h2>
        {state.list.length === 0 ? (
          <p className="muted">Nothing on your list. Add one below.</p>
        ) : (
          <div className="supp-toggles">
            {state.list.map((s) => {
              const on = isTaken(state, s.id, today);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`supp-toggle${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => save((prev) => toggleTaken(prev, s.id, today))}
                >
                  <span className="supp-toggle__name">{s.name}</span>
                  <span className="supp-toggle__state">{on ? 'Taken ✓' : 'Not yet'}</span>
                </button>
              );
            })}
          </div>
        )}
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
      </section>

      {state.list.length > 0 && (
        <section className="card" aria-labelledby="supp-week">
          <h2 id="supp-week">Last 7 days</h2>
          <ul className="supp-week">
            {state.list.map((s) => {
              const count = week.filter((d) => isTaken(state, s.id, d)).length;
              return (
                <li key={s.id}>
                  <span className="supp-week__name">
                    {s.name} <span className="muted">{count} of 7</span>
                  </span>
                  <span className="supp-week__days" aria-hidden="true">
                    {week.map((d) => (
                      <span key={d} className={`supp-day${isTaken(state, s.id, d) ? ' is-on' : ''}`} title={d}>
                        {weekday(d).slice(0, 1)}
                      </span>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card" aria-labelledby="supp-reminder">
        <h2 id="supp-reminder">Daily reminder</h2>
        <p className="muted">Adds a repeating event with an alert to your phone’s calendar. Nothing is sent anywhere.</p>
        <div className="form supp-reminder">
          <div className="field">
            <label className="field__label" htmlFor="supp-time">
              Remind me at
            </label>
            <input
              id="supp-time"
              className="input supp-time"
              type="time"
              value={state.reminderTime}
              onChange={(e) => isTimeOfDay(e.target.value) && save((prev) => ({ ...prev, reminderTime: e.target.value }))}
            />
          </div>
          <div className="button-row">
            <button type="button" className="btn btn--primary" onClick={addReminder} disabled={state.list.length === 0}>
              Add to my calendar
            </button>
          </div>
        </div>
      </section>

      {shownInfo.length > 0 && (
        <section className="card card--soft" aria-labelledby="supp-info">
          <h2 id="supp-info">What Health NZ says</h2>
          {shownInfo.map((s) => (
            <p key={s.id}>
              <strong>{s.name}:</strong> {SUPPLEMENT_INFO[s.id]}
            </p>
          ))}
          <p>{SUPPLEMENT_FREE_LINE}</p>
          <SourceNote id={SUPPLEMENT_SOURCE_ID} />
        </section>
      )}

      <section className="card" aria-labelledby="supp-list">
        <h2 id="supp-list">Your list</h2>
        <ul className="supp-list">
          {state.list.map((s) => (
            <li key={s.id}>
              <span>{s.name}</span>
              <button
                type="button"
                className="btn btn--ghost"
                aria-label={`Remove ${s.name}`}
                onClick={() => save((prev) => removeSupplement(prev, s.id))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={add} className="form supp-add">
          <div className="field">
            <label className="field__label" htmlFor="supp-new">
              Add a supplement
            </label>
            <p className="field__hint" id="supp-new-hint">
              Something your midwife, doctor or nurse practitioner suggested, like iron or vitamin D.
            </p>
            <input
              id="supp-new"
              className="input"
              maxLength={MAX_SUPPLEMENT_NAME}
              autoComplete="off"
              aria-describedby="supp-new-hint"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="button-row">
            <button type="submit" className="btn btn--ghost">
              Add
            </button>
          </div>
        </form>
      </section>
    </Page>
  );
}
