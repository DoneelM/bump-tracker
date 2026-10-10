/**
 * Pure helpers for the hash router (`#/tools/weight` -> `/tools/weight`).
 * Patterns support `:param` segments, e.g. `/weeks/:week`.
 */

export type RouteParams = Record<string, string>;

/** Normalises a hash or path to `/a/b` form (leading slash, no trailing slash, no query). */
export function normalizePath(hashOrPath: string): string {
  let p = hashOrPath.startsWith('#') ? hashOrPath.slice(1) : hashOrPath;
  p = p.split('?')[0] ?? '';
  const segments = p.split('/').filter(Boolean);
  return `/${segments.join('/')}`;
}

export function matchPath(pattern: string, path: string): RouteParams | null {
  const patternParts = normalizePath(pattern).split('/').filter(Boolean);
  const pathParts = normalizePath(path).split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: RouteParams = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]!;
    const seg = pathParts[i]!;
    if (pp.startsWith(':')) {
      let decoded: string;
      try {
        decoded = decodeURIComponent(seg);
      } catch {
        return null;
      }
      params[pp.slice(1)] = decoded;
    } else if (pp !== seg) {
      return null;
    }
  }
  return params;
}

export function toHref(path: string): string {
  return `#${normalizePath(path)}`;
}
