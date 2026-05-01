import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Auth Store ───────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        sessionStorage.setItem('accessToken', accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },
      logout: () => {
        sessionStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
    }),
    {
      name: 'magizhchi-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated })
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
  setWishlist: (products) => set({
    itemCount: products.length,
    productIds: products.map(p => (p.productId?._id || p.productId || p._id))
  }),
  toggleId: (id, add = true) => set(state => ({
    productIds: add ? [...state.productIds, id] : state.productIds.filter(i => i !== id),
    itemCount: add ? state.itemCount + 1 : Math.max(0, state.itemCount - 1)
  }))
}));


// new deploy