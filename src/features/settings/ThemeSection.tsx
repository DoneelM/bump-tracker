import { useTheme, type ThemePref } from '../../lib/theme';

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Match my device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Light / dark appearance for this device only. */
export function ThemeSection() {
  const [pref, setPref] = useTheme();
  return (
    <section className="card" aria-labelledby="theme-heading">
      <h2 id="theme-heading">Appearance</h2>
      <div className="chip-group" role="radiogroup" aria-labelledby="theme-heading">
        {OPTIONS.map((o) => (
          <label key={o.value} className={`chip${pref === o.value ? ' is-selected' : ''}`}>
            <input type="radio" name="theme" checked={pref === o.value} onChange={() => setPref(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
      <p className="muted">Saved on this device only.</p>
    </section>
  );
}
