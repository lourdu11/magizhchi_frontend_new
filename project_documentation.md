# Magizhchi Garments – Complete Project Documentation

This document serves as the comprehensive A-to-Z technical and functional documentation for the Magizhchi Garments E-commerce & Admin Platform.

---

## 1. Project Overview
Magizhchi Garments is a full-stack, enterprise-grade e-commerce application tailored for premium men's wear. The platform seamlessly integrates a highly optimized, user-facing storefront with a robust point-of-sale (POS) system for staff and a comprehensive analytics dashboard for administrators.

**Target Audience:**
1. **Public/Customers:** Browse collections, add to cart, checkout, track orders, and manage wishlists.
2. **Staff:** Execute in-store sales via a dedicated POS interface, print thermal receipts, and view daily sales targets.
3. **Administrators:** Manage inventory, procurement, suppliers, user access, broadcast messaging, and view deep financial analytics.

---

## 2. Technology Stack

### Frontend
* **Core Framework:** React 18, Vite
* **Routing:** React Router v6 (with extensive route-based Code Splitting/Lazy Loading)
* **State Management:** 
  * `Zustand` (Global App State: Auth, Cart, Wishlist, Settings)
  * `@tanstack/react-query` (Server State, Caching, API Synchronization)
* **Styling & UI:** 
  * Custom Vanilla CSS & CSS Modules (Premium aesthetics)
  * `lucide-react` (SVG Icons)
  * `framer-motion` (Micro-animations and Page Transitions)
* **Data Visualization:** `recharts` (Admin Analytics & Dashboards)
* **Build & Bundling:** Vite, Rollup (Highly tuned `manualChunks` for HTTP/2 multiplexing), `vite-plugin-compression` (Brotli/Gzip)

### Backend (Inferred via API Integration)
* **Server:** Node.js / Express.js
* **Database:** MongoDB
* **Authentication:** JWT (JSON Web Tokens), OTP-based verification, Admin 2FA.
* **Hosting/CDN:** 
  * Frontend: Vercel Edge Network
  * Backend: Render (`magizhchi-backend-28sx.onrender.com`)
  * Image CDN: ImageKit (`ik.imagekit.io`) & Unsplash

---

## 3. Frontend Architecture & Folder Structure

The frontend is strictly modularized for enterprise scalability.

```text
frontend/
├── dist/                  # Production-ready build artifacts
├── public/                # Static assets (Favicons, manifest)
├── src/
│   ├── components/        # Reusable UI blocks
│   │   ├── common/        # Buttons, Loaders, ErrorBoundaries, SafeImage
│   │   ├── layout/        # Header, Footer, BottomNav, Admin/Staff Layouts
│   │   └── product/       # ProductCards, SkeletonCards
│   ├── pages/             # Route-level components (Code Split)
│   │   ├── admin/         # Admin Dashboard, Inventory, Procurement, Analytics
│   │   ├── staff/         # Staff POS Layout, Thermal Receipt, Daily Reports
│   │   ├── auth/          # Login, Register, Forgot Password
│   │   └── ...            # Home, Cart, Checkout, ProductDetails
│   ├── services/          # Axios API Interceptors & Service modules
│   ├── store/             # Zustand Store slices (authStore, cartStore)
│   ├── utils/             # Helper functions (Formatting, Validation)
│   ├── App.jsx            # Core Routing and Suspense Boundaries
│   ├── main.jsx           # React DOM Entry
│   └── index.css          # Global CSS Tokens & Design System
├── index.html             # HTML Shell (Optimized with LCP Preloads & Skeletons)
└── vite.config.js         # Build Tools & Minification settings
```

---

## 4. Core Modules & Features

### 4.1 E-Commerce Storefront (User Facing)
* **Dynamic Hero Section:** Instantly paints via static HTML skeletons, gracefully hydrating to React.
* **Product Catalog:** Supports filtering, pagination, and sorting.
* **Cart & Wishlist:** Persisted local state synced securely with the backend.
* **Checkout Flow:** Integrated address management and dynamic payment gateways.
* **Order Tracking:** Public endpoints allowing users to track shipments.

### 4.2 Point of Sale (Staff Facing)
* **Barcode Scanning:** Rapid product lookup via `getByBarcode`.
* **Thermal Receipt Generation:** Auto-formatting and printing functionality for hardware thermal printers.
* **Daily Reports:** Tracks individual staff performance and end-of-day tallying.

### 4.3 Administrator Command Center
* **Live Dashboard:** Real-time revenue charts, order statistics, and recent activity.
* **Inventory Engine:** Stock adjustments, multi-channel selling configs, low-stock alerts, and pricing automation.
* **Procurement & Suppliers:** Track inbound shipments, supplier debts, and payment records.
* **Broadcast Center:** WhatsApp/Email marketing integration with customer segmenting.
* **System Health:** Database backups, sync integrity, and audit logging.

---

## 5. Security & Authentication (RBAC)

The app enforces strict Role-Based Access Control via `ProtectedRoute.jsx`:
* **Token Refreshing:** Axios interceptors silently refresh expired JWT tokens in the background.
* **Role Redirection:** Users attempting to access `/admin/*` without admin credentials are automatically kicked out.
* **Credentials:** All API calls securely transmit HTTP-Only cookies (`withCredentials: true`).

---

## 6. Performance Engineering & Optimizations

This project features elite-level frontend optimizations to score **95+ on Lighthouse Mobile**:

1. **Instant LCP (Largest Contentful Paint):**
   * The Hero image is art-directed via `imagesrcset` and preloaded directly in `index.html`.
   * A static `<div id="hero-skeleton">` ensures the browser paints the layout in `0ms` before React even downloads.
2. **Network Preconnects:**
   * Crucial CDNs and backend APIs (`magizhchi-backend-28sx.onrender.com` with `crossorigin="use-credentials"`) are preconnected in the HTML `<head>` to eliminate SSL/DNS handshake delays.
3. **Advanced Chunking Strategy (`vite.config.js`):**
   * Dozens of tiny SVG icons (`lucide-react`) are merged into a single `icons.js` chunk, preventing HTTP/2 waterfall blocking.
   * Heavy libraries like `recharts` and `framer-motion` are strictly tree-shaken and split off so they never load on the initial Home page.
4. **Compression:**
   * `vite-plugin-compression` serves ultra-lightweight `.gz` and `.br` (Brotli) files.

---

## 7. Deployment Protocol

* **Commands:** `npm install` -> `npm run build`
* **Environment:** Node `18.x+`
* **Vercel Settings:** 
  * The build targets `es2022`.
  * API rewrites in `vite.config.js` proxy `/api` to the backend. In production, requests hit the absolute Render URL.

---

**Documentation Status:** Finalized & Complete.
**Last Updated:** May 2026.
