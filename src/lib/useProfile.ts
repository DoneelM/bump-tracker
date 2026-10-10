import { parseProfile, type PregnancyProfile } from './profile';
import { STORAGE_KEYS } from './storage';
import { useStoredState } from './useStoredState';

/** The stored pregnancy profile, or null before onboarding is complete. */
export function useProfile() {
  return useStoredState<PregnancyProfile | null>(STORAGE_KEYS.profile, null, parseProfile);
}
