/**
 * 客戶相關表結構定義
 * 統一客戶管理系統標準化實現
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'

// ============ 客戶表 ============
export const customers = sqliteTable('customers', {
  customerId: text('customer_id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  displayName: text('display_name'),
  avatar: text('avatar'),
  phone: text('phone'),
  birthDate: text('birth_date'), // YYYY-MM-DD format
  gender: text('gender'), // male, female, other
  status: text('status').notNull().default('active'), // active, inactive, suspended, deleted
  registrationSource: text('registration_source').default('website'), // website, facebook, google, line, app
  referralCode: text('referral_code'),
  referredBy: text('referred_by'), // customer_id of referrer
  marketingOptIn: integer('marketing_opt_in', { mode: 'boolean' }).default(false),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  emailVerifiedAt: text('email_verified_at'),
  phoneVerified: integer('phone_verified', { mode: 'boolean' }).default(false),
  phoneVerifiedAt: text('phone_verified_at'),
  lastLoginAt: text('last_login_at'),
  lastLoginIp: text('last_login_ip'),
  loginCount: integer('login_count').default(0),
  totalSpent: real('total_spent').default(0),
  totalOrders: integer('total_orders').default(0),
  averageOrderValue: real('average_order_value').default(0),
  lifetimeValue: real('lifetime_value').default(0),
  loyaltyPoints: integer('loyalty_points').default(0),
  tier: text('tier').default('bronze'), // bronze, silver, gold, platinum, diamond
  preferences: text('preferences', { mode: 'json' }),
  tags: text('tags', { mode: 'json' }), // Array of tags for segmentation
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  deletedAt: text('deleted_at')
}, (table) => ({
  emailIdx: index('idx_customers_email').on(table.email),
  phoneIdx: index('idx_customers_phone').on(table.phone),
  statusIdx: index('idx_customers_status').on(table.status),
  tierIdx: index('idx_customers_tier').on(table.tier),
  referredByIdx: index('idx_customers_referred_by').on(table.referredBy),
  createdAtIdx: index('idx_customers_created_at').on(table.createdAt),
  deletedAtIdx: index('idx_customers_deleted_at').on(table.deletedAt),
  totalSpentIdx: index('idx_customers_total_spent').on(table.totalSpent),
  loyaltyPointsIdx: index('idx_customers_loyalty_points').on(table.loyaltyPoints)
}))

// ============ 客戶地址表 ============
export const customerAddresses = sqliteTable('customer_addresses', {
  addressId: text('address_id').primaryKey(),
  customerId: text('customer_id').notNull(),
  type: text('type').notNull().default('shipping'), // shipping, billing, both
  label: text('label'), // home, office, etc.
  recipientName: text('recipient_name').notNull(),
  phone: text('phone'),
  country: text('country').notNull().default('TW'),
  city: text('city').notNull(),
  district: text('district'), // 區/鄉鎮
  zipCode: text('zip_code'),
  addressLine1: text('address_line_1').notNull(),
  addressLine2: text('address_line_2'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  customerIdx: index('idx_customer_addresses_customer').on(table.customerId),
  typeIdx: index('idx_customer_addresses_type').on(table.type),
  defaultIdx: index('idx_customer_addresses_default').on(table.isDefault),
  activeIdx: index('idx_customer_addresses_active').on(table.isActive),
  cityIdx: index('idx_customer_addresses_city').on(table.city)
}))

// ============ 客戶會話表 ============
export const customerSessions = sqliteTable('customer_sessions', {
  sessionId: text('session_id').primaryKey(),
  customerId: text('customer_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  deviceId: text('device_id'),
  deviceName: text('device_name'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  location: text('location', { mode: 'json' }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastActivityAt: text('last_activity_at').default(sql`(CURRENT_TIMESTAMP)`),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  revokedAt: text('revoked_at')
}, (table) => ({
  customerIdx: index('idx_customer_sessions_customer').on(table.customerId),
  tokenIdx: index('idx_customer_sessions_token').on(table.tokenHash),
  activeIdx: index('idx_customer_sessions_active').on(table.isActive),
  expiresIdx: index('idx_customer_sessions_expires').on(table.expiresAt),
  activityIdx: index('idx_customer_sessions_activity').on(table.lastActivityAt)
}))

// ============ 客戶活動日誌表 ============
export const customerActivityLogs = sqliteTable('customer_activity_logs', {
  logId: text('log_id').primaryKey(),
  customerId: text('customer_id').notNull(),
  sessionId: text('session_id'),
  action: text('action').notNull(), // LOGIN, LOGOUT, VIEW_PRODUCT, ADD_TO_CART, PURCHASE, etc.
  category: text('category'), // auth, shopping, profile, support
  resource: text('resource'), // product_id, order_id, etc.
  description: text('description'),
  value: real('value'), // monetary value if applicable
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  customerIdx: index('idx_customer_activity_customer').on(table.customerId),
  sessionIdx: index('idx_customer_activity_session').on(table.sessionId),
  actionIdx: index('idx_customer_activity_action').on(table.action),
  categoryIdx: index('idx_customer_activity_category').on(table.category),
  createdAtIdx: index('idx_customer_activity_created_at').on(table.createdAt)
}))

// ============ 客戶願望清單表 ============
export const customerWishlists = sqliteTable('customer_wishlists', {
  wishlistId: text('wishlist_id').primaryKey(),
  customerId: text('customer_id').notNull(),
  productId: text('product_id').notNull(),
  addedAt: text('added_at').default(sql`(CURRENT_TIMESTAMP)`),
  notes: text('notes'),
  priority: integer('priority').default(0) // 0=normal, 1=high
}, (table) => ({
  customerIdx: index('idx_customer_wishlists_customer').on(table.customerId),
  productIdx: index('idx_customer_wishlists_product').on(table.productId),
  addedAtIdx: index('idx_customer_wishlists_added_at').on(table.addedAt),
  priorityIdx: index('idx_customer_wishlists_priority').on(table.priority)
}))

// ============ 關聯定義 ============
export const customersRelations = relations(customers, ({ many, one }) => ({
  addresses: many(customerAddresses),
  sessions: many(customerSessions),
  activityLogs: many(customerActivityLogs),
  wishlists: many(customerWishlists),
  referrer: one(customers, {
    fields: [customers.referredBy],
    references: [customers.customerId],
    relationName: 'referrer'
  }),
  referrals: many(customers, { relationName: 'referrer' })
}))

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.customerId]
  })
}))

export const customerSessionsRelations = relations(customerSessions, ({ one, many }) => ({
  customer: one(customers, {
    fields: [customerSessions.customerId],
    references: [customers.customerId]
  }),
  activityLogs: many(customerActivityLogs)
}))

export const customerActivityLogsRelations = relations(customerActivityLogs, ({ one }) => ({
  customer: one(customers, {
    fields: [customerActivityLogs.customerId],
    references: [customers.customerId]
  }),
  session: one(customerSessions, {
    fields: [customerActivityLogs.sessionId],
    references: [customerSessions.sessionId]
  })
}))

export const customerWishlistsRelations = relations(customerWishlists, ({ one }) => ({
  customer: one(customers, {
    fields: [customerWishlists.customerId],
    references: [customers.customerId]
  })
}))

// ============ 類型導出 ============
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert

export type CustomerAddress = typeof customerAddresses.$inferSelect
export type NewCustomerAddress = typeof customerAddresses.$inferInsert

export type CustomerSession = typeof customerSessions.$inferSelect
export type NewCustomerSession = typeof customerSessions.$inferInsert

export type CustomerActivityLog = typeof customerActivityLogs.$inferSelect
export type NewCustomerActivityLog = typeof customerActivityLogs.$inferInsert

export type CustomerWishlist = typeof customerWishlists.$inferSelect
export type NewCustomerWishlist = typeof customerWishlists.$inferInsert