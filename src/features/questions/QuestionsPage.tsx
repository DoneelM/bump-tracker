import { useState, type FormEvent } from 'react';
import { Page } from '../../components/Page';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import { askedQuestions, MAX_QUESTION_LENGTH, MAX_QUESTIONS, openQuestions, parseQuestions, type Question } from '../../lib/questions';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';
import { newId } from '../../lib/validate';

const NONE: Question[] = [];

export function useQuestions() {
  return useStoredState<Question[]>(STORAGE_KEYS.questions, NONE, parseQuestions);
}

/** A running list of questions for the next midwife/LMC appointment; open ones go on the print summary. */
export function QuestionsPage({ today }: { today: LocalDate }) {
  const [questions, setQuestions] = useQuestions();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const open = openQuestions(questions);
  const asked = askedQuestions(questions);

  const save = (fn: (prev: Question[]) => Question[]) => {
    const r = setQuestions(fn);
    setError(r.ok ? null : r.error);
    return r.ok;
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return setError('Type a question first.');
    if (questions.length >= MAX_QUESTIONS) return setError('The list is full. Delete some asked questions first.');
    if (save((prev) => [...prev, { id: newId(), text: t, askedOn: null }])) setText('');
  };

  const setAsked = (id: string, askedOn: LocalDate | null) => save((prev) => prev.map((q) => (q.id === id ? { ...q, askedOn } : q)));
  const remove = (id: string) => save((prev) => prev.filter((q) => q.id !== id));

  return (
    <Page title="Questions for my midwife" icon="❓" back={{ to: '/journal', label: 'Journal' }} health={false}>
      <form className="card form" onSubmit={add}>
        <div className="field">
          <label className="field__label" htmlFor="q-text">
            New question
          </label>
          <textarea id="q-text" className="input" rows={2} maxLength={MAX_QUESTION_LENGTH} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <div className="button-row">
          <button type="submit" className="btn btn--primary">
            Add question
          </button>
        </div>
      </form>

      <section aria-labelledby="q-open">
        <h2 id="q-open">To ask ({open.length})</h2>
        {open.length === 0 ? (
          <p className="muted">Nothing yet. Questions you add here also go on the print summary.</p>
        ) : (
          <ul className="question-list">
            {open.map((q) => (
              <li key={q.id} className="card question">
                <label className="question__check">
                  <input type="checkbox" checked={false} onChange={() => setAsked(q.id, today)} />
                  <span>{q.text}</span>
                </label>
                <button type="button" className="btn btn--ghost" onClick={() => remove(q.id)} aria-label={`Delete: ${q.text}`}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {asked.length > 0 && (
        <section aria-labelledby="q-asked">
          <details>
            <summary>
              <h2 id="q-asked" className="details-summary-heading">
                Asked ({asked.length})
              </h2>
            </summary>
            <ul className="question-list">
              {asked.map((q) => (
                <li key={q.id} className="card question question--asked">
                  <label className="question__check">
                    <input type="checkbox" checked onChange={() => setAsked(q.id, null)} />
                    <span>
                      {q.text} <span className="muted">(asked {formatDisplayDate(q.askedOn!)})</span>
                    </span>
                  </label>
                  <button type="button" className="btn btn--ghost" onClick={() => remove(q.id)} aria-label={`Delete: ${q.text}`}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </Page>
  );
}
