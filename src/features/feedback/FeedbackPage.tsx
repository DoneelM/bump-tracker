import { useMemo, useState, type FormEvent } from 'react';
import { FormField } from '../../components/FormField';
import { Page } from '../../components/Page';
import { copyText } from '../../lib/clipboard';
import {
  buildAppInfo,
  buildFeedbackBody,
  buildMailto,
  FEEDBACK_DESC,
  FEEDBACK_EMAIL,
  FEEDBACK_LABEL,
  FEEDBACK_TYPES,
  MAX_MESSAGE,
  MAX_REPLY_TO,
  validateFeedback,
  type FeedbackType,
} from '../../lib/feedback';
import type { PregnancyProfile } from '../../lib/profile';
import { readTheme } from '../../lib/theme';

/**
 * Contact us: feedback, feature requests and problems. Builds an email draft the user sends from their
 * own mail app; the app sends nothing itself and keeps no copy.
 */
export function FeedbackPage({ profile }: { profile: PregnancyProfile }) {
  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [includeInfo, setIncludeInfo] = useState(true);
  const [errors, setErrors] = useState<ReturnType<typeof validateFeedback>>({});
  const [opened, setOpened] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const appInfo = useMemo(
    () =>
      buildAppInfo({
        version: __APP_VERSION__,
        mode: profile.ending?.kind === 'born' ? 'baby' : profile.ending ? 'ended' : 'pregnancy',
        theme: readTheme(),
        width: window.innerWidth,
        height: window.innerHeight,
        installed: window.matchMedia?.('(display-mode: standalone)').matches ?? false,
      }),
    [profile.ending],
  );
  const draft = { type, message, replyTo, appInfo: includeInfo ? appInfo : null };

  const send = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateFeedback(draft);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(errs.message ? 'fb-message' : 'fb-reply')?.focus();
      return;
    }
    setOpened(true);
    window.location.href = buildMailto(draft);
  };

  const copy = async () => {
    const ok = await copyText(`To: ${FEEDBACK_EMAIL}\nSubject: [Bump Tracker] ${FEEDBACK_LABEL[type]}\n\n${buildFeedbackBody(draft)}`);
    setCopyStatus(ok ? 'Copied. Paste it into an email to us.' : 'Couldn’t copy. Select the text and copy it yourself.');
  };

  return (
    <Page title="Contact us" icon="💬" back={{ to: '/more', label: 'More' }} health={false}>
      <p className="lead">Tell us what you think, ask for a feature, or let us know if something’s broken. We read everything.</p>

      <form className="card form" onSubmit={send} noValidate>
        <fieldset className="choice">
          <legend className="field__label">What’s it about?</legend>
          {FEEDBACK_TYPES.map((t) => (
            <label key={t} className={`choice__option${type === t ? ' is-selected' : ''}`}>
              <input type="radio" name="fb-type" value={t} checked={type === t} onChange={() => setType(t)} />
              <span>
                <strong>{FEEDBACK_LABEL[t]}</strong>
                <span className="choice__desc">{FEEDBACK_DESC[t]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <FormField id="fb-message" label="Your message" hint={`${message.trim().length} / ${MAX_MESSAGE}`} error={errors.message}>
          {(aria) => (
            <textarea {...aria} className="input" rows={6} maxLength={MAX_MESSAGE + 50} value={message} onChange={(e) => setMessage(e.target.value)} />
          )}
        </FormField>

        <FormField id="fb-reply" label="Your email (optional)" hint="Only if you’d like a reply." error={errors.replyTo}>
          {(aria) => (
            <input
              {...aria}
              className="input"
              type="email"
              autoComplete="email"
              maxLength={MAX_REPLY_TO}
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
            />
          )}
        </FormField>

        <div className="field">
          <label className="question__check">
            <input type="checkbox" checked={includeInfo} onChange={(e) => setIncludeInfo(e.target.checked)} />
            <span>Include app info to help us fix problems</span>
          </label>
          {includeInfo && (
            <pre className="fb-info" aria-label="App info that will be included">
              {appInfo}
            </pre>
          )}
          <p className="field__hint">Never your due date, logs, notes or anything you’ve entered.</p>
        </div>

        <div className="button-row">
          <button type="submit" className="btn btn--primary">
            Write the email
          </button>
        </div>
        <p className="muted">
          This opens your mail app with everything filled in, to {FEEDBACK_EMAIL}. Nothing is sent until you tap Send there.
        </p>
      </form>

      {opened && (
        <section className="card card--soft" role="status" aria-labelledby="fb-opened">
          <h2 id="fb-opened">Your mail app should open now</h2>
          <p>If it didn’t, copy your message and email it to {FEEDBACK_EMAIL}.</p>
          <div className="button-row">
            <button type="button" className="btn btn--ghost" onClick={() => void copy()}>
              Copy message
            </button>
          </div>
          {copyStatus && <p className="muted">{copyStatus}</p>}
        </section>
      )}
    </Page>
  );
}
