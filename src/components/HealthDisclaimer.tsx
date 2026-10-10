export const DISCLAIMER_TEXT =
  'General information only, not medical advice. Contact your midwife/LMC with any concerns, or call 111 in an emergency (NZ).';

export function HealthDisclaimer() {
  return (
    <aside className="disclaimer" aria-label="Health disclaimer">
      <span className="disclaimer__icon" aria-hidden="true">
        ℹ️
      </span>
      <p>{DISCLAIMER_TEXT}</p>
    </aside>
  );
}
