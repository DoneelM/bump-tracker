/**
 * Partner summary: a small, strictly validated snapshot that can be shared as text or as a link
 * (base64url JSON in the URL hash). Only fields the user ticked are included; nothing is uploaded.
 */
import { getWeekInfo } from '../data/weeks';
import { diffDays, formatDisplayDate, isLocalDate, type LocalDate } from './dates';
import { formatWeeksDays, gestationalAge, TRIMESTER_LABEL, trimester } from './pregnancy';
import { SCAN_TYPES, scanTypeLabel, type ScanType } from './scans';
import { isIntInRange, isRecord } from './validate';

export const PARTNER_VERSION = 1;
export const MAX_ENCODED_LENGTH = 1500;

export interface PartnerPayload {
  v: typeof PARTNER_VERSION;
  /** Date the snapshot was made. */
  created: LocalDate;
  due?: LocalDate;
  /** Gestational age on `created`. */
  ga?: { w: number; d: number };
  /** Guide week used for the size comparison. */
  size?: number;
  next?: { date: LocalDate; type: ScanType };
  bag?: { done: number; total: number };
  flagged?: number;
}

export interface PartnerSections {
  dueWeek: boolean;
  size: boolean;
  next: boolean;
  bag: boolean;
  flagged: boolean;
}

/** Due date and week are on by default; anything more personal is opt-in. */
export const DEFAULT_SECTIONS: PartnerSections = { dueWeek: true, size: false, next: false, bag: false, flagged: false };

export interface PartnerSource {
  dueDate: LocalDate;
  today: LocalDate;
  next: { date: LocalDate; type: ScanType } | null;
  bag: { done: number; total: number };
  flaggedCount: number;
}

export function buildPayload(sections: PartnerSections, src: PartnerSource): PartnerPayload {
  const p: PartnerPayload = { v: PARTNER_VERSION, created: src.today };
  const ga = gestationalAge(src.dueDate, src.today);
  if (sections.dueWeek) {
    p.due = src.dueDate;
    p.ga = { w: Math.max(0, ga.weeks), d: ga.weeks < 0 ? 0 : ga.days };
  }
  if (sections.size && getWeekInfo(ga.weeks)) p.size = ga.weeks;
  if (sections.next && src.next) p.next = src.next;
  if (sections.bag && src.bag.total > 0) p.bag = src.bag;
  if (sections.flagged) p.flagged = src.flaggedCount;
  return p;
}

export const isEmptyPayload = (p: PartnerPayload): boolean => Object.keys(p).length <= 2;

const KEYS = ['v', 'created', 'due', 'ga', 'size', 'next', 'bag', 'flagged'];

/** Strict: unknown keys, wrong types or out-of-range values all reject the whole payload. */
export function parsePayload(value: unknown): PartnerPayload | null {
  if (!isRecord(value) || Object.keys(value).some((k) => !KEYS.includes(k))) return null;
  if (value.v !== PARTNER_VERSION || !isLocalDate(value.created)) return null;
  const p: PartnerPayload = { v: PARTNER_VERSION, created: value.created };
  if (value.due !== undefined) {
    if (!isLocalDate(value.due)) return null;
    p.due = value.due;
  }
  if (value.ga !== undefined) {
    const g = value.ga;
    if (!isRecord(g) || Object.keys(g).length !== 2 || !isIntInRange(g.w, 0, 45) || !isIntInRange(g.d, 0, 6)) return null;
    p.ga = { w: g.w, d: g.d };
  }
  if (value.size !== undefined) {
    if (!isIntInRange(value.size, 0, 45) || !getWeekInfo(value.size)) return null;
    p.size = value.size;
  }
  if (value.next !== undefined) {
    const n = value.next;
    if (!isRecord(n) || Object.keys(n).length !== 2 || !isLocalDate(n.date)) return null;
    if (!SCAN_TYPES.some((s) => s.value === n.type)) return null;
    p.next = { date: n.date, type: n.type as ScanType };
  }
  if (value.bag !== undefined) {
    const b = value.bag;
    if (!isRecord(b) || Object.keys(b).length !== 2 || !isIntInRange(b.total, 1, 200) || !isIntInRange(b.done, 0, b.total)) return null;
    p.bag = { done: b.done, total: b.total };
  }
  if (value.flagged !== undefined) {
    if (!isIntInRange(value.flagged, 0, 1000)) return null;
    p.flagged = value.flagged;
  }
  return p;
}

/** Null if the encoded form would exceed the size limit. */
export function encodePayload(p: PartnerPayload): string | null {
  const encoded = btoa(JSON.stringify(p)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return encoded.length <= MAX_ENCODED_LENGTH ? encoded : null;
}

export function decodePayload(encoded: unknown): PartnerPayload | null {
  if (typeof encoded !== 'string' || encoded.length === 0 || encoded.length > MAX_ENCODED_LENGTH) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    return parsePayload(JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))));
  } catch {
    return null;
  }
}

/** The `d` parameter from a hash like `#/partner-view?d=...`. */
export function payloadFromHash(hash: string): PartnerPayload | null {
  const q = hash.indexOf('?');
  return q < 0 ? null : decodePayload(new URLSearchParams(hash.slice(q + 1)).get('d'));
}

export const partnerLink = (base: string, encoded: string): string => `${base}#/partner-view?d=${encoded}`;

export function summaryLines(p: PartnerPayload): string[] {
  const lines: string[] = [];
  if (p.due) lines.push(`Due date: ${formatDisplayDate(p.due)}`);
  if (p.ga) lines.push(`Now: ${formatWeeksDays(p.ga.w, p.ga.d)} (${TRIMESTER_LABEL[trimester(p.ga.w * 7 + p.ga.d)]})`);
  const info = p.size === undefined ? undefined : getWeekInfo(p.size);
  if (info) lines.push(`Baby is about the size of ${info.sizeObject} ${info.sizeEmoji} (week ${info.week})`);
  if (p.next) {
    const days = diffDays(p.created, p.next.date);
    const when = days <= 0 ? '' : days === 1 ? ' (1 day after this snapshot)' : ` (${days} days after this snapshot)`;
    lines.push(`Next appointment: ${scanTypeLabel(p.next.type)} on ${formatDisplayDate(p.next.date)}${when}`);
  }
  if (p.bag) lines.push(`Hospital bag: ${p.bag.done} of ${p.bag.total} items packed`);
  if (p.flagged !== undefined) lines.push(`Journal items flagged to mention to the midwife: ${p.flagged}`);
  return lines;
}

export const summaryText = (p: PartnerPayload): string =>
  ['Pregnancy update from Hey Baby', ...summaryLines(p), `Snapshot made ${formatDisplayDate(p.created)}.`].join('\n');
