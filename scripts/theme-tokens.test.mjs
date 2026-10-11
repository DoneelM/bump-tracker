// The dark theme is written twice in tokens.css (explicit choice, and following the system); keep them identical.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const block = (re) => {
  const m = css.match(re);
  if (!m) throw new Error(`block not found: ${re}`);
  return m[1].split('\n').map((l) => l.trim()).filter(Boolean).sort();
};

describe('dark theme tokens', () => {
  it('keeps the explicit and system dark blocks identical', () => {
    const chosen = block(/:root\[data-theme='dark'\] \{([^}]*)\}/);
    const system = block(/:root:not\(\[data-theme='light'\]\) \{([^}]*)\}/);
    expect(chosen.length).toBeGreaterThan(15);
    expect(system).toEqual(chosen);
  });

  it('gives every light colour token a dark value', () => {
    const light = block(/:root \{([^}]*)\}/).filter((l) => l.startsWith('--color-')).map((l) => l.split(':')[0]);
    const dark = new Set(block(/:root\[data-theme='dark'\] \{([^}]*)\}/).map((l) => l.split(':')[0]));
    for (const t of light) expect(dark.has(t), t).toBe(true);
  });
});
