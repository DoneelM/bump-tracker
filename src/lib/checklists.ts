/** Checklist model: flat item list grouped by section, with pure operations. */
import { cleanString, isRecord, newId, type Validator } from './validate';

export const MAX_ITEM_TEXT = 120;
export const MAX_ITEM_ANSWER = 500;
export const MAX_ITEMS = 200;

export interface ChecklistItem {
  id: string;
  section: string;
  text: string;
  done: boolean;
  /** Free-text answer (birth plan only). */
  answer?: string;
}

/** Builds default items with stable ids from `{ section: [text, ...] }`. */
export function makeDefaults(prefix: string, spec: Record<string, readonly string[]>): ChecklistItem[] {
  return Object.entries(spec).flatMap(([section, texts], s) =>
    texts.map((text, i) => ({ id: `${prefix}-${s}-${i}`, section, text, done: false })),
  );
}

export function parseChecklist(sections: readonly string[]): Validator<ChecklistItem[]> {
  return (value) => {
    if (!Array.isArray(value)) return null;
    const out: ChecklistItem[] = [];
    for (const v of value.slice(0, MAX_ITEMS)) {
      if (!isRecord(v) || typeof v.id !== 'string' || !v.id || v.id.length > 100) continue;
      if (typeof v.section !== 'string' || !sections.includes(v.section)) continue;
      const text = cleanString(v.text, MAX_ITEM_TEXT);
      if (!text) continue;
      const item: ChecklistItem = { id: v.id, section: v.section, text, done: v.done === true };
      const answer = cleanString(v.answer, MAX_ITEM_ANSWER);
      if (answer) item.answer = answer;
      out.push(item);
    }
    return out;
  };
}

const patch = (items: ChecklistItem[], id: string, changes: Partial<ChecklistItem>) =>
  items.map((i) => (i.id === id ? { ...i, ...changes } : i));

export const toggleItem = (items: ChecklistItem[], id: string) =>
  items.map((i) => (i.id === id ? { ...i, done: !i.done } : i));

/** Ignores blank or over-long text. */
export function editItem(items: ChecklistItem[], id: string, text: string): ChecklistItem[] {
  const t = cleanString(text, MAX_ITEM_TEXT);
  return t ? patch(items, id, { text: t }) : items;
}

export function setAnswer(items: ChecklistItem[], id: string, answer: string): ChecklistItem[] {
  const a = cleanString(answer, MAX_ITEM_ANSWER);
  if (a === null) return items;
  return items.map((i) => {
    if (i.id !== id) return i;
    const { answer: _old, ...rest } = i;
    return a ? { ...rest, answer: a } : rest;
  });
}

export function addItem(items: ChecklistItem[], section: string, text: string): ChecklistItem[] {
  const t = cleanString(text, MAX_ITEM_TEXT);
  if (!t || items.length >= MAX_ITEMS) return items;
  return [...items, { id: newId(), section, text: t, done: false }];
}

export const removeItem = (items: ChecklistItem[], id: string) => items.filter((i) => i.id !== id);

/** Swaps an item with its previous (-1) or next (+1) neighbour in the same section. */
export function moveItem(items: ChecklistItem[], id: string, dir: -1 | 1): ChecklistItem[] {
  const from = items.findIndex((i) => i.id === id);
  if (from < 0) return items;
  const section = items[from]!.section;
  let to = from + dir;
  while (to >= 0 && to < items.length && items[to]!.section !== section) to += dir;
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

export const progress = (items: readonly ChecklistItem[]) => ({
  done: items.filter((i) => i.done).length,
  total: items.length,
});
