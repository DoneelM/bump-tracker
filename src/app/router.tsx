import { useSyncExternalStore, type AnchorHTMLAttributes } from 'react';
import { normalizePath, toHref } from '../lib/route';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** Current route path derived from `location.hash`, e.g. `/tools/weight`. */
export function useRoutePath(): string {
  return useSyncExternalStore(
    subscribe,
    () => normalizePath(window.location.hash),
    () => '/',
  );
}

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  const href = toHref(path);
  if (options.replace) {
    window.location.replace(href);
  } else {
    window.location.hash = href;
  }
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
}

/** Plain anchor with a hash href: works with middle-click, keyboard and no JS routing tricks. */
export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <a href={toHref(to)} {...rest}>
      {children}
    </a>
  );
}
