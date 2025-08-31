/**
 * 會員控制器
 * 處理會員相關的 HTTP 請求
 */

import { Context } from 'hono'
import { BaseController } from '@/shared/services/baseController'
import { createServiceContext } from '@/shared/services/baseService'
import { MemberService } from './memberService'
import {
  UpdateProfileRequest,
  CreateAddressRequest,
  UpdateAddressRequest,
  AddToWishlistRequest,
  UpdateWishlistItemRequest,
  MemberSearchParams,
  AddressSearchParams,
  WishlistSearchParams
} from './types'

export class MemberController extends BaseController {

  /**
   * 獲取當前會員完整資料
   * GET /api/v1/members/profile
   */
  async getProfile(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        sessionId: c.get('sessionId'),
        requestId: this.getRequestId(c)
      })

      const memberService = new MemberService(serviceContext)
      const response = await memberService.getMemberProfile(user.id)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 更新會員資料
   * PUT /api/v1/members/profile
   */
  async updateProfile(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const body = await c.req.json<UpdateProfileRequest>()
      
      // 基本驗證
      if (body.firstName && body.firstName.trim().length === 0) {
        return this.error(c, '姓名不能為空', [], 422)
      }

      if (body.lastName && body.lastName.trim().length === 0) {
        return this.error(c, '姓氏不能為空', [], 422)
      }

      if (body.phone && !/^[\d\-\+\(\)\s]+$/.test(body.phone)) {
        return this.error(c, '電話號碼格式不正確', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        sessionId: c.get('sessionId'),
        requestId: this.getRequestId(c)
      })

      const memberService = new MemberService(serviceContext)
      const response = await memberService.updateMemberProfile(user.id, body)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  // ============ 地址管理 ============

  /**
   * 獲取會員地址列表
   * GET /api/v1/members/addresses
   */
  async getAddresses(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const pagination = this.getPaginationParams(c)
      const searchParams: AddressSearchParams = {
        type: c.req.query('type') as 'shipping' | 'billing' | 'both',
        city: c.req.query('city'),
        isDefault: c.req.query('isDefault') === 'true' ? true : 
                  c.req.query('isDefault') === 'false' ? false : undefined,
        isActive: c.req.query('isActive') === 'true' ? true : 
                 c.req.query('isActive') === 'false' ? false : undefined
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        sessionId: c.get('sessionId'),
        requestId: this.getRequestId(c)
      })

      const memberService = new MemberService(serviceContext)
      const response = await memberService.getMemberAddresses(user.id, {
        ...pagination,
        ...searchParams
      })

      return this.handleServicePaginationResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 創建新地址
   * POST /api/v1/members/addresses
   */
  async createAddress(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const body = await c.req.json<CreateAddressRequest>()
      
      // 驗證必填欄位
      const validation = this.validateRequired(c, body, [
        'type', 'recipientName', 'country', 'city', 'addressLine1'
      ])
      if (validation) return validation

      // 驗證地址類型
      if (!['shipping', 'billing', 'both'].includes(body.type)) {
        return this.error(c, '地址類型無效', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        sessionId: c.get('sessionId'),
        requestId: this.getRequestId(c)
      })

      const memberService = new MemberService(serviceContext)
      const response = await memberService.createAddress(user.id, body)

      return this.handleServiceResponse(c, response, 201)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 更新地址
   * PUT /api/v1/members/addresses/:addressId
   */
  async updateAddress(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const addressId = c.req.param('addressId')
      if (!addressId) {
        return this.error(c, '地址 ID 不能為空', [], 422)
      }

      const body = await c.req.json<UpdateAddressRequest>()

      // 驗證地址類型（如果提供）
      if (body.type && !['shipping', 'billing', 'both'].includes(body.type)) {
        return this.error(c, '地址類型無效', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        sessionId: c.get('sessionId'),
        requestId: this.getRequestId(c)
      })

      const memberService = new MemberService(serviceContext)
      const response = await memberService.updateAddress(user.id, addressId, body)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 刪除地址
   * DELETE /api/v1/members/addresses/:addressId
   */
  async deleteAddress(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const addressId = c.req.param('addressId')
      if (!addressId) {
        return this.error(c, '地址 ID 不能為空', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        sessionId: c.get('sessionId'),
        requestId: this.getRequestId(c)
      })

      const memberService = new MemberService(serviceContext)
      const response = await memberService.deleteAddress(user.id, addressId)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  // ============ 願望清單管理 ============

  /**
   * 獲取會員願望清單
   * GET /api/v1/members/wishlist
   */
  async getWishlist(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const pagination = this.getPaginationParams(c)
      const searchParams: WishlistSearchParams = {
        productId: c.req.query('productId'),
        priority: c.req.query('priority') ? parseInt(c.req.query('priority')!) : undefined,
        dateFrom: c.req.query('dateFrom'),
        dateTo: c.req.query('dateTo')
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        sessionId: c.get('sessionId'),
        requestId: this.getRequestId(c)
      })

      const memberService = new MemberService(serviceContext)
      const response = await memberService.getMemberWishlist(user.id, {
        ...pagination,
        ...searchParams
      })

      return this.handleServicePaginationResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 添加商品到願望清單
   * POST /api/v1/members/wishlist
   */
  async addToWishlist(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const body = await c.req.json<AddToWishlistRequest>()
      
      // 驗證必填欄位
      const validation = this.validateRequired(c, body, ['productId'])
      if (validation) return validation

      // 驗證優先級
      if (body.priority !== undefined && (body.priority < 0 || body.priority > 2)) {
        return this.error(c, '優先級必須在 0-2 之間', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        sessionId: c.get('sessionId'),
        requestId: this.getRequestId(c)
      })

      const memberService = new MemberService(serviceContext)
      const response = await memberService.addToWishlist(user.id, body)

      return this.handleServiceResponse(c, response, 201)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 從願望清單移除商品
   * DELETE /api/v1/members/wishlist/:wishlistId
   */
  async removeFromWishlist(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const wishlistId = c.req.param('wishlistId')
      if (!wishlistId) {
        return this.error(c, '願望清單 ID 不能為空', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        sessionId: c.get('sessionId'),
        requestId: this.getRequestId(c)
      })

      const memberService = new MemberService(serviceContext)
      const response = await memberService.removeFromWishlist(user.id, wishlistId)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 檢查商品是否在願望清單中
   * GET /api/v1/members/wishlist/check/:productId
   */
  async checkWishlist(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const productId = c.req.param('productId')
      if (!productId) {
        return this.error(c, '商品 ID 不能為空', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        sessionId: c.get('sessionId'),
        requestId: this.getRequestId(c)
      })

      const memberService = new MemberService(serviceContext)
      const response = await memberService.getMemberWishlist(user.id, { productId })

      const isInWishlist = response.success && response.data && response.data.data.length > 0

      return this.success(c, { 
        productId, 
        isInWishlist,
        wishlistId: isInWishlist ? response.data.data[0].wishlistId : null
      })
    } catch (error) {
      return this.handleError(c, error)
    }
  }
}