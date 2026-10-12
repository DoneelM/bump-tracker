import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const dayFmt = new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const label = (day: string) => dayFmt.format(new Date(`${day}T00:00:00Z`));

/** One bar per day. Lazy-loaded (Recharts stays out of the main chunk). */
export function TrendsChart({ rows, unit }: { rows: { day: string; value: number }[]; unit: string }) {
  return (
    <div className="chart" aria-hidden="true">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tickFormatter={label} tick={{ fontSize: 12 }} interval="preserveStartEnd" />
          <YAxis width={36} tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip labelFormatter={(d) => label(String(d))} formatter={(v) => [`${v} ${unit}`, '']} />
          <Bar className="chart-bar" dataKey="value" isAnimationActive={false} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
