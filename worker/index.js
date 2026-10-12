/**
 * The only server code: counts anonymous daily and monthly pings (src/lib/ping.ts). Everything else is static
 * assets. Writes the period, mode and version to Workers Analytics Engine and nothing else: no IP, no headers,
 * no identifiers. `run_worker_first` in wrangler.jsonc sends only /api/* here.
 */
const PERIODS = ['day', 'month'];
const MODES = ['pregnancy', 'baby', 'ended'];
const VERSION = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/** The data point to write, or null if the request isn't a valid ping. Exported for tests. */
export function pingPoint(url) {
  const { pathname, searchParams: q } = new URL(url);
  if (pathname !== '/api/ping') return null;
  const p = q.get('p');
  const m = q.get('m');
  const v = q.get('v');
  if (!PERIODS.includes(p) || !MODES.includes(m) || !v || !VERSION.test(v)) return null;
  return { indexes: [p], blobs: [p, m, v], doubles: [1] };
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } });
    const point = pingPoint(request.url);
    if (!point) return new Response(null, { status: 404 });
    // Preview deploys have no bindings; accept and drop.
    env.PINGS?.writeDataPoint(point);
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  },
};
