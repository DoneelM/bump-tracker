import { addDays, formatDisplayDate, type LocalDate } from '../../lib/dates';
import {
  formatDuration,
  isOpen,
  lastOfKind,
  openOf,
  type ActivityKind,
  type BabyLogEntry,
  type BottleType,
  type EntryKind,
  type FeedSide,
  type NappyKind,
  type SolidsAmount,
} from '../../lib/babyLog';

export const SIDE_LABEL: Record<FeedSide, string> = { left: 'Left', right: 'Right', bottle: 'Bottle' };
export const BOTTLE_LABEL: Record<BottleType, string> = { formula: 'Formula', 'breast-milk': 'Breast milk', mixed: 'Mixed' };
export const NAPPY_LABEL: Record<NappyKind, string> = { wet: 'Wet', dirty: 'Dirty', both: 'Wet and dirty', dry: 'Dry' };
export const SOLIDS_LABEL: Record<SolidsAmount, string> = { none: 'None', some: 'Some', most: 'Most or all' };
export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  tummy: 'Tummy time',
  bath: 'Bath',
  story: 'Story time',
  skin: 'Skin-to-skin',
  outdoor: 'Outdoors',
};
export const KIND_LABEL: Record<EntryKind, string> = {
  feed: 'Feed',
  nappy: 'Nappy',
  sleep: 'Sleep',
  pump: 'Pumping',
  solids: 'Solids',
  medicine: 'Medicine',
  temp: 'Temperature',
  activity: 'Activity',
  growth: 'Growth',
};

export const clock = (ms: number) => new Date(ms).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' });
const mins = (ms: number) => formatDuration(ms / 60_000);
const span = (e: { at: number; end?: number | null }, now: number) =>
  e.end === null ? ` (${mins(now - e.at)} so far)` : e.end ? `, ${mins(e.end - e.at)}` : '';

/** One line for the list, the undo message and screen readers. */
export function describe(e: BabyLogEntry, now: number): string {
  switch (e.kind) {
    case 'feed': {
      if (e.side === 'bottle') return `Bottle${e.ml ? `, ${e.ml} ml` : ''}${e.bottle ? ` (${BOTTLE_LABEL[e.bottle].toLowerCase()})` : ''}`;
      if (e.end === undefined) return `Feed: ${SIDE_LABEL[e.side]}`;
      if (e.end === null) return `Breastfeeding, ${SIDE_LABEL[e.side].toLowerCase()} side (${mins(now - e.at)} so far)`;
      return `Breastfeed: left ${mins(e.leftMs ?? 0)}, right ${mins(e.rightMs ?? 0)}`;
    }
    case 'nappy':
      return `Nappy: ${NAPPY_LABEL[e.nappy].toLowerCase()}`;
    case 'sleep':
      return e.end === null ? `Asleep (${mins(now - e.at)} so far)` : `Sleep: ${mins(e.end - e.at)}`;
    case 'pump': {
      const amounts = [e.leftMl && `left ${e.leftMl} ml`, e.rightMl && `right ${e.rightMl} ml`].filter(Boolean).join(', ');
      return `Pumping${span(e, now)}${amounts ? `: ${amounts}` : ''}`;
    }
    case 'solids':
      return `Solids: ${e.food}${e.amount ? ` (ate ${SOLIDS_LABEL[e.amount].toLowerCase()})` : ''}`;
    case 'medicine':
      return `Medicine: ${e.name}${e.dose ? `, ${e.dose}` : ''}`;
    case 'temp':
      return `Temperature: ${e.celsius.toFixed(1)} °C`;
    case 'activity':
      return `${ACTIVITY_LABEL[e.activity]}${span(e, now)}`;
    case 'growth': {
      const parts = [
        e.weightG !== null && `${(e.weightG / 1000).toFixed(2)} kg`,
        e.lengthCm !== null && `${e.lengthCm} cm long`,
        e.headCm !== null && `head ${e.headCm} cm`,
      ].filter(Boolean);
      return `Growth: ${parts.join(', ')}`;
    }
  }
}

/** The big line at the top of the log and on Home. */
export function statusLine(log: readonly BabyLogEntry[], now: number): string {
  const feeding = openOf(log, 'feed');
  if (feeding) return `Feeding for ${mins(now - feeding.at)}`;
  const asleep = openOf(log, 'sleep');
  if (asleep) return `Asleep for ${mins(now - asleep.at)}`;
  const pumping = openOf(log, 'pump');
  if (pumping) return `Pumping for ${mins(now - pumping.at)}`;
  const active = openOf(log, 'activity');
  if (active) return `${ACTIVITY_LABEL[active.activity]} for ${mins(now - active.at)}`;
  const lastFeed = lastOfKind(log, 'feed');
  return lastFeed ? `Last feed ${mins(now - lastFeed.at)} ago` : 'Nothing logged yet';
}

export const hasRunning = (log: readonly BabyLogEntry[]) => log.some(isOpen);

/** `<input type="datetime-local">` value in local time, and back. */
export function toLocalInput(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fromLocalInput(v: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const ms = new Date(v).getTime();
  return Number.isFinite(ms) ? ms : null;
}

const shortFmt = new Intl.DateTimeFormat('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "Today", "Yesterday" or the date ("Sun 11 Oct" when `short`, for tables on a phone). */
export const dayOfLabel = (day: LocalDate, today: LocalDate, short = false) =>
  day === today
    ? 'Today'
    : day === addDays(today, -1)
      ? 'Yesterday'
      : short
        ? shortFmt.format(new Date(`${day}T00:00:00Z`)).replace(',', '')
        : formatDisplayDate(day);
