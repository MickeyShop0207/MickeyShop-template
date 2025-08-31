/**
 * 訂單相關表結構定義
 * 統一訂單管理系統標準化實現
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'

// ============ 訂單主表 ============
export const orders = sqliteTable('orders', {
  orderId: text('order_id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // 人類可讀的訂單編號
  customerId: text('customer_id').notNull(),
  
  // 訂單狀態
  status: text('status').notNull().default('pending'), // pending, processing, shipped, delivered, cancelled, refunded
  paymentStatus: text('payment_status').notNull().default('pending'), // pending, paid, failed, refunded, partial
  shippingStatus: text('shipping_status').notNull().default('pending'), // pending, preparing, shipped, delivered, returned
  
  // 金額資訊
  subtotal: real('subtotal').notNull().default(0), // 商品小計
  taxAmount: real('tax_amount').notNull().default(0), // 稅額
  shippingAmount: real('shipping_amount').notNull().default(0), // 運費
  discountAmount: real('discount_amount').notNull().default(0), // 折扣金額
  totalAmount: real('total_amount').notNull().default(0), // 總金額
  paidAmount: real('paid_amount').notNull().default(0), // 已付金額
  refundAmount: real('refund_amount').notNull().default(0), // 退款金額
  
  // 貨幣
  currency: text('currency').notNull().default('TWD'),
  
  // 收件地址資訊
  shippingName: text('shipping_name').notNull(),
  shippingPhone: text('shipping_phone'),
  shippingEmail: text('shipping_email'),
  shippingCountry: text('shipping_country').notNull().default('TW'),
  shippingCity: text('shipping_city').notNull(),
  shippingDistrict: text('shipping_district'),
  shippingZipCode: text('shipping_zip_code'),
  shippingAddressLine1: text('shipping_address_line_1').notNull(),
  shippingAddressLine2: text('shipping_address_line_2'),
  
  // 帳單地址資訊（如果與收件地址不同）
  billingName: text('billing_name'),
  billingPhone: text('billing_phone'),
  billingEmail: text('billing_email'),
  billingCountry: text('billing_country'),
  billingCity: text('billing_city'),
  billingDistrict: text('billing_district'),
  billingZipCode: text('billing_zip_code'),
  billingAddressLine1: text('billing_address_line_1'),
  billingAddressLine2: text('billing_address_line_2'),
  
  // 運送資訊
  shippingMethod: text('shipping_method'), // standard, express, same_day
  trackingNumber: text('tracking_number'),
  carrierName: text('carrier_name'),
  
  // 付款資訊
  paymentMethod: text('payment_method'), // credit_card, transfer, cod, linepay, etc.
  paymentReference: text('payment_reference'), // 第三方支付參考號
  
  // 其他資訊
  notes: text('notes'), // 客戶備註
  internalNotes: text('internal_notes'), // 內部備註
  source: text('source').default('web'), // web, mobile, admin, api
  
  // 優惠券/折扣碼
  couponCode: text('coupon_code'),
  couponDiscount: real('coupon_discount').default(0),
  
  // 會員點數
  pointsEarned: integer('points_earned').default(0),
  pointsUsed: integer('points_used').default(0),
  pointsValue: real('points_value').default(0),
  
  // 時間戳記
  orderDate: text('order_date').default(sql`(CURRENT_TIMESTAMP)`),
  paidAt: text('paid_at'),
  shippedAt: text('shipped_at'),
  deliveredAt: text('delivered_at'),
  cancelledAt: text('cancelled_at'),
  refundedAt: text('refunded_at'),
  
  // 系統欄位
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  deletedAt: text('deleted_at')
}, (table) => ({
  customerIdx: index('idx_orders_customer').on(table.customerId),
  orderNumberIdx: index('idx_orders_number').on(table.orderNumber),
  statusIdx: index('idx_orders_status').on(table.status),
  paymentStatusIdx: index('idx_orders_payment_status').on(table.paymentStatus),
  shippingStatusIdx: index('idx_orders_shipping_status').on(table.shippingStatus),
  orderDateIdx: index('idx_orders_date').on(table.orderDate),
  totalAmountIdx: index('idx_orders_total').on(table.totalAmount),
  createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
  deletedAtIdx: index('idx_orders_deleted_at').on(table.deletedAt)
}))

// ============ 訂單商品明細表 ============
export const orderItems = sqliteTable('order_items', {
  itemId: text('item_id').primaryKey(),
  orderId: text('order_id').notNull(),
  productId: text('product_id').notNull(),
  variationId: text('variation_id'), // 如果是商品變體
  
  // 商品資訊（快照）
  productName: text('product_name').notNull(),
  productSku: text('product_sku').notNull(),
  productImage: text('product_image'),
  
  // 數量和價格
  quantity: integer('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull().default(0),
  totalPrice: real('total_price').notNull().default(0),
  
  // 成本價格（用於利潤計算）
  costPrice: real('cost_price').default(0),
  totalCost: real('total_cost').default(0),
  
  // 商品屬性（快照）
  attributes: text('attributes', { mode: 'json' }),
  
  // 系統欄位
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  orderIdx: index('idx_order_items_order').on(table.orderId),
  productIdx: index('idx_order_items_product').on(table.productId),
  variationIdx: index('idx_order_items_variation').on(table.variationId)
}))

// ============ 購物車主表 ============
export const shoppingCarts = sqliteTable('shopping_carts', {
  cartId: text('cart_id').primaryKey(),
  customerId: text('customer_id'), // 可為 null，支援訪客購物車
  sessionId: text('session_id'), // 訪客購物車識別
  
  // 購物車狀態
  status: text('status').notNull().default('active'), // active, abandoned, converted, expired
  
  // 金額統計
  itemsCount: integer('items_count').default(0),
  totalAmount: real('total_amount').default(0),
  
  // 優惠券
  couponCode: text('coupon_code'),
  couponDiscount: real('coupon_discount').default(0),
  
  // 時間戳記
  lastActivityAt: text('last_activity_at').default(sql`(CURRENT_TIMESTAMP)`),
  expiresAt: text('expires_at'), // 購物車過期時間
  
  // 系統欄位
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  customerIdx: index('idx_shopping_carts_customer').on(table.customerId),
  sessionIdx: index('idx_shopping_carts_session').on(table.sessionId),
  statusIdx: index('idx_shopping_carts_status').on(table.status),
  activityIdx: index('idx_shopping_carts_activity').on(table.lastActivityAt),
  expiresIdx: index('idx_shopping_carts_expires').on(table.expiresAt)
}))

// ============ 購物車商品明細表 ============
export const cartItems = sqliteTable('cart_items', {
  itemId: text('item_id').primaryKey(),
  cartId: text('cart_id').notNull(),
  productId: text('product_id').notNull(),
  variationId: text('variation_id'), // 如果是商品變體
  
  // 數量
  quantity: integer('quantity').notNull().default(1),
  
  // 加入購物車的時間
  addedAt: text('added_at').default(sql`(CURRENT_TIMESTAMP)`),
  
  // 系統欄位
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  cartIdx: index('idx_cart_items_cart').on(table.cartId),
  productIdx: index('idx_cart_items_product').on(table.productId),
  variationIdx: index('idx_cart_items_variation').on(table.variationId),
  addedAtIdx: index('idx_cart_items_added_at').on(table.addedAt)
}))

// ============ 檔案上傳管理表 ============
export const fileUploads = sqliteTable('file_uploads', {
  fileId: text('file_id').primaryKey(),
  
  // 檔案基本資訊
  originalName: text('original_name').notNull(),
  fileName: text('file_name').notNull(), // 儲存的檔名
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(), // bytes
  fileExtension: text('file_extension').notNull(),
  
  // 儲存資訊
  storageProvider: text('storage_provider').notNull().default('r2'), // r2, s3, local
  storageKey: text('storage_key').notNull(), // 在儲存服務中的 key
  storageUrl: text('storage_url').notNull(), // 完整的存取 URL
  cdnUrl: text('cdn_url'), // CDN 加速 URL
  
  // 檔案類型和用途
  category: text('category').notNull(), // avatar, product, banner, document, etc.
  purpose: text('purpose'), // profile_image, product_gallery, category_banner, etc.
  
  // 關聯資訊
  relatedType: text('related_type'), // customer, product, order, etc.
  relatedId: text('related_id'), // 關聯的 ID
  
  // 圖片特定資訊
  imageWidth: integer('image_width'),
  imageHeight: integer('image_height'),
  thumbnails: text('thumbnails', { mode: 'json' }), // 縮圖版本
  
  // 狀態
  status: text('status').notNull().default('active'), // active, deleted, processing
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),
  
  // 上傳者資訊
  uploadedBy: text('uploaded_by'), // 上傳者 ID
  uploadedByType: text('uploaded_by_type'), // admin, customer
  
  // 檔案處理資訊
  processedAt: text('processed_at'), // 檔案處理完成時間
  
  // 系統欄位
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  deletedAt: text('deleted_at')
}, (table) => ({
  categoryIdx: index('idx_file_uploads_category').on(table.category),
  statusIdx: index('idx_file_uploads_status').on(table.status),
  relatedIdx: index('idx_file_uploads_related').on(table.relatedType, table.relatedId),
  uploadedByIdx: index('idx_file_uploads_uploaded_by').on(table.uploadedBy),
  createdAtIdx: index('idx_file_uploads_created_at').on(table.createdAt),
  deletedAtIdx: index('idx_file_uploads_deleted_at').on(table.deletedAt)
}))

// ============ 關聯定義 ============
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems)
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.orderId]
  })
}))

export const shoppingCartsRelations = relations(shoppingCarts, ({ many }) => ({
  items: many(cartItems)
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(shoppingCarts, {
    fields: [cartItems.cartId],
    references: [shoppingCarts.cartId]
  })
}))

// ============ 類型導出 ============
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

export type ShoppingCart = typeof shoppingCarts.$inferSelect
export type NewShoppingCart = typeof shoppingCarts.$inferInsert

export type CartItem = typeof cartItems.$inferSelect
export type NewCartItem = typeof cartItems.$inferInsert

export type FileUpload = typeof fileUploads.$inferSelect
export type NewFileUpload = typeof fileUploads.$inferInsert