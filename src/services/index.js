import api from './api';

export const authService = {
  sendOTP: (identifier, purpose) => api.post('/auth/send-otp', { identifier, purpose }),
  verifyOTP: (identifier, otp, purpose) => api.post('/auth/verify-otp', { identifier, otp, purpose }),
  register: (data) => api.post('/auth/register', data),
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  verifyAdmin2FA: (data) => api.post('/auth/verify-admin-2fa', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (identifier) => api.post('/auth/forgot-password', { identifier }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  quickGuest: () => api.post('/auth/quick-guest'),
};

export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (slug, params) => api.get(`/products/${slug}`, { params }),
  searchProducts: (q) => api.get('/products/search', { params: { q } }),
  createProduct: (data) => api.post('/products', data),
  createProductWithProcurement: (data) => api.post('/products/with-procurement', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const categoryService = {
  getCategories: (params) => api.get('/categories', { params: { ...params } }),
  getCategory: (slug) => api.get(`/categories/${slug}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart/add', data),
  updateCartItem: (itemId, quantity) => api.put(`/cart/update/${itemId}`, { quantity }),
  removeFromCart: (itemId) => api.delete(`/cart/remove/${itemId}`),
  clearCart: () => api.delete('/cart/clear'),
};

export const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (productId) => api.post('/wishlist/add', { productId }),
  removeFromWishlist: (productId) => api.delete(`/wishlist/remove/${productId}`),
};

export const orderService = {
  createOrder: (data) => api.post('/orders/create', data),
  verifyPayment: (data) => api.post('/orders/verify-payment', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  requestReturn: (id, data) => api.post(`/orders/${id}/return`, data),
};

export const couponService = {
  getAllCoupons: () => api.get('/coupons/all'),
  createCoupon: (data) => api.post('/coupons/create', data),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),
  validateCoupon: (code, amount) => api.post('/coupons/validate', { code, amount }),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getSalesAnalytics: (params) => api.get('/admin/analytics/sales', { params }),
  getAdminProducts: (params) => api.get('/admin/products', { params }),
  getAdminProductById: (id) => api.get(`/products/admin/detail/${id}`),
  restoreProduct: (id) => api.post(`/admin/products/${id}/restore`),
  purgeProduct: (id) => api.delete(`/products/admin/purge/${id}`),
  getHealth: () => api.get('/admin/health'),
  getAllOrders: (params) => api.get('/orders/all', { params }),
  updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  resendOrderReceipt: (id) => api.post(`/orders/${id}/resend-receipt`),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  toggleBlockUser: (id) => api.put(`/admin/users/${id}/toggle-block`),
  createCustomer: (data) => api.post('/admin/users', data),
  deleteCustomer: (id) => api.delete(`/admin/users/${id}`),
  createStaff: (data) => api.post('/admin/staff', data),
  getStaff: () => api.get('/admin/staff'),
  updateStaff: (id, data) => api.put(`/admin/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`),
  updateReturnStatus: (id, data) => api.put(`/orders/${id}/return-status`, data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  resetSystemData: (data) => api.post('/admin/reset-system-data', data),
  getSystemBackups: () => api.get('/admin/system-backups'),
  restoreSystemData: (data) => api.post('/admin/restore-system-data', data),
  getSyncIntegrityStats: () => api.get('/admin/sync-integrity'),
  getPublicSettings: () => api.get('/public/settings'),
  uploadImage: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000
  }),
  getReturns: () => api.get('/admin/returns'),
  createReturn: (data) => api.post('/admin/returns', data),
  getDailyProfitReport: (date) => api.get('/admin/reports/daily', { params: { date } }),
  getStaffPerformance: () => api.get('/admin/staff/performance'),
  getWastageHistory: () => api.get('/admin/wastage'),
  createWastage: (data) => api.post('/admin/wastage', data),
  reconcileStock: (data) => api.post('/admin/inventory/reconcile', data),
  testNotifications: (type) => api.post('/admin/test-notifications-v2', { type }),
};

export const reviewService = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  getReviewStats: (productId) => api.get(`/reviews/stats/${productId}`),
  createReview: (data) => api.post('/reviews/create', data),
  getAllReviews: () => api.get('/reviews/all'),
  updateReviewStatus: (id, data) => api.put(`/reviews/${id}/status`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  likeReview: (id) => api.post(`/reviews/${id}/like`),
  dislikeReview: (id) => api.post(`/reviews/${id}/dislike`),
  uploadImages: (formData) => api.post('/reviews/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000
  }),
};

export const billService = {
  createBill: (data) => api.post('/bills/create', data),
  getBills: (params) => api.get('/bills', { params }),
  getBill: (id) => api.get(`/bills/${id}`),
  deleteBill: (id, reason) => api.delete(`/bills/${id}`, { data: { reason } }),
  getDailyReport: (date) => api.get('/bills/daily-report', { params: { date } }),
  lookupCustomer: (phone) => api.get(`/bills/customer/${phone}`),
  getByBarcode: (barcode) => api.get(`/bills/barcode/${barcode}`),
  updateBill: (id, data) => api.put(`/bills/${id}`, data),
  resendReceipt: (id) => api.post(`/bills/${id}/resend-receipt`),
  getStaffStats: () => api.get('/bills/staff-stats'),
};

export const bannerService = {
  getActiveBanners: () => api.get('/banners/active'),
  getAllBanners: () => api.get('/banners/all'),
  createBanner: (data) => api.post('/banners/create', data),
  updateBanner: (id, data) => api.put(`/banners/${id}`, data),
  deleteBanner: (id) => api.delete(`/banners/${id}`),
};

export const publicService = {
  trackOrder: (data) => api.post('/public/track-order', data),
  getOrderDetails: (id) => api.get(`/public/order/${id}`),
  submitContact: (data) => api.post('/contact', data),
  getStaffList: () => api.get('/public/staff-list'),
};

export const purchaseService = {
  createPurchase: (data) => api.post('/admin/purchases', data),
  updatePurchase: (id, data) => api.put(`/admin/purchases/${id}`, data),
  restorePurchase: (id) => api.post(`/admin/purchases/${id}/restore`),
  resyncPurchase: (id) => api.post(`/admin/purchases/${id}/resync`),
  deletePurchase: (id) => api.delete(`/admin/purchases/${id}`),
  getPurchases: (params) => api.get('/admin/purchases', { params }),
  getSuppliers: () => api.get('/admin/suppliers'),
  createSupplier: (data) => api.post('/admin/suppliers', data),
  updateSupplier: (id, data) => api.put(`/admin/suppliers/${id}`, data),
  restoreSupplier: (id) => api.post(`/admin/suppliers/${id}/restore`),
  recordPayment: (id, data) => api.put(`/admin/suppliers/${id}/record-payment`, data),
  updatePayment: (sid, pid, data) => api.put(`/admin/suppliers/${sid}/payments/${pid}`, data),
  deletePayment: (sid, pid) => api.delete(`/admin/suppliers/${sid}/payments/${pid}`),
  deleteSupplier: (id) => api.delete(`/admin/suppliers/${id}`),
};

export const inventoryService = {
  getInventory:        (params)   => api.get('/admin/inventory', { params }),
  getStats:            ()         => api.get('/admin/inventory/stats'),
  getLowStock:         ()         => api.get('/admin/inventory/low-stock'),
  createItem:          (data)     => api.post('/admin/inventory', data),
  toggleChannel:       (id, data) => api.put(`/admin/inventory/${id}/toggle`, data),
  updateChannelConfig: (id, data) => api.put(`/admin/inventory/${id}/channel-config`, data),
  updateSellingPrice:  (id, data) => api.put(`/admin/inventory/${id}/selling-price`, data),
  adjustStock:         (id, data) => api.put(`/admin/inventory/${id}/adjust`, data),
  updateDetails:       (id, data) => api.put(`/admin/inventory/${id}/details`, data),
  linkProduct:         (id, data) => api.put(`/admin/inventory/${id}/link-product`, data),
  getByBarcode:        (barcode)  => api.get(`/admin/inventory/barcode/${barcode}`),
  deleteItem:          (id)       => api.delete(`/admin/inventory/${id}`),
  getAllHistory:       (params)   => api.get('/admin/inventory/all-history', { params }),
  getHistory:          (id)       => api.get(`/admin/inventory/${id}/history`),
  restoreChannels:     ()         => api.post('/admin/inventory/restore-channels'),
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
};

export const broadcastService = {
  getCustomers: (params) => api.get('/admin/broadcast/customers', { params }),
  sendBroadcast: (data) => api.post('/admin/broadcast/send', data),
  getHistory: () => api.get('/admin/broadcast/history'),
  getDetails: (id) => api.get(`/admin/broadcast/details/${id}`),
  disconnectWhatsApp: () => api.post('/admin/broadcast/whatsapp/disconnect'),
  
  // Templates
  getTemplates: () => api.get('/admin/broadcast/templates'),
  createTemplate: (data) => api.post('/admin/broadcast/templates', data),
  updateTemplate: (id, data) => api.put(`/admin/broadcast/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/admin/broadcast/templates/${id}`),
};
