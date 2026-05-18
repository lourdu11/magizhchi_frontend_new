/**
 * Enterprise Constants & Enums
 * Prevents magic string fragility across the ERP.
 */

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  USER: 'user'
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  UPI: 'upi',
  CARD: 'card',
  SPLIT: 'split'
};

export const BILL_STATUS = {
  ACTIVE: 'active',
  VOIDED: 'voided'
};

export const PRODUCT_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
  ARCHIVED: 'archived'
};

export const ORDER_STATUS = {
  PLACED: 'placed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned'
};

export const STOCK_CHANNELS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  POS: 'offline' // Alias
};
