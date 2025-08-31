// 訂單 API 服務
import { apiClient } from '../index'
import type { 
  CartItem,
  Order,
  OrderSearchParams,
  Address,
  Coupon,
  PaginatedResponse 
} from '../types'

// 購物車相關類型
export interface AddToCartRequest {
  productId: string
  variantId?: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface CartSummary {
  items: CartItem[]
  subtotal: number
  tax: number
  shippingFee: number
  discountAmount: number
  total: number
  itemCount: number
}

// 結帳相關類型
export interface CheckoutRequest {
  shippingAddress: Address
  billingAddress?: Address
  paymentMethod: string
  couponCode?: string
  notes?: string
}

export interface CheckoutSession {
  sessionId: string
  order: Order
  paymentUrl?: string
  expiresAt: string
}

// 應用優惠券請求
export interface ApplyCouponRequest {
  code: string
}

export interface CouponValidation {
  isValid: boolean
  coupon?: Coupon
  discountAmount: number
  message: string
}

export class OrderService {
  private readonly baseUrl = '/api/v1/orders'
  private readonly cartBaseUrl = '/api/v1/cart'
  private readonly adminBaseUrl = '/api/admin/v1/orders'

  // ===================
  // 購物車 API
  // ===================

  /**
   * 獲取購物車內容
   */
  async getCart(): Promise<CartSummary> {
    return apiClient.get<CartSummary>(this.cartBaseUrl)
  }

  /**
   * 添加商品到購物車
   */
  async addToCart(data: AddToCartRequest): Promise<CartItem> {
    return apiClient.post<CartItem>(`${this.cartBaseUrl}/items`, data)
  }

  /**
   * 更新購物車項目數量
   */
  async updateCartItem(itemId: string, data: UpdateCartItemRequest): Promise<CartItem> {
    return apiClient.put<CartItem>(`${this.cartBaseUrl}/items/${itemId}`, data)
  }

