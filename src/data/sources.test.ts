import { describe, expect, it } from 'vitest';
import { creditLine, LICENCES, SOURCES } from './sources';

describe('sources', () => {
  it('have unique ids, https links and a known licence', () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    for (const s of SOURCES) {
      expect(s.url.startsWith('https://'), s.id).toBe(true);
      expect(LICENCES, s.id).toContain(s.licence);
    }
  });

  it('give the credit each licence asks for', () => {
    expect(creditLine({ licence: 'cc-by-4.0' })).toBe('Licensed under CC BY 4.0.');
    expect(creditLine({ licence: 'cc-by-4.0', changed: true })).toBe('Adapted, under CC BY 4.0.');
    expect(creditLine({ licence: 'reference' })).toBeNull();
    expect(creditLine({ licence: 'kidshealth' })).toMatch(/without changes/);
    const mpi = SOURCES.find((s) => s.id === 'mpi-food-pregnancy');
    expect(mpi && creditLine(mpi)).toMatch(/^Source: Ministry for Primary Industries/);
  });

  it('only reproduce text unchanged where the terms require it', () => {
    for (const s of SOURCES.filter((x) => x.licence === 'kidshealth' || x.licence === 'safekids')) expect(s.changed, s.id).toBeFalsy();
  });
});
