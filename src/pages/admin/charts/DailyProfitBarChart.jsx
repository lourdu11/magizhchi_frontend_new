import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#D4AF37', '#1A1A1A', '#4F46E5', '#10B981', '#F59E0B'];

export default function DailyProfitBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={1}>
      <BarChart data={data}>
        <XAxis
          dataKey="category"
          tick={{ fontSize: 10, fontWeight: 900 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#F8F9FA' }}
          contentStyle={{
            borderRadius: '20px', border: 'none',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 900
          }}
        />
        <Bar dataKey="profit" radius={[10, 10, 0, 0]} barSize={40}>
          {data?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
