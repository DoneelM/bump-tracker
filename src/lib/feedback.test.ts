import { describe, expect, it } from 'vitest';
import {
  buildAppInfo,
  buildFeedbackBody,
  buildFormUrl,
  buildMailto,
  FEEDBACK_EMAIL,
  FEEDBACK_FORM,
  MAX_MESSAGE,
  validateFeedback,
  type FeedbackDraft,
} from './feedback';

const draft = (over: Partial<FeedbackDraft> = {}): FeedbackDraft => ({
  type: 'feature',
  message: 'Kia ora, pēpi tracker idea',
  replyTo: '',
  appInfo: null,
  ...over,
});

describe('validateFeedback', () => {
  it('accepts a normal message', () => {
    expect(validateFeedback(draft())).toEqual({});
  });

  it('catches short, long, bad email and unknown type', () => {
    expect(validateFeedback(draft({ message: '  hi ' })).message).toBeDefined();
    expect(validateFeedback(draft({ message: 'x'.repeat(MAX_MESSAGE + 1) })).message).toBeDefined();
    expect(validateFeedback(draft({ replyTo: 'not-an-email' })).replyTo).toBeDefined();
    expect(validateFeedback(draft({ replyTo: ' me@example.nz ' })).replyTo).toBeUndefined();
    expect(validateFeedback({ ...draft(), type: 'spam' as never }).type).toBeDefined();
  });
});

describe('buildAppInfo', () => {
  it('holds only technical details', () => {
    const info = buildAppInfo({ version: '0.1.0', mode: 'baby', theme: 'dark', width: 390, height: 844, installed: true });
    expect(info).toBe('App version: 0.1.0\nMode: baby\nTheme: dark\nScreen: 390 x 844\nInstalled as an app: yes');
  });
});

describe('buildMailto', () => {
  it('addresses us with a subject per type and an encoded body', () => {
    const url = buildMailto(draft({ replyTo: 'me@example.nz', appInfo: 'Mode: baby' }));
    expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?subject=`)).toBe(true);
    const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));
    expect(params.get('subject')).toBe('[Bump Tracker] Feature request');
    expect(params.get('body')).toBe('Kia ora, pēpi tracker idea\r\n\r\nReply to: me@example.nz\r\n\r\n--\r\nMode: baby');
    expect(url).not.toMatch(/\s/);
  });

  it('leaves out the reply line and app info when not given', () => {
    expect(buildFeedbackBody(draft())).toBe('Kia ora, pēpi tracker idea');
  });
});

describe('buildFormUrl', () => {
  it('pre-fills the Google Form fields', () => {
    const url = new URL(buildFormUrl(draft({ type: 'bug', replyTo: 'me@example.nz', appInfo: 'Mode: baby\nTheme: dark' })));
    expect(`${url.origin}${url.pathname}`).toBe(FEEDBACK_FORM.url);
    expect(url.searchParams.get('usp')).toBe('pp_url');
    expect(url.searchParams.get(FEEDBACK_FORM.type)).toBe("Something's broken");
    expect(url.searchParams.get(FEEDBACK_FORM.message)).toBe('Kia ora, pēpi tracker idea');
    expect(url.searchParams.get(FEEDBACK_FORM.replyTo)).toBe('me@example.nz');
    expect(url.searchParams.get(FEEDBACK_FORM.appInfo)).toBe('Mode: baby\nTheme: dark');
  });

  it('leaves out empty optional fields', () => {
    const url = new URL(buildFormUrl(draft()));
    expect(url.searchParams.has(FEEDBACK_FORM.replyTo)).toBe(false);
    expect(url.searchParams.has(FEEDBACK_FORM.appInfo)).toBe(false);
  });
});
