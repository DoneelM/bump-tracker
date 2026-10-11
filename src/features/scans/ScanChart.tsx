import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import { efwPercentilesAtDays, EFW_FIRST_WEEK, EFW_LAST_WEEK, WHO_EFW } from '../../lib/fetalGrowth';

export interface ScanPoint {
  /** Gestational age in total days. */
  days: number;
  efwG: number;
}

interface Row {
  week: number;
  p50?: number;
  band?: [number, number];
  efw?: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** User's EFW points against the WHO median with the p10-p90 band, weeks 14-40. */
export function ScanChart({ points }: { points: ScanPoint[] }) {
  const rows: Row[] = WHO_EFW.map((r) => ({ week: r.week, p50: r.p50, band: [r.p10, r.p90] }));
  for (const p of points) {
    const pct = efwPercentilesAtDays(p.days);
    if (!pct) continue;
    rows.push({ week: round1(p.days / 7), p50: round1(pct.p50), band: [round1(pct.p10), round1(pct.p90)], efw: p.efwG });
  }
  rows.sort((a, b) => a.week - b.week);

  return (
    <div className="chart" aria-hidden="true">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="#f0dccf" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="week"
            domain={[EFW_FIRST_WEEK, EFW_LAST_WEEK]}
            ticks={[14, 18, 22, 26, 30, 34, 38, 40]}
            tick={{ fontSize: 12 }}
            label={{ value: 'Weeks of pregnancy', position: 'insideBottom', offset: -12, fontSize: 12 }}
          />
          <YAxis width={48} tick={{ fontSize: 12 }} label={{ value: 'Weight (g)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
          <Tooltip
            itemStyle={{ color: 'var(--color-text)' }}
            labelStyle={{ color: 'var(--color-text)' }}
            formatter={(v) => (Array.isArray(v) ? `${v[0]} to ${v[1]} g` : `${v} g`)} labelFormatter={(w) => `Week ${w}`} />
          <Area className="chart-band" dataKey="band" name="Typical range (10th to 90th)" stroke="none" fill="#b7cfae" fillOpacity={0.6} isAnimationActive={false} />
          <Line className="chart-mid" dataKey="p50" name="Typical middle (50th)" stroke="#3d5a40" strokeWidth={2} strokeDasharray="6 3" dot={false} isAnimationActive={false} />
          <Scatter className="chart-you" dataKey="efw" name="Your scan estimate" fill="#b04a32" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
