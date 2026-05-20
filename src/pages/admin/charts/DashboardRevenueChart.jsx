import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function DashboardRevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
        <XAxis
          dataKey="_id"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: '#999', fontWeight: 700 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: '#999', fontWeight: 700 }}
          tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '20px', border: 'none',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            padding: '16px', fontSize: '11px', fontWeight: 700
          }}
          formatter={v => [fmt(v), 'Revenue']}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#D4AF37"
          strokeWidth={3}
          fill="url(#revGrad)"
          dot={{ fill: '#D4AF37', r: 4, strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
