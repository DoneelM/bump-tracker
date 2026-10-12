/**
 * Feedback by email: builds a mailto: draft the user sends from their own mail app. The app itself sends
 * nothing, so there is no server and no CSP change. Pure.
 */

export const FEEDBACK_EMAIL = 'dons-bot@agentmail.to';
export const MIN_MESSAGE = 5;
/** Keeps the mailto: URL a length every mail app accepts. */
export const MAX_MESSAGE = 1500;
export const MAX_REPLY_TO = 200;

export const FEEDBACK_TYPES = ['feedback', 'feature', 'bug', 'other'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_LABEL: Record<FeedbackType, string> = {
  feedback: 'Feedback',
  feature: 'Feature request',
  bug: 'Something’s broken',
  other: 'Other',
};

export const FEEDBACK_DESC: Record<FeedbackType, string> = {
  feedback: 'What you like, or what could be better',
  feature: 'Something you’d like Bump Tracker to do',
  bug: 'Something isn’t working as it should',
  other: 'Anything else',
};

export interface FeedbackDraft {
  type: FeedbackType;
  message: string;
  replyTo: string;
  /** Included only if the user leaves "Include app info" ticked. */
  appInfo: string | null;
}

export function validateFeedback(d: Pick<FeedbackDraft, 'type' | 'message' | 'replyTo'>): { message?: string; replyTo?: string; type?: string } {
  const errors: { message?: string; replyTo?: string; type?: string } = {};
  if (!FEEDBACK_TYPES.includes(d.type)) errors.type = 'Choose what this is about.';
  const m = d.message.trim();
  if (m.length < MIN_MESSAGE) errors.message = 'Tell us a little more (at least a few words).';
  else if (m.length > MAX_MESSAGE) errors.message = `Please keep it under ${MAX_MESSAGE} characters.`;
  const r = d.replyTo.trim();
  if (r && (r.length > MAX_REPLY_TO || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r))) errors.replyTo = 'That email address doesn’t look right.';
  return errors;
}

export interface AppInfoInput {
  version: string;
  mode: 'pregnancy' | 'baby' | 'ended';
  theme: string;
  width: number;
  height: number;
  installed: boolean;
}

/** Technical details only: never dates, names or anything the user has logged. */
export const buildAppInfo = (i: AppInfoInput): string =>
  [
    `App version: ${i.version}`,
    `Mode: ${i.mode}`,
    `Theme: ${i.theme}`,
    `Screen: ${i.width} x ${i.height}`,
    `Installed as an app: ${i.installed ? 'yes' : 'no'}`,
  ].join('\n');

export function buildFeedbackBody(d: FeedbackDraft): string {
  const parts = [d.message.trim()];
  if (d.replyTo.trim()) parts.push(`Reply to: ${d.replyTo.trim()}`);
  if (d.appInfo) parts.push(`--\n${d.appInfo}`);
  return parts.join('\n\n');
}

/** mailto: link with subject and body; line breaks as CRLF, which mail apps expect. */
export function buildMailto(d: FeedbackDraft): string {
  const enc = (s: string) => encodeURIComponent(s.replace(/\r?\n/g, '\r\n'));
  return `mailto:${FEEDBACK_EMAIL}?subject=${enc(`[Bump Tracker] ${FEEDBACK_LABEL[d.type]}`)}&body=${enc(buildFeedbackBody(d))}`;
}
