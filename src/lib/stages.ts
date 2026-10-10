/** Weeks that have a baby illustration in public/images/baby/. */
export const ILLUSTRATION_STAGES = [6, 8, 12, 16, 20, 24, 28] as const;

/** Closest illustration stage at or below `week` (weeks before 6 use 6; 28+ use 28). */
export function stageForWeek(week: number): number {
  let stage: number = ILLUSTRATION_STAGES[0];
  for (const s of ILLUSTRATION_STAGES) if (week >= s) stage = s;
  return stage;
}

/** Image path relative to the site root, e.g. "images/baby/baby-week-06.webp". */
export function stageImagePath(week: number): string {
  return `images/baby/baby-week-${String(stageForWeek(week)).padStart(2, '0')}.webp`;
}
