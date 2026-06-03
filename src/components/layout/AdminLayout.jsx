import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart2, Settings, FileText, Tag, Image, UserCog, Boxes, LogOut, ChevronLeft, ChevronRight, Menu, RefreshCcw, Star, Truck, History, RotateCcw, LayoutGrid, X, Receipt, Smartphone } from 'lucide-react';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../../store';
import { adminService } from '../../services';

function WhatsAppStatus({ collapsed }) {
  const [status, setStatus] = useState('Checking...');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!useAuthStore.getState().isAuthenticated) return;
      try {
        const { data } = await adminService.getHealth();
        setStatus(data.whatsapp || 'Unknown');
        setIsReady(data.whatsapp === 'Ready');
      } catch (_err) {
        setStatus('Error');
        setIsReady(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`px-4 py-2 mt-auto mb-2 ${collapsed ? 'flex justify-center' : ''}`}>
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-xl border font-sans text-xs
        ${isReady ? 'bg-[#E6F4EA] border-[#CEEAD6] text-[#137333]' : 'bg-[#FEF7E0] border-[#FEEFC3] text-[#B06000]'}
      `}>
        <Smartphone size={14} className={isReady ? '' : 'animate-pulse'} />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-[7.5px] font-black uppercase tracking-widest leading-none">WhatsApp</span>
            <span className="text-[9.5px] font-black uppercase tracking-tighter mt-0.5">{status}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Tag, label: 'Category', path: '/admin/categories' },
  { icon: Truck, label: 'Procurement Hub', path: '/admin/procurement' },
  { icon: Boxes, label: 'Product Profiles', path: '/admin/profiles' },
  { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
  { icon: Users, label: 'Customers', path: '/admin/users' },
  { icon: ShoppingBag, label: 'Create Bill', path: '/admin/create-bill' },
  { icon: FileText, label: 'Offline Bills', path: '/admin/bills' },
  { icon: Star, label: 'Reviews', path: '/admin/reviews' },
  { icon: BarChart2, label: 'Analysis', path: '/admin/analytics' },
  { icon: Smartphone, label: 'Broadcast Center', path: '/admin/broadcast' },
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

  const handleLogout = () => { 
    navigate('/'); 
    setTimeout(() => {
      logout();
    }, 50);
  };

  return (
    <div className="min-h-dvh print:min-h-0 print:h-auto print:block bg-[#F8F9FA] font-sans">
      {/* Mobile Header (Fixed at top) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#DADCE0] px-4 sm:px-6 flex items-center justify-between z-[60] print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-black text-[#202124] text-sm tracking-tighter leading-none uppercase">MAGIZHCHI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
        </div>
        <button 
          onClick={() => setMobileOpen(true)} 
          className="w-10 h-10 bg-[#F1F3F4] text-[#202124] rounded-xl flex items-center justify-center hover:bg-[#E8F0FE] active:scale-95 transition-all"
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
            className="fixed inset-0 bg-[#202124]/40 backdrop-blur-sm z-[70] lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${collapsed ? 'w-16' : 'w-64'} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shrink-0 bg-white border-r border-[#DADCE0] flex flex-col transition-all duration-300 fixed lg:sticky top-0 h-dvh z-[80] shadow-xl lg:shadow-none print:hidden
        `}>
          {/* Logo */}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 sm:px-6 py-5 border-b border-[#F1F3F4]`}>
            {!collapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-[#202124] text-base tracking-tighter leading-none">MAGIZHCHI</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                </div>
                <span className="text-[8px] text-[#5F6368] font-black tracking-[0.25em] uppercase mt-1">Control Console</span>
              </div>
            )}
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block text-[#5F6368] hover:text-[#202124] transition-colors">
              {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden w-8 h-8 bg-[#F1F3F4] text-[#5F6368] rounded-lg flex items-center justify-center hover:bg-[#E8F0FE]">
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 sm:py-6 overflow-y-auto custom-scrollbar px-3 space-y-1">
            {NAV.map(({ icon: Icon, label, path }) => {
              const active = location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));
              return (
                <Link 
                  key={path} 
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                    ${active ? 'bg-[#E8F0FE] text-[#1a73e8] font-black' : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]'}
                  `}
                >
                  <Icon size={18} className={`${active ? 'text-[#1a73e8]' : 'group-hover:scale-105 transition-transform'}`} />
                  {(!collapsed || mobileOpen) && <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* WhatsApp Status */}
          <WhatsAppStatus collapsed={collapsed} />

          {/* User Profile */}
          <div className={`border-t border-[#F1F3F4] p-4 sm:p-6 ${collapsed && !mobileOpen ? 'flex flex-col items-center' : ''}`}>
            {(!collapsed || mobileOpen) && (
              <div className="mb-4 bg-[#F8F9FA] border border-[#DADCE0] p-4 rounded-2xl">
                <p className="text-[#202124] text-[10px] font-black uppercase tracking-widest truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[#5F6368] text-[8px] font-bold uppercase tracking-widest mt-1">Full Access</p>
              </div>
            )}
            <button onClick={handleLogout} className={`flex items-center gap-3 text-[#5F6368] hover:text-[#EA4335] transition-colors ${collapsed && !mobileOpen ? '' : 'px-2'}`}>
              <LogOut size={16} />
              {(!collapsed || mobileOpen) && <span className="text-[9px] font-black uppercase tracking-[0.2em]">Exit System</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden min-h-dvh print:min-h-0 print:h-auto print:m-0 print:p-0 print:block pt-16 lg:pt-0">
          <div className="w-full p-4 md:p-5 md:p-10 print:p-0 print:m-0 max-w-[1600px] print:max-w-none mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
