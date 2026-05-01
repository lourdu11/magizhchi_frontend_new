import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Receipt, History, BarChart2, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store';

const NAV = [
  { icon: Receipt, label: 'Create Bill', path: '/staff' },
  { icon: History, label: 'Sales History', path: '/staff/history' },
  { icon: BarChart2, label: 'Daily Report', path: '/staff/report' },
];

export default function StaffLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-light-bg flex">
      <aside className="w-52 shrink-0 bg-charcoal flex flex-col fixed h-full z-30">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="font-display text-lg font-bold text-white tracking-widest">MAGIZHCHI</div>
          <div className="text-[9px] text-white/30 tracking-[0.4em]">STAFF PANEL</div>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map(({ icon: Icon, label, path }) => { // eslint-disable-line no-unused-vars

            const active = location.pathname === path;
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-4 py-3 transition-all ${active ? 'bg-premium-gold/20 border-r-2 border-premium-gold text-premium-gold' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="text-white text-sm font-medium">{user?.name}</p>
          <p className="text-white/40 text-xs mb-3">Staff</p>
          <button onClick={() => { logout(); navigate('/staff/login'); }} className="flex items-center gap-2 text-white/40 hover:text-stock-out text-sm">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-52 p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
