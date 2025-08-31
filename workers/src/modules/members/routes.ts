/**
 * 會員模組路由定義
 * 定義會員相關的 API 路由
 */

import { Hono } from 'hono'
import { MemberController } from './memberController'
import { authMiddleware } from '@/middlewares/auth'
import { rateLimitMiddleware } from '@/middlewares/rateLimit'

const memberRoutes = new Hono()
const memberController = new MemberController()

// 應用中間件
memberRoutes.use('*', authMiddleware) // 所有會員路由都需要認證
memberRoutes.use('*', rateLimitMiddleware) // 應用速率限制

// ============ 會員資料管理 ============

/**
 * 獲取當前會員完整資料
 * GET /api/v1/members/profile
 */
memberRoutes.get('/profile', (c) => memberController.getProfile(c))

/**
 * 更新會員資料
 * PUT /api/v1/members/profile
 */
memberRoutes.put('/profile', (c) => memberController.updateProfile(c))

// ============ 地址管理 ============

/**
 * 獲取會員地址列表
 * GET /api/v1/members/addresses
 * Query params: type, city, isDefault, isActive, page, limit, sort, order
 */
memberRoutes.get('/addresses', (c) => memberController.getAddresses(c))

/**
 * 創建新地址
 * POST /api/v1/members/addresses
 */
memberRoutes.post('/addresses', (c) => memberController.createAddress(c))

/**
 * 更新地址
 * PUT /api/v1/members/addresses/:addressId
 */
memberRoutes.put('/addresses/:addressId', (c) => memberController.updateAddress(c))

/**
 * 刪除地址
 * DELETE /api/v1/members/addresses/:addressId
 */
memberRoutes.delete('/addresses/:addressId', (c) => memberController.deleteAddress(c))

// ============ 願望清單管理 ============

/**
 * 獲取會員願望清單
 * GET /api/v1/members/wishlist
 * Query params: productId, priority, dateFrom, dateTo, page, limit, sort, order
 */
memberRoutes.get('/wishlist', (c) => memberController.getWishlist(c))

/**
 * 添加商品到願望清單
 * POST /api/v1/members/wishlist
 */
memberRoutes.post('/wishlist', (c) => memberController.addToWishlist(c))

/**
 * 從願望清單移除商品
 * DELETE /api/v1/members/wishlist/:wishlistId
 */
memberRoutes.delete('/wishlist/:wishlistId', (c) => memberController.removeFromWishlist(c))

/**
 * 檢查商品是否在願望清單中
 * GET /api/v1/members/wishlist/check/:productId
 */
memberRoutes.get('/wishlist/check/:productId', (c) => memberController.checkWishlist(c))

export { memberRoutes }