import { describe, expect, it } from 'vitest';
import {
  buildPayload,
  decodePayload,
  DEFAULT_SECTIONS,
  encodePayload,
  isEmptyPayload,
  MAX_ENCODED_LENGTH,
  parsePayload,
  payloadFromHash,
  summaryText,
  type PartnerSource,
} from './partner';

const src: PartnerSource = {
  dueDate: '2026-12-06',
  today: '2026-10-11',
  next: { date: '2026-10-20', type: 'growth' },
  bag: { done: 3, total: 20 },
  flaggedCount: 2,
};
const all = { dueWeek: true, size: true, next: true, bag: true, flagged: true };
const none = { dueWeek: false, size: false, next: false, bag: false, flagged: false };
const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('buildPayload', () => {
  it('defaults to due date and week only', () => {
    expect(buildPayload(DEFAULT_SECTIONS, src)).toEqual({ v: 1, created: '2026-10-11', due: '2026-12-06', ga: { w: 32, d: 0 } });
  });
  it('includes opted-in sections', () => {
    expect(buildPayload(all, src)).toMatchObject({ size: 32, next: src.next, bag: src.bag, flagged: 2 });
  });
  it('is empty with everything off', () => {
    expect(isEmptyPayload(buildPayload(none, src))).toBe(true);
  });
});

describe('encode / decode', () => {
  it('round-trips and is URL-safe', () => {
    const p = buildPayload(all, src);
    const e = encodePayload(p)!;
    expect(e).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodePayload(e)).toEqual(p);
  });
  it('reads the payload from a hash', () => {
    const e = encodePayload(buildPayload(DEFAULT_SECTIONS, src))!;
    expect(payloadFromHash(`#/partner-view?d=${e}`)?.due).toBe('2026-12-06');
    expect(payloadFromHash('#/partner-view')).toBeNull();
    expect(payloadFromHash('#/partner-view?d=')).toBeNull();
  });
});

describe('untrusted payloads', () => {
  const ok = { v: 1, created: '2026-10-11' };
  it('accepts the minimal payload', () => expect(parsePayload(ok)).toEqual(ok));
  it('rejects unknown keys, bad types and ranges', () => {
    const bad: unknown[] = [
      null,
      [],
      'x',
      5,
      { ...ok, v: 2 },
      { ...ok, extra: 1 },
      { ...ok, created: '2026-02-30' },
      { ...ok, due: '<script>' },
      { ...ok, ga: { w: 99, d: 0 } },
      { ...ok, ga: { w: 1, d: 7 } },
      { ...ok, ga: { w: 1, d: 1, x: 1 } },
      { ...ok, size: 2 },
      { ...ok, size: 1.5 },
      { ...ok, next: { date: '2026-10-20', type: '<img onerror=x>' } },
      { ...ok, next: { date: 'soon', type: 'growth' } },
      { ...ok, bag: { done: 5, total: 3 } },
      { ...ok, bag: { done: 0, total: 0 } },
      { ...ok, flagged: -1 },
      { ...ok, flagged: '3' },
    ];
    for (const b of bad) expect(parsePayload(b), JSON.stringify(b)).toBeNull();
  });
  it('rejects malicious or malformed encodings', () => {
    expect(decodePayload('!!!')).toBeNull();
    expect(decodePayload('')).toBeNull();
    expect(decodePayload(null)).toBeNull();
    expect(decodePayload(b64url('not json'))).toBeNull();
    expect(decodePayload(b64url('{"v":1,"created":"2026-10-11","note":"<script>alert(1)</script>"}'))).toBeNull();
    expect(decodePayload(b64url('{"__proto__":{"x":1},"v":1,"created":"2026-10-11"}'))).toBeNull();
  });
  it('rejects oversized input before decoding', () => {
    expect(decodePayload('A'.repeat(MAX_ENCODED_LENGTH + 1))).toBeNull();
    expect(decodePayload(b64url(JSON.stringify({ ...ok, pad: 'x'.repeat(5000) })))).toBeNull();
  });
});

describe('summaryText', () => {
  it('lists only included fields', () => {
    const t = summaryText(buildPayload(DEFAULT_SECTIONS, src));
    expect(t).toContain('Due date:');
    expect(t).toContain('32 weeks');
    expect(t).not.toMatch(/appointment|bag|flagged/i);
  });
  it('includes opted-in fields', () => {
    const t = summaryText(buildPayload(all, src));
    expect(t).toMatch(/Next appointment: Growth scan/);
    expect(t).toContain('3 of 20');
    expect(t).toContain('flagged to mention to the midwife: 2');
  });
});
