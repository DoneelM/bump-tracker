import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { recommendedRangeAtWeek, type BmiCategory } from '../../lib/weightGain';

export interface WeightPoint {
  week: number;
  /** kg gained since before pregnancy, or absolute kg when there is no baseline. */
  value: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Weight (or gain) by gestational week; shades the approximate IOM band when a category is known. */
export function WeightChart({ points, category, gain }: { points: WeightPoint[]; category: BmiCategory | null; gain: boolean }) {
  const rows: { week: number; value?: number; band?: [number, number] }[] = [];
  if (category) {
    for (let w = 0; w <= 40; w++) {
      const r = recommendedRangeAtWeek(category, w);
      rows.push({ week: w, band: [round1(r.low), round1(r.high)] });
    }
  }
  for (const p of points) {
    // One row per entry (not per week), so two entries on the same day both show.
    const band = category ? recommendedRangeAtWeek(category, p.week) : null;
    rows.push({ week: p.week, value: round1(p.value), band: band ? [round1(band.low), round1(band.high)] : undefined });
  }
  const data = rows.sort((a, b) => a.week - b.week);
  const unit = gain ? 'Gain (kg)' : 'Weight (kg)';

  return (
    <div className="chart" aria-hidden="true">
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="#f0dccf" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="week"
            domain={[0, 40]}
            ticks={[0, 8, 16, 24, 32, 40]}
            tick={{ fontSize: 12 }}
            label={{ value: 'Weeks of pregnancy', position: 'insideBottom', offset: -12, fontSize: 12 }}
          />
          <YAxis width={44} tick={{ fontSize: 12 }} domain={['auto', 'auto']} label={{ value: unit, angle: -90, position: 'insideLeft', fontSize: 12 }} />
          <Tooltip formatter={(v) => (Array.isArray(v) ? `${v[0]} to ${v[1]} kg` : `${v} kg`)} labelFormatter={(w) => `Week ${w}`} />
          {category && <Area className="chart-band" dataKey="band" name="Approximate recommended range" stroke="none" fill="#b7cfae" fillOpacity={0.6} isAnimationActive={false} />}
          <Line className="chart-you" dataKey="value" name={gain ? 'Your gain' : 'Your weight'} stroke="#b04a32" strokeWidth={2.5} dot={{ r: 4, fill: '#b04a32' }} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
