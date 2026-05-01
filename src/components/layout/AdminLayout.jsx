import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart2, Settings, FileText, Tag, Image, UserCog, Boxes, LogOut, ChevronLeft, ChevronRight, Menu, RefreshCcw, Star, Truck, History, RotateCcw, LayoutGrid, X, Receipt } from 'lucide-react';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store';

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Tag, label: 'Category', path: '/admin/categories' },
  { icon: Truck, label: 'Procurement Hub', path: '/admin/procurement' },
  { icon: LayoutGrid, label: 'Catalog Master', path: '/admin/catalog' },
  { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
  { icon: Users, label: 'Customers', path: '/admin/users' },
  { icon: ShoppingBag, label: 'Create Bill', path: '/admin/create-bill' },
  { icon: FileText, label: 'Offline Bills', path: '/admin/bills' },
  { icon: Star, label: 'Reviews', path: '/admin/reviews' },
  { icon: BarChart2, label: 'Analysis', path: '/admin/analytics' },
  { icon: UserCog, label: 'Staff', path: '/admin/staff' },
  { icon: Image, label: 'Banners', path: '/admin/banners' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-light-bg">
      {/* Mobile Header (Fixed at top) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-border-light px-6 flex items-center justify-between z-[60]">
        <div className="flex flex-col">
          <span className="font-black text-charcoal text-sm tracking-tighter leading-none uppercase">MAGIZHCHI</span>
          <span className="text-[7px] text-premium-gold font-black tracking-[0.3em] uppercase mt-0.5 opacity-60">Admin Hub</span>
        </div>
        <button 
          onClick={() => setMobileOpen(true)} 
          className="w-10 h-10 bg-charcoal text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-md z-[70] lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${collapsed ? 'w-16' : 'w-64'} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shrink-0 bg-charcoal flex flex-col transition-all duration-300 fixed lg:sticky top-0 h-screen z-[80] shadow-2xl lg:shadow-none
        `}>
          {/* Logo */}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-6 py-5 border-b border-white/5`}>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-black text-white text-base tracking-tighter leading-none">MAGIZHCHI</span>
                <span className="text-[8px] text-premium-gold font-black tracking-[0.3em] uppercase mt-1 opacity-60">Control Panel</span>
              </div>
            )}
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block text-white/30 hover:text-white transition-colors">
              {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden w-8 h-8 bg-white/10 text-white rounded-lg flex items-center justify-center hover:bg-white/20">
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar px-3 space-y-1">
            {NAV.map(({ icon: Icon, label, path }) => {
              const active = location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));
              return (
                <Link 
                  key={path} 
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                    ${active ? 'bg-premium-gold text-charcoal font-black' : 'text-white/50 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <Icon size={18} className={`${active ? 'text-charcoal' : 'group-hover:scale-110 transition-transform'}`} />
                  {(!collapsed || mobileOpen) && <span className="text-[10px] uppercase tracking-widest">{label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className={`border-t border-white/5 p-6 ${collapsed && !mobileOpen ? 'flex flex-col items-center' : ''}`}>
            {(!collapsed || mobileOpen) && (
              <div className="mb-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-white text-[10px] font-black uppercase tracking-widest truncate">{user?.name || 'Administrator'}</p>
                <p className="text-white/30 text-[8px] font-bold uppercase tracking-widest mt-1">Full Access</p>
              </div>
            )}
            <button onClick={handleLogout} className={`flex items-center gap-3 text-white/30 hover:text-red-400 transition-colors ${collapsed && !mobileOpen ? '' : 'px-2'}`}>
              <LogOut size={16} />
              {(!collapsed || mobileOpen) && <span className="text-[9px] font-black uppercase tracking-[0.2em]">Exit System</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen pt-16 lg:pt-0">
          <div className="p-4 md:p-10 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
