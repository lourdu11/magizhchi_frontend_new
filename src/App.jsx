// v1.0.2 - Resilient Chunk Loading
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';

// Wrapper to retry lazy imports automatically on flaky networks
const lazyWithRetry = (importFn) => {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      // If chunk fails to load, wait 1 second and retry once
      console.warn('Chunk loading failed, retrying...', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await importFn();
    }
  });
};

// Layouts — UserLayout is eagerly loaded (serves all public users)
import UserLayout from './components/layout/UserLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
// AdminLayout & StaffLayout are lazy: they bring framer-motion + heavy deps
const AdminLayout = lazyWithRetry(() => import('./components/layout/AdminLayout'));
const StaffLayout = lazyWithRetry(() => import('./components/layout/StaffLayout'));
import PageLoader from './components/common/PageLoader';

// Lazily loaded pages
const Home = lazyWithRetry(() => import('./pages/Home'));
const Collections = lazyWithRetry(() => import('./pages/Collections'));
const ProductDetails = lazyWithRetry(() => import('./pages/ProductDetails'));
const Cart = lazyWithRetry(() => import('./pages/Cart'));
const Wishlist = lazyWithRetry(() => import('./pages/Wishlist'));
const Checkout = lazyWithRetry(() => import('./pages/Checkout'));
const OrderConfirmation = lazyWithRetry(() => import('./pages/OrderConfirmation'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Search = lazyWithRetry(() => import('./pages/Search'));
const About = lazyWithRetry(() => import('./pages/About'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const ForgotPassword = lazyWithRetry(() => import('./pages/auth/ForgotPassword'));
const WriteReview = lazyWithRetry(() => import('./pages/WriteReview'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const TrackOrder = lazyWithRetry(() => import('./pages/TrackOrder'));
const Services = lazyWithRetry(() => import('./pages/Services'));
const Login = lazyWithRetry(() => import('./pages/auth/Login'));

// Legal pages
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazyWithRetry(() => import('./pages/TermsAndConditions'));
const RefundPolicy = lazyWithRetry(() => import('./pages/RefundPolicy'));
const ShippingPolicy = lazyWithRetry(() => import('./pages/ShippingPolicy'));

const ProductProfileCenter = lazyWithRetry(() => import('./pages/admin/ProductProfileCenter'));
const AdminCategories = lazyWithRetry(() => import('./pages/admin/AdminCategories'));
const AdminCategoryForm = lazyWithRetry(() => import('./pages/admin/AdminCategoryForm'));
const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazyWithRetry(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazyWithRetry(() => import('./pages/admin/AdminUsers'));
const AdminInventory = lazyWithRetry(() => import('./pages/admin/AdminInventory'));
const AdminBills = lazyWithRetry(() => import('./pages/admin/AdminBills'));
const AdminStaff = lazyWithRetry(() => import('./pages/admin/AdminStaff'));
const AdminProductForm = lazyWithRetry(() => import('./pages/admin/AdminProductForm'));
const AdminSettings = lazyWithRetry(() => import('./pages/admin/AdminSettings'));
const AdminAnalytics = lazyWithRetry(() => import('./pages/admin/AdminAnalytics'));
const AdminCoupons = lazyWithRetry(() => import('./pages/admin/AdminCoupons'));
const AdminReviews = lazyWithRetry(() => import('./pages/admin/AdminReviews'));
const AdminLogin = lazyWithRetry(() => import('./pages/admin/AdminLogin'));
const AdminBanners = lazyWithRetry(() => import('./pages/admin/AdminBanners'));
const AdminProcurement = lazyWithRetry(() => import('./pages/admin/AdminProcurement'));
const AdminPurchaseForm = lazyWithRetry(() => import('./pages/admin/AdminPurchaseForm'));
const AdminSupplierForm = lazyWithRetry(() => import('./pages/admin/AdminSupplierForm'));
const AdminDailyProfit = lazyWithRetry(() => import('./pages/admin/AdminDailyProfit'));
const AdminWastage = lazyWithRetry(() => import('./pages/admin/AdminWastage'));
const AdminAudit = lazyWithRetry(() => import('./pages/admin/AdminAudit'));
const BroadcastCenter = lazyWithRetry(() => import('./pages/admin/BroadcastCenter'));

// Staff pages
const StaffLogin = lazyWithRetry(() => import('./pages/staff/StaffLogin'));
const PosLayout = lazyWithRetry(() => import('./pages/staff/pos/PosLayout'));
const StaffSalesHistory = lazyWithRetry(() => import('./pages/staff/StaffSalesHistory'));
const StaffDailyReport = lazyWithRetry(() => import('./pages/staff/StaffDailyReport'));

import ScrollToTop from './components/layout/ScrollToTop';
import { useAuthStore } from './store';
import { checkAuthSession } from './services';

export default function App() {
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const initAuth = async () => {
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
          <Route path="broadcast" element={<BroadcastCenter />} />
        </Route>

        {/* ── Staff Routes ── */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff" element={<ProtectedRoute role="staff"><StaffLayout /></ProtectedRoute>}>
          <Route index element={<PosLayout />} />
          <Route path="history" element={<StaffSalesHistory />} />
          <Route path="report" element={<StaffDailyReport />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
