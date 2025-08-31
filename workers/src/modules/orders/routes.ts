/**
 * 訂單模組路由定義
 * 處理訂單和購物車相關的路由
 */

import { Hono } from 'hono'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { OrderController } from './orderController'
import { authMiddleware } from '@/middlewares/auth'

export function createOrderRoutes(db: DrizzleD1Database) {
  const app = new Hono()
  const orderController = new OrderController(db)

  // ============ 訂單管理路由 ============

  /**
   * 創建訂單
   * POST /orders
   * 需要認證
   */
  app.post('/orders', authMiddleware(), async (c) => {
    return await orderController.createOrder(c)
  })

  /**
   * 獲取訂單列表
   * GET /orders
   * 需要認證（一般用戶只能看到自己的訂單）
   */
  app.get('/orders', authMiddleware(), async (c) => {
    return await orderController.getOrders(c)
  })

  /**
   * 獲取訂單統計
   * GET /orders/stats
   * 需要認證
   */
  app.get('/orders/stats', authMiddleware(), async (c) => {
    return await orderController.getOrderStats(c)
  })

  /**
   * 獲取單一訂單詳情
   * GET /orders/:orderId
   * 需要認證（只有訂單所有者或管理員可以查看）
   */
  app.get('/orders/:orderId', authMiddleware(), async (c) => {
    return await orderController.getOrder(c)
  })

  /**
   * 更新訂單狀態
   * PATCH /orders/:orderId
   * 需要管理員權限
   */
  app.patch('/orders/:orderId', authMiddleware(), async (c) => {
    return await orderController.updateOrder(c)
  })

  /**
   * 取消訂單
   * POST /orders/:orderId/cancel
   * 需要認證（只有訂單所有者或管理員可以取消）
   */
  app.post('/orders/:orderId/cancel', authMiddleware(), async (c) => {
    return await orderController.cancelOrder(c)
  })

  // ============ 購物車管理路由 ============

  /**
   * 獲取購物車
   * GET /cart
   * 支援認證和訪客模式
   */
  app.get('/cart', authMiddleware({ required: false }), async (c) => {
    return await orderController.getCart(c)
  })

  /**
   * 加入商品到購物車
   * POST /cart/items
   * 支援認證和訪客模式
   */
  app.post('/cart/items', authMiddleware({ required: false }), async (c) => {
    return await orderController.addToCart(c)
  })

  /**
   * 更新購物車項目
   * PUT /cart/items/:itemId
   * 支援認證和訪客模式
   */
  app.put('/cart/items/:itemId', authMiddleware({ required: false }), async (c) => {
    return await orderController.updateCartItem(c)
  })

  /**
   * 移除購物車項目
   * DELETE /cart/items/:itemId
   * 支援認證和訪客模式
   */
  app.delete('/cart/items/:itemId', authMiddleware({ required: false }), async (c) => {
    return await orderController.removeCartItem(c)
  })

  /**
   * 清空購物車
   * DELETE /cart
   * 支援認證和訪客模式
   */
  app.delete('/cart', authMiddleware({ required: false }), async (c) => {
    return await orderController.clearCart(c)
  })

  return app
}

// 導出路由實例（供 public routes 使用）
export const orderRoutes = new Hono()

// 在路由初始化時需要資料庫實例，這裡提供一個工廠函數
orderRoutes.use('*', async (c, next) => {
  const db = c.get('db') as DrizzleD1Database
  const routes = createOrderRoutes(db)
  return routes.fetch(c.req.raw, c.env, c.executionCtx)
})