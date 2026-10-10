interface ProgressBarProps {
  /** 0..1 */
  value: number;
  label: string;
  /** Human-readable value for assistive tech, e.g. "24 of 40 weeks". */
  valueText: string;
}

export function ProgressBar({ value, label, valueText }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={valueText}
    >
      <div className="progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
