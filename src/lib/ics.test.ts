import { describe, expect, it } from 'vitest';
import { buildCalendar, escapeText, foldLine } from './ics';

describe('ics', () => {
  it('escapes TEXT values', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\;c\\\\d\\ne');
  });

  it('folds lines at 75 octets, counting UTF-8 bytes', () => {
    const folded = foldLine('X'.repeat(200));
    const parts = folded.split('\r\n');
    expect(parts[0]).toHaveLength(75);
    expect(parts.slice(1).every((p) => p.startsWith(' ') && new TextEncoder().encode(p).length <= 75)).toBe(true);
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join('')).toBe('X'.repeat(200));
    // Multi-byte characters are never split.
    const maori = foldLine('ā'.repeat(60));
    for (const p of maori.split('\r\n')) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
    expect(maori.replace(/\r\n /g, '')).toBe('ā'.repeat(60));
  });

  it('builds all-day events with CRLF line endings', () => {
    const ics = buildCalendar([{ uid: 'a@x', date: '2026-12-31', title: 'Scan, 20 weeks', description: 'Line 1\nLine 2' }], new Date('2026-10-11T08:00:00Z'));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20270101\r\n');
    expect(ics).toContain('DTSTAMP:20261011T080000Z\r\n');
    expect(ics).toContain('SUMMARY:Scan\\, 20 weeks\r\n');
    expect(ics).toContain('DESCRIPTION:Line 1\\nLine 2\r\n');
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/\n/);
  });
});
