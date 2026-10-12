/**
 * The name of whoever logs on this device ("Sam", "Mum"), stamped on baby log entries as `by` so two caregivers
 * can tell their entries apart. Per-device like the theme: not a registered key, never synced. Null means not
 * asked yet; an empty string means they chose not to set one.
 */
import { useState } from 'react';
import { MAX_BY } from './babyLog';

export const CAREGIVER_KEY = 'bt:ui:caregiver';

export function readCaregiver(): string | null {
  try {
    const v = localStorage.getItem(CAREGIVER_KEY);
    return v === null ? null : v.trim().slice(0, MAX_BY);
  } catch {
    return '';
  }
}

export function useCaregiver(): [string | null, (name: string) => void] {
  const [name, setName] = useState(readCaregiver);
  const set = (next: string) => {
    const clean = next.trim().slice(0, MAX_BY);
    try {
      localStorage.setItem(CAREGIVER_KEY, clean);
    } catch {
      // Storage blocked: the name lasts for this visit only.
    }
    setName(clean);
  };
  return [name, set];
}
