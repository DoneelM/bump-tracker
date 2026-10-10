import { useEffect } from 'react';
import { HealthDisclaimer } from '../../components/HealthDisclaimer';
import { writeStored, STORAGE_KEYS, isStorageAvailable, requestPersistentStorage } from '../../lib/storage';
import { useToday } from '../../lib/useToday';
import { navigate } from '../../app/router';
import { PregnancyForm } from './PregnancyForm';

/** First-launch setup, shown instead of the app until a profile is saved. */
export function OnboardingPage() {
  const today = useToday();

  useEffect(() => {
    document.title = 'Welcome · Bump Tracker';
  }, []);

  return (
    <main className="onboarding" id="main">
      <div className="onboarding__hero">
        <span className="onboarding__emoji" aria-hidden="true">
          🤰
        </span>
        <h1>Kia ora, welcome to Bump Tracker</h1>
        <p>
          Let’s work out your estimated due date. Everything you enter stays private on this device. There are no
          accounts and nothing is sent anywhere.
        </p>
      </div>
      {!isStorageAvailable() && (
        <p className="card card--warning" role="alert">
          Your browser is blocking local storage, so Bump Tracker can’t save your details. Check your privacy
          settings or try a different browser.
        </p>
      )}
      <PregnancyForm
        today={today}
        initial={null}
        submitLabel="Looks right, let’s go"
        onSave={(profile) => {
          const result = writeStored(STORAGE_KEYS.profile, profile);
          if (!result.ok) return result.error;
          void requestPersistentStorage();
          navigate('/', { replace: true });
          return null;
        }}
      />
      <HealthDisclaimer />
    </main>
  );
}
