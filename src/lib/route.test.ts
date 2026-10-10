import { describe, expect, it } from 'vitest';
import { matchPath, normalizePath, toHref } from './route';

describe('normalizePath', () => {
  it.each([
    ['', '/'],
    ['#', '/'],
    ['#/', '/'],
    ['#/tools/weight', '/tools/weight'],
    ['#/tools/weight/', '/tools/weight'],
    ['#//tools//weight', '/tools/weight'],
    ['tools', '/tools'],
    ['#/weeks/12?x=1', '/weeks/12'],
  ])('%j -> %j', (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});

describe('matchPath', () => {
  it('matches static paths', () => {
    expect(matchPath('/', '/')).toEqual({});
    expect(matchPath('/tools', '/tools')).toEqual({});
    expect(matchPath('/tools', '/tools/weight')).toBeNull();
    expect(matchPath('/tools/weight', '/tools')).toBeNull();
  });

  it('extracts params', () => {
    expect(matchPath('/weeks/:week', '/weeks/24')).toEqual({ week: '24' });
    expect(matchPath('/weeks/:week', '/weeks/a%20b')).toEqual({ week: 'a b' });
  });

  it('rejects malformed encodings', () => {
    expect(matchPath('/weeks/:week', '/weeks/%E0%A4%A')).toBeNull();
  });
});

describe('toHref', () => {
  it('builds hash hrefs', () => {
    expect(toHref('/tools/weight')).toBe('#/tools/weight');
    expect(toHref('')).toBe('#/');
  });
});
