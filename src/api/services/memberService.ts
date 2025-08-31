// 會員 API 服務
import { apiClient } from '../index'
import type { 
  User,
  MemberAddress,
  WishlistItem,
  PaginatedResponse 
} from '../types'

// 會員地址相關類型
export interface CreateAddressRequest {
  type: 'shipping' | 'billing'
  isDefault?: boolean
  recipientName: string
  phone: string
  countryCode: string
  state: string
  city: string
  district: string
  address: string
  postalCode: string
  notes?: string
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}

// 會員資料更新請求
export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other'
  marketingOptIn?: boolean
}

// 願望清單項目添加請求
export interface AddToWishlistRequest {
  productId: string
  variantId?: string
}

// 會員統計信息
export interface MemberStats {
  totalOrders: number
  totalSpent: number
  loyaltyPoints: number
  nextTierPoints: number
  nextTier: string
  memberSince: string
  lastOrderDate?: string
  favoriteCategories: Array<{
    categoryId: string
    categoryName: string
    orderCount: number
  }>
}

export class MemberService {
  private readonly baseUrl = '/api/v1/members'
  private readonly adminBaseUrl = '/api/admin/v1/members'

  // ===================
  // 會員資料 API
  // ===================

  /**
   * 獲取會員資料
   */
  async getProfile(): Promise<User> {
    return apiClient.get<User>(`${this.baseUrl}/profile`)
  }

  /**
   * 更新會員資料
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return apiClient.put<User>(`${this.baseUrl}/profile`, data)
  }

  /**
   * 上傳頭像
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    return apiClient.upload<{ avatarUrl: string }>(`${this.baseUrl}/avatar`, file)
  }

  /**
   * 獲取會員統計信息
   */
  async getStats(): Promise<MemberStats> {
    return apiClient.get<MemberStats>(`${this.baseUrl}/stats`)
  }

  /**
   * 獲取會員等級規則
   */
  async getTierRules(): Promise<{
    tiers: Array<{
      name: string
      nameEn: string
      minSpent: number
      benefits: string[]
      loyaltyPointRate: number
      discountRate: number
    }>
  }> {
    return apiClient.get<{
      tiers: Array<{
        name: string
        nameEn: string
        minSpent: number
        benefits: string[]
        loyaltyPointRate: number
        discountRate: number
      }>
    }>('/api/v1/member-tiers')
  }

  // ===================
  // 會員地址 API
  // ===================

  /**
   * 獲取會員地址列表
   */
  async getAddresses(): Promise<MemberAddress[]> {
    return apiClient.get<MemberAddress[]>(`${this.baseUrl}/addresses`)
  }

  /**
   * 獲取地址詳情
   */
  async getAddress(id: string): Promise<MemberAddress> {
    return apiClient.get<MemberAddress>(`${this.baseUrl}/addresses/${id}`)
  }

  /**
   * 創建新地址
   */
  async createAddress(data: CreateAddressRequest): Promise<MemberAddress> {
    return apiClient.post<MemberAddress>(`${this.baseUrl}/addresses`, data)
  }

  /**
   * 更新地址
   */
  async updateAddress(id: string, data: UpdateAddressRequest): Promise<MemberAddress> {
    return apiClient.put<MemberAddress>(`${this.baseUrl}/addresses/${id}`, data)
  }

