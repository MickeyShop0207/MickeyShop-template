/**
 * 前台公開 API 路由
 * 路徑前綴: /api/v1
 */

import { Hono } from 'hono'
import type { Env } from '../index'
// import { memberAuthRoutes } from './auth/memberAuth'
// import { orderRoutes } from '@/modules/orders'
// import { uploadRoutes } from '@/modules/upload'

export const publicRoutes = new Hono<{ Bindings: Env }>()

// ============ 健康檢查 ============
publicRoutes.get('/health', (c) => {
  return c.json({
    success: true,
    message: '前台 API 服務運行正常',
    version: 'v1',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  })
})

// ============ 商品相關 API ============
publicRoutes.get('/products', async (c) => {
  return c.json({
    success: true,
    message: '商品列表 API - 開發中',
    data: [],
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  })
})

publicRoutes.get('/products/:id', async (c) => {
  const id = c.req.param('id')
  return c.json({
    success: true,
    message: `商品詳情 API - 開發中 (ID: ${id})`,
    data: null,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  })
})

// ============ 分類相關 API ============
publicRoutes.get('/categories', async (c) => {
  return c.json({
    success: true,
    message: '分類列表 API - 開發中',
    data: [],
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  })
})

// ============ 認證相關 API ============
// publicRoutes.route('/auth', memberAuthRoutes)

// ============ 訂單和購物車 API ============
// publicRoutes.route('/', orderRoutes)

// ============ 檔案上傳 API ============
// publicRoutes.route('/', uploadRoutes)