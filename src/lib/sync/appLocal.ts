/** The app's real LocalData: registered localStorage keys, replaced atomically via applyBackup. */
import { appStorage, applyBackup } from '../backup';
import { readRaw, STORAGE_TABLE } from '../storage';
import type { LocalData } from './engine';

export const appLocal: LocalData = {
  read() {
    const out: Record<string, unknown> = {};
    for (const { key } of STORAGE_TABLE) {
      const raw = readRaw(key);
      if (raw === null) continue;
      try {
        out[key] = JSON.parse(raw);
      } catch {
        // Unreadable values count as absent; the merge then takes the synced copy's value.
      }
    }
    return out;
  },
  apply: (values) =>
    applyBackup({ exportedAt: '', accepted: values, skipped: [], photos: [], photosSkipped: 0, photoRejectedWeeks: [] }, appStorage),
};