  /**
   * 從購物車移除項目
   */
  async removeCartItem(itemId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.cartBaseUrl}/items/${itemId}`)
  }

  /**
   * 清空購物車
   */
  async clearCart(): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(this.cartBaseUrl)
  }

  /**
   * 同步購物車 (合併本地和服務器購物車)
   */
  async syncCart(localItems: AddToCartRequest[]): Promise<CartSummary> {
    return apiClient.post<CartSummary>(`${this.cartBaseUrl}/sync`, {
      items: localItems
    })
  }

  // ===================
  // 優惠券 API
  // ===================

  /**
   * 驗證優惠券
   */
  async validateCoupon(data: ApplyCouponRequest): Promise<CouponValidation> {
    return apiClient.post<CouponValidation>('/api/v1/coupons/validate', data)
  }

  /**
   * 應用優惠券到購物車
   */
  async applyCoupon(data: ApplyCouponRequest): Promise<CartSummary> {
    return apiClient.post<CartSummary>(`${this.cartBaseUrl}/coupon`, data)
  }

  /**
   * 移除購物車優惠券
   */
  async removeCoupon(): Promise<CartSummary> {
    return apiClient.delete<CartSummary>(`${this.cartBaseUrl}/coupon`)
  }

  /**
   * 獲取可用優惠券
   */
  async getAvailableCoupons(): Promise<Coupon[]> {
    return apiClient.get<Coupon[]>('/api/v1/coupons/available')
  }

  // ===================
  // 結帳 API
  // ===================

  /**
   * 計算運費
   */
  async calculateShipping(address: Address): Promise<{
    methods: Array<{
      id: string
      name: string
      fee: number
      estimatedDays: number
    }>
  }> {
    return apiClient.post<{
      methods: Array<{
        id: string
        name: string
        fee: number
        estimatedDays: number
      }>
    }>('/api/v1/shipping/calculate', { address })
  }

  /**
   * 創建結帳會話
   */
  async createCheckoutSession(data: CheckoutRequest): Promise<CheckoutSession> {
    return apiClient.post<CheckoutSession>('/api/v1/checkout', data)
  }

  /**
   * 確認訂單
   */
  async confirmOrder(sessionId: string): Promise<Order> {
    return apiClient.post<Order>(`/api/v1/checkout/${sessionId}/confirm`)
  }

  /**
   * 取消結帳會話
   */
  async cancelCheckout(sessionId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/v1/checkout/${sessionId}`)
  }

  // ===================
  // 訂單 API
  // ===================

  /**
   * 獲取用戶訂單列表
   */
  async getOrders(params?: OrderSearchParams): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => searchParams.append(key, String(item)))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
    }

    const url = searchParams.toString() 
      ? `${this.baseUrl}?${searchParams.toString()}`
      : this.baseUrl

    return apiClient.get<PaginatedResponse<Order>>(url)
  }

  /**
   * 獲取訂單詳情
   */
  async getOrder(id: string): Promise<Order> {
    return apiClient.get<Order>(`${this.baseUrl}/${id}`)
  }

  /**
   * 根據訂單號獲取訂單
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    return apiClient.get<Order>(`${this.baseUrl}/number/${orderNumber}`)
  }

  /**
   * 取消訂單
   */
  async cancelOrder(id: string, reason?: string): Promise<Order> {
    return apiClient.post<Order>(`${this.baseUrl}/${id}/cancel`, {
      reason
    })
  }

  /**
   * 確認收貨
   */
  async confirmDelivery(id: string): Promise<Order> {
    return apiClient.post<Order>(`${this.baseUrl}/${id}/confirm-delivery`)
  }

  /**
   * 申請退款
   */
  async requestRefund(id: string, data: {
    reason: string
    amount?: number
    items?: string[]
  }): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/${id}/refund`, data)
  }

  /**
   * 重新下單 (基於已有訂單)
   */
  async reorder(id: string): Promise<CartSummary> {
    return apiClient.post<CartSummary>(`${this.baseUrl}/${id}/reorder`)
  }

  // ===================
  // 訂單追蹤 API
  // ===================

  /**
   * 獲取訂單物流追蹤
   */
  async trackOrder(id: string): Promise<{
    trackingNumber: string
    carrier: string
    status: string
    events: Array<{
      date: string
      status: string
      description: string
      location?: string
    }>
  }> {
    return apiClient.get<{
      trackingNumber: string
      carrier: string
      status: string
      events: Array<{
        date: string
        status: string
        description: string
        location?: string
      }>
    }>(`${this.baseUrl}/${id}/tracking`)
  }

  // ===================
  // 發票 API
  // ===================

  /**
   * 下載訂單發票
   */
  async downloadInvoice(id: string): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/${id}/invoice`, {
      responseType: 'blob'
    })
    return response as unknown as Blob
  }

  // ===================
  // 管理後台 API (需要管理員權限)
  // ===================

  /**
   * 獲取所有訂單 (管理員)
   */
  async getAdminOrders(params?: OrderSearchParams): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => searchParams.append(key, String(item)))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
    }

    const url = searchParams.toString()
      ? `${this.adminBaseUrl}?${searchParams.toString()}`
      : this.adminBaseUrl

    return apiClient.get<PaginatedResponse<Order>>(url)
  }

  /**
   * 更新訂單狀態 (管理員)
   */
  async updateOrderStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<Order> {
    return apiClient.put<Order>(`${this.adminBaseUrl}/${id}/status`, {
      status,
      notes
    })
  }

  /**
   * 更新訂單物流信息 (管理員)
   */
  async updateShippingInfo(
    id: string,
    data: {
      trackingNumber: string
      carrier?: string
      shippedAt?: string
    }
  ): Promise<Order> {
    return apiClient.put<Order>(`${this.adminBaseUrl}/${id}/shipping`, data)
  }

  /**
   * 處理退款 (管理員)
   */
  async processRefund(
    id: string,
    data: {
      amount: number
      reason: string
      method?: string
    }
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.adminBaseUrl}/${id}/process-refund`, data)
  }

  /**
   * 批量更新訂單狀態 (管理員)
   */
  async batchUpdateOrderStatus(
    ids: string[],
    status: string
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.adminBaseUrl}/batch-status`, {
      ids,
      status
    })
  }

  /**
   * 獲取訂單統計 (管理員)
   */
  async getOrderStats(params?: {
    startDate?: string
    endDate?: string
    groupBy?: 'day' | 'week' | 'month'
  }): Promise<{
    totalOrders: number
    totalRevenue: number
    avgOrderValue: number
    ordersByStatus: Record<string, number>
    revenueByDate: Array<{ date: string; revenue: number }>
  }> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const url = searchParams.toString()
      ? `${this.adminBaseUrl}/stats?${searchParams.toString()}`
      : `${this.adminBaseUrl}/stats`

    return apiClient.get<{
      totalOrders: number
      totalRevenue: number
      avgOrderValue: number
      ordersByStatus: Record<string, number>
      revenueByDate: Array<{ date: string; revenue: number }>
    }>(url)
  }
}

// 導出服務實例
export const orderService = new OrderService()