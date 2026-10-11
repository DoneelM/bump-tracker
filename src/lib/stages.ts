/** Weeks that have a baby illustration in public/images/baby/. */
export const ILLUSTRATION_STAGES = [6, 8, 12, 16, 20, 24, 28] as const;

/** Closest illustration stage at or below `week` (weeks before 6 use 6; 28+ use 28). */
export function stageForWeek(week: number): number {
  let stage: number = ILLUSTRATION_STAGES[0];
  for (const s of ILLUSTRATION_STAGES) if (week >= s) stage = s;
  return stage;
}

/** Alt text that doesn't claim a week the art isn't for: weeks 4-7 reuse the week 6 image, 28+ reuse week 28. */
export function stageAlt(week: number): string {
  const stage = stageForWeek(week);
  if (week === stage) return `Stylised illustration of a baby at about ${stage} weeks of pregnancy`;
  if (week > stage && week >= 28) return 'Stylised illustration of a baby in late pregnancy';
  if (week < 8) return 'Stylised illustration of a baby in early pregnancy';
  return `Stylised illustration of a baby at about ${stage} weeks of pregnancy`;
}

/** Image path relative to the site root, e.g. "images/baby/baby-week-06.webp". */
export function stageImagePath(week: number): string {
  return `images/baby/baby-week-${String(stageForWeek(week)).padStart(2, '0')}.webp`;
}
