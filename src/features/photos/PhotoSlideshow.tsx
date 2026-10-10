import { useEffect, useRef, useState } from 'react';

export interface SlidePhoto {
  week: number;
  url: string;
  addedOn: string;
}

const INTERVAL_MS = 2000;

/** Fullscreen-ish overlay: auto-advances every 2 s; arrows navigate, Escape closes. */
export function PhotoSlideshow({ photos, start, onClose }: { photos: SlidePhoto[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const [playing, setPlaying] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeFn = useRef(onClose);
  closeFn.current = onClose;
  const count = photos.length;
  const go = (d: number) => setIndex((i) => (i + d + count) % count);

  useEffect(() => {
    if (!playing || count < 2) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [playing, count]);

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFn.current();
      else if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count);
      else if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [count]);

  const photo = photos[index];
  if (!photo) return null;
  return (
    <div className="slideshow" role="dialog" aria-modal="true" aria-label="Bump photo slideshow">
      <img key={photo.url} className="slideshow__img" src={photo.url} alt={`Bump photo, week ${photo.week}`} />
      <p className="slideshow__label">Week {photo.week}</p>
      <div className="slideshow__controls">
        <button type="button" className="btn" onClick={() => go(-1)} aria-label="Previous photo">
          ‹
        </button>
        <button type="button" className="btn" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="btn" onClick={() => go(1)} aria-label="Next photo">
          ›
        </button>
        <button ref={closeRef} type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
