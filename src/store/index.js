import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { setToken, clearToken } from '../services/api';

// ─── Custom Storage Engine for Role-Based Persistence ───
// Customers stay logged in (localStorage)
// Admins and Staff get logged out on browser close (sessionStorage)
const customAuthStorage = {
  getItem: (name) => {
    // Prioritize sessionStorage, fallback to localStorage
    return sessionStorage.getItem(name) || localStorage.getItem(name);
  },
  setItem: (name, value) => {
    try {
      const parsed = JSON.parse(value);
      const role = parsed?.state?.user?.role;
      if (role === 'admin' || role === 'staff') {
        sessionStorage.setItem(name, value);
        localStorage.removeItem(name); // Ensure no persistent trace
      } else {
        localStorage.setItem(name, value);
        sessionStorage.removeItem(name);
      }
    } catch (e) {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    sessionStorage.removeItem(name);
    localStorage.removeItem(name);
  }
};

// ─── Auth Store ───────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        setToken(accessToken);
        set({ user, token: accessToken, isAuthenticated: true });
      },
      logout: () => {
        clearToken();
        sessionStorage.removeItem('admin_settings_verified');
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
    }),
    {
      name: 'magizhchi-auth',
      storage: createJSONStorage(() => customAuthStorage),
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated })
    }
  )
);

// ─── Cart Store (count only, data from React Query) ───
export const useCartStore = create((set) => ({
  itemCount: 0,
  isCartOpen: false,
  setItemCount: (count) => set({ itemCount: count }),
  setCartOpen: (open) => set({ isCartOpen: open }),
}));

// ─── UI Store ─────────────────────────────────────────
export const useUIStore = create((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isFilterOpen: false,
  searchQuery: '',
  setMobileMenu: (open) => set({ isMobileMenuOpen: open }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setFilterOpen: (open) => set({ isFilterOpen: open }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));

// ─── Wishlist Store (tracking IDs) ────────────────────────────
export const useWishlistStore = create((set) => ({
  itemCount: 0,
  productIds: [],
  setItemCount: (count) => set({ itemCount: count }),
  setWishlist: (products) => {
    const list = Array.isArray(products) ? products : [];
    set({
      itemCount: list.length,
      productIds: list.map(p => (p?.productId?._id || p?.productId || p?._id)).filter(Boolean)
    });
  },
  toggleId: (id, add = true) => set(state => ({
    productIds: add ? [...(state.productIds || []), id] : (state.productIds || []).filter(i => i !== id),
    itemCount: add ? (state.itemCount || 0) + 1 : Math.max(0, (state.itemCount || 0) - 1)
  }))
}));


// new deploy