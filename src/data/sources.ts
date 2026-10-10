/**
 * References for health content shown in the app.
 *
 * TODO(content): Add every source used for week guides, checklists and tool
 * thresholds. Prefer NZ sources (e.g. Health NZ / Te Whatu Ora, Ministry of
 * Health, NZ College of Midwives).
 */

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** Date the page was last checked, YYYY-MM-DD. */
  accessed: string;
}

export const SOURCES: readonly Source[] = [];
