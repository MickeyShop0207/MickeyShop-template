/**
 * 全局類型定義 - 統一類型管理
 */

// 基本類型
export type ID = string | number
export type Timestamp = string | number | Date
export type LocaleCode = 'zh-TW' | 'zh-CN' | 'zh-HK' | 'en-US' | 'ja-JP' | 'ko-KR'
export type CurrencyCode = 'TWD' | 'CNY' | 'HKD' | 'USD' | 'JPY' | 'KRW'
export type ThemeMode = 'light' | 'dark'

// API 相關類型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
  meta?: {
    pagination?: PaginationMeta
    total?: number
    count?: number
    [key: string]: any
  }
}

export interface ApiError {
  message: string
  code?: string | number
  status?: number
  details?: Record<string, any>
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: PaginationMeta
  success: boolean
  message?: string
}

// 用戶相關類型
export interface User {
  id: ID
  email: string
  username?: string
  firstName?: string
  lastName?: string
  avatar?: string
  phone?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  preferences?: UserPreferences
  addresses?: Address[]
  createdAt: Timestamp
  updatedAt: Timestamp
  emailVerified: boolean
  phoneVerified: boolean
  isActive: boolean
  role: UserRole
  membershipLevel?: MembershipLevel
}

export type UserRole = 'user' | 'admin' | 'moderator'
export type MembershipLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface UserPreferences {
  language: LocaleCode
  currency: CurrencyCode
  theme: ThemeMode
  notifications: NotificationPreferences
  privacy: PrivacyPreferences
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  marketing: boolean
  orderUpdates: boolean
  promotions: boolean
}

export interface PrivacyPreferences {
  showProfile: boolean
  showOrders: boolean
  allowAnalytics: boolean
  allowCookies: boolean
}

export interface Address {
  id: ID
  type: 'billing' | 'shipping' | 'both'
  firstName: string
  lastName: string
  company?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 認證相關類型
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  firstName?: string
  lastName?: string
  agreedToTerms: boolean
  agreedToMarketing?: boolean
}

// JWT 權限相關類型
export interface JWTPayload {
  sub: string                    // 用戶 ID
  email: string                  // 用戶 email
  roles: AdminRole[]             // 角色列表
  permissions: Permission[]      // 權限列表
  brand: string                  // 品牌標識
  session: string                // 會話 ID
  iat: number                   // 簽發時間
  exp: number                   // 過期時間
  iss: string                   // 簽發者
  aud: string                   // 受眾
}

// 管理員用戶類型
export interface AdminUser {
  id: ID
  username: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  phone?: string
  department: AdminDepartment
  roles: AdminRole[]
  permissions: Permission[]
  isActive: boolean
  lastLoginAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 管理員角色定義
export type AdminRole = 
  | 'super_admin'        // 超級管理員：全系統權限
  | 'admin'              // 管理員：業務管理權限
  | 'customer_service'   // 客服人員：客戶服務權限
  | 'warehouse_staff'    // 倉庫人員：庫存物流權限
  | 'content_editor'     // 內容編輯：內容管理權限

// 管理員部門
export type AdminDepartment = 
  | 'management'         // 管理部門
  | 'customer_service'   // 客服部門
  | 'warehouse'          // 倉庫部門
  | 'marketing'          // 行銷部門
  | 'it'                 // IT 部門

// 權限定義（符合 RBAC 模式）
export type Permission = 
  // 商品管理權限
  | 'product:read'       | 'product:write'      | 'product:delete'
  | 'category:read'      | 'category:write'     | 'category:delete'
  | 'brand:read'         | 'brand:write'        | 'brand:delete'
  | 'inventory:read'     | 'inventory:write'    | 'inventory:adjust'
  
  // 訂單管理權限
  | 'order:read'         | 'order:write'        | 'order:delete'
  | 'order:process'      | 'order:ship'         | 'order:cancel'
  | 'order:refund'       | 'order:return'
  
  // 會員管理權限
  | 'member:read'        | 'member:write'       | 'member:delete'
  | 'member:suspend'     | 'member:activate'
  
  // 內容管理權限
  | 'content:read'       | 'content:write'      | 'content:delete'
  | 'banner:read'        | 'banner:write'       | 'banner:delete'
  
  // 促銷活動權限
  | 'promotion:read'     | 'promotion:write'    | 'promotion:delete'
  | 'coupon:read'        | 'coupon:write'       | 'coupon:delete'
  
  // 報表分析權限
  | 'analytics:read'     | 'analytics:export'
  | 'report:read'        | 'report:export'
  
