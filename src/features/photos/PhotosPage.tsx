import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { FormField } from '../../components/FormField';
import { Page } from '../../components/Page';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import {
  deleteWeekPhoto,
  listPhotos,
  MAX_PHOTO_WEEK,
  MIN_PHOTO_WEEK,
  preparePhoto,
  putWeekPhoto,
} from '../../lib/photoStore';
import { gestationalAge } from '../../lib/pregnancy';
import type { PregnancyProfile } from '../../lib/profile';
import { requestPersistentStorage } from '../../lib/storage';
import { PhotoSlideshow, type SlidePhoto } from './PhotoSlideshow';

const WEEKS = Array.from({ length: MAX_PHOTO_WEEK - MIN_PHOTO_WEEK + 1 }, (_, i) => MIN_PHOTO_WEEK + i);

export function PhotosPage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const currentWeek = Math.min(MAX_PHOTO_WEEK, Math.max(MIN_PHOTO_WEEK, gestationalAge(profile.dueDate, today).weeks));
  const [photos, setPhotos] = useState<SlidePhoto[]>([]);
  const [reload, setReload] = useState(0);
  const [week, setWeek] = useState(currentWeek);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideshow, setSlideshow] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    listPhotos()
      .then((list) => {
        if (cancelled) return;
        setPhotos(
          list.map((p) => {
            const url = URL.createObjectURL(p.blob);
            urls.push(url);
            return { week: p.week!, url, addedOn: p.takenOn };
          }),
        );
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load photos.'));
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [reload]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (photos.some((p) => p.week === week) && !window.confirm(`Replace the photo for week ${week}?`)) return;
    setBusy(true);
    try {
      await putWeekPhoto(await preparePhoto(file), week, today);
      void requestPersistentStorage();
      setError(null);
      setReload((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this photo.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(w: number) {
    if (!window.confirm(`Delete the photo for week ${w}? This can’t be undone.`)) return;
    try {
      await deleteWeekPhoto(w);
      setReload((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this photo.');
    }
  }

  const replace = (w: number) => {
    setWeek(w);
    fileRef.current?.click();
  };

  return (
    <Page title="Bump photos" icon="📸" back={{ to: '/tools', label: 'Tools' }}>
      <div className="card card--soft" role="note">
        <p>
          Photos stay only on this device. They’re shrunk to fit (up to 1280 px) and re-saved when you add them, which also
          removes hidden data such as the location a photo was taken. Photos are not part of the JSON backup unless you tick
          “include photos” when you make one.
        </p>
      </div>

      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}

      <section className="card form" aria-labelledby="ph-add">
        <h2 id="ph-add">Add a photo</h2>
        <FormField id="ph-week" label="Week" hint="One photo per week. Adding to a week that has a photo replaces it.">
          {(aria) => (
            <select {...aria} className="input input--short" value={week} onChange={(e) => setWeek(Number(e.target.value))}>
              {WEEKS.map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
        <div className="button-row">
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? 'Saving…' : 'Take or choose photo'}
          </button>
          {photos.length > 1 && (
            <button type="button" className="btn btn--ghost" onClick={() => setSlideshow(0)}>
              ▶ Slideshow
            </button>
          )}
        </div>
      </section>

      <section aria-labelledby="ph-timeline">
        <h2 id="ph-timeline">Timeline</h2>
        {photos.length === 0 ? (
          <p className="muted">No photos yet.</p>
        ) : (
          <ul className="photo-grid">
            {photos.map((p, i) => (
              <li key={p.week}>
                <button type="button" className="photo-grid__thumb" onClick={() => setSlideshow(i)}>
                  <img src={p.url} alt={`Bump photo, week ${p.week}, added ${formatDisplayDate(p.addedOn)}`} loading="lazy" />
                  <span className="photo-grid__label">Week {p.week}</span>
                </button>
                <div className="button-row">
                  <button type="button" className="btn btn--ghost" onClick={() => replace(p.week)}>
                    Replace
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => remove(p.week)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {slideshow !== null && <PhotoSlideshow photos={photos} start={slideshow} onClose={() => setSlideshow(null)} />}
    </Page>
  );
}
