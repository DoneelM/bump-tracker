import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from '../app/router';
import { HealthDisclaimer } from './HealthDisclaimer';

interface PageProps {
  title: string;
  /** Optional emoji/visual shown before the title (decorative). */
  icon?: string;
  /** Path for the "back" link on nested screens. */
  back?: { to: string; label: string };
  /** Show the health disclaimer (default true: most screens are health screens). */
  health?: boolean;
  /** Shown at the very bottom, after the disclaimer (e.g. Home's privacy policy link). */
  footer?: ReactNode;
  /** Keep the h1 for screen readers but hide it on screen, when the tab bar already says where you are. */
  hideTitle?: boolean;
  children?: ReactNode;
}

/** Standard screen layout: heading (focused on navigation for screen readers), content, disclaimer. */
export function Page({ title, icon, back, health = true, footer, hideTitle = false, children }: PageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${title} · Bump Tracker`;
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="page">
      {back && (
        <Link to={back.to} className="back-link">
          <span aria-hidden="true">‹</span> {back.label}
        </Link>
      )}
      <h1 ref={headingRef} tabIndex={-1} className={hideTitle ? 'visually-hidden' : 'page__title'}>
        {icon && (
          <span className="page__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {title}
      </h1>
      {children}
      {health && <HealthDisclaimer />}
      {footer}
    </div>
  );
}