  // 系統管理權限
  | 'system:read'        | 'system:write'
  | 'user:read'          | 'user:write'         | 'user:delete'
  | 'role:read'          | 'role:write'         | 'role:assign'
  | 'audit:read'         | 'backup:create'      | 'backup:restore'

// 權限檢查選項
export interface PermissionCheck {
  permissions: Permission[]
  requireAll?: boolean     // 是否需要所有權限 (AND) 或任一權限 (OR)
  roles?: AdminRole[]      // 可選：同時檢查角色
}

// 認證響應類型
export interface AuthResponse {
  success: boolean
  message?: string
  user: User | AdminUser
  tokens: AuthTokens
  permissions?: Permission[]
  roles?: AdminRole[]
}

// 設備信息類型
export interface DeviceInfo {
  userAgent?: string
  platform?: string
  browser?: string
  ip?: string
  location?: string
}

// 商品相關類型
export interface Product {
  id: ID
  sku: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  brand: Brand
  category: Category
  images: ProductImage[]
  variants: ProductVariant[]
  pricing: ProductPricing
  inventory: ProductInventory
  specifications?: ProductSpecification[]
  reviews: ProductReviewSummary
  tags?: string[]
  isActive: boolean
  isFeature: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  publishedAt?: Timestamp
  seo?: SEOMeta
}

export interface Brand {
  id: ID
  name: string
  slug: string
  logo?: string
  description?: string
  country?: string
  website?: string
  isActive: boolean
  createdAt: Timestamp
}

export interface Category {
  id: ID
  name: string
  slug: string
  description?: string
  parentId?: ID
  image?: string
  isActive: boolean
  sortOrder: number
  createdAt: Timestamp
  children?: Category[]
}

export interface ProductImage {
  id: ID
  url: string
  alt: string
  sortOrder: number
  isPrimary: boolean
  type: 'main' | 'gallery' | 'variant' | 'detail'
}

export interface ProductVariant {
  id: ID
  sku: string
  name: string
  attributes: Record<string, string> // e.g., { color: 'red', size: 'M' }
  pricing: ProductPricing
  inventory: ProductInventory
  images?: ProductImage[]
  isActive: boolean
}

export interface ProductPricing {
  basePrice: number
  salePrice?: number
  currency: CurrencyCode
  discountPercentage?: number
  priceBreaks?: PriceBreak[] // 數量折扣
  memberPricing?: MemberPricing[]
}

export interface PriceBreak {
  minQuantity: number
  price: number
  discountPercentage: number
}

export interface MemberPricing {
  membershipLevel: MembershipLevel
  price: number
  discountPercentage: number
}

export interface ProductInventory {
  quantity: number
  reserved: number
  available: number
  threshold: number
  isInStock: boolean
  trackQuantity: boolean
  allowBackorders: boolean
  stockStatus: 'in-stock' | 'out-of-stock' | 'backorder'
}

export interface ProductSpecification {
  name: string
  value: string
  unit?: string
  group?: string
  sortOrder?: number
}

export interface ProductReviewSummary {
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>
}

// 購物車相關類型
export interface CartItem {
  id: ID
  product: Product
  variant?: ProductVariant
  quantity: number
  unitPrice: number
  totalPrice: number
  addedAt: Timestamp
  customizations?: Record<string, any>
}

export interface Cart {
  id: ID
  items: CartItem[]
  totalItems: number
  subtotal: number
  discounts: Discount[]
  taxes: Tax[]
  shipping?: ShippingMethod
  total: number
  currency: CurrencyCode
  expiresAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 訂單相關類型
export interface Order {
  id: ID
  orderNumber: string
  user: User
  items: OrderItem[]
  billing: Address
  shipping?: Address
  payment: PaymentMethod
  shippingMethod?: ShippingMethod
  status: OrderStatus
  timestamps: OrderTimestamps
  totals: OrderTotals
  notes?: string
  trackingNumbers?: TrackingInfo[]
  refunds?: Refund[]
}

export interface OrderItem {
  id: ID
  product: Product
  variant?: ProductVariant
  quantity: number
  unitPrice: number
  totalPrice: number
  status: OrderItemStatus
}

export type OrderStatus = 
  | 'pending'      // 待處理
  | 'confirmed'    // 已確認
  | 'processing'   // 處理中
  | 'shipped'      // 已出貨
  | 'delivered'    // 已送達
  | 'cancelled'    // 已取消
  | 'refunded'     // 已退款
  | 'returned'     // 已退貨

export type OrderItemStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export interface OrderTimestamps {
  createdAt: Timestamp
  confirmedAt?: Timestamp
  processedAt?: Timestamp
  shippedAt?: Timestamp
  deliveredAt?: Timestamp
  cancelledAt?: Timestamp
}

export interface OrderTotals {
  subtotal: number
  discounts: Discount[]
  taxes: Tax[]
  shipping: number
  total: number
  currency: CurrencyCode
}

// 付款相關類型
export interface PaymentMethod {
  id: ID
  type: PaymentType
  provider: PaymentProvider
  details: Record<string, any>
  isDefault: boolean
  isActive: boolean
  createdAt: Timestamp
}

export type PaymentType = 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'bank_transfer' | 'cash_on_delivery'
export type PaymentProvider = 'stripe' | 'paypal' | 'square' | 'adyen' | 'local'

// 物流相關類型
export interface ShippingMethod {
  id: ID
  name: string
  description?: string
  provider: string
  cost: number
  estimatedDays: number
  trackingSupported: boolean
  isActive: boolean
}

export interface TrackingInfo {
  carrier: string
  trackingNumber: string
  url?: string
  status: TrackingStatus
  events: TrackingEvent[]
}

export type TrackingStatus = 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception'

export interface TrackingEvent {
  timestamp: Timestamp
  status: string
  description: string
  location?: string
}

// 折扣相關類型
export interface Discount {
  id: ID
  code?: string
  name: string
  type: DiscountType
  value: number
  conditions?: DiscountConditions
  appliedAmount: number
}

export type DiscountType = 'percentage' | 'fixed' | 'free_shipping'

export interface DiscountConditions {
  minAmount?: number
  maxAmount?: number
  applicableProducts?: ID[]
  applicableCategories?: ID[]
  membershipLevels?: MembershipLevel[]
  usageLimit?: number
  usageCount?: number
  validFrom?: Timestamp
  validUntil?: Timestamp
}

// 稅收相關類型
export interface Tax {
  id: ID
  name: string
  rate: number
  type: 'percentage' | 'fixed'
  appliedAmount: number
}

// 退款相關類型
export interface Refund {
  id: ID
  orderId: ID
  items: RefundItem[]
  amount: number
  reason: string
  status: RefundStatus
  method: PaymentMethod
  processedAt?: Timestamp
  createdAt: Timestamp
}

export interface RefundItem {
  orderItemId: ID
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type RefundStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'

// 節慶活動相關類型
export interface Festival {
  id: ID
  name: string
  slug: string
  type: FestivalType
  description: string
  startDate: Timestamp
  endDate: Timestamp
  isActive: boolean
  theme?: FestivalTheme
  discountRules: DiscountRule[]
  banners?: Banner[]
  featuredProducts?: ID[]
}

export type FestivalType = 'flash_sale' | 'seasonal' | 'traditional' | 'member_exclusive' | 'brand_day'

export interface FestivalTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  backgroundImage?: string
  animations?: AnimationConfig[]
}

export interface DiscountRule {
  id: ID
  conditions: DiscountConditions
  benefits: DiscountBenefit[]
  priority: number
}

export interface DiscountBenefit {
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping'
  value: number
  maxDiscount?: number
  freeItems?: ID[]
}

export interface Banner {
  id: ID
  title: string
  subtitle?: string
  image: string
  mobileImage?: string
  link?: string
  position: BannerPosition
  isActive: boolean
  sortOrder: number
  displayFrom?: Timestamp
  displayUntil?: Timestamp
}

export type BannerPosition = 'hero' | 'category' | 'product_detail' | 'cart' | 'checkout' | 'sidebar'

// 動畫相關類型
export interface AnimationConfig {
  type: AnimationType
  duration: number
  delay?: number
  easing?: string
  loop?: boolean
  trigger?: AnimationTrigger
  properties: Record<string, any>
}

export type AnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'pulse' | 'particles'
export type AnimationTrigger = 'load' | 'scroll' | 'hover' | 'click' | 'interval'

// SEO 相關類型
export interface SEOMeta {
  title?: string
  description?: string
  keywords?: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  canonicalUrl?: string
  noIndex?: boolean
  noFollow?: boolean
}

// 搜尋相關類型
export interface SearchParams {
  query?: string
  categories?: ID[]
  brands?: ID[]
  priceRange?: {
    min: number
    max: number
  }
  rating?: number
  inStock?: boolean
  onSale?: boolean
  sortBy?: SearchSortBy
  page?: number
  limit?: number
}

export type SearchSortBy = 
  | 'relevance'
  | 'price_low_high'
  | 'price_high_low'
  | 'rating'
  | 'newest'
  | 'popularity'
  | 'name'

export interface SearchResult<T = Product> {
  items: T[]
  facets?: SearchFacets
  suggestions?: string[]
  pagination: PaginationMeta
}

export interface SearchFacets {
  categories: FacetItem[]
  brands: FacetItem[]
  priceRanges: FacetItem[]
  ratings: FacetItem[]
}

export interface FacetItem {
  value: string
  label: string
  count: number
}

// 通知相關類型
export interface Notification {
  id: ID
  userId: ID
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  readAt?: Timestamp
  createdAt: Timestamp
  expiresAt?: Timestamp
}

export type NotificationType = 
  | 'order_update'
  | 'payment_success'
  | 'payment_failed'
  | 'shipping_update'
  | 'promotion'
  | 'system'
  | 'review_reminder'
  | 'wishlist_price_drop'

// 表單相關類型
export interface FormField<T = any> {
  name: string
  label?: string
  type: FieldType
  value: T
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  options?: SelectOption[]
  validation?: ValidationRule[]
  error?: string
  helper?: string
}

export type FieldType = 
  | 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio'
  | 'date' | 'time' | 'datetime' | 'file' | 'image'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}

export interface ValidationRule {
  type: ValidationType
  value?: any
  message: string
}

export type ValidationType = 
  | 'required' | 'min' | 'max' | 'minLength' | 'maxLength'
  | 'pattern' | 'email' | 'url' | 'number' | 'integer'
  | 'custom'

// 工具類型
export type RequireField<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialField<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T]

// React 相關類型擴展
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
  style?: React.CSSProperties
}