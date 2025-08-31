/**
 * 購物車服務
 * 處理購物車相關的業務邏輯
 */

import { eq, and, desc, count, sql, isNull } from 'drizzle-orm'
import { BaseService, ServiceContext, ServiceResponse } from '@/shared/services/baseService'
import { 
  shoppingCarts, 
  cartItems,
  products,
  productVariations,
  NewShoppingCart,
  NewCartItem
} from '@/core/database/schema'
import {
  CartInfo,
  CartItemInfo,
  CartDetailResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
  ApplyCouponRequest,
  OrderErrorCodes
} from './types'

export class CartService extends BaseService {
  
  constructor(context: ServiceContext) {
    super(context)
  }

  /**
   * 獲取或創建購物車
   */
  async getOrCreateCart(customerId?: string, sessionId?: string): Promise<ServiceResponse<CartInfo>> {
    try {
      // 查找現有購物車
      let existingCart = null
      
      if (customerId) {
        [existingCart] = await this.db.select()
          .from(shoppingCarts)
          .where(and(
            eq(shoppingCarts.customerId, customerId),
            eq(shoppingCarts.status, 'active')
          ))
          .orderBy(desc(shoppingCarts.lastActivityAt))
          .limit(1)
      } else if (sessionId) {
        [existingCart] = await this.db.select()
          .from(shoppingCarts)
          .where(and(
            eq(shoppingCarts.sessionId, sessionId),
            eq(shoppingCarts.status, 'active')
          ))
          .orderBy(desc(shoppingCarts.lastActivityAt))
          .limit(1)
      }

      // 如果找到現有購物車，返回它
      if (existingCart) {
        const cartInfo: CartInfo = {
          cartId: existingCart.cartId,
          customerId: existingCart.customerId || undefined,
          sessionId: existingCart.sessionId || undefined,
          status: existingCart.status as 'active' | 'abandoned' | 'converted' | 'expired',
          itemsCount: existingCart.itemsCount,
          totalAmount: existingCart.totalAmount,
          couponCode: existingCart.couponCode || undefined,
          couponDiscount: existingCart.couponDiscount,
          lastActivityAt: existingCart.lastActivityAt!,
          expiresAt: existingCart.expiresAt || undefined,
          createdAt: existingCart.createdAt!,
          updatedAt: existingCart.updatedAt!
        }

        return this.success(cartInfo)
      }

      // 創建新購物車
      const cartId = this.generateId('cart')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天後過期

      const newCart: NewShoppingCart = {
        cartId,
        customerId,
        sessionId,
        status: 'active',
        itemsCount: 0,
        totalAmount: 0,
        couponDiscount: 0,
        expiresAt
      }

      await this.db.insert(shoppingCarts).values(newCart)

      const cartInfo: CartInfo = {
        cartId,
        customerId,
        sessionId,
        status: 'active',
        itemsCount: 0,
        totalAmount: 0,
        couponDiscount: 0,
        lastActivityAt: new Date().toISOString(),
        expiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.logAction('CREATE_CART', cartId, null, newCart)
      return this.success(cartInfo, '購物車創建成功')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 獲取購物車詳情
   */
  async getCartDetail(cartId: string): Promise<ServiceResponse<CartDetailResponse>> {
    try {
      // 獲取購物車基本資料
      const [cart] = await this.db.select()
        .from(shoppingCarts)
        .where(eq(shoppingCarts.cartId, cartId))

      if (!cart) {
        return this.error('購物車不存在', [{ 
          code: OrderErrorCodes.CART_NOT_FOUND,
          message: '找不到指定的購物車'
        }])
      }

      // 檢查購物車是否過期
      if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
        await this.db.update(shoppingCarts)
          .set({ 
            status: 'expired',
            updatedAt: new Date().toISOString()
          })
          .where(eq(shoppingCarts.cartId, cartId))

        return this.error('購物車已過期', [{ 
          code: OrderErrorCodes.CART_EXPIRED,
          message: '購物車已過期，請重新添加商品'
        }])
      }

      // 獲取購物車商品項目
      const cartItemsData = await this.db.select({
        cartItem: cartItems,
        product: products,
        variation: productVariations
      })
        .from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.productId))
        .leftJoin(productVariations, eq(cartItems.variationId, productVariations.variationId))
        .where(eq(cartItems.cartId, cartId))
        .orderBy(desc(cartItems.addedAt))

      const items: CartItemInfo[] = []
      const validation = {
        hasOutOfStockItems: false,
        hasUnavailableItems: false,
        errors: [] as string[],
        warnings: [] as string[]
      }

      let subtotal = 0

      for (const { cartItem, product, variation } of cartItemsData) {
        // 檢查商品是否存在且啟用
        if (!product || product.status !== 'published' || product.deletedAt) {
          validation.hasUnavailableItems = true
          validation.errors.push(`商品 ${cartItem.productId} 不可用`)
          continue
        }

        // 使用變體資料（如果有）或商品資料
        const currentPrice = variation?.price || product.price
        const currentStock = variation?.stockQuantity || product.stockQuantity
        const currentStockStatus = variation?.stockStatus || product.stockStatus

        // 檢查庫存
        if (currentStockStatus === 'outofstock' || currentStock < cartItem.quantity) {
          validation.hasOutOfStockItems = true
          if (currentStock === 0) {
            validation.errors.push(`${product.name} 已售完`)
          } else {
            validation.warnings.push(`${product.name} 庫存不足，僅剩 ${currentStock} 件`)
          }
        }

        const itemTotal = currentPrice * cartItem.quantity
        subtotal += itemTotal

        items.push({
          itemId: cartItem.itemId,
          cartId: cartItem.cartId,
          productId: cartItem.productId,
          variationId: cartItem.variationId || undefined,
          quantity: cartItem.quantity,
          productName: product.name,
          productImage: Array.isArray(product.imageGallery) && product.imageGallery.length > 0 
            ? product.imageGallery[0] : undefined,
          productPrice: currentPrice,
          productStock: currentStock,
          productStatus: product.status,
          addedAt: cartItem.addedAt!,
          createdAt: cartItem.createdAt!,
          updatedAt: cartItem.updatedAt!
        })
      }

      // 計算費用
      const shipping = 0 // TODO: 根據商品和地址計算運費
      const tax = subtotal * 0.05 // TODO: 根據稅率設定計算
      const discount = cart.couponDiscount
      const total = subtotal + shipping + tax - discount

      const cartInfo: CartInfo = {
        cartId: cart.cartId,
        customerId: cart.customerId || undefined,
        sessionId: cart.sessionId || undefined,
        status: cart.status as 'active' | 'abandoned' | 'converted' | 'expired',
        itemsCount: cart.itemsCount,
        totalAmount: cart.totalAmount,
        couponCode: cart.couponCode || undefined,
        couponDiscount: cart.couponDiscount,
        lastActivityAt: cart.lastActivityAt!,
        expiresAt: cart.expiresAt || undefined,
        createdAt: cart.createdAt!,
        updatedAt: cart.updatedAt!
      }

      const response: CartDetailResponse = {
        cart: cartInfo,
        items,
        summary: {
          subtotal,
          shipping,
          tax,
          discount,
          total
        },
        validation
      }

      this.logAction('GET_CART_DETAIL', cartId)
      return this.success(response)

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 添加商品到購物車
   */
  async addToCart(cartId: string, data: AddToCartRequest): Promise<ServiceResponse<CartItemInfo>> {
    try {
      // 驗證購物車存在且啟用
      const [cart] = await this.db.select()
        .from(shoppingCarts)
        .where(and(
          eq(shoppingCarts.cartId, cartId),
          eq(shoppingCarts.status, 'active')
        ))

      if (!cart) {
        return this.error('購物車不存在或已失效', [{ 
          code: OrderErrorCodes.CART_NOT_FOUND,
          message: '找不到有效的購物車'
        }])
      }

      // 檢查購物車是否過期
      if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
        return this.error('購物車已過期', [{ 
          code: OrderErrorCodes.CART_EXPIRED,
          message: '購物車已過期，請重新創建'
        }])
      }

      // 驗證商品存在且可購買
      const [product] = await this.db.select()
        .from(products)
        .where(and(
          eq(products.productId, data.productId),
          eq(products.status, 'published'),
          isNull(products.deletedAt)
        ))

      if (!product) {
        return this.error('商品不存在或不可購買', [{ 
          code: OrderErrorCodes.PRODUCT_NOT_FOUND,
          message: '找不到指定的商品或商品不可購買'
        }])
      }

      // 如果是變體商品，驗證變體存在
      let variation = null
      if (data.variationId) {
        [variation] = await this.db.select()
          .from(productVariations)
          .where(and(
            eq(productVariations.variationId, data.variationId),
            eq(productVariations.parentId, data.productId),
            eq(productVariations.status, 'published')
          ))

        if (!variation) {
          return this.error('商品變體不存在', [{ 
            code: OrderErrorCodes.PRODUCT_NOT_FOUND,
            message: '找不到指定的商品變體'
          }])
        }
      }

      // 檢查庫存
      const currentStock = variation?.stockQuantity || product.stockQuantity
      const currentStockStatus = variation?.stockStatus || product.stockStatus

      if (currentStockStatus === 'outofstock') {
        return this.error('商品已售完', [{ 
          code: OrderErrorCodes.PRODUCT_OUT_OF_STOCK,
          message: '商品已售完，無法加入購物車'
        }])
      }

      if (currentStock < data.quantity) {
        return this.error('庫存不足', [{ 
          code: OrderErrorCodes.INSUFFICIENT_STOCK,
          message: `庫存不足，僅剩 ${currentStock} 件`
        }])
      }

      // 檢查購物車中是否已有相同商品（同一商品同一變體）
      const [existingItem] = await this.db.select()
        .from(cartItems)
        .where(and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, data.productId),
          data.variationId ? eq(cartItems.variationId, data.variationId) : isNull(cartItems.variationId)
        ))

      if (existingItem) {
        // 更新數量
        const newQuantity = existingItem.quantity + data.quantity

        if (newQuantity > currentStock) {
          return this.error('庫存不足', [{ 
            code: OrderErrorCodes.INSUFFICIENT_STOCK,
            message: `加上購物車中的數量後超出庫存限制，僅剩 ${currentStock} 件`
          }])
        }

        await this.db.update(cartItems)
          .set({
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
          })
          .where(eq(cartItems.itemId, existingItem.itemId))

        // 更新購物車活動時間
        await this.updateCartActivity(cartId)

        const cartItemInfo: CartItemInfo = {
          itemId: existingItem.itemId,
          cartId: existingItem.cartId,
          productId: existingItem.productId,
          variationId: existingItem.variationId || undefined,
          quantity: newQuantity,
          productName: product.name,
          productImage: Array.isArray(product.imageGallery) && product.imageGallery.length > 0 
            ? product.imageGallery[0] : undefined,
          productPrice: variation?.price || product.price,
          productStock: currentStock,
          productStatus: product.status,
          addedAt: existingItem.addedAt!,
          createdAt: existingItem.createdAt!,
          updatedAt: new Date().toISOString()
        }

        this.logAction('UPDATE_CART_ITEM', existingItem.itemId, { quantity: existingItem.quantity }, { quantity: newQuantity })
        return this.success(cartItemInfo, '購物車商品數量已更新')
      }

      // 添加新的購物車項目
      const itemId = this.generateId('item')
      const newCartItem: NewCartItem = {
        itemId,
        cartId,
        productId: data.productId,
        variationId: data.variationId,
        quantity: data.quantity
      }

      await this.db.insert(cartItems).values(newCartItem)

      // 更新購物車活動時間
      await this.updateCartActivity(cartId)

      const cartItemInfo: CartItemInfo = {
        itemId,
        cartId,
        productId: data.productId,
        variationId: data.variationId,
        quantity: data.quantity,
        productName: product.name,
        productImage: Array.isArray(product.imageGallery) && product.imageGallery.length > 0 
          ? product.imageGallery[0] : undefined,
        productPrice: variation?.price || product.price,
        productStock: currentStock,
        productStatus: product.status,
        addedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.logAction('ADD_TO_CART', itemId, null, newCartItem)
      return this.success(cartItemInfo, '商品已加入購物車')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 更新購物車商品數量
   */
  async updateCartItem(cartId: string, itemId: string, data: UpdateCartItemRequest): Promise<ServiceResponse<CartItemInfo>> {
    try {
      // 驗證購物車項目存在
      const [cartItem] = await this.db.select({
        cartItem: cartItems,
        product: products,
        variation: productVariations
      })
        .from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.productId))
        .leftJoin(productVariations, eq(cartItems.variationId, productVariations.variationId))
        .where(and(
          eq(cartItems.itemId, itemId),
          eq(cartItems.cartId, cartId)
        ))

      if (!cartItem || !cartItem.product) {
        return this.error('購物車項目不存在', [{ 
          code: OrderErrorCodes.CART_ITEM_NOT_FOUND,
          message: '找不到指定的購物車項目'
        }])
      }

      const { cartItem: item, product, variation } = cartItem

      // 檢查庫存
      const currentStock = variation?.stockQuantity || product.stockQuantity

      if (data.quantity > currentStock) {
        return this.error('庫存不足', [{ 
          code: OrderErrorCodes.INSUFFICIENT_STOCK,
          message: `庫存不足，僅剩 ${currentStock} 件`
        }])
      }

      // 更新數量
      await this.db.update(cartItems)
        .set({
          quantity: data.quantity,
          updatedAt: new Date().toISOString()
        })
        .where(eq(cartItems.itemId, itemId))

      // 更新購物車活動時間
      await this.updateCartActivity(cartId)

      const cartItemInfo: CartItemInfo = {
        itemId: item.itemId,
        cartId: item.cartId,
        productId: item.productId,
        variationId: item.variationId || undefined,
        quantity: data.quantity,
        productName: product.name,
        productImage: Array.isArray(product.imageGallery) && product.imageGallery.length > 0 
          ? product.imageGallery[0] : undefined,
        productPrice: variation?.price || product.price,
        productStock: currentStock,
        productStatus: product.status,
        addedAt: item.addedAt!,
        createdAt: item.createdAt!,
        updatedAt: new Date().toISOString()
      }

      this.logAction('UPDATE_CART_ITEM', itemId, { quantity: item.quantity }, { quantity: data.quantity })
      return this.success(cartItemInfo, '購物車項目已更新')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 從購物車移除商品
   */
  async removeFromCart(cartId: string, itemId: string): Promise<ServiceResponse<void>> {
    try {
      // 驗證購物車項目存在
      const [existingItem] = await this.db.select()
        .from(cartItems)
        .where(and(
          eq(cartItems.itemId, itemId),
          eq(cartItems.cartId, cartId)
        ))

      if (!existingItem) {
        return this.error('購物車項目不存在', [{ 
          code: OrderErrorCodes.CART_ITEM_NOT_FOUND,
          message: '找不到指定的購物車項目'
        }])
      }

      // 刪除項目
      await this.db.delete(cartItems)
        .where(eq(cartItems.itemId, itemId))

      // 更新購物車活動時間
      await this.updateCartActivity(cartId)

      this.logAction('REMOVE_FROM_CART', itemId, existingItem, null)
      return this.success(undefined, '商品已從購物車移除')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 清空購物車
   */
  async clearCart(cartId: string): Promise<ServiceResponse<void>> {
    try {
      // 刪除所有購物車項目
      await this.db.delete(cartItems)
        .where(eq(cartItems.cartId, cartId))

      // 重置購物車統計
      await this.db.update(shoppingCarts)
        .set({
          itemsCount: 0,
          totalAmount: 0,
          couponCode: null,
          couponDiscount: 0,
          lastActivityAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(shoppingCarts.cartId, cartId))

      this.logAction('CLEAR_CART', cartId)
      return this.success(undefined, '購物車已清空')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  // ============ 私有輔助方法 ============
  
  /**
   * 更新購物車活動時間和統計
   */
  private async updateCartActivity(cartId: string): Promise<void> {
    try {
      // 計算購物車統計
      const [stats] = await this.db.select({
        itemsCount: count(cartItems.itemId),
        // TODO: 計算總金額需要關聯商品價格
      })
        .from(cartItems)
        .where(eq(cartItems.cartId, cartId))

      await this.db.update(shoppingCarts)
        .set({
          itemsCount: stats.itemsCount,
          lastActivityAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(shoppingCarts.cartId, cartId))

    } catch (error) {
      // 更新活動時間失敗不應影響主要業務流程
      this.logger.error('Failed to update cart activity', { 
        error: error.message, 
        cartId 
      })
    }
  }
}