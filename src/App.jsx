// v1.0.1 - Forced Refresh
// v1.0.1 - Forced Refresh
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';

// Layouts — UserLayout is eagerly loaded (serves all public users)
import UserLayout from './components/layout/UserLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
// AdminLayout & StaffLayout are lazy: they bring framer-motion + heavy deps
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
import PageLoader from './components/common/PageLoader';

// Eagerly loaded pages
import { Navigate } from 'react-router-dom';
import Home from './pages/Home';

// Lazily loaded pages
const Collections = lazy(() => import('./pages/Collections'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Search = lazy(() => import('./pages/Search'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const WriteReview = lazy(() => import('./pages/WriteReview'));
const NotFound = lazy(() => import('./pages/NotFound'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Services = lazy(() => import('./pages/Services'));
const Login = lazy(() => import('./pages/auth/Login'));

// Legal pages
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));

const ProductProfileCenter = lazy(() => import('./pages/admin/ProductProfileCenter'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminCategoryForm = lazy(() => import('./pages/admin/AdminCategoryForm'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminBills = lazy(() => import('./pages/admin/AdminBills'));
const AdminStaff = lazy(() => import('./pages/admin/AdminStaff'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminBannerForm = lazy(() => import('./pages/admin/AdminBannerForm'));
const AdminProcurement = lazy(() => import('./pages/admin/AdminProcurement'));
const AdminPurchaseForm = lazy(() => import('./pages/admin/AdminPurchaseForm'));
const AdminSupplierForm = lazy(() => import('./pages/admin/AdminSupplierForm'));
const AdminDailyProfit = lazy(() => import('./pages/admin/AdminDailyProfit'));
const AdminWastage = lazy(() => import('./pages/admin/AdminWastage'));
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'));
const BroadcastCenter = lazy(() => import('./pages/admin/BroadcastCenter'));

// Staff pages
const PosLayout = lazy(() => import('./pages/staff/pos/PosLayout'));
const StaffSalesHistory = lazy(() => import('./pages/staff/StaffSalesHistory'));
const StaffDailyReport = lazy(() => import('./pages/staff/StaffDailyReport'));

import ScrollToTop from './components/layout/ScrollToTop';
import { useAuthStore } from './store';
import { checkAuthSession, setToken } from './services/api';

export default function App() {
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const initAuth = async () => {
      const persistedToken = useAuthStore.getState().token;
      if (persistedToken) {
        setToken(persistedToken);
      }
      if (isAuthenticated) {
        const success = await checkAuthSession();
        if (!success) {
          logout();
        }
      }
    };
    // Defer session checking to idle callback or timeout to prevent main-thread blockage
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        initAuth();
      });
    } else {
      setTimeout(initAuth, 150);
    }
  }, [isAuthenticated, logout]);

  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
      <Routes>

        {/* ── Public / User Routes ── */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:category" element={<Collections />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/product/:slug/write-review" element={<ProtectedRoute><WriteReview /></ProtectedRoute>} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
        </Route>

        {/* ── Auth Routes ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── Admin Routes ── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/edit/:id" element={<AdminProductForm />} />
          <Route path="profiles" element={<ProductProfileCenter />} />
          <Route path="products" element={<Navigate to="/admin/profiles" replace />} />
          <Route path="catalog" element={<Navigate to="/admin/profiles" replace />} />
          <Route path="inventory" element={<Navigate to="/admin/profiles" replace />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="bills" element={<AdminBills />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="categories/new" element={<AdminCategoryForm />} />
          <Route path="categories/edit/:id" element={<AdminCategoryForm />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="procurement" element={<AdminProcurement />} />
          <Route path="procurement/purchases/new" element={<AdminPurchaseForm />} />
          <Route path="procurement/purchases/edit/:id" element={<AdminPurchaseForm />} />
          <Route path="procurement/suppliers/new" element={<AdminSupplierForm />} />
          <Route path="procurement/suppliers/edit/:id" element={<AdminSupplierForm />} />
          <Route path="purchases" element={<AdminProcurement />} />
          <Route path="purchases/new" element={<AdminPurchaseForm />} />
          <Route path="purchases/edit/:id" element={<AdminPurchaseForm />} />
          <Route path="suppliers" element={<AdminProcurement />} />
          <Route path="suppliers/new" element={<AdminSupplierForm />} />
          <Route path="suppliers/edit/:id" element={<AdminSupplierForm />} />
          <Route path="wastage" element={<AdminWastage />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="reports/daily" element={<AdminDailyProfit />} />
          <Route path="create-bill" element={<PosLayout />} />
          <Route path="daily-report" element={<StaffDailyReport />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="banners/new" element={<AdminBannerForm />} />
          <Route path="banners/edit/:id" element={<AdminBannerForm />} />
          <Route path="broadcast" element={<BroadcastCenter />} />
        </Route>

        {/* ── Legacy Staff Routes (Redirect to Unified Admin UI) ── */}
        <Route path="/staff/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/staff/*" element={<Navigate to="/admin/create-bill" replace />} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
