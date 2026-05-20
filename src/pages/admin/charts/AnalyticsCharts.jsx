import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export function AnalyticsAreaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
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
            fontSize: 11, fontWeight: 700, padding: 16
          }}
          formatter={v => [fmt(v), 'Revenue']}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#D4AF37"
          strokeWidth={3}
          fill="url(#aGrad)"
          dot={{ fill: '#D4AF37', r: 3, strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AnalyticsBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: '#999' }}
          tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          dataKey="_id"
          type="category"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: '#202124', fontWeight: 700 }}
          width={50}
        />
        <Tooltip
          formatter={v => [fmt(v), 'Revenue']}
          contentStyle={{
            borderRadius: 16, border: 'none',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            fontSize: 11, fontWeight: 700
          }}
        />
        <Bar dataKey="revenue" fill="#D4AF37" radius={[0, 8, 8, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
