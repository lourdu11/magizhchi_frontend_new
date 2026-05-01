// v1.0.1 - Forced Refresh
// v1.0.1 - Forced Refresh
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Layouts
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import StaffLayout from './components/layout/StaffLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import PageLoader from './components/common/PageLoader';

// Eagerly loaded pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import { Navigate } from 'react-router-dom';

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

// Legal pages
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));

const AdminCatalog = lazy(() => import('./pages/admin/AdminCatalog'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminBills = lazy(() => import('./pages/admin/AdminBills'));
const AdminStaff = lazy(() => import('./pages/admin/AdminStaff'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminProcurement = lazy(() => import('./pages/admin/AdminProcurement'));
const AdminDailyProfit = lazy(() => import('./pages/admin/AdminDailyProfit'));
const AdminWastage = lazy(() => import('./pages/admin/AdminWastage'));
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'));

// Staff pages
const StaffLogin = lazy(() => import('./pages/staff/StaffLogin'));
const StaffCreateBill = lazy(() => import('./pages/staff/StaffCreateBill'));
const StaffSalesHistory = lazy(() => import('./pages/staff/StaffSalesHistory'));
const StaffDailyReport = lazy(() => import('./pages/staff/StaffDailyReport'));

import ScrollToTop from './components/layout/ScrollToTop';

export default function App() {
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
          <Route path="catalog" element={<AdminCatalog />} />
          <Route path="products" element={<AdminCatalog />} />
          <Route path="products/new" element={<AdminProducts />} />
          <Route path="products/:id" element={<AdminProducts />} />
          <Route path="inventory" element={<AdminCatalog />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="bills" element={<AdminBills />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="procurement" element={<AdminProcurement />} />
          <Route path="purchases" element={<AdminProcurement />} />
          <Route path="suppliers" element={<AdminProcurement />} />
          <Route path="wastage" element={<AdminWastage />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="reports/daily" element={<AdminDailyProfit />} />
          <Route path="create-bill" element={<StaffCreateBill />} />
          <Route path="daily-report" element={<StaffDailyReport />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="banners" element={<AdminBanners />} />
        </Route>

        {/* ── Staff Routes ── */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff" element={<ProtectedRoute role="staff"><StaffLayout /></ProtectedRoute>}>
          <Route index element={<StaffCreateBill />} />
          <Route path="history" element={<StaffSalesHistory />} />
          <Route path="report" element={<StaffDailyReport />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
