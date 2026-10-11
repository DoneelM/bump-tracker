/**
 * The user's own care team phone numbers (midwife/LMC, birthing unit, GP), for one-tap calling.
 * Fixed NZ helplines live in `data/helplines.ts`.
 */
import { cleanString, isRecord } from './validate';

export const CARE_ROLES = ['lmc', 'birthing', 'gp'] as const;
export type CareRole = (typeof CARE_ROLES)[number];

export const CARE_ROLE_LABEL: Record<CareRole, string> = {
  lmc: 'Midwife/LMC',
  birthing: 'Birthing unit or hospital',
  gp: 'GP',
};

export const MAX_CONTACT_NAME_LENGTH = 60;
export const MAX_PHONE_LENGTH = 20;

export interface CareContact {
  name: string;
  phone: string;
}

export type CareTeam = Partial<Record<CareRole, CareContact>>;

/** Digits, spaces, + ( ) - only, with at least 3 digits. */
export function isValidPhone(phone: string): boolean {
  return phone.length <= MAX_PHONE_LENGTH && /^\+?[\d\s()-]+$/.test(phone) && (phone.match(/\d/g)?.length ?? 0) >= 3;
}

/** `tel:` URI for a typed number: keeps a leading + and the digits. */
export const telHref = (phone: string): string => `tel:${phone.trim().startsWith('+') ? '+' : ''}${phone.replace(/\D/g, '')}`;

export function parseCareTeam(value: unknown): CareTeam | null {
  if (!isRecord(value)) return null;
  const team: CareTeam = {};
  for (const role of CARE_ROLES) {
    const c = value[role];
    if (c === undefined) continue;
    if (!isRecord(c)) return null;
    const name = cleanString(c.name ?? '', MAX_CONTACT_NAME_LENGTH);
    const phone = cleanString(c.phone, MAX_PHONE_LENGTH);
    if (name === null || phone === null || !isValidPhone(phone)) return null;
    team[role] = { name, phone };
  }
  return team;
}
