/**
 * 訂單控制器
 * 處理訂單和購物車相關的 HTTP 請求
 */

import type { Context } from 'hono'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { OrderService } from './orderService'
import { validateRequest } from '@/middlewares/validation'
import type {
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderListQuery,
  AddToCartRequest,
  UpdateCartItemRequest,
  OrderListResponse,
  OrderResponse,
  CartResponse,
  OrderError
} from './types'

export class OrderController {
  private orderService: OrderService

  constructor(db: DrizzleD1Database) {
    this.orderService = new OrderService(db)
  }

  // ============ 訂單管理 ============

  /**
   * 創建訂單
   * POST /orders
   */
  async createOrder(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      
      // 獲取當前用戶 ID（需要認證）
      const currentUser = c.get('currentUser')
      if (!currentUser) {
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '需要登入才能創建訂單'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 401)
      }

      const body = await c.req.json()
      
      // 驗證請求資料
      const validationResult = this.validateCreateOrderRequest(body)
      if (!validationResult.valid) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: '請求資料不正確',
            details: validationResult.errors
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 確保 customerId 為當前用戶
      const orderRequest: CreateOrderRequest = {
        ...body,
        customerId: currentUser.customerId
      }

      const order = await this.orderService.createOrder(orderRequest)

      const response: OrderResponse = {
        success: true,
        data: order,
        message: '訂單創建成功',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response, 201)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 獲取訂單詳情
   * GET /orders/:orderId
   */
  async getOrder(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const orderId = c.req.param('orderId')
      const currentUser = c.get('currentUser')

      if (!orderId) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '訂單 ID 不能為空'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      const order = await this.orderService.getOrderById(orderId)

      // 檢查權限（只有訂單所有者或管理員可以查看）
      if (currentUser?.role !== 'admin' && order.customerId !== currentUser?.customerId) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '沒有權限查看此訂單'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 403)
      }

      const response: OrderResponse = {
        success: true,
        data: order,
        message: '獲取訂單詳情成功',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 獲取訂單列表
   * GET /orders
   */
  async getOrders(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const currentUser = c.get('currentUser')

      // 從查詢參數獲取篩選條件
      const query: OrderListQuery = {
        page: parseInt(c.req.query('page') || '1'),
        limit: Math.min(parseInt(c.req.query('limit') || '20'), 100),
        status: c.req.query('status') || undefined,
        paymentStatus: c.req.query('paymentStatus') || undefined,
        shippingStatus: c.req.query('shippingStatus') || undefined,
        orderDateStart: c.req.query('orderDateStart') || undefined,
        orderDateEnd: c.req.query('orderDateEnd') || undefined,
        search: c.req.query('search') || undefined,
        sortBy: (c.req.query('sortBy') as any) || 'orderDate',
        sortOrder: (c.req.query('sortOrder') as any) || 'desc'
      }

      // 如果不是管理員，只能查看自己的訂單
      if (currentUser?.role !== 'admin') {
        query.customerId = currentUser?.customerId
      } else if (c.req.query('customerId')) {
        query.customerId = c.req.query('customerId')
      }

      const { orders, total } = await this.orderService.getOrders(query)

      const response: OrderListResponse = {
        success: true,
        data: {
          orders,
          pagination: {
            page: query.page || 1,
            limit: query.limit || 20,
            total,
            totalPages: Math.ceil(total / (query.limit || 20))
          }
        },
        message: '獲取訂單列表成功',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 更新訂單狀態
   * PATCH /orders/:orderId
   */
  async updateOrder(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const orderId = c.req.param('orderId')
      const currentUser = c.get('currentUser')
      const body = await c.req.json()

      if (!orderId) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '訂單 ID 不能為空'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 只有管理員可以更新訂單狀態
      if (currentUser?.role !== 'admin') {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '沒有權限更新訂單狀態'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 403)
      }

      const updateRequest: UpdateOrderRequest = {
        orderId,
        ...body
      }

      const order = await this.orderService.updateOrder(updateRequest)

      const response: OrderResponse = {
        success: true,
        data: order,
        message: '訂單狀態更新成功',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 取消訂單
   * POST /orders/:orderId/cancel
   */
  async cancelOrder(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const orderId = c.req.param('orderId')
      const currentUser = c.get('currentUser')

      if (!orderId) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '訂單 ID 不能為空'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 檢查訂單所有權
      const order = await this.orderService.getOrderById(orderId)
      if (currentUser?.role !== 'admin' && order.customerId !== currentUser?.customerId) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '沒有權限取消此訂單'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 403)
      }

      // 檢查訂單狀態是否可以取消
      if (order.status !== 'pending' && order.status !== 'processing') {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_ORDER_STATUS',
            message: '訂單狀態不允許取消'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      const updatedOrder = await this.orderService.updateOrder({
        orderId,
        status: 'cancelled'
      })

      const response: OrderResponse = {
        success: true,
        data: updatedOrder,
        message: '訂單取消成功',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  // ============ 購物車管理 ============

  /**
   * 獲取購物車
   * GET /cart
   */
  async getCart(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const currentUser = c.get('currentUser')
      const sessionId = c.req.header('X-Session-ID')
      const cartId = c.req.query('cartId')

      let cart = null

      if (cartId) {
        cart = await this.orderService.getCartById(cartId)
      } else {
        cart = await this.orderService.getCart(
          currentUser?.customerId,
          sessionId,
          undefined
        )
      }

      if (!cart) {
        // 返回空購物車結構
        cart = {
          cartId: '',
          customerId: currentUser?.customerId,
          sessionId,
          status: 'active' as const,
          itemsCount: 0,
          totalAmount: 0,
          couponDiscount: 0,
          lastActivityAt: new Date().toISOString(),
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }

      const response: CartResponse = {
        success: true,
        data: cart,
        message: '獲取購物車成功',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 加入商品到購物車
   * POST /cart/items
   */
  async addToCart(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const currentUser = c.get('currentUser')
      const sessionId = c.req.header('X-Session-ID')
      const body = await c.req.json()

      // 驗證請求資料
      const validationResult = this.validateAddToCartRequest(body)
      if (!validationResult.valid) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: '請求資料不正確',
            details: validationResult.errors
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      const addToCartRequest: AddToCartRequest = body

      const cart = await this.orderService.addToCart(
        addToCartRequest,
        currentUser?.customerId,
        sessionId
      )

      const response: CartResponse = {
        success: true,
        data: cart,
        message: '商品已加入購物車',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 更新購物車項目
   * PUT /cart/items/:itemId
   */
  async updateCartItem(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const itemId = c.req.param('itemId')
      const body = await c.req.json()

      if (!itemId) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '項目 ID 不能為空'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      const updateRequest: UpdateCartItemRequest = {
        itemId,
        quantity: body.quantity
      }

      // 驗證數量
      if (typeof updateRequest.quantity !== 'number' || updateRequest.quantity < 0) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_QUANTITY',
            message: '商品數量必須為非負整數'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      const cart = await this.orderService.updateCartItem(updateRequest)

      const response: CartResponse = {
        success: true,
        data: cart,
        message: '購物車項目更新成功',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 移除購物車項目
   * DELETE /cart/items/:itemId
   */
  async removeCartItem(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const itemId = c.req.param('itemId')

      if (!itemId) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '項目 ID 不能為空'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      const cart = await this.orderService.updateCartItem({
        itemId,
        quantity: 0 // 數量設為 0 表示移除
      })

      const response: CartResponse = {
        success: true,
        data: cart,
        message: '商品已從購物車移除',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 清空購物車
   * DELETE /cart
   */
  async clearCart(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const currentUser = c.get('currentUser')
      const sessionId = c.req.header('X-Session-ID')
      const cartId = c.req.query('cartId')

      let cart = null

      if (cartId) {
        cart = await this.orderService.getCartById(cartId)
      } else {
        cart = await this.orderService.getCart(
          currentUser?.customerId,
          sessionId,
          undefined
        )
      }

      if (!cart) {
        return c.json({
          success: false,
          error: {
            code: 'CART_NOT_FOUND',
            message: '購物車不存在'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 404)
      }

      await this.orderService.clearCart(cart.cartId)

      return c.json({
        success: true,
        message: '購物車已清空',
        timestamp: new Date().toISOString(),
        requestId
      })
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  // ============ 統計功能 ============

  /**
   * 獲取訂單統計
   * GET /orders/stats
   */
  async getOrderStats(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const currentUser = c.get('currentUser')

      const startDate = c.req.query('startDate')
      const endDate = c.req.query('endDate')

      let customerId: string | undefined
      
      // 如果不是管理員，只能查看自己的統計
      if (currentUser?.role !== 'admin') {
        customerId = currentUser?.customerId
      } else if (c.req.query('customerId')) {
        customerId = c.req.query('customerId')
      }

      const stats = await this.orderService.getOrderStats(customerId, startDate, endDate)

      return c.json({
        success: true,
        data: stats,
        message: '獲取訂單統計成功',
        timestamp: new Date().toISOString(),
        requestId
      })
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  // ============ 驗證方法 ============

  private validateCreateOrderRequest(data: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    if (!data.shippingAddress) {
      errors.push('收件地址為必填')
    } else {
      if (!data.shippingAddress.name) errors.push('收件人姓名為必填')
      if (!data.shippingAddress.country) errors.push('收件國家為必填')
      if (!data.shippingAddress.city) errors.push('收件城市為必填')
      if (!data.shippingAddress.addressLine1) errors.push('收件地址為必填')
    }

    if (!data.shipping || !data.shipping.method) {
      errors.push('運送方式為必填')
    }

    if (!data.payment || !data.payment.method) {
      errors.push('付款方式為必填')
    }

    if (!data.cartId && (!data.items || data.items.length === 0)) {
      errors.push('必須提供購物車 ID 或商品項目')
    }

    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any, index: number) => {
        if (!item.productId) errors.push(`商品項目 ${index + 1} 缺少商品 ID`)
        if (!item.quantity || item.quantity <= 0) errors.push(`商品項目 ${index + 1} 數量必須大於 0`)
      })
    }

    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined }
  }

  private validateAddToCartRequest(data: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    if (!data.productId) {
      errors.push('商品 ID 為必填')
    }

    if (!data.quantity || typeof data.quantity !== 'number' || data.quantity <= 0) {
      errors.push('商品數量必須為大於 0 的數字')
    }

    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined }
  }

  // ============ 錯誤處理 ============

  private handleError(c: Context, error: unknown): Response {
    const requestId = c.get('requestId')
    
    if (error && typeof error === 'object' && 'code' in error && 'statusCode' in error) {
      const orderError = error as OrderError
      return c.json({
        success: false,
        error: {
          code: orderError.code,
          message: orderError.message,
          details: orderError.details
        },
        timestamp: new Date().toISOString(),
        requestId
      }, orderError.statusCode)
    }

    // 預設錯誤處理
    console.error('Unexpected error in OrderController:', error)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服務器內部錯誤'
      },
      timestamp: new Date().toISOString(),
      requestId
    }, 500)
  }
}