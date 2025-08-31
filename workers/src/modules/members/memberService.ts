/**
 * 會員服務層
 * 處理會員相關的業務邏輯
 */

import { eq, and, like, gte, lte, desc, asc, count } from 'drizzle-orm'
import { BaseService, ServiceContext, ServiceResponse, PaginatedResponse, PaginationParams } from '@/shared/services/baseService'
import { 
  customers, 
  customerAddresses, 
  customerWishlists,
  customerActivityLogs,
  NewCustomer,
  NewCustomerAddress,
  NewCustomerWishlist,
  NewCustomerActivityLog
} from '@/core/database/schema'
import {
  MemberProfile,
  MemberAddress,
  MemberWishlistItem,
  UpdateProfileRequest,
  CreateAddressRequest,
  UpdateAddressRequest,
  AddToWishlistRequest,
  MemberSearchParams,
  AddressSearchParams,
  WishlistSearchParams,
  MemberProfileResponse,
  MemberStatsResponse,
  MemberErrorCodes
} from './types'

export class MemberService extends BaseService {
  
  constructor(context: ServiceContext) {
    super(context)
  }

  // ============ 會員資料管理 ============
  
  /**
   * 獲取會員完整資料
   */
  async getMemberProfile(customerId: string): Promise<ServiceResponse<MemberProfileResponse>> {
    try {
      // 獲取會員基本資料
      const [member] = await this.db.select()
        .from(customers)
        .where(and(
          eq(customers.customerId, customerId),
          eq(customers.status, 'active')
        ))

      if (!member) {
        return this.error('會員不存在', [{ 
          code: MemberErrorCodes.MEMBER_NOT_FOUND,
          message: '找不到指定的會員'
        }])
      }

      // 獲取會員地址
      const addresses = await this.db.select()
        .from(customerAddresses)
        .where(and(
          eq(customerAddresses.customerId, customerId),
          eq(customerAddresses.isActive, true)
        ))
        .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt))

      // 獲取願望清單數量
      const [wishlistCount] = await this.db.select({ count: count() })
        .from(customerWishlists)
        .where(eq(customerWishlists.customerId, customerId))

      // 獲取最近活動
      const recentActivity = await this.db.select()
        .from(customerActivityLogs)
        .where(eq(customerActivityLogs.customerId, customerId))
        .orderBy(desc(customerActivityLogs.createdAt))
        .limit(10)

      const profile: MemberProfile = {
        customerId: member.customerId,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        displayName: member.displayName || `${member.firstName} ${member.lastName}`,
        avatar: member.avatar || undefined,
        phone: member.phone || undefined,
        birthDate: member.birthDate || undefined,
        gender: member.gender as 'male' | 'female' | 'other' || undefined,
        marketingOptIn: member.marketingOptIn,
        tier: member.tier as 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond',
        loyaltyPoints: member.loyaltyPoints,
        preferences: member.preferences || {},
        totalSpent: member.totalSpent,
        totalOrders: member.totalOrders,
        averageOrderValue: member.averageOrderValue,
        lifetimeValue: member.lifetimeValue,
        createdAt: member.createdAt!,
        updatedAt: member.updatedAt!
      }

      const memberAddresses: MemberAddress[] = addresses.map(addr => ({
        addressId: addr.addressId,
        type: addr.type as 'shipping' | 'billing' | 'both',
        label: addr.label || undefined,
        recipientName: addr.recipientName,
        phone: addr.phone || undefined,
        country: addr.country,
        city: addr.city,
        district: addr.district || undefined,
        zipCode: addr.zipCode || undefined,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || undefined,
        isDefault: addr.isDefault,
        isActive: addr.isActive
      }))

      const response: MemberProfileResponse = {
        profile,
        addresses: memberAddresses,
        wishlistCount: wishlistCount.count,
        recentActivity: recentActivity.map(activity => ({
          action: activity.action,
          description: activity.description || activity.action,
          createdAt: activity.createdAt!
        }))
      }

      this.logAction('GET_MEMBER_PROFILE', customerId)
      return this.success(response)

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 更新會員資料
   */
  async updateMemberProfile(
    customerId: string, 
    data: UpdateProfileRequest
  ): Promise<ServiceResponse<MemberProfile>> {
    try {
      // 驗證會員存在
      const [existingMember] = await this.db.select()
        .from(customers)
        .where(eq(customers.customerId, customerId))

      if (!existingMember) {
        return this.error('會員不存在', [{ 
          code: MemberErrorCodes.MEMBER_NOT_FOUND,
          message: '找不到指定的會員'
        }])
      }

      // 準備更新數據
      const updateData: Partial<NewCustomer> = {
        updatedAt: new Date().toISOString()
      }

      if (data.firstName) updateData.firstName = data.firstName
      if (data.lastName) updateData.lastName = data.lastName
      if (data.displayName) updateData.displayName = data.displayName
      if (data.phone) updateData.phone = data.phone
      if (data.birthDate) updateData.birthDate = data.birthDate
      if (data.gender) updateData.gender = data.gender
      if (data.marketingOptIn !== undefined) updateData.marketingOptIn = data.marketingOptIn
      if (data.preferences) updateData.preferences = data.preferences

      // 執行更新
      await this.db.update(customers)
        .set(updateData)
        .where(eq(customers.customerId, customerId))

      // 記錄活動日誌
      await this.logMemberActivity(
        customerId,
        'PROFILE_UPDATE',
        'profile',
        'Profile updated',
        JSON.stringify(data)
      )

      // 獲取更新後的資料
      const [updatedMember] = await this.db.select()
        .from(customers)
        .where(eq(customers.customerId, customerId))

      const profile: MemberProfile = {
        customerId: updatedMember.customerId,
        email: updatedMember.email,
        firstName: updatedMember.firstName,
        lastName: updatedMember.lastName,
        displayName: updatedMember.displayName || `${updatedMember.firstName} ${updatedMember.lastName}`,
        avatar: updatedMember.avatar || undefined,
        phone: updatedMember.phone || undefined,
        birthDate: updatedMember.birthDate || undefined,
        gender: updatedMember.gender as 'male' | 'female' | 'other' || undefined,
        marketingOptIn: updatedMember.marketingOptIn,
        tier: updatedMember.tier as 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond',
        loyaltyPoints: updatedMember.loyaltyPoints,
        preferences: updatedMember.preferences || {},
        totalSpent: updatedMember.totalSpent,
        totalOrders: updatedMember.totalOrders,
        averageOrderValue: updatedMember.averageOrderValue,
        lifetimeValue: updatedMember.lifetimeValue,
        createdAt: updatedMember.createdAt!,
        updatedAt: updatedMember.updatedAt!
      }

      this.logAction('UPDATE_MEMBER_PROFILE', customerId, existingMember, updatedMember)
      return this.success(profile, '會員資料更新成功')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  // ============ 地址管理 ============
  
  /**
   * 獲取會員地址列表
   */
  async getMemberAddresses(
    customerId: string,
    params?: AddressSearchParams & PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<MemberAddress>>> {
    try {
      const { page = 1, limit = 10, type, city, isDefault, isActive } = params || {}
      const offset = (page - 1) * limit

      // 建立查詢條件
      const conditions = [
        eq(customerAddresses.customerId, customerId)
      ]

      if (type) conditions.push(eq(customerAddresses.type, type))
      if (city) conditions.push(like(customerAddresses.city, `%${city}%`))
      if (isDefault !== undefined) conditions.push(eq(customerAddresses.isDefault, isDefault))
      if (isActive !== undefined) conditions.push(eq(customerAddresses.isActive, isActive))

      // 獲取總數
      const [totalCount] = await this.db.select({ count: count() })
        .from(customerAddresses)
        .where(and(...conditions))

      // 獲取地址列表
      const addresses = await this.db.select()
        .from(customerAddresses)
        .where(and(...conditions))
        .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt))
        .limit(limit)
        .offset(offset)

      const memberAddresses: MemberAddress[] = addresses.map(addr => ({
        addressId: addr.addressId,
        type: addr.type as 'shipping' | 'billing' | 'both',
        label: addr.label || undefined,
        recipientName: addr.recipientName,
        phone: addr.phone || undefined,
        country: addr.country,
        city: addr.city,
        district: addr.district || undefined,
        zipCode: addr.zipCode || undefined,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || undefined,
        isDefault: addr.isDefault,
        isActive: addr.isActive
      }))

      return this.success(this.paginated(memberAddresses, totalCount.count, page, limit))

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 創建新地址
   */
  async createAddress(
    customerId: string,
    data: CreateAddressRequest
  ): Promise<ServiceResponse<MemberAddress>> {
    try {
      // 驗證會員存在
      const [member] = await this.db.select()
        .from(customers)
        .where(eq(customers.customerId, customerId))

      if (!member) {
        return this.error('會員不存在', [{ 
          code: MemberErrorCodes.MEMBER_NOT_FOUND,
          message: '找不到指定的會員'
        }])
      }

      // 如果設為預設地址，需要先取消其他預設地址
      if (data.isDefault) {
        await this.db.update(customerAddresses)
          .set({ isDefault: false, updatedAt: new Date().toISOString() })
          .where(and(
            eq(customerAddresses.customerId, customerId),
            eq(customerAddresses.type, data.type),
            eq(customerAddresses.isDefault, true)
          ))
      }

      const addressId = this.generateId('addr')
      const newAddress: NewCustomerAddress = {
        addressId,
        customerId,
        type: data.type,
        label: data.label,
        recipientName: data.recipientName,
        phone: data.phone,
        country: data.country,
        city: data.city,
        district: data.district,
        zipCode: data.zipCode,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        isDefault: data.isDefault || false,
        isActive: true
      }

      await this.db.insert(customerAddresses).values(newAddress)

      // 記錄活動日誌
      await this.logMemberActivity(
        customerId,
        'ADDRESS_CREATE',
        'address',
        'New address created',
        JSON.stringify(data)
      )

      const memberAddress: MemberAddress = {
        addressId,
        type: data.type,
        label: data.label,
        recipientName: data.recipientName,
        phone: data.phone,
        country: data.country,
        city: data.city,
        district: data.district,
        zipCode: data.zipCode,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        isDefault: data.isDefault || false,
        isActive: true
      }

      this.logAction('CREATE_ADDRESS', addressId, null, newAddress)
      return this.success(memberAddress, '地址創建成功')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 更新地址
   */
  async updateAddress(
    customerId: string,
    addressId: string,
    data: UpdateAddressRequest
  ): Promise<ServiceResponse<MemberAddress>> {
    try {
      // 驗證地址存在且屬於該會員
      const [existingAddress] = await this.db.select()
        .from(customerAddresses)
        .where(and(
          eq(customerAddresses.addressId, addressId),
          eq(customerAddresses.customerId, customerId)
        ))

      if (!existingAddress) {
        return this.error('地址不存在', [{ 
          code: MemberErrorCodes.ADDRESS_NOT_FOUND,
          message: '找不到指定的地址'
        }])
      }

      // 如果設為預設地址，需要先取消其他預設地址
      if (data.isDefault && data.type) {
        await this.db.update(customerAddresses)
          .set({ isDefault: false, updatedAt: new Date().toISOString() })
          .where(and(
            eq(customerAddresses.customerId, customerId),
            eq(customerAddresses.type, data.type),
            eq(customerAddresses.isDefault, true)
          ))
      }

      // 準備更新數據
      const updateData: Partial<NewCustomerAddress> = {
        updatedAt: new Date().toISOString()
      }

      if (data.type) updateData.type = data.type
      if (data.label !== undefined) updateData.label = data.label
      if (data.recipientName) updateData.recipientName = data.recipientName
      if (data.phone !== undefined) updateData.phone = data.phone
      if (data.country) updateData.country = data.country
      if (data.city) updateData.city = data.city
      if (data.district !== undefined) updateData.district = data.district
      if (data.zipCode !== undefined) updateData.zipCode = data.zipCode
      if (data.addressLine1) updateData.addressLine1 = data.addressLine1
      if (data.addressLine2 !== undefined) updateData.addressLine2 = data.addressLine2
      if (data.isDefault !== undefined) updateData.isDefault = data.isDefault
      if (data.isActive !== undefined) updateData.isActive = data.isActive

      // 執行更新
      await this.db.update(customerAddresses)
        .set(updateData)
        .where(eq(customerAddresses.addressId, addressId))

      // 記錄活動日誌
      await this.logMemberActivity(
        customerId,
        'ADDRESS_UPDATE',
        'address',
        'Address updated',
        JSON.stringify(data)
      )

      // 獲取更新後的地址
      const [updatedAddress] = await this.db.select()
        .from(customerAddresses)
        .where(eq(customerAddresses.addressId, addressId))

      const memberAddress: MemberAddress = {
        addressId: updatedAddress.addressId,
        type: updatedAddress.type as 'shipping' | 'billing' | 'both',
        label: updatedAddress.label || undefined,
        recipientName: updatedAddress.recipientName,
        phone: updatedAddress.phone || undefined,
        country: updatedAddress.country,
        city: updatedAddress.city,
        district: updatedAddress.district || undefined,
        zipCode: updatedAddress.zipCode || undefined,
        addressLine1: updatedAddress.addressLine1,
        addressLine2: updatedAddress.addressLine2 || undefined,
        isDefault: updatedAddress.isDefault,
        isActive: updatedAddress.isActive
      }

      this.logAction('UPDATE_ADDRESS', addressId, existingAddress, updatedAddress)
      return this.success(memberAddress, '地址更新成功')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 刪除地址
   */
  async deleteAddress(customerId: string, addressId: string): Promise<ServiceResponse<void>> {
    try {
      // 驗證地址存在且屬於該會員
      const [existingAddress] = await this.db.select()
        .from(customerAddresses)
        .where(and(
          eq(customerAddresses.addressId, addressId),
          eq(customerAddresses.customerId, customerId)
        ))

      if (!existingAddress) {
        return this.error('地址不存在', [{ 
          code: MemberErrorCodes.ADDRESS_NOT_FOUND,
          message: '找不到指定的地址'
        }])
      }

      // 軟刪除（設為不啟用）
      await this.db.update(customerAddresses)
        .set({ 
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .where(eq(customerAddresses.addressId, addressId))

      // 記錄活動日誌
      await this.logMemberActivity(
        customerId,
        'ADDRESS_DELETE',
        'address',
        'Address deleted',
        addressId
      )

      this.logAction('DELETE_ADDRESS', addressId, existingAddress, null)
      return this.success(undefined, '地址刪除成功')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  // ============ 願望清單管理 ============
  
  /**
   * 獲取會員願望清單
   */
  async getMemberWishlist(
    customerId: string,
    params?: WishlistSearchParams & PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<MemberWishlistItem>>> {
    try {
      const { page = 1, limit = 20, productId, priority, dateFrom, dateTo } = params || {}
      const offset = (page - 1) * limit

      // 建立查詢條件
      const conditions = [
        eq(customerWishlists.customerId, customerId)
      ]

      if (productId) conditions.push(eq(customerWishlists.productId, productId))
      if (priority !== undefined) conditions.push(eq(customerWishlists.priority, priority))
      if (dateFrom) conditions.push(gte(customerWishlists.addedAt, dateFrom))
      if (dateTo) conditions.push(lte(customerWishlists.addedAt, dateTo))

      // 獲取總數
      const [totalCount] = await this.db.select({ count: count() })
        .from(customerWishlists)
        .where(and(...conditions))

      // 獲取願望清單
      const wishlistItems = await this.db.select()
        .from(customerWishlists)
        .where(and(...conditions))
        .orderBy(desc(customerWishlists.priority), desc(customerWishlists.addedAt))
        .limit(limit)
        .offset(offset)

      const memberWishlist: MemberWishlistItem[] = wishlistItems.map(item => ({
        wishlistId: item.wishlistId,
        productId: item.productId,
        addedAt: item.addedAt!,
        notes: item.notes || undefined,
        priority: item.priority
      }))

      return this.success(this.paginated(memberWishlist, totalCount.count, page, limit))

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 添加商品到願望清單
   */
  async addToWishlist(
    customerId: string,
    data: AddToWishlistRequest
  ): Promise<ServiceResponse<MemberWishlistItem>> {
    try {
      // 檢查商品是否已在願望清單中
      const [existingItem] = await this.db.select()
        .from(customerWishlists)
        .where(and(
          eq(customerWishlists.customerId, customerId),
          eq(customerWishlists.productId, data.productId)
        ))

      if (existingItem) {
        return this.error('商品已在願望清單中')
      }

      const wishlistId = this.generateId('wish')
      const newWishlistItem: NewCustomerWishlist = {
        wishlistId,
        customerId,
        productId: data.productId,
        notes: data.notes,
        priority: data.priority || 0
      }

      await this.db.insert(customerWishlists).values(newWishlistItem)

      // 記錄活動日誌
      await this.logMemberActivity(
        customerId,
        'WISHLIST_ADD',
        'product',
        'Product added to wishlist',
        data.productId
      )

      const wishlistItem: MemberWishlistItem = {
        wishlistId,
        productId: data.productId,
        addedAt: new Date().toISOString(),
        notes: data.notes,
        priority: data.priority || 0
      }

      this.logAction('ADD_TO_WISHLIST', wishlistId, null, newWishlistItem)
      return this.success(wishlistItem, '商品已加入願望清單')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 從願望清單移除商品
   */
  async removeFromWishlist(customerId: string, wishlistId: string): Promise<ServiceResponse<void>> {
    try {
      // 驗證願望清單項目存在且屬於該會員
      const [existingItem] = await this.db.select()
        .from(customerWishlists)
        .where(and(
          eq(customerWishlists.wishlistId, wishlistId),
          eq(customerWishlists.customerId, customerId)
        ))

      if (!existingItem) {
        return this.error('願望清單項目不存在', [{ 
          code: MemberErrorCodes.WISHLIST_ITEM_NOT_FOUND,
          message: '找不到指定的願望清單項目'
        }])
      }

      // 刪除項目
      await this.db.delete(customerWishlists)
        .where(eq(customerWishlists.wishlistId, wishlistId))

      // 記錄活動日誌
      await this.logMemberActivity(
        customerId,
        'WISHLIST_REMOVE',
        'product',
        'Product removed from wishlist',
        existingItem.productId
      )

      this.logAction('REMOVE_FROM_WISHLIST', wishlistId, existingItem, null)
      return this.success(undefined, '商品已從願望清單移除')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  // ============ 私有方法 ============
  
  /**
   * 記錄會員活動日誌
   */
  private async logMemberActivity(
    customerId: string,
    action: string,
    category: string,
    description: string,
    metadata?: string
  ): Promise<void> {
    try {
      const activityLog: NewCustomerActivityLog = {
        logId: this.generateId('log'),
        customerId,
        sessionId: this.context?.sessionId,
        action,
        category,
        description,
        metadata: metadata ? { data: metadata } : undefined
      }

      await this.db.insert(customerActivityLogs).values(activityLog)
    } catch (error) {
      // 日誌記錄失敗不應影響主要業務流程
      this.logger.error('Failed to log member activity', { error: error.message, customerId, action })
    }
  }
}