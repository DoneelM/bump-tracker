import { describe, expect, it } from 'vitest';
import { isValidPhone, parseCareTeam, telHref } from './careTeam';

describe('care team', () => {
  it('accepts NZ-style numbers and rejects anything else', () => {
    for (const ok of ['0800 611 116', '(09) 123 4567', '+64 21 123 4567', '021-123-4567', '111']) expect(isValidPhone(ok)).toBe(true);
    for (const bad of ['', '12', 'call me', '021 123 4567 ext 2', '1'.repeat(21), 'javascript:alert(1)']) expect(isValidPhone(bad)).toBe(false);
  });

  it('builds tel: links with only digits and a leading +', () => {
    expect(telHref('(09) 123 4567')).toBe('tel:091234567');
    expect(telHref(' +64 21 123-4567')).toBe('tel:+64211234567');
  });

  it('parses stored contacts, keeping valid contacts and refusing bad data', () => {
    expect(parseCareTeam({ lmc: { name: ' Aroha ', phone: '021 123 4567' } })).toEqual({ lmc: { name: 'Aroha', phone: '021 123 4567' } });
    expect(parseCareTeam({ gp: { phone: '09 555 0000' } })).toEqual({ gp: { name: '', phone: '09 555 0000' } });
    expect(parseCareTeam({ lmc: { name: 'x', phone: 'nope' } })).toBeNull();
    expect(parseCareTeam({ lmc: 'x' })).toBeNull();
    expect(parseCareTeam([])).toBeNull();
    expect(parseCareTeam({ other: { phone: '111' } })).toEqual({});
  });
});
