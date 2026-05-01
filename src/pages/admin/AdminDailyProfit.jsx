import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services';
import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  ArrowUpRight, 
  Calendar, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  PieChart as PieChartIcon,
  Layers,
  ArrowDownRight,
  BarChart2
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const COLORS = ['#D4AF37', '#1A1A1A', '#4F46E5', '#10B981', '#F59E0B'];

export default function AdminDailyProfit() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: report, isLoading } = useQuery({
    queryKey: ['daily-profit-report', selectedDate],
    queryFn: () => adminService.getDailyProfitReport(selectedDate).then(r => r.data.data),
  });

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-premium-gold" size={40} /></div>;

  const stats = [
    { label: 'Revenue', value: `₹${report?.totalRevenue?.toLocaleString()}`, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Cost', value: `₹${report?.totalCost?.toLocaleString()}`, icon: IndianRupee, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Gross Profit', value: `₹${report?.grossProfit?.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Margin', value: `${report?.marginPercent?.toFixed(1)}%`, icon: BarChart2, color: 'text-premium-gold', bg: 'bg-gold-soft/30' },
  ];

  return (
    <div className="space-y-10 pb-20">
      <Helmet><title>Profit Report — Admin</title></Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border border-border-light shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight">Daily Profit Report</h1>
          <p className="text-text-muted text-sm font-medium">Financial performance for {new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
        </div>

        <div className="flex items-center gap-3 bg-light-bg p-2 rounded-2xl">
          <button onClick={() => changeDate(-1)} className="p-3 hover:bg-white rounded-xl transition-all"><ChevronLeft size={20} /></button>
          <div className="relative">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border-none shadow-sm cursor-pointer"
            />
          </div>
          <button onClick={() => changeDate(1)} className="p-3 hover:bg-white rounded-xl transition-all"><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-border-light shadow-sm hover:shadow-xl transition-all">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <h2 className="text-3xl font-black text-charcoal tracking-tighter">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white p-10 rounded-[3rem] border border-border-light shadow-sm">
          <h3 className="text-xs font-black text-charcoal uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
            <Layers size={18} className="text-premium-gold" /> Profit by Category
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.byCategory || []}>
                <XAxis dataKey="category" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F8F9FA' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 900 }} />
                <Bar dataKey="profit" radius={[10, 10, 0, 0]} barSize={40}>
                  {report?.byCategory?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {report?.byCategory?.map((cat, i) => (
              <div key={i} className="p-4 bg-light-bg rounded-2xl">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{cat.category}</p>
                <p className="text-sm font-black text-charcoal">₹{cat.profit.toLocaleString()}</p>
                <div className="text-[9px] font-bold text-emerald-600 mt-1">{((cat.profit / cat.revenue) * 100).toFixed(1)}% Margin</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Profitable Products */}
        <div className="bg-white p-10 rounded-[3rem] border border-border-light shadow-sm">
          <h3 className="text-xs font-black text-charcoal uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
            <TrendingUp size={18} className="text-premium-gold" /> Most Profitable Today
          </h3>
          <div className="space-y-4">
            {report?.topProducts?.length === 0 ? (
               <div className="py-20 text-center text-xs font-bold text-text-muted uppercase tracking-widest">No sales recorded today</div>
            ) : report?.topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-light-bg/50 rounded-3xl border border-border-light hover:bg-white transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-premium-gold border border-border-light shadow-sm group-hover:scale-110 transition-transform">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-charcoal uppercase tracking-tight line-clamp-1">{p.name}</p>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-0.5">{p.unitsSold} Units Sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">+₹{p.profit.toLocaleString()}</p>
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1">Revenue: ₹{p.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
