/**
 * Builds an iCalendar (RFC 5545) file, made on the device and downloaded by the user. Events are all-day,
 * or at a local wall-clock time (floating, so they follow the phone's time zone and DST) and optionally
 * repeating with an alert. Nothing is uploaded; the user imports the file into their own calendar.
 */
import { addDays, type LocalDate } from './dates';

export interface CalendarEvent {
  uid: string;
  date: LocalDate;
  title: string;
  description: string;
  /** "HH:MM" local time for a 15-minute event; all-day when left out. */
  time?: string;
  /** Repeat rule, e.g. "FREQ=DAILY". */
  rrule?: string;
  /** Add an alert at the start time (timed events only). */
  alert?: boolean;
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isTimeOfDay = (t: unknown): t is string => typeof t === 'string' && TIME.test(t);

/** Escapes TEXT values: backslash, semicolon, comma and newlines. */
export const escapeText = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Folds a content line to at most 75 octets per line (UTF-8), continuation lines starting with a space. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let curBytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines lose one octet to the leading space
    if (curBytes + b > limit) {
      out.push(cur);
      cur = '';
      curBytes = 0;
    }
    cur += ch;
    curBytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const icsDate = (d: LocalDate) => d.replace(/-/g, '');

const icsStamp = (now: Date) =>
  now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

export function buildCalendar(events: readonly CalendarEvent[], now: Date = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hey Baby//Timeline//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${escapeText(e.uid)}`, `DTSTAMP:${icsStamp(now)}`);
    if (isTimeOfDay(e.time)) {
      const hhmm = e.time.replace(':', '');
      lines.push(`DTSTART:${icsDate(e.date)}T${hhmm}00`, 'DURATION:PT15M');
    } else {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(e.date)}`, `DTEND;VALUE=DATE:${icsDate(addDays(e.date, 1))}`);
    }
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    lines.push(`SUMMARY:${escapeText(e.title)}`, `DESCRIPTION:${escapeText(e.description)}`, 'TRANSP:TRANSPARENT');
    if (e.alert && isTimeOfDay(e.time)) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(e.title)}`, 'TRIGGER:PT0M', 'END:VALARM');
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
