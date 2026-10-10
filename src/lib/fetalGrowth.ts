/**
 * WHO fetal growth chart: estimated fetal weight (EFW, grams) percentiles by completed
 * gestational week. Kiserud et al. 2017, PLOS Medicine 14(1): e1002220, Table 11,
 * sexes combined. Values copied exactly from the published table.
 *
 * These are reference lines, not a diagnostic tool: wording here stays neutral.
 */
export interface EfwRow {
  week: number;
  p10: number;
  p50: number;
  p90: number;
}

export const EFW_FIRST_WEEK = 14;
export const EFW_LAST_WEEK = 40;

export const WHO_EFW: readonly EfwRow[] = [
  { week: 14, p10: 78, p50: 90, p90: 104 },
  { week: 15, p10: 99, p50: 114, p90: 132 },
  { week: 16, p10: 124, p50: 144, p90: 166 },
  { week: 17, p10: 155, p50: 179, p90: 207 },
  { week: 18, p10: 192, p50: 222, p90: 255 },
  { week: 19, p10: 235, p50: 272, p90: 313 },
  { week: 20, p10: 286, p50: 330, p90: 380 },
  { week: 21, p10: 345, p50: 398, p90: 458 },
  { week: 22, p10: 412, p50: 476, p90: 548 },
  { week: 23, p10: 489, p50: 565, p90: 650 },
  { week: 24, p10: 576, p50: 665, p90: 765 },
  { week: 25, p10: 673, p50: 778, p90: 894 },
  { week: 26, p10: 780, p50: 902, p90: 1038 },
  { week: 27, p10: 898, p50: 1039, p90: 1196 },
  { week: 28, p10: 1026, p50: 1189, p90: 1368 },
  { week: 29, p10: 1165, p50: 1350, p90: 1554 },
  { week: 30, p10: 1313, p50: 1523, p90: 1753 },
  { week: 31, p10: 1470, p50: 1707, p90: 1964 },
  { week: 32, p10: 1635, p50: 1901, p90: 2187 },
  { week: 33, p10: 1807, p50: 2103, p90: 2419 },
  { week: 34, p10: 1985, p50: 2312, p90: 2659 },
  { week: 35, p10: 2167, p50: 2527, p90: 2904 },
  { week: 36, p10: 2352, p50: 2745, p90: 3153 },
  { week: 37, p10: 2537, p50: 2966, p90: 3403 },
  { week: 38, p10: 2723, p50: 3186, p90: 3652 },
  { week: 39, p10: 2905, p50: 3403, p90: 3897 },
  { week: 40, p10: 3084, p50: 3617, p90: 4135 },
];

export interface EfwPercentiles {
  p10: number;
  p50: number;
  p90: number;
}

/** Percentile lines at a gestational age in total days, linearly interpolated between weeks. Null outside 14w0d-40w0d. */
export function efwPercentilesAtDays(totalDays: number): EfwPercentiles | null {
  if (!Number.isFinite(totalDays)) return null;
  const weekPos = totalDays / 7;
  if (weekPos < EFW_FIRST_WEEK || weekPos > EFW_LAST_WEEK) return null;
  const lo = Math.min(Math.floor(weekPos), EFW_LAST_WEEK - 1);
  const a = WHO_EFW[lo - EFW_FIRST_WEEK];
  const b = WHO_EFW[lo - EFW_FIRST_WEEK + 1];
  if (!a || !b) return null;
  const t = weekPos - lo;
  const mix = (x: number, y: number) => x + (y - x) * t;
  return { p10: mix(a.p10, b.p10), p50: mix(a.p50, b.p50), p90: mix(a.p90, b.p90) };
}

/** Neutral description of where an EFW sits relative to the p10/p50/p90 lines. */
export function describeEfw(efwGrams: number, totalDays: number): string {
  const p = efwPercentilesAtDays(totalDays);
  if (!p) return 'outside the 14 to 40 week range of the WHO chart, so there is no comparison line';
  if (efwGrams < p.p10) return 'below the 10th percentile line';
  if (efwGrams > p.p90) return 'above the 90th percentile line';
  // "Around the middle" = within 10% of the p10-p90 span of the 50th line.
  if (Math.abs(efwGrams - p.p50) <= 0.1 * (p.p90 - p.p10)) return 'around the typical middle (50th percentile line)';
  return efwGrams < p.p50 ? 'between the 10th and 50th percentile lines' : 'between the 50th and 90th percentile lines';
}
