/**
 * 後台管理 API 路由
 * 路徑前綴: /api/admin/v1
 */

import { Hono } from 'hono'
import type { Env } from '../index'
import { adminAuthRoutes } from './auth/adminAuth'
import { orderRoutes } from '@/modules/orders'
import { uploadRoutes } from '@/modules/upload'

export const adminRoutes = new Hono<{ Bindings: Env }>()

// ============ 健康檢查 ============
adminRoutes.get('/health', (c) => {
  return c.json({
    success: true,
    message: '後台管理 API 服務運行正常',
    version: 'admin-v1',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  })
})

// ============ 認證相關 API ============
adminRoutes.route('/auth', adminAuthRoutes)

// ============ 商品管理 API ============
adminRoutes.get('/products', async (c) => {
  return c.json({
    success: true,
    message: '後台商品列表 API - 開發中',
    data: [],
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  })
})

// ============ 訂單管理 API ============
// 整合完整的訂單管理功能
adminRoutes.route('/', orderRoutes)

// ============ 檔案管理 API ============
// 整合完整的檔案管理功能
adminRoutes.route('/', uploadRoutes)