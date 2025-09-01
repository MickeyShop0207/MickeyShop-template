/**
 * 系統 API 路由
 * 路徑前綴: /api/system/v1
 */

import { Hono } from 'hono'
import type { Env } from '../index'
// import { systemController } from '@/controllers/systemController'

export const systemRoutes = new Hono<{ Bindings: Env }>()

// ============ 健康檢查 ============
systemRoutes.get('/health', (c) => {
  return c.json({
    success: true,
    message: '系統 API 服務運行正常',
    version: 'system-v1',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  })
})

// ============ 系統狀態 ============
systemRoutes.get('/status', (c) => {
  return c.json({
    success: true,
    message: '系統 API 服務運行正常',
    version: 'system-v1',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  })
})

// ============ 系統信息 ============
systemRoutes.get('/info', (c) => {
  return c.json({
    success: true,
    message: '系統信息 API - 開發中',
    data: {
      name: 'MickeyShop Beauty API',
      version: '1.0.0',
      environment: c.env.NODE_ENV || 'development'
    },
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  })
})

// ============ 版本資訊 ============
systemRoutes.get('/version', (c) => {
  return c.json({
    success: true,
    message: '版本資訊',
    data: {
      api_version: '1.0.0',
      build_time: '2024-08-31',
      environment: c.env.NODE_ENV || 'development'
    },
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  })
})