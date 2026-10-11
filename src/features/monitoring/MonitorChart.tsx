import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface MonitorSeries {
  key: string;
  name: string;
  className: string;
}

const dayFmt = new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short' });

/** Readings over time (x = epoch ms), with the user's own upper limits as dashed lines. */
export function MonitorChart({
  rows,
  series,
  limits,
  unit,
}: {
  rows: Record<string, number | null>[];
  series: MonitorSeries[];
  limits: { value: number; label: string }[];
  unit: string;
}) {
  return (
    <div className="chart" aria-hidden="true">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="t" domain={['dataMin', 'dataMax']} scale="time" tickFormatter={(t: number) => dayFmt.format(t)} tick={{ fontSize: 12 }} />
          <YAxis width={44} tick={{ fontSize: 12 }} domain={['auto', 'auto']} label={{ value: unit, angle: -90, position: 'insideLeft', fontSize: 12 }} />
          <Tooltip labelFormatter={(t) => dayFmt.format(Number(t))} />
          {limits.map((l) => (
            <ReferenceLine key={l.label} className="chart-limit" y={l.value} strokeDasharray="6 3" label={{ value: l.label, position: 'insideTopRight', fontSize: 11 }} />
          ))}
          {series.map((s) => (
            <Line key={s.key} className={s.className} dataKey={s.key} name={s.name} strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
