/**
 * MickeyShop Beauty Backend API - Simplified Version
 * 簡化版本用於測試基礎功能
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

// 環境變數類型
export interface Env {
  // Cloudflare Services  
  CACHE?: KVNamespace
  DB?: D1Database
  R2_BUCKET?: R2Bucket
  
  // Environment Variables
  ENVIRONMENT?: string
  API_VERSION?: string
  CORS_ORIGIN?: string
}

// 創建 Hono 應用
const app = new Hono<{ Bindings: Env }>()

// 基礎中間件
app.use('*', logger())

// CORS 配置
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// 健康檢查端點
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'MickeyShop Beauty API 服務運行正常',
    version: c.env.API_VERSION || 'v1',
    environment: c.env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString()
  })
})

app.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// API 路由
app.get('/api/test', (c) => {
  return c.json({
    success: true,
    message: '測試 API 正常運行',
    data: {
      timestamp: new Date().toISOString(),
      server: 'Cloudflare Workers'
    }
  })
})

// 404 處理
app.notFound((c) => {
  return c.json({
    success: false,
    message: '找不到請求的端點',
    code: 'NOT_FOUND'
  }, 404)
})

// 錯誤處理
app.onError((err, c) => {
  console.error('API 錯誤:', err)
  return c.json({
    success: false,
    message: '服務器內部錯誤',
    code: 'INTERNAL_ERROR',
    error: err.message
  }, 500)
})

export default app