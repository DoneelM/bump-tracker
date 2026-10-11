/** Places the antenatal milestones (`data/milestones.ts`) relative to today's gestational age. */
import { MILESTONES, type Milestone } from '../data/milestones';
import { addDays, type LocalDate } from './dates';
import type { CalendarEvent } from './ics';
import { gestationalAge, lmpFromDueDate } from './pregnancy';

export type MilestoneStatus = 'done' | 'now' | 'soon';

/** "As soon as you can" milestones (no end) count as current until this many days, then as past. */
export const EARLY_UNTIL_DAY = 14 * 7;

export interface PlacedMilestone {
  milestone: Milestone;
  status: MilestoneStatus;
  /** Date the window opens. */
  from: LocalDate;
  /** Date the window closes, or null for "as soon as you can". */
  to: LocalDate | null;
}

export function milestoneStatus(m: Milestone, gaDays: number): MilestoneStatus {
  if (gaDays < m.startDay) return 'soon';
  const end = m.endDay ?? EARLY_UNTIL_DAY;
  return gaDays > end ? 'done' : 'now';
}

export function placeMilestones(dueDate: LocalDate, today: LocalDate, list: readonly Milestone[] = MILESTONES): PlacedMilestone[] {
  const lmp = lmpFromDueDate(dueDate);
  const ga = gestationalAge(dueDate, today).totalDays;
  return list.map((milestone) => ({
    milestone,
    status: milestoneStatus(milestone, ga),
    from: addDays(lmp, milestone.startDay),
    to: milestone.endDay === null ? null : addDays(lmp, milestone.endDay),
  }));
}

/** For Home: current milestones first, then the next upcoming ones, at most `n`. Excludes "any stage" items. */
export function comingUp(dueDate: LocalDate, today: LocalDate, n = 2): PlacedMilestone[] {
  const placed = placeMilestones(dueDate, today).filter((p) => p.milestone.calendarDay !== null || p.milestone.endDay === null);
  const now = placed.filter((p) => p.status === 'now');
  const soon = placed.filter((p) => p.status === 'soon').sort((a, b) => a.milestone.startDay - b.milestone.startDay);
  return [...now, ...soon].slice(0, n);
}

/**
 * Calendar events: each milestone that still lies ahead (on its calendar day, or today if its window is
 * open), and each upcoming scan or appointment by type only. Notes are left out, because calendars often
 * sync to other services.
 */
export function timelineEvents(
  dueDate: LocalDate,
  today: LocalDate,
  appointments: readonly { id: string; date: LocalDate; label: string }[],
  sourceUrl: (id: string) => string | undefined,
): CalendarEvent[] {
  const lmp = lmpFromDueDate(dueDate);
  const events: CalendarEvent[] = [];
  for (const m of MILESTONES) {
    if (m.calendarDay === null) continue;
    const planned = addDays(lmp, m.calendarDay);
    const closes = addDays(lmp, m.endDay ?? m.calendarDay);
    if (closes < today) continue;
    const urls = m.sources.map(sourceUrl).filter((u) => u !== undefined);
    events.push({
      uid: `${m.id}-${dueDate}@bump-tracker.aiagents.nz`,
      date: planned < today ? today : planned,
      title: m.optional ? `${m.title} (optional)` : m.title,
      description: `${m.when}. ${m.note}\nSource: Health NZ, ${urls.join(' ')}`,
    });
  }
  for (const a of appointments) {
    if (a.date < today) continue;
    events.push({ uid: `appt-${a.id}@bump-tracker.aiagents.nz`, date: a.date, title: a.label, description: 'From your Bump Tracker scans and appointments.' });
  }
  return events.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
}
