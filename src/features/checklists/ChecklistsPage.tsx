import { useMemo, useState } from 'react';
import { Page } from '../../components/Page';
import { ProgressBar } from '../../components/ProgressBar';
import { BAG_SECTIONS, bagDefaults, PLAN_SECTIONS, planDefaults } from '../../data/checklists';
import {
  addItem,
  editItem,
  MAX_ITEM_ANSWER,
  MAX_ITEM_TEXT,
  moveItem,
  parseChecklist,
  progress,
  removeItem,
  setAnswer,
  toggleItem,
  type ChecklistItem,
} from '../../lib/checklists';
import { STORAGE_KEYS } from '../../lib/storage';
import { useStoredState } from '../../lib/useStoredState';

type Tab = 'bag' | 'plan';

export function ChecklistsPage() {
  const [tab, setTab] = useState<Tab>('bag');
  return (
    <Page title="Checklists" icon="✅" back={{ to: '/tools', label: 'Tools' }}>
      <div className="tabs" role="tablist" aria-label="Checklists">
        {(['bag', 'plan'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`cl-tab-${t}`}
            aria-selected={tab === t}
            aria-controls="cl-panel"
            className={`btn ${tab === t ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setTab(t)}
          >
            {t === 'bag' ? 'Hospital bag' : 'Birth plan'}
          </button>
        ))}
      </div>
      <div id="cl-panel" role="tabpanel" aria-labelledby={`cl-tab-${tab}`}>
        {tab === 'bag' ? (
          <ChecklistView
            key="bag"
            storageKey={STORAGE_KEYS.bagChecklist}
            sections={BAG_SECTIONS}
            defaults={bagDefaults}
            progressLabel="packed"
          />
        ) : (
          <ChecklistView
            key="plan"
            storageKey={STORAGE_KEYS.birthPlan}
            sections={PLAN_SECTIONS}
            defaults={planDefaults}
            progressLabel="decided"
            answers
            intro="A birth plan is a list of preferences to discuss with your midwife/LMC - plans can change, and that’s okay."
          />
        )}
      </div>
    </Page>
  );
}

interface ViewProps {
  storageKey: string;
  sections: string[];
  defaults: () => ChecklistItem[];
  progressLabel: string;
  answers?: boolean;
  intro?: string;
}

function ChecklistView({ storageKey, sections, defaults, progressLabel, answers, intro }: ViewProps) {
  const validate = useMemo(() => parseChecklist(sections), [sections]);
  const fallback = useMemo(defaults, [defaults]);
  const [items, setItems] = useStoredState<ChecklistItem[]>(storageKey, fallback, validate);
  const [error, setError] = useState<string | null>(null);
  const update = (fn: (prev: ChecklistItem[]) => ChecklistItem[]) => {
    const r = setItems(fn);
    setError(r.ok ? null : r.error);
  };
  const { done, total } = progress(items);

  return (
    <>
      {intro && (
        <p className="card card--soft" role="note">
          {intro}
        </p>
      )}
      <ProgressBar value={total ? done / total : 0} label={`Items ${progressLabel}`} valueText={`${done} of ${total} ${progressLabel}`} />
      <p className="muted" aria-live="polite">
        {done} of {total} {progressLabel}
      </p>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}

      {sections.map((section) => {
        const inSection = items.filter((i) => i.section === section);
        return (
          <section key={section} className="card" aria-label={section}>
            <h2>{section}</h2>
            <ul className="entry-list">
              {inSection.map((item, idx) => (
                <li key={item.id}>
                  <div className="check-item">
                    <input
                      type="checkbox"
                      checked={item.done}
                      aria-label={`Done: ${item.text}`}
                      onChange={() => update((p) => toggleItem(p, item.id))}
                    />
                    <input
                      className={`input${item.done ? ' check-item__done' : ''}`}
                      key={item.text}
                      defaultValue={item.text}
                      maxLength={MAX_ITEM_TEXT}
                      aria-label="Item text"
                      onBlur={(e) => {
                        if (e.target.value.trim()) update((p) => editItem(p, item.id, e.target.value));
                        else e.target.value = item.text; // blank edits revert
                      }}
                    />
                    <button type="button" className="btn btn--ghost" disabled={idx === 0} aria-label={`Move up: ${item.text}`} onClick={() => update((p) => moveItem(p, item.id, -1))}>
                      ↑
                    </button>
                    <button type="button" className="btn btn--ghost" disabled={idx === inSection.length - 1} aria-label={`Move down: ${item.text}`} onClick={() => update((p) => moveItem(p, item.id, 1))}>
                      ↓
                    </button>
                    <button type="button" className="btn btn--ghost" aria-label={`Delete: ${item.text}`} onClick={() => update((p) => removeItem(p, item.id))}>
                      ✕
                    </button>
                  </div>
                  {answers && (
                    <textarea
                      className="input"
                      rows={2}
                      maxLength={MAX_ITEM_ANSWER}
                      placeholder="Your notes (optional)"
                      aria-label={`Notes for: ${item.text}`}
                      key={item.answer ?? ''}
                      defaultValue={item.answer ?? ''}
                      onBlur={(e) => update((p) => setAnswer(p, item.id, e.target.value))}
                    />
                  )}
                </li>
              ))}
            </ul>
            <AddRow onAdd={(text) => update((p) => addItem(p, section, text))} section={section} />
          </section>
        );
      })}

      <div className="button-row">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            if (window.confirm('Restore the default items? Your changes and ticks on this list will be replaced.')) update(() => defaults());
          }}
        >
          Restore defaults
        </button>
      </div>
    </>
  );
}

function AddRow({ section, onAdd }: { section: string; onAdd: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <form
      className="check-item"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onAdd(text);
        setText('');
      }}
    >
      <input className="input" value={text} maxLength={MAX_ITEM_TEXT} placeholder="Add an item" aria-label={`Add item to ${section}`} onChange={(e) => setText(e.target.value)} />
      <button type="submit" className="btn btn--ghost">
        Add
      </button>
    </form>
  );
}
