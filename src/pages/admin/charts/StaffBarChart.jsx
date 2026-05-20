import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#D4AF37', '#1A1A1A', '#4F46E5', '#10B981', '#F59E0B'];

export default function StaffBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={1}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 10, fontWeight: 900 }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip
          contentStyle={{ borderRadius: '20px', border: 'none', fontWeight: 900 }}
        />
        <Bar dataKey="totalSales" radius={[0, 10, 10, 0]} barSize={30}>
          {data?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
