/** A private shortlist of baby names. Pure. */
import { cleanString, isRecord } from './validate';

export const MAX_NAME_LENGTH = 60;
export const MAX_NOTE_LENGTH = 200;
export const MAX_NAMES = 300;

export interface BabyName {
  id: string;
  name: string;
  /** Meaning, family link, or why you like it. */
  note: string;
  favourite: boolean;
}

export function parseBabyNames(value: unknown): BabyName[] | null {
  if (!Array.isArray(value)) return null;
  const out: BabyName[] = [];
  for (const n of value) {
    if (out.length >= MAX_NAMES) break;
    if (!isRecord(n) || typeof n.id !== 'string' || !n.id) continue;
    const name = cleanString(n.name, MAX_NAME_LENGTH);
    if (!name) continue;
    const note = cleanString(n.note ?? '', MAX_NOTE_LENGTH) ?? '';
    out.push({ id: n.id, name, note, favourite: n.favourite === true });
  }
  return out;
}

/** Same name already on the list, ignoring case and accents (so "Aroha" and "aroha" don't both get added). */
export function hasName(names: readonly BabyName[], name: string): boolean {
  const key = (s: string) => s.trim().normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
  const k = key(name);
  return names.some((n) => key(n.name) === k);
}

/** Favourites first, otherwise the order they were added. */
export const sortNames = (names: readonly BabyName[]): BabyName[] =>
  [...names].sort((a, b) => Number(b.favourite) - Number(a.favourite));

export const toggleFavourite = (names: readonly BabyName[], id: string): BabyName[] =>
  names.map((n) => (n.id === id ? { ...n, favourite: !n.favourite } : n));