  /**
   * 刪除地址
   */
  async deleteAddress(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.baseUrl}/addresses/${id}`)
  }

  /**
   * 設為默認地址
   */
  async setDefaultAddress(id: string): Promise<MemberAddress> {
    return apiClient.post<MemberAddress>(`${this.baseUrl}/addresses/${id}/default`)
  }

  /**
   * 獲取默認地址
   */
  async getDefaultAddress(type?: 'shipping' | 'billing'): Promise<MemberAddress | null> {
    const params = type ? { type } : {}
    return apiClient.get<MemberAddress | null>(`${this.baseUrl}/addresses/default`, { params })
  }

  // ===================
  // 願望清單 API
  // ===================

  /**
   * 獲取願望清單
   */
  async getWishlist(params?: {
    page?: number
    limit?: number
    sort?: string
  }): Promise<PaginatedResponse<WishlistItem>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const url = searchParams.toString()
      ? `${this.baseUrl}/wishlist?${searchParams.toString()}`
      : `${this.baseUrl}/wishlist`

    return apiClient.get<PaginatedResponse<WishlistItem>>(url)
  }

  /**
   * 添加到願望清單
   */
  async addToWishlist(data: AddToWishlistRequest): Promise<WishlistItem> {
    return apiClient.post<WishlistItem>(`${this.baseUrl}/wishlist`, data)
  }

  /**
   * 從願望清單移除
   */
  async removeFromWishlist(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.baseUrl}/wishlist/${id}`)
  }

  /**
   * 檢查商品是否在願望清單中
   */
  async isInWishlist(productId: string, variantId?: string): Promise<{ inWishlist: boolean }> {
    const params = new URLSearchParams({ productId })
    if (variantId) {
      params.append('variantId', variantId)
    }
    
    return apiClient.get<{ inWishlist: boolean }>(`${this.baseUrl}/wishlist/check?${params.toString()}`)
  }

  /**
   * 清空願望清單
   */
  async clearWishlist(): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.baseUrl}/wishlist`)
  }

  /**
   * 批量添加到購物車 (從願望清單)
   */
  async addWishlistToCart(items: Array<{ wishlistItemId: string; quantity?: number }>): Promise<{
    addedItems: number
    failedItems: number
    message: string
  }> {
    return apiClient.post<{
      addedItems: number
      failedItems: number
      message: string
    }>(`${this.baseUrl}/wishlist/add-to-cart`, { items })
  }

  // ===================
  // 忠誠度積分 API
  // ===================

  /**
   * 獲取積分歷史
   */
  async getPointsHistory(params?: {
    type?: 'earn' | 'spend'
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<{
    id: string
    type: 'earn' | 'spend'
    points: number
    reason: string
    orderId?: string
    createdAt: string
  }>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const url = searchParams.toString()
      ? `${this.baseUrl}/points/history?${searchParams.toString()}`
      : `${this.baseUrl}/points/history`

    return apiClient.get<PaginatedResponse<{
      id: string
      type: 'earn' | 'spend'
      points: number
      reason: string
      orderId?: string
      createdAt: string
    }>>(url)
  }

  /**
   * 兌換積分優惠券
   */
  async redeemPointsForCoupon(couponId: string, points: number): Promise<{
    coupon: {
      id: string
      code: string
      type: string
      value: number
      expiresAt: string
    }
    remainingPoints: number
  }> {
    return apiClient.post<{
      coupon: {
        id: string
        code: string
        type: string
        value: number
        expiresAt: string
      }
      remainingPoints: number
    }>(`${this.baseUrl}/points/redeem`, {
      couponId,
      points
    })
  }

  /**
   * 獲取可兌換的積分獎品
   */
  async getRedeemableRewards(): Promise<Array<{
    id: string
    name: string
    description: string
    pointsRequired: number
    image?: string
    type: 'coupon' | 'gift' | 'discount'
    isAvailable: boolean
  }>> {
    return apiClient.get<Array<{
      id: string
      name: string
      description: string
      pointsRequired: number
      image?: string
      type: 'coupon' | 'gift' | 'discount'
      isAvailable: boolean
    }>>(`${this.baseUrl}/points/rewards`)
  }

  // ===================
  // 會員通知 API
  // ===================

  /**
   * 獲取通知列表
   */
  async getNotifications(params?: {
    type?: 'order' | 'promotion' | 'system'
    isRead?: boolean
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<{
    id: string
    type: 'order' | 'promotion' | 'system'
    title: string
    content: string
    isRead: boolean
    actionUrl?: string
    createdAt: string
  }>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const url = searchParams.toString()
      ? `${this.baseUrl}/notifications?${searchParams.toString()}`
      : `${this.baseUrl}/notifications`

    return apiClient.get<PaginatedResponse<{
      id: string
      type: 'order' | 'promotion' | 'system'
      title: string
      content: string
      isRead: boolean
      actionUrl?: string
      createdAt: string
    }>>(url)
  }

  /**
   * 標記通知為已讀
   */
  async markNotificationRead(id: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/notifications/${id}/read`)
  }

  /**
   * 批量標記通知為已讀
   */
  async markAllNotificationsRead(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/notifications/read-all`)
  }

  /**
   * 獲取未讀通知數量
   */
  async getUnreadNotificationCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>(`${this.baseUrl}/notifications/unread-count`)
  }

  // ===================
  // 管理後台 API (需要管理員權限)
  // ===================

  /**
   * 獲取會員列表 (管理員)
   */
  async getAdminMembers(params?: {
    search?: string
    tier?: string
    isActive?: boolean
    sort?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const url = searchParams.toString()
      ? `${this.adminBaseUrl}?${searchParams.toString()}`
      : this.adminBaseUrl

    return apiClient.get<PaginatedResponse<User>>(url)
  }

  /**
   * 獲取會員詳情 (管理員)
   */
  async getAdminMemberDetail(id: string): Promise<User & MemberStats> {
    return apiClient.get<User & MemberStats>(`${this.adminBaseUrl}/${id}`)
  }

  /**
   * 更新會員狀態 (管理員)
   */
  async updateMemberStatus(id: string, isActive: boolean): Promise<User> {
    return apiClient.put<User>(`${this.adminBaseUrl}/${id}/status`, { isActive })
  }

  /**
   * 調整會員積分 (管理員)
   */
  async adjustMemberPoints(
    id: string, 
    data: { points: number; reason: string; type: 'earn' | 'spend' }
  ): Promise<{ newBalance: number }> {
    return apiClient.post<{ newBalance: number }>(`${this.adminBaseUrl}/${id}/points`, data)
  }

  /**
   * 獲取會員統計 (管理員)
   */
  async getAdminMemberStats(): Promise<{
    totalMembers: number
    activeMembers: number
    newMembersThisMonth: number
    membersByTier: Record<string, number>
    avgOrderValue: number
    memberGrowth: Array<{ date: string; count: number }>
  }> {
    return apiClient.get<{
      totalMembers: number
      activeMembers: number
      newMembersThisMonth: number
      membersByTier: Record<string, number>
      avgOrderValue: number
      memberGrowth: Array<{ date: string; count: number }>
    }>(`${this.adminBaseUrl}/stats`)
  }
}

// 導出服務實例
export const memberService = new MemberService()