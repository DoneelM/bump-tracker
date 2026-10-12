import { usePingSetting } from '../../lib/ping';

/** The anonymous daily count switch, for this device only. */
export function CountSection() {
  const [on, setOn] = usePingSetting();
  return (
    <section className="card" aria-labelledby="count-heading">
      <h2 id="count-heading">Anonymous count</h2>
      <label className="question__check">
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
        <span>Help us count how many people use Hey Baby</span>
      </label>
      <p className="muted">
        Once a day this device tells us it was used, with the app version and whether it’s in pregnancy or baby mode.
        No name, no ID and nothing you’ve entered, so we can’t tell who you are. Saved on this device only.
      </p>
    </section>
  );
}
