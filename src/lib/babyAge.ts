/** A baby's age from their birth date, the way NZ parents and Well Child say it. Pure. */
import { addMonths, diffDays, diffMonths, type LocalDate } from './dates';

/** Under 12 weeks: "3 weeks 2 days old"; then "4 months 1 week old"; from 2 years, "2 years 3 months old". */
export function formatBabyAge(born: LocalDate, today: LocalDate): string {
  const days = diffDays(born, today);
  if (days < 0) return '';
  if (days === 0) return 'Born today';
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
  if (days < 7) return `${plural(days, 'day')} old`;
  if (days < 84) {
    const w = Math.floor(days / 7);
    const d = days % 7;
    return `${plural(w, 'week')}${d ? ` ${plural(d, 'day')}` : ''} old`;
  }
  const months = diffMonths(born, today);
  if (months < 24) {
    const weeks = Math.floor(diffDays(addMonths(born, months), today) / 7);
    return `${plural(months, 'month')}${weeks ? ` ${plural(weeks, 'week')}` : ''} old`;
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return `${plural(years, 'year')}${rest ? ` ${plural(rest, 'month')}` : ''} old`;
}
