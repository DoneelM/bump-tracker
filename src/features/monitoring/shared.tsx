import type { ReactNode } from 'react';
import { SOURCES } from '../../data/sources';
import { toDayNumber, type LocalDate } from '../../lib/dates';

/** Shown at the top of both pages: who this is for, and that the app doesn't interpret readings. */
export function MonitoringIntro({ what, sourceId, topic }: { what: string; sourceId: string; topic: string }) {
  const s = SOURCES.find((x) => x.id === sourceId);
  return (
    <section className="card card--soft">
      <p>
        <strong>Only if your midwife, doctor or diabetes team has asked you to check your {what} at home.</strong> Hey Baby doesn’t set targets or
        tell you what a reading means. It compares your readings with the upper limits your team gives you.
      </p>
      {s && (
        <p className="muted">
          More about {topic}:{' '}
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            {s.publisher}: {s.title}
          </a>
        </p>
      )}
    </section>
  );
}

export function AboveTargetNote({ children }: { children?: ReactNode }) {
  return (
    <div className="alert-banner" role="alert">
      <p className="alert-banner__title">Your latest reading is above the target you entered</p>
      <p>Follow what your care team told you to do for a reading like this. If you’re not sure, or you feel unwell, call them.</p>
      {children}
    </div>
  );
}

/** Time input value, or "" when empty. */
export const timeNow = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Chart x value for a reading (time defaults to midday). Treated as UTC so days line up with dates. */
export const epoch = (r: { date: LocalDate; time: string }) => {
  const [h, m] = (r.time || '12:00').split(':').map(Number);
  return toDayNumber(r.date) * 86_400_000 + (h! * 60 + m!) * 60_000;
};
