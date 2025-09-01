// API 通用類型定義

// 分頁響應類型
export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  success: boolean
  message?: string
}

// 用戶相關類型
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName?: string
  phone?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other'
  avatar?: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  memberTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  loyaltyPoints: number
  totalSpent: number
  emailVerified: boolean
  phoneVerified: boolean
  marketingOptIn: boolean
  isActive: boolean
  role: 'user' | 'admin' | 'moderator'
  createdAt: string
  updatedAt: string
}

// 管理員用戶類型 (與主類型定義保持一致)
export interface AdminUser {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  phone?: string
  department: 'management' | 'customer_service' | 'warehouse' | 'marketing' | 'it'
  roles: ('super_admin' | 'admin' | 'customer_service' | 'warehouse_staff' | 'content_editor')[]
  permissions: string[]
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

// Token 信息
export interface TokenInfo {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

// 會話信息
export interface SessionInfo {
  sessionId: string
  expiresAt: string
}

// 認證響應
export interface AuthResponse {
  user: User | AdminUser
  tokens: TokenInfo
  session?: SessionInfo
}

// 商品類型
export interface Product {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  shortDescription?: string
  sku: string
  barcode?: string
  categoryId: string
  brandId: string
  price: number
  originalPrice?: number
  discountPercentage?: number
  stock: number
  minStock: number
  maxStock: number
  status: 'active' | 'inactive' | 'draft'
  isRecommended: boolean
  isFeatured: boolean
  isNewArrival: boolean
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  images: string[]
  tags: string[]
  attributes: Record<string, any>
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  createdAt: string
  updatedAt: string
  // 關聯數據
  category?: Category
  brand?: Brand
  variants?: ProductVariant[]
  reviews?: ProductReview[]
  avgRating?: number
  reviewCount?: number
}

// 商品變體
export interface ProductVariant {
  id: string
  productId: string
  name: string
  sku: string
  price?: number
  stock: number
  attributes: Record<string, any>
  images?: string[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// 商品分類
export interface Category {
  id: string
  name: string
  nameEn: string
  slug: string
  description?: string
  parentId?: string
  image?: string
  icon?: string
  sortOrder: number
  isActive: boolean
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
  // 關聯數據
  children?: Category[]
  parent?: Category
  productCount?: number
}

// 品牌
export interface Brand {
  id: string
  name: string
  nameEn: string
  slug: string
  description?: string
  logo?: string
  website?: string
  sortOrder: number
  isActive: boolean
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
  // 關聯數據
  productCount?: number
}

// 商品評價
export interface ProductReview {
  id: string
  productId: string
  userId: string
  orderId?: string
  rating: number
  title: string
  content: string
  images?: string[]
  isVerified: boolean
  isRecommended: boolean
  status: 'pending' | 'approved' | 'rejected'
  likes: number
  dislikes: number
  createdAt: string
  updatedAt: string
  // 關聯數據
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>
  product?: Pick<Product, 'id' | 'name' | 'images'>
}

// 創建商品評價請求
export interface CreateProductReviewRequest {
  productId: string
  rating: number
  title: string
  content: string
  images?: string[]
  isRecommended?: boolean
}

// 購物車項目
export interface CartItem {
  id: string
  productId: string
  variantId?: string
  quantity: number
  price: number
  subtotal: number
  createdAt: string
  updatedAt: string
  // 關聯數據
  product: Pick<Product, 'id' | 'name' | 'images' | 'status' | 'stock'>
  variant?: Pick<ProductVariant, 'id' | 'name' | 'attributes'>
}

// 訂單狀態
export type OrderStatus = 
  | 'pending'        // 待付款
  | 'paid'          // 已付款
  | 'confirmed'     // 已確認
  | 'processing'    // 處理中
  | 'shipped'       // 已出貨
  | 'delivered'     // 已送達
  | 'completed'     // 已完成
  | 'cancelled'     // 已取消
  | 'refunded'      // 已退款

// 訂單
export interface Order {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatus
  subtotal: number
  shippingFee: number
  tax: number
  discountAmount: number
  total: number
  currency: string
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  shippingAddress: Address
  billingAddress?: Address
  notes?: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
  // 關聯數據
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>
  items: OrderItem[]
  payments?: Payment[]
}

// 訂單項目
export interface OrderItem {
  id: string
  orderId: string
  productId: string
  variantId?: string
  quantity: number
  price: number
  subtotal: number
  createdAt: string
  // 關聯數據
  product: Pick<Product, 'id' | 'name' | 'images'>
  variant?: Pick<ProductVariant, 'id' | 'name' | 'attributes'>
}

// 地址
export interface Address {
  id?: string
  userId?: string
  type: 'shipping' | 'billing'
  isDefault: boolean
  recipientName: string
  phone: string
  countryCode: string
  state: string
  city: string
  district: string
  address: string
  postalCode: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

// 付款記錄
export interface Payment {
  id: string
  orderId: string
  method: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  transactionId?: string
  gatewayResponse?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 優惠券
export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minimumAmount?: number
  maximumAmount?: number
  startDate: string
  endDate: string
  usageLimit?: number
  usageCount: number
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

// 會員地址
export interface MemberAddress extends Address {
  id: string
  userId: string
}

// 願望清單項目
export interface WishlistItem {
  id: string
  userId: string
  productId: string
  variantId?: string
  createdAt: string
  // 關聯數據
  product: Pick<Product, 'id' | 'name' | 'price' | 'images' | 'status'>
  variant?: Pick<ProductVariant, 'id' | 'name' | 'price' | 'attributes'>
}

// 商品搜索參數
export interface ProductSearchParams {
  q?: string
  categoryId?: string
  brandId?: string
  minPrice?: number
  maxPrice?: number
  tags?: string[]
  attributes?: Record<string, any>
  isRecommended?: boolean
  isFeatured?: boolean
  isNewArrival?: boolean
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'created_desc' | 'rating_desc'
  page?: number
  limit?: number
}

// 訂單搜索參數
export interface OrderSearchParams {
  status?: OrderStatus[]
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  sort?: 'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc'
  page?: number
  limit?: number
}

// 文件上傳響應
export interface UploadResponse {
  url: string
  filename: string
  size: number
  mimetype: string
  key: string
}

// 統計數據
export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  totalProducts: number
  orderGrowth: number
  revenueGrowth: number
  customerGrowth: number
  productGrowth: number
}

// 設備信息
export interface DeviceInfo {
  deviceId: string
  deviceName: string
  platform?: string
  userAgent?: string
  ip?: string
}