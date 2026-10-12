import { describe, expect, it } from 'vitest';
// Plain JS module (no types), so this test file is outside tsconfig.
import worker, { pingPoint } from './index.js';

describe('ping worker', () => {
  it('accepts a valid ping and records only period, mode and version', () => {
    expect(pingPoint('https://heybaby.nz/api/ping?p=day&m=baby&v=0.1.0')).toEqual({ indexes: ['day'], blobs: ['day', 'baby', '0.1.0'], doubles: [1] });
  });

  it('rejects anything else', () => {
    expect(pingPoint('https://heybaby.nz/api/ping?p=week&m=baby&v=0.1.0')).toBeNull();
    expect(pingPoint('https://heybaby.nz/api/ping?p=day&m=baby&v=<script>')).toBeNull();
    expect(pingPoint('https://heybaby.nz/api/other?p=day&m=baby&v=0.1.0')).toBeNull();
  });

  it('writes one point for a POST and refuses GET', async () => {
    const points: unknown[] = [];
    const env = { PINGS: { writeDataPoint: (p: unknown) => points.push(p) } };
    const ok = await worker.fetch(new Request('https://heybaby.nz/api/ping?p=month&m=pregnancy&v=0.1.0', { method: 'POST' }), env);
    expect(ok.status).toBe(204);
    expect(points).toHaveLength(1);
    const get = await worker.fetch(new Request('https://heybaby.nz/api/ping?p=month&m=pregnancy&v=0.1.0'), env);
    expect(get.status).toBe(405);
    const noBinding = await worker.fetch(new Request('https://heybaby.nz/api/ping?p=day&m=baby&v=0.1.0', { method: 'POST' }), {});
    expect(noBinding.status).toBe(204);
  });
});
