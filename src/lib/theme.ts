/**
 * Light / dark theme choice. "system" follows the device setting through CSS alone; "light" and "dark" set
 * `data-theme` on <html>. Per-device: not a registered storage key, so never backed up or synced.
 */
import { useState } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';
export const THEME_KEY = 'bt:ui:theme';

/** Browser chrome colours, matching --color-bg in each theme. */
export const THEME_COLOR = { light: '#fff8f0', dark: '#1b1412' } as const;

export function readTheme(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(pref: ThemePref, doc: Document = document): void {
  const root = doc.documentElement;
  if (pref === 'system') delete root.dataset.theme;
  else root.dataset.theme = pref;
  for (const meta of doc.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const forDark = meta.media.includes('dark');
    meta.content = pref === 'system' ? THEME_COLOR[forDark ? 'dark' : 'light'] : THEME_COLOR[pref];
  }
}

export function useTheme(): [ThemePref, (pref: ThemePref) => void] {
  const [pref, setPref] = useState(readTheme);
  const set = (next: ThemePref) => {
    try {
      if (next === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked: the choice lasts for this visit only.
    }
    applyTheme(next);
    setPref(next);
  };
  return [pref, set];
}
