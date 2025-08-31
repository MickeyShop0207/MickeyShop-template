/**
 * 會員模組類型定義
 */

import { Customer, CustomerAddress, CustomerWishlist } from '@/core/database/schema'

// ============ 基本類型 ============
export interface MemberProfile {
  customerId: string
  email: string
  firstName: string
  lastName: string
  displayName?: string
  avatar?: string
  phone?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other'
  marketingOptIn: boolean
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  loyaltyPoints: number
  preferences?: Record<string, any>
  totalSpent: number
  totalOrders: number
  averageOrderValue: number
  lifetimeValue: number
  createdAt: string
  updatedAt: string
}

export interface MemberAddress {
  addressId: string
  type: 'shipping' | 'billing' | 'both'
  label?: string
  recipientName: string
  phone?: string
  country: string
  city: string
  district?: string
  zipCode?: string
  addressLine1: string
  addressLine2?: string
  isDefault: boolean
  isActive: boolean
}

export interface MemberWishlistItem {
  wishlistId: string
  productId: string
  productName?: string
  productImage?: string
  productPrice?: number
  addedAt: string
  notes?: string
  priority: number
}

// ============ API 請求/響應類型 ============
export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  displayName?: string
  phone?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other'
  marketingOptIn?: boolean
  preferences?: Record<string, any>
}

export interface CreateAddressRequest {
  type: 'shipping' | 'billing' | 'both'
  label?: string
  recipientName: string
  phone?: string
  country: string
  city: string
  district?: string
  zipCode?: string
  addressLine1: string
  addressLine2?: string
  isDefault?: boolean
}

export interface UpdateAddressRequest {
  type?: 'shipping' | 'billing' | 'both'
  label?: string
  recipientName?: string
  phone?: string
  country?: string
  city?: string
  district?: string
  zipCode?: string
  addressLine1?: string
  addressLine2?: string
  isDefault?: boolean
  isActive?: boolean
}

export interface AddToWishlistRequest {
  productId: string
  notes?: string
  priority?: number
}

export interface UpdateWishlistItemRequest {
  notes?: string
  priority?: number
}

// ============ 分頁和搜尋類型 ============
export interface MemberSearchParams {
  keyword?: string
  tier?: string
  status?: string
  registrationSource?: string
  dateFrom?: string
  dateTo?: string
  minSpent?: number
  maxSpent?: number
  hasOrders?: boolean
}

export interface AddressSearchParams {
  type?: 'shipping' | 'billing' | 'both'
  city?: string
  isDefault?: boolean
  isActive?: boolean
}

export interface WishlistSearchParams {
  productId?: string
  priority?: number
  dateFrom?: string
  dateTo?: string
}

// ============ 響應類型 ============
export interface MemberProfileResponse {
  profile: MemberProfile
  addresses: MemberAddress[]
  wishlistCount: number
  recentActivity: Array<{
    action: string
    description: string
    createdAt: string
  }>
}

export interface MemberStatsResponse {
  totalMembers: number
  newMembersThisMonth: number
  activeMembers: number
  topSpenders: Array<{
    customerId: string
    displayName: string
    totalSpent: number
    tier: string
  }>
  tierDistribution: Array<{
    tier: string
    count: number
    percentage: number
  }>
}

// ============ 錯誤類型 ============
export interface MemberError {
  code: string
  message: string
  field?: string
}

export const MemberErrorCodes = {
  MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
  INVALID_EMAIL: 'INVALID_EMAIL',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_PHONE: 'INVALID_PHONE',
  ADDRESS_NOT_FOUND: 'ADDRESS_NOT_FOUND',
  WISHLIST_ITEM_NOT_FOUND: 'WISHLIST_ITEM_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_REQUEST: 'INVALID_REQUEST'
} as const

export type MemberErrorCode = typeof MemberErrorCodes[keyof typeof MemberErrorCodes]