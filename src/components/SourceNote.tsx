import { CC_BY_URL, creditLine, SOURCES } from '../data/sources';

/** "Source:" line under reproduced health content, with the credit its licence asks for. */
export function SourceNote({ id, label = 'Source' }: { id: string; label?: string }) {
  const s = SOURCES.find((x) => x.id === id);
  if (!s) return null;
  const credit = creditLine(s);
  return (
    <p className="muted">
      {label}:{' '}
      <a href={s.url} target="_blank" rel="noopener noreferrer">
        {s.publisher}: {s.title}
      </a>
      {credit && (
        <>
          .{' '}
          {s.licence === 'cc-by-4.0' && !s.credit ? (
            <a href={CC_BY_URL} target="_blank" rel="noopener noreferrer">
              {credit}
            </a>
          ) : (
            credit
          )}
        </>
      )}
    </p>
  );
}
