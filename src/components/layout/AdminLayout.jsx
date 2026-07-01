import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart2, Settings, FileText, Tag, Image, UserCog, Boxes, LogOut, ChevronLeft, ChevronRight, Menu, RefreshCcw, Star, Truck, History, RotateCcw, LayoutGrid, X, Receipt, Smartphone, ShieldCheck } from 'lucide-react';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../../store';
import { adminService } from '../../services';



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

  // Map backend permission keys to exact frontend route paths
  const permissionPathMap = {
    'dashboard': '/admin',
    'categories': '/admin/categories',
    'procurement': '/admin/procurement',
    'profiles': '/admin/profiles',
    'orders': '/admin/orders',
    'customers': '/admin/users',
    'create-bill': '/admin/create-bill',
    'offline-bills': '/admin/bills',
    'reviews': '/admin/reviews',
    'analytics': '/admin/analytics',
    'broadcast': '/admin/broadcast',
    'staff': '/admin/staff',
    'banners': '/admin/banners',
    'settings': '/admin/settings'
  };

  // Dynamically derive allowed paths based on user's granted permissions
  const staffAllowedPaths = (user?.permissions || []).map(p => permissionPathMap[p]).filter(Boolean);
  
  // Filter navigation for staff
  const filteredNav = user?.role === 'staff' 
    ? NAV.filter(item => staffAllowedPaths.includes(item.path))
    : NAV;

  // Protect internal admin routes from staff
  useEffect(() => {
    if (user?.role === 'staff') {
      // Legacy token check: if permissions array doesn't exist on the user object, their session is stale.
      if (!user.permissions) {
        alert("Security Update: Your session must be refreshed. Please log in again.");
        handleLogout();
        return;
      }

      // If the admin has revoked ALL permissions, they shouldn't see any module.
      if (staffAllowedPaths.length === 0) {
        if (location.pathname !== '/admin') {
          navigate('/admin', { replace: true });
        }
        return; // They will stay on the dashboard but it will be empty
      }

      const isAllowed = staffAllowedPaths.some(p => location.pathname.startsWith(p));
      if (!isAllowed) {
        // Redirect to their first available permitted module
        navigate(staffAllowedPaths[0], { replace: true });
      }
    }
  }, [location.pathname, user, navigate, staffAllowedPaths]);

  return (
    <div className="h-dvh print:h-auto print:block bg-[#F8F9FA] font-sans overflow-hidden">
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

      <div className="flex h-full">
        {/* Sidebar */}
        <aside className={`
          ${collapsed ? 'w-16' : 'w-64'} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shrink-0 bg-white border-r border-[#DADCE0] flex flex-col transition-all duration-300 fixed lg:static top-0 h-full z-[80] shadow-xl lg:shadow-none print:hidden overflow-hidden
        `}>
          {/* Logo */}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 sm:px-6 py-5 border-b border-[#F1F3F4]`}>
            {collapsed ? (
              <button onClick={() => setCollapsed(false)} className="hidden lg:block w-8 h-8 rounded-full overflow-hidden hover:opacity-80 transition-opacity">
                <img src="https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0043.jpg?updatedAt=1772379265473&tr=w-150,h-150,q-100" alt="Logo" className="w-full h-full object-cover" />
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <img src="https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0043.jpg?updatedAt=1772379265473&tr=w-150,h-150,q-100" alt="Logo" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-[#202124] text-base tracking-tighter leading-none">MAGIZHCHI</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                  </div>
                  <span className="text-[8px] text-[#5F6368] font-black tracking-[0.25em] uppercase mt-1">Control Console</span>
                </div>
              </div>
            )}
            
            {!collapsed && (
              <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block text-[#5F6368] hover:text-[#202124] transition-colors shrink-0 ml-2">
                <ChevronLeft size={16} />
              </button>
            )}
            
            <button onClick={() => setMobileOpen(false)} className="lg:hidden w-8 h-8 bg-[#F1F3F4] text-[#5F6368] rounded-lg flex items-center justify-center hover:bg-[#E8F0FE]">
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
            {/* Nav */}
              <nav className="flex-1 overflow-y-auto py-4 px-3 sm:px-4 space-y-1 custom-scrollbar">
              {filteredNav.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-3 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-widest
                    ${location.pathname === item.path 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]'
                    }
                  `}
                >
                  <item.icon size={18} className={location.pathname === item.path ? 'text-blue-600' : 'text-[#5F6368]'} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </nav>
          </div>

          <div className="shrink-0 bg-white">

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
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 max-w-full overflow-y-auto overflow-x-hidden h-full print:h-auto print:m-0 print:p-0 print:block pt-16 lg:pt-0">
          <div className="w-full p-4 md:p-5 md:p-10 print:p-0 print:m-0 max-w-[1600px] print:max-w-none mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
