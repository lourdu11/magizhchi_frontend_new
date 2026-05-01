import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '../../store';

const TABS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Grid, label: 'Shop', path: '/collections' },
  { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: true },
  { icon: User, label: 'Account', path: '/dashboard' },
];

export default function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCartStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border-light shadow-[0_-2px_16px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-4 h-16">
        {TABS.map(({ icon: Icon, label, path, badge }) => { // eslint-disable-line no-unused-vars

          const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link key={path} to={path}
              className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${active ? 'text-premium-gold' : 'text-text-muted hover:text-text-secondary'}`}>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gold-gradient rounded-b-full" />
              )}
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {badge && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-premium-gold text-primary-black text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
