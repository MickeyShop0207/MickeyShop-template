/**
 * 訂單模組類型定義
 * 完整的訂單和購物車相關介面
 */

// ============ 基礎類型定義 ============
export interface OrderAddress {
  name: string
  phone?: string
  email?: string
  country: string
  city: string
  district?: string
  zipCode?: string
  addressLine1: string
  addressLine2?: string
}

export interface OrderPayment {
  method: string // 'credit_card' | 'transfer' | 'cod' | 'linepay' | etc.
  reference?: string
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial'
}

export interface OrderShipping {
  method?: string // 'standard' | 'express' | 'same_day'
  trackingNumber?: string
  carrierName?: string
  status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned'
}

// ============ 訂單相關介面 ============
export interface CreateOrderRequest {
  customerId: string
  cartId?: string // 從購物車創建訂單時提供
  
  // 收件地址
  shippingAddress: OrderAddress
  
  // 帳單地址（可選，不提供則使用收件地址）
  billingAddress?: OrderAddress
  
  // 運送和付款
  shipping: {
    method: string
  }
  payment: {
    method: string
  }
  
  // 其他資訊
  notes?: string
  couponCode?: string
  pointsUsed?: number
  
  // 訂單項目（如果不從購物車創建）
  items?: Array<{
    productId: string
    variationId?: string
    quantity: number
  }>
}

export interface UpdateOrderRequest {
  orderId: string
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial'
  shippingStatus?: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned'
  trackingNumber?: string
  carrierName?: string
  internalNotes?: string
}

export interface OrderItem {
  itemId: string
  productId: string
  variationId?: string
  productName: string
  productSku: string
  productImage?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  attributes?: Record<string, any>
}

export interface Order {
  orderId: string
  orderNumber: string
  customerId: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial'
  shippingStatus: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned'
  
  // 金額資訊
  subtotal: number
  taxAmount: number
  shippingAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  refundAmount: number
  currency: string
  
  // 地址資訊
  shippingAddress: OrderAddress
  billingAddress?: OrderAddress
  
  // 運送和付款資訊
  shipping: OrderShipping
  payment: OrderPayment
  
  // 其他資訊
  notes?: string
  internalNotes?: string
  source: string
  
  // 優惠券和點數
  couponCode?: string
  couponDiscount: number
  pointsEarned: number
  pointsUsed: number
  pointsValue: number
  
  // 時間戳記
  orderDate: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  refundedAt?: string
  
  // 訂單項目
  items: OrderItem[]
  
  // 系統欄位
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// ============ 購物車相關介面 ============
export interface CartItem {
  itemId: string
  cartId: string
  productId: string
  variationId?: string
  quantity: number
  addedAt: string
  
  // 從商品表關聯的資訊
  product?: {
    name: string
    sku: string
    price: number
    image?: string
    attributes?: Record<string, any>
  }
}

export interface ShoppingCart {
  cartId: string
  customerId?: string
  sessionId?: string
  status: 'active' | 'abandoned' | 'converted' | 'expired'
  
  // 統計資訊
  itemsCount: number
  totalAmount: number
  
  // 優惠券
  couponCode?: string
  couponDiscount: number
  
  // 時間戳記
  lastActivityAt: string
  expiresAt?: string
  
  // 購物車項目
  items: CartItem[]
  
  // 系統欄位
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface AddToCartRequest {
  productId: string
  variationId?: string
  quantity: number
  cartId?: string // 訪客購物車 ID
}

export interface UpdateCartItemRequest {
  itemId: string
  quantity: number
}

// ============ API 回應介面 ============
export interface OrderListResponse {
  success: boolean
  data: {
    orders: Order[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  message: string
  timestamp: string
  requestId: string
}

export interface OrderResponse {
  success: boolean
  data: Order
  message: string
  timestamp: string
  requestId: string
}

export interface CartResponse {
  success: boolean
  data: ShoppingCart
  message: string
  timestamp: string
  requestId: string
}

// ============ 查詢參數介面 ============
export interface OrderListQuery {
  page?: number
  limit?: number
  status?: string
  paymentStatus?: string
  shippingStatus?: string
  customerId?: string
  orderDateStart?: string
  orderDateEnd?: string
  search?: string // 搜尋訂單編號或客戶資訊
  sortBy?: 'orderDate' | 'totalAmount' | 'status'
  sortOrder?: 'asc' | 'desc'
}

// ============ 錯誤類型 ============
export interface OrderError extends Error {
  code: string
  statusCode: number
  details?: Record<string, any>
}

// ============ 統計介面 ============
export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: Record<string, number>
  revenueByMonth: Array<{
    month: string
    revenue: number
    orders: number
  }>
}