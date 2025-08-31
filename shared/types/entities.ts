/**
 * 業務實體類型定義
 * 定義系統中所有核心業務實體的TypeScript類型
 */

// ============ 基礎實體類型 ============
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface BaseEntityWithSoftDelete extends BaseEntity {
  deletedAt?: string | null
}

// ============ 用戶相關實體 ============

// 管理員
export interface Admin extends BaseEntity {
  username: string
  email: string
  passwordHash: string
  name: string
  avatar?: string
  role: AdminRole
  permissions: string[]
  isActive: boolean
  lastLoginAt?: string
}

export type AdminRole = 
  | 'superadmin'     // 超級管理員
  | 'admin'          // 管理員
  | 'customer_service' // 客服人員
  | 'warehouse'      // 倉庫人員
  | 'content_editor' // 內容編輯

// 會員
export interface Customer extends BaseEntity {
  email: string
  phone?: string
  name?: string
  birthday?: string
  gender?: 'male' | 'female' | 'other'
  registrationSource: 'web' | 'mobile' | 'social'
  status: CustomerStatus
  emailVerified: boolean
  phoneVerified: boolean
  marketingConsent: boolean
  
  // 統計數據
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderAt?: string
  
  // 會員等級
  memberTier: MemberTier
  memberPoints: number
  
  // 關聯
  defaultAddressId?: string
}

export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'pending'
export type MemberTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

// 會員地址
export interface CustomerAddress extends BaseEntity {
  customerId: string
  name: string
  phone: string
  city: string
  district: string
  zipCode: string
  streetAddress: string
  addressType: 'shipping' | 'billing'
  isDefault: boolean
}

// ============ 商品相關實體 ============

// 商品
export interface Product extends BaseEntity {
  name: string
  description?: string
  brand: string
  category: string
  subcategory?: string
  
  // 價格
  basePrice: number
  comparePrice?: number
  costPrice?: number
  
  // 庫存相關
  sku: string
  barcode?: string
  trackInventory: boolean
  
  // 媒體資源
  images: ProductImage[]
  videos?: ProductVideo[]
  
  // 變體
  hasVariants: boolean
  variants?: ProductVariant[]
  
  // 屬性
  attributes: ProductAttribute[]
  
  // SEO
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  
  // 狀態
  status: ProductStatus
  featured: boolean
  
  // 物流
  weight?: number
  dimensions?: ProductDimensions
  shippingClass: string
  
  // 分類標籤
  tags: string[]
  
  // 創建者
  createdBy: string
}

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'archived'

export interface ProductImage {
  id: string
  url: string
  alt?: string
  sortOrder: number
  isMain: boolean
}

export interface ProductVideo {
  id: string
  url: string
  title?: string
  sortOrder: number
  thumbnailUrl?: string
}

export interface ProductVariant {
  id: string
  name: string
  sku: string
  price?: number
  comparePrice?: number
  weight?: number
  dimensions?: ProductDimensions
  image?: ProductImage
  attributes: VariantAttribute[]
  inventory: InventoryInfo
}

export interface VariantAttribute {
  name: string
  value: string
}

export interface ProductAttribute {
  name: string
  value: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'color' | 'image'
  isRequired: boolean
  isVisible: boolean
}

export interface ProductDimensions {
  length: number
  width: number
  height: number
  unit: 'cm' | 'inch'
}

// 商品分類
export interface Category extends BaseEntity {
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
  sortOrder: number
  isActive: boolean
  seoTitle?: string
  seoDescription?: string
  children?: Category[]
}

// ============ 庫存相關實體 ============
export interface InventoryInfo {
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  lowStockThreshold: number
  reorderPoint: number
  reorderQuantity: number
  location?: string
  cost?: number
  lastReceivedAt?: string
  lastSoldAt?: string
}

export interface InventoryTransaction extends BaseEntity {
  productId: string
  variantId?: string
  type: InventoryTransactionType
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason?: string
  referenceId?: string
  referenceType?: string
  notes?: string
  performedBy: string
}

export type InventoryTransactionType = 
  | 'adjustment'     // 庫存調整
  | 'sale'          // 銷售
  | 'return'        // 退貨
  | 'purchase'      // 採購
  | 'transfer'      // 調撥
  | 'loss'          // 損耗
  | 'found'         // 盤盈

// ============ 訂單相關實體 ============
export interface Order extends BaseEntity {
  orderNumber: string
  customerId?: string
  customerEmail: string
  
  // 訂單狀態
  status: OrderStatus
  paymentStatus: PaymentStatus
  fulfillmentStatus: FulfillmentStatus
  
  // 金額
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  total: number
  currency: string
  
  // 收件資訊
  shippingAddress: ShippingAddress
  billingAddress?: BillingAddress
  
  // 付款資訊
  paymentMethod?: string
  paymentReference?: string
  
  // 時間戳
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  
  // 物流資訊
  trackingNumber?: string
  shippingCarrier?: string
  
  // 備註
  customerNotes?: string
  adminNotes?: string
  
  // 關聯項目
  items: OrderItem[]
  transactions?: OrderTransaction[]
}

export type OrderStatus = 
  | 'created'       // 已創建
  | 'confirmed'     // 已確認
  | 'paid'          // 已付款
  | 'preparing'     // 備貨中
  | 'shipped'       // 已出貨
  | 'delivered'     // 已送達
  | 'completed'     // 已完成
  | 'cancelled'     // 已取消
  | 'refunded'      // 已退款

export type PaymentStatus = 
  | 'pending'       // 待付款
  | 'paid'          // 已付款
  | 'failed'        // 付款失敗
  | 'refunded'      // 已退款
  | 'partial_refund' // 部分退款

export type FulfillmentStatus = 
  | 'pending'       // 待處理
  | 'processing'    // 處理中
  | 'shipped'       // 已出貨
  | 'delivered'     // 已送達
  | 'returned'      // 已退回

export interface OrderItem {
  id: string
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  
  // 商品快照（訂單時商品狀態）
  productSnapshot: {
    name: string
    description?: string
    image?: string
    attributes?: ProductAttribute[]
  }
}

export interface OrderTransaction extends BaseEntity {
  orderId: string
  type: TransactionType
  amount: number
  currency: string
  paymentMethod: string
  reference?: string
  status: TransactionStatus
  processedAt?: string
  notes?: string
}

export type TransactionType = 'payment' | 'refund' | 'partial_refund'
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'cancelled'

export interface ShippingAddress {
  name: string
  phone: string
  email?: string
  company?: string
  address1: string
  address2?: string
  city: string
  district: string
  zipCode: string
  country: string
}

export interface BillingAddress extends ShippingAddress {}

// ============ 購物車實體 ============
export interface CartItem {
  id: string
  customerId?: string
  sessionId?: string
  productId: string
  variantId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  addedAt: string
  updatedAt: string
  
  // 商品資訊快照
  product: {
    name: string
    image?: string
    sku: string
    status: ProductStatus
    inStock: boolean
  }
  
  variant?: {
    name: string
    sku: string
    attributes: VariantAttribute[]
  }
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  itemCount: number
  updatedAt: string
}

// ============ 促銷與優惠實體 ============
export interface Promotion extends BaseEntity {
  name: string
  description?: string
  type: PromotionType
  status: PromotionStatus
  
  // 時間限制
  startDate: string
  endDate: string
  
  // 使用限制
  usageLimit?: number
  usageCount: number
  customerUsageLimit?: number
  
  // 條件
  conditions: PromotionCondition[]
  
  // 動作
  actions: PromotionAction[]
  
  // 適用範圍
  applicableProducts?: string[]
  applicableCategories?: string[]
  excludedProducts?: string[]
  excludedCategories?: string[]
}

export type PromotionType = 'discount' | 'gift' | 'shipping' | 'bundle'
export type PromotionStatus = 'draft' | 'active' | 'paused' | 'expired'

export interface PromotionCondition {
  type: 'min_amount' | 'min_quantity' | 'customer_group' | 'product' | 'category'
  operator: 'gte' | 'gt' | 'lte' | 'lt' | 'eq' | 'in' | 'not_in'
  value: any
}

export interface PromotionAction {
  type: 'percentage_discount' | 'fixed_discount' | 'free_shipping' | 'free_gift'
  value: any
  target?: 'order' | 'product' | 'category'
}

// ============ 系統配置實體 ============
export interface SystemConfig extends BaseEntity {
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'json' | 'array'
  description?: string
  isPublic: boolean
  category: string
}

// ============ 文件上傳實體 ============
export interface UploadedFile extends BaseEntity {
  fileName: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  uploadedBy: string
  folder?: string
  metadata?: Record<string, any>
}

// ============ 審計日誌實體 ============
export interface AuditLog extends BaseEntity {
  entityType: string
  entityId: string
  action: AuditAction
  changes?: Record<string, { before: any; after: any }>
  performedBy: string
  performedByType: 'admin' | 'customer' | 'system'
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export type AuditAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout' 
  | 'export' 
  | 'import'

// ============ 工具類型 ============
// 實體ID類型
export type EntityId = string

// 分頁結果
export interface PaginatedResult<T> {
  items: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// 搜索結果
export interface SearchResult<T> {
  items: T[]
  total: number
  facets?: Record<string, { value: string; count: number }[]>
  suggestions?: string[]
}

// 實體創建/更新的基礎類型
export type CreateEntityData<T> = Omit<T, keyof BaseEntity>
export type UpdateEntityData<T> = Partial<CreateEntityData<T>>

// 實體查詢選項
export interface EntityQueryOptions {
  include?: string[]
  fields?: string[]
  sort?: string
  filters?: Record<string, any>
  search?: string
}

// 批量操作結果
export interface BulkOperationResult {
  success: number
  failed: number
  errors: Array<{
    item: any
    error: string
  }>
}