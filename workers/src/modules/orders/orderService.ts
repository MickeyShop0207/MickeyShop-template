/**
 * 訂單服務層
 * 處理訂單和購物車的業務邏輯
 */

import { eq, desc, asc, and, gte, lte, like, sql, or } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { 
  orders, 
  orderItems, 
  shoppingCarts, 
  cartItems,
  type Order as DbOrder,
  type NewOrder,
  type OrderItem as DbOrderItem,
  type NewOrderItem,
  type ShoppingCart as DbShoppingCart,
  type NewShoppingCart,
  type CartItem as DbCartItem,
  type NewCartItem
} from '@/core/database/schema/orders'
import { products } from '@/core/database/schema/products'
import type { 
  Order, 
  OrderItem,
  CreateOrderRequest, 
  UpdateOrderRequest, 
  OrderListQuery,
  ShoppingCart,
  CartItem,
  AddToCartRequest,
  UpdateCartItemRequest,
  OrderStats,
  OrderError
} from './types'

export class OrderService {
  constructor(private db: DrizzleD1Database) {}

  // ============ 訂單管理 ============

  /**
   * 創建新訂單
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const orderNumber = this.generateOrderNumber()

      // 如果從購物車創建訂單，先獲取購物車內容
      let orderItemsData: any[] = []
      let subtotal = 0

      if (request.cartId) {
        const cart = await this.getCartById(request.cartId)
        if (!cart || cart.items.length === 0) {
          throw this.createError('EMPTY_CART', '購物車為空', 400)
        }

        // 從購物車項目創建訂單項目
        orderItemsData = cart.items.map(item => {
          if (!item.product) {
            throw this.createError('PRODUCT_NOT_FOUND', `商品 ${item.productId} 不存在`, 400)
          }
          
          const itemTotal = item.product.price * item.quantity
          subtotal += itemTotal

          return {
            itemId: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderId,
            productId: item.productId,
            variationId: item.variationId,
            productName: item.product.name,
            productSku: item.product.sku,
            productImage: item.product.image,
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: itemTotal,
            attributes: item.product.attributes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } satisfies NewOrderItem
        })
      } else if (request.items) {
        // 從直接提供的項目創建訂單項目
        for (const item of request.items) {
          const product = await this.db
            .select()
            .from(products)
            .where(eq(products.productId, item.productId))
            .get()

          if (!product || product.deletedAt) {
            throw this.createError('PRODUCT_NOT_FOUND', `商品 ${item.productId} 不存在`, 400)
          }

          const itemTotal = product.price * item.quantity
          subtotal += itemTotal

          orderItemsData.push({
            itemId: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderId,
            productId: item.productId,
            variationId: item.variationId,
            productName: product.name,
            productSku: product.sku || '',
            productImage: product.images?.[0],
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: itemTotal,
            attributes: product.attributes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } satisfies NewOrderItem)
        }
      } else {
        throw this.createError('NO_ORDER_ITEMS', '訂單必須包含商品項目', 400)
      }

      // 計算各種費用
      const taxAmount = 0 // TODO: 實現稅額計算
      const shippingAmount = this.calculateShippingFee(request.shipping.method, subtotal)
      const discountAmount = request.couponCode ? await this.calculateDiscount(request.couponCode, subtotal) : 0
      const pointsValue = request.pointsUsed ? request.pointsUsed * 0.01 : 0 // 假設 1 點 = 0.01 元
      const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount - pointsValue

      // 準備訂單資料
      const orderData: NewOrder = {
        orderId,
        orderNumber,
        customerId: request.customerId,
        status: 'pending',
        paymentStatus: 'pending',
        shippingStatus: 'pending',
        
        // 金額資訊
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        paidAmount: 0,
        refundAmount: 0,
        currency: 'TWD',
        
        // 收件地址
        shippingName: request.shippingAddress.name,
        shippingPhone: request.shippingAddress.phone,
        shippingEmail: request.shippingAddress.email,
        shippingCountry: request.shippingAddress.country,
        shippingCity: request.shippingAddress.city,
        shippingDistrict: request.shippingAddress.district,
        shippingZipCode: request.shippingAddress.zipCode,
        shippingAddressLine1: request.shippingAddress.addressLine1,
        shippingAddressLine2: request.shippingAddress.addressLine2,
        
        // 帳單地址（如果提供）
        billingName: request.billingAddress?.name,
        billingPhone: request.billingAddress?.phone,
        billingEmail: request.billingAddress?.email,
        billingCountry: request.billingAddress?.country,
        billingCity: request.billingAddress?.city,
        billingDistrict: request.billingAddress?.district,
        billingZipCode: request.billingAddress?.zipCode,
        billingAddressLine1: request.billingAddress?.addressLine1,
        billingAddressLine2: request.billingAddress?.addressLine2,
        
        // 運送和付款
        shippingMethod: request.shipping.method,
        paymentMethod: request.payment.method,
        
        // 其他資訊
        notes: request.notes,
        source: 'web',
        
        // 優惠券和點數
        couponCode: request.couponCode,
        couponDiscount: discountAmount,
        pointsEarned: Math.floor(totalAmount * 0.01), // 消費金額 1% 回饋點數
        pointsUsed: request.pointsUsed || 0,
        pointsValue,
        
        // 時間戳記
        orderDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 開始資料庫事務
      const result = await this.db.transaction(async (tx) => {
        // 1. 插入訂單
        await tx.insert(orders).values(orderData)

        // 2. 插入訂單項目
        if (orderItemsData.length > 0) {
          await tx.insert(orderItems).values(orderItemsData)
        }

        // 3. 如果從購物車創建，將購物車標記為已轉換
        if (request.cartId) {
          await tx
            .update(shoppingCarts)
            .set({ 
              status: 'converted',
              updatedAt: new Date().toISOString()
            })
            .where(eq(shoppingCarts.cartId, request.cartId))
        }

        // 4. 返回完整訂單資料
        return await tx
          .select()
          .from(orders)
          .where(eq(orders.orderId, orderId))
          .get()
      })

      if (!result) {
        throw this.createError('ORDER_CREATION_FAILED', '訂單創建失敗', 500)
      }

      // 獲取完整訂單資料（包含項目）
      return await this.getOrderById(orderId)
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError('ORDER_CREATION_ERROR', error instanceof Error ? error.message : '創建訂單時發生錯誤', 500)
    }
  }

  /**
   * 根據 ID 獲取訂單
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      // 獲取訂單基本資料
      const order = await this.db
        .select()
        .from(orders)
        .where(and(eq(orders.orderId, orderId), eq(orders.deletedAt, null)))
        .get()

      if (!order) {
        throw this.createError('ORDER_NOT_FOUND', '訂單不存在', 404)
      }

      // 獲取訂單項目
      const items = await this.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))
        .all()

      return this.transformDbOrderToOrder(order, items)
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError('GET_ORDER_ERROR', error instanceof Error ? error.message : '獲取訂單時發生錯誤', 500)
    }
  }

  /**
   * 獲取訂單列表
   */
  async getOrders(query: OrderListQuery): Promise<{ orders: Order[], total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        shippingStatus,
        customerId,
        orderDateStart,
        orderDateEnd,
        search,
        sortBy = 'orderDate',
        sortOrder = 'desc'
      } = query

      const offset = (page - 1) * limit

      // 建立查詢條件
      const conditions = [eq(orders.deletedAt, null)]

      if (status) conditions.push(eq(orders.status, status))
      if (paymentStatus) conditions.push(eq(orders.paymentStatus, paymentStatus))
      if (shippingStatus) conditions.push(eq(orders.shippingStatus, shippingStatus))
      if (customerId) conditions.push(eq(orders.customerId, customerId))
      if (orderDateStart) conditions.push(gte(orders.orderDate, orderDateStart))
      if (orderDateEnd) conditions.push(lte(orders.orderDate, orderDateEnd))
      if (search) {
        conditions.push(
          or(
            like(orders.orderNumber, `%${search}%`),
            like(orders.shippingName, `%${search}%`),
            like(orders.shippingEmail, `%${search}%`)
          )
        )
      }

      // 排序條件
      const orderByColumn = sortBy === 'orderDate' ? orders.orderDate : 
                          sortBy === 'totalAmount' ? orders.totalAmount :
                          orders.status
      const orderDirection = sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn)

      // 獲取訂單列表
      const orderList = await this.db
        .select()
        .from(orders)
        .where(and(...conditions))
        .orderBy(orderDirection)
        .limit(limit)
        .offset(offset)
        .all()

      // 獲取總數
      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(...conditions))
        .all()

      // 為每個訂單獲取項目
      const ordersWithItems = await Promise.all(
        orderList.map(async (order) => {
          const items = await this.db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.orderId))
            .all()

          return this.transformDbOrderToOrder(order, items)
        })
      )

      return {
        orders: ordersWithItems,
        total: count
      }
    } catch (error) {
      throw this.createError('GET_ORDERS_ERROR', error instanceof Error ? error.message : '獲取訂單列表時發生錯誤', 500)
    }
  }

  /**
   * 更新訂單狀態
   */
  async updateOrder(request: UpdateOrderRequest): Promise<Order> {
    try {
      const updateData: any = {
        updatedAt: new Date().toISOString()
      }

      if (request.status) {
        updateData.status = request.status
        // 根據狀態更新相關時間戳記
        if (request.status === 'cancelled') {
          updateData.cancelledAt = new Date().toISOString()
        }
      }

      if (request.paymentStatus) {
        updateData.paymentStatus = request.paymentStatus
        if (request.paymentStatus === 'paid') {
          updateData.paidAt = new Date().toISOString()
        } else if (request.paymentStatus === 'refunded') {
          updateData.refundedAt = new Date().toISOString()
        }
      }

      if (request.shippingStatus) {
        updateData.shippingStatus = request.shippingStatus
        if (request.shippingStatus === 'shipped') {
          updateData.shippedAt = new Date().toISOString()
        } else if (request.shippingStatus === 'delivered') {
          updateData.deliveredAt = new Date().toISOString()
        }
      }

      if (request.trackingNumber) updateData.trackingNumber = request.trackingNumber
      if (request.carrierName) updateData.carrierName = request.carrierName
      if (request.internalNotes) updateData.internalNotes = request.internalNotes

      // 更新訂單
      const result = await this.db
        .update(orders)
        .set(updateData)
        .where(eq(orders.orderId, request.orderId))
        .returning()
        .get()

      if (!result) {
        throw this.createError('ORDER_NOT_FOUND', '訂單不存在', 404)
      }

      return await this.getOrderById(request.orderId)
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError('UPDATE_ORDER_ERROR', error instanceof Error ? error.message : '更新訂單時發生錯誤', 500)
    }
  }

  // ============ 購物車管理 ============

  /**
   * 獲取購物車
   */
  async getCart(customerId?: string, sessionId?: string, cartId?: string): Promise<ShoppingCart | null> {
    try {
      let cart: DbShoppingCart | undefined

      if (cartId) {
        cart = await this.db
          .select()
          .from(shoppingCarts)
          .where(eq(shoppingCarts.cartId, cartId))
          .get()
      } else if (customerId) {
        cart = await this.db
          .select()
          .from(shoppingCarts)
          .where(and(
            eq(shoppingCarts.customerId, customerId),
            eq(shoppingCarts.status, 'active')
          ))
          .get()
      } else if (sessionId) {
        cart = await this.db
          .select()
          .from(shoppingCarts)
          .where(and(
            eq(shoppingCarts.sessionId, sessionId),
            eq(shoppingCarts.status, 'active')
          ))
          .get()
      }

      if (!cart) return null

      // 獲取購物車項目及商品資訊
      const items = await this.db
        .select({
          itemId: cartItems.itemId,
          cartId: cartItems.cartId,
          productId: cartItems.productId,
          variationId: cartItems.variationId,
          quantity: cartItems.quantity,
          addedAt: cartItems.addedAt,
          productName: products.name,
          productSku: products.sku,
          productPrice: products.price,
          productImage: products.images,
          productAttributes: products.attributes
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.productId))
        .where(and(
          eq(cartItems.cartId, cart.cartId),
          eq(products.deletedAt, null)
        ))
        .all()

      return this.transformDbCartToCart(cart, items)
    } catch (error) {
      throw this.createError('GET_CART_ERROR', error instanceof Error ? error.message : '獲取購物車時發生錯誤', 500)
    }
  }

  /**
   * 根據 ID 獲取購物車
   */
  async getCartById(cartId: string): Promise<ShoppingCart | null> {
    return await this.getCart(undefined, undefined, cartId)
  }

  /**
   * 加入商品到購物車
   */
  async addToCart(request: AddToCartRequest, customerId?: string, sessionId?: string): Promise<ShoppingCart> {
    try {
      // 驗證商品存在
      const product = await this.db
        .select()
        .from(products)
        .where(eq(products.productId, request.productId))
        .get()

      if (!product || product.deletedAt) {
        throw this.createError('PRODUCT_NOT_FOUND', '商品不存在', 404)
      }

      // 獲取或創建購物車
      let cart = await this.getCart(customerId, sessionId, request.cartId)

      if (!cart) {
        const cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const cartData: NewShoppingCart = {
          cartId,
          customerId,
          sessionId,
          status: 'active',
          itemsCount: 0,
          totalAmount: 0,
          couponDiscount: 0,
          lastActivityAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        await this.db.insert(shoppingCarts).values(cartData)
        cart = await this.getCartById(cartId)
        if (!cart) throw this.createError('CART_CREATION_FAILED', '購物車創建失敗', 500)
      }

      // 檢查商品是否已在購物車中
      const existingItem = cart.items.find(item => 
        item.productId === request.productId && 
        item.variationId === request.variationId
      )

      if (existingItem) {
        // 更新數量
        const newQuantity = existingItem.quantity + request.quantity
        await this.db
          .update(cartItems)
          .set({ 
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
          })
          .where(eq(cartItems.itemId, existingItem.itemId))
      } else {
        // 新增項目
        const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const itemData: NewCartItem = {
          itemId,
          cartId: cart.cartId,
          productId: request.productId,
          variationId: request.variationId,
          quantity: request.quantity,
          addedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        await this.db.insert(cartItems).values(itemData)
      }

      // 更新購物車統計
      await this.updateCartSummary(cart.cartId)

      return await this.getCartById(cart.cartId) || cart
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError('ADD_TO_CART_ERROR', error instanceof Error ? error.message : '加入購物車時發生錯誤', 500)
    }
  }

  /**
   * 更新購物車項目
   */
  async updateCartItem(request: UpdateCartItemRequest): Promise<ShoppingCart> {
    try {
      if (request.quantity <= 0) {
        // 移除項目
        await this.db
          .delete(cartItems)
          .where(eq(cartItems.itemId, request.itemId))
      } else {
        // 更新數量
        await this.db
          .update(cartItems)
          .set({ 
            quantity: request.quantity,
            updatedAt: new Date().toISOString()
          })
          .where(eq(cartItems.itemId, request.itemId))
      }

      // 獲取購物車 ID
      const item = await this.db
        .select({ cartId: cartItems.cartId })
        .from(cartItems)
        .where(eq(cartItems.itemId, request.itemId))
        .get()

      if (!item) {
        throw this.createError('CART_ITEM_NOT_FOUND', '購物車項目不存在', 404)
      }

      // 更新購物車統計
      await this.updateCartSummary(item.cartId)

      const cart = await this.getCartById(item.cartId)
      if (!cart) {
        throw this.createError('CART_NOT_FOUND', '購物車不存在', 404)
      }

      return cart
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError('UPDATE_CART_ERROR', error instanceof Error ? error.message : '更新購物車時發生錯誤', 500)
    }
  }

  /**
   * 清空購物車
   */
  async clearCart(cartId: string): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        // 刪除所有購物車項目
        await tx.delete(cartItems).where(eq(cartItems.cartId, cartId))

        // 更新購物車狀態
        await tx
          .update(shoppingCarts)
          .set({
            itemsCount: 0,
            totalAmount: 0,
            lastActivityAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .where(eq(shoppingCarts.cartId, cartId))
      })
    } catch (error) {
      throw this.createError('CLEAR_CART_ERROR', error instanceof Error ? error.message : '清空購物車時發生錯誤', 500)
    }
  }

  // ============ 統計功能 ============

  /**
   * 獲取訂單統計
   */
  async getOrderStats(customerId?: string, startDate?: string, endDate?: string): Promise<OrderStats> {
    try {
      const conditions = [eq(orders.deletedAt, null)]
      
      if (customerId) conditions.push(eq(orders.customerId, customerId))
      if (startDate) conditions.push(gte(orders.orderDate, startDate))
      if (endDate) conditions.push(lte(orders.orderDate, endDate))

      // 基本統計
      const [stats] = await this.db
        .select({
          totalOrders: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${orders.totalAmount})`,
          averageOrderValue: sql<number>`avg(${orders.totalAmount})`
        })
        .from(orders)
        .where(and(...conditions))
        .all()

      // 各狀態訂單數量
      const statusStats = await this.db
        .select({
          status: orders.status,
          count: sql<number>`count(*)`
        })
        .from(orders)
        .where(and(...conditions))
        .groupBy(orders.status)
        .all()

      const ordersByStatus = statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat.count
        return acc
      }, {} as Record<string, number>)

      // 按月營收統計
      const monthlyStats = await this.db
        .select({
          month: sql<string>`strftime('%Y-%m', ${orders.orderDate})`,
          revenue: sql<number>`sum(${orders.totalAmount})`,
          orders: sql<number>`count(*)`
        })
        .from(orders)
        .where(and(...conditions))
        .groupBy(sql`strftime('%Y-%m', ${orders.orderDate})`)
        .orderBy(sql`strftime('%Y-%m', ${orders.orderDate})`)
        .all()

      return {
        totalOrders: stats.totalOrders || 0,
        totalRevenue: stats.totalRevenue || 0,
        averageOrderValue: stats.averageOrderValue || 0,
        ordersByStatus,
        revenueByMonth: monthlyStats
      }
    } catch (error) {
      throw this.createError('GET_STATS_ERROR', error instanceof Error ? error.message : '獲取統計資料時發生錯誤', 500)
    }
  }

  // ============ 輔助方法 ============

  /**
   * 生成訂單編號
   */
  private generateOrderNumber(): string {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const random = Math.random().toString(36).substr(2, 6).toUpperCase()
    return `MS${year}${month}${day}${random}`
  }

  /**
   * 計算運費
   */
  private calculateShippingFee(method: string, subtotal: number): number {
    // 簡化的運費計算邏輯
    if (subtotal >= 1000) return 0 // 滿千免運
    
    switch (method) {
      case 'standard':
        return 60
      case 'express':
        return 120
      case 'same_day':
        return 200
      default:
        return 60
    }
  }

  /**
   * 計算優惠券折扣
   */
  private async calculateDiscount(couponCode: string, subtotal: number): Promise<number> {
    // TODO: 實現優惠券邏輯
    // 這裡僅為示例
    return 0
  }

  /**
   * 更新購物車統計
   */
  private async updateCartSummary(cartId: string): Promise<void> {
    const result = await this.db
      .select({
        itemsCount: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${products.price} * ${cartItems.quantity})`
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.productId))
      .where(and(
        eq(cartItems.cartId, cartId),
        eq(products.deletedAt, null)
      ))
      .get()

    await this.db
      .update(shoppingCarts)
      .set({
        itemsCount: result?.itemsCount || 0,
        totalAmount: result?.totalAmount || 0,
        lastActivityAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(shoppingCarts.cartId, cartId))
  }

  /**
   * 轉換資料庫訂單為 API 格式
   */
  private transformDbOrderToOrder(order: DbOrder, items: DbOrderItem[]): Order {
    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      status: order.status as any,
      paymentStatus: order.paymentStatus as any,
      shippingStatus: order.shippingStatus as any,
      
      // 金額資訊
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      paidAmount: order.paidAmount,
      refundAmount: order.refundAmount,
      currency: order.currency,
      
      // 地址資訊
      shippingAddress: {
        name: order.shippingName,
        phone: order.shippingPhone || undefined,
        email: order.shippingEmail || undefined,
        country: order.shippingCountry,
        city: order.shippingCity,
        district: order.shippingDistrict || undefined,
        zipCode: order.shippingZipCode || undefined,
        addressLine1: order.shippingAddressLine1,
        addressLine2: order.shippingAddressLine2 || undefined
      },
      billingAddress: order.billingName ? {
        name: order.billingName,
        phone: order.billingPhone || undefined,
        email: order.billingEmail || undefined,
        country: order.billingCountry!,
        city: order.billingCity!,
        district: order.billingDistrict || undefined,
        zipCode: order.billingZipCode || undefined,
        addressLine1: order.billingAddressLine1!,
        addressLine2: order.billingAddressLine2 || undefined
      } : undefined,
      
      // 運送和付款資訊
      shipping: {
        method: order.shippingMethod || undefined,
        trackingNumber: order.trackingNumber || undefined,
        carrierName: order.carrierName || undefined,
        status: order.shippingStatus as any
      },
      payment: {
        method: order.paymentMethod!,
        reference: order.paymentReference || undefined,
        status: order.paymentStatus as any
      },
      
      // 其他資訊
      notes: order.notes || undefined,
      internalNotes: order.internalNotes || undefined,
      source: order.source!,
      
      // 優惠券和點數
      couponCode: order.couponCode || undefined,
      couponDiscount: order.couponDiscount,
      pointsEarned: order.pointsEarned,
      pointsUsed: order.pointsUsed,
      pointsValue: order.pointsValue,
      
      // 時間戳記
      orderDate: order.orderDate!,
      paidAt: order.paidAt || undefined,
      shippedAt: order.shippedAt || undefined,
      deliveredAt: order.deliveredAt || undefined,
      cancelledAt: order.cancelledAt || undefined,
      refundedAt: order.refundedAt || undefined,
      
      // 訂單項目
      items: items.map(item => ({
        itemId: item.itemId,
        productId: item.productId,
        variationId: item.variationId || undefined,
        productName: item.productName,
        productSku: item.productSku,
        productImage: item.productImage || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        attributes: item.attributes ? JSON.parse(item.attributes as string) : undefined
      })),
      
      // 系統欄位
      metadata: order.metadata ? JSON.parse(order.metadata as string) : undefined,
      createdAt: order.createdAt!,
      updatedAt: order.updatedAt!
    }
  }

  /**
   * 轉換資料庫購物車為 API 格式
   */
  private transformDbCartToCart(cart: DbShoppingCart, items: any[]): ShoppingCart {
    return {
      cartId: cart.cartId,
      customerId: cart.customerId || undefined,
      sessionId: cart.sessionId || undefined,
      status: cart.status as any,
      itemsCount: cart.itemsCount,
      totalAmount: cart.totalAmount,
      couponCode: cart.couponCode || undefined,
      couponDiscount: cart.couponDiscount,
      lastActivityAt: cart.lastActivityAt!,
      expiresAt: cart.expiresAt || undefined,
      items: items.map(item => ({
        itemId: item.itemId,
        cartId: item.cartId,
        productId: item.productId,
        variationId: item.variationId || undefined,
        quantity: item.quantity,
        addedAt: item.addedAt,
        product: {
          name: item.productName,
          sku: item.productSku || '',
          price: item.productPrice,
          image: Array.isArray(item.productImage) ? item.productImage[0] : item.productImage,
          attributes: item.productAttributes ? JSON.parse(item.productAttributes as string) : undefined
        }
      })),
      metadata: cart.metadata ? JSON.parse(cart.metadata as string) : undefined,
      createdAt: cart.createdAt!,
      updatedAt: cart.updatedAt!
    }
  }

  /**
   * 創建錯誤對象
   */
  private createError(code: string, message: string, statusCode: number): OrderError {
    const error = new Error(message) as OrderError
    error.code = code
    error.statusCode = statusCode
    return error
  }
}