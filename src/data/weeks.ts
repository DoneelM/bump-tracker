/**
 * Week-by-week guide content.
 *
 * TODO(content): Fill in from reputable sources (e.g. Health NZ / Te Whatu Ora,
 * your LMC's materials) and record each source in `src/data/sources.ts`.
 * Do not guess sizes or weights: leave `lengthCm` / `weightG` as null until sourced.
 */

/** Crown-rump length is typically quoted in early pregnancy, crown-heel later. */
export type LengthMeasure = 'crown-rump' | 'crown-heel';

export interface WeekInfo {
  /** Completed weeks of pregnancy this entry describes (e.g. 24 = 24w0d-24w6d). */
  week: number;
  /** What's developing with baby this week. */
  developing: string[];
  /** What the mother may notice or experience. */
  mother: string[];
  /** Typical length in centimetres, or null if not yet sourced. */
  lengthCm: number | null;
  /** How `lengthCm` is measured. */
  lengthNote: LengthMeasure;
  /** Typical weight in grams, or null if not yet sourced. */
  weightG: number | null;
  /** Friendly size comparison, e.g. "a lemon". */
  sizeObject: string;
  sizeEmoji: string;
  /** Ids of entries in `SOURCES` backing this week's content. */
  sourceIds?: string[];
}

export const FIRST_GUIDE_WEEK = 4;
export const LAST_GUIDE_WEEK = 42;

export const WEEKS: readonly WeekInfo[] = [
  // TODO(content): EXAMPLE ENTRY ONLY. Replace with sourced content and add weeks 4-42.
  {
    week: 24,
    developing: ['TODO: what is developing this week (sourced)'],
    mother: ['TODO: what you may notice this week (sourced)'],
    lengthCm: null,
    lengthNote: 'crown-heel',
    weightG: null,
    sizeObject: 'TODO: size comparison',
    sizeEmoji: '🍼',
    sourceIds: [],
  },
];

export function getWeekInfo(week: number): WeekInfo | undefined {
  return WEEKS.find((w) => w.week === week);
}

/** Clamp a gestational week into the range the guide covers. */
export function clampGuideWeek(week: number): number {
  return Math.min(LAST_GUIDE_WEEK, Math.max(FIRST_GUIDE_WEEK, week));
}
