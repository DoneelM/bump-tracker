import { useState } from 'react';
import { Page } from '../../components/Page';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import { useProfile } from '../../lib/useProfile';
import { PregnancyForm } from '../onboarding/PregnancyForm';

export function SettingsPage({ today }: { today: LocalDate }) {
  const [profile, setProfile] = useProfile();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <Page title="Settings" icon="⚙️" back={{ to: '/more', label: 'More' }} health={false}>
      {saved && !editing && (
        <p className="card card--success" role="status">
          Saved. Your due date has been updated.
        </p>
      )}
      {editing ? (
        <PregnancyForm
          today={today}
          initial={profile}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSave={(next) => {
            const result = setProfile(next);
            if (!result.ok) return result.error;
            setEditing(false);
            setSaved(true);
            return null;
          }}
        />
      ) : (
        <section className="card">
          <h2>Pregnancy details</h2>
          {profile ? (
            <dl className="details">
              <dt>Estimated due date</dt>
              <dd>{formatDisplayDate(profile.dueDate)}</dd>
              <dt>Based on</dt>
              <dd>
                {profile.dating.method === 'lmp'
                  ? `Last period starting ${formatDisplayDate(profile.dating.lmp)}`
                  : `Scan on ${formatDisplayDate(profile.dating.scanDate)} showing ${profile.dating.gaWeeks}w${profile.dating.gaDays}d`}
              </dd>
              <dt>Baby’s nickname</dt>
              <dd>{profile.nickname || 'Not set'}</dd>
            </dl>
          ) : (
            <p>No details saved yet.</p>
          )}
          <div className="button-row">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setSaved(false);
                setEditing(true);
              }}
            >
              Change due date or nickname
            </button>
          </div>
        </section>
      )}
    </Page>
  );
}
