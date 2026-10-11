/**
 * Builds an iCalendar (RFC 5545) file of all-day events, made on the device and downloaded by the user.
 * Nothing is uploaded; the user imports the file into their own calendar.
 */
import { addDays, type LocalDate } from './dates';

export interface CalendarEvent {
  uid: string;
  date: LocalDate;
  title: string;
  description: string;
}

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
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bump Tracker//Timeline//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeText(e.uid)}`,
      `DTSTAMP:${icsStamp(now)}`,
      `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
      `DTEND;VALUE=DATE:${icsDate(addDays(e.date, 1))}`,
      `SUMMARY:${escapeText(e.title)}`,
      `DESCRIPTION:${escapeText(e.description)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
