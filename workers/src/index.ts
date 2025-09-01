/**
 * MickeyShop Beauty Backend API
 * Cloudflare Workers 主入口文件
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'

// 核心功能
import { createDatabase } from '@/core/database'

// 中間件
import { requestIdMiddleware } from '@/middlewares/requestId'
import { errorHandler } from '@/middlewares/errorHandler'
import { rateLimitMiddleware } from '@/middlewares/rateLimit'

// 路由
import { publicRoutes } from '@/routes/public'
import { adminRoutes } from '@/routes/admin'
import { systemRoutes } from '@/routes/system'

// 環境變數類型
export interface Env {
  // Cloudflare Services
  CACHE_KV: KVNamespace
  SESSION_KV: KVNamespace
  CONFIG_KV: KVNamespace
  DB: D1Database
  R2_BUCKET: R2Bucket
  
  // 公開環境變數
  NODE_ENV: string
  DEBUG?: string
  API_VERSION?: string
  CORS_ORIGINS?: string
  DEFAULT_CURRENCY?: string
  FREE_SHIPPING_THRESHOLD?: string
  
  // Cloudflare Secrets (敏感資料)
  JWT_SECRET?: string
  ADMIN_DEFAULT_PASSWORD?: string
  
  // 支付系統 Secrets
  ECPAY_MERCHANT_ID?: string
  ECPAY_HASH_KEY?: string
  ECPAY_HASH_IV?: string
  LINEPAY_CHANNEL_ID?: string
  LINEPAY_CHANNEL_SECRET?: string
  
  // 電子郵件服務 Secrets
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USER?: string
  SMTP_PASSWORD?: string
  
  // 第三方服務 Secrets
  GOOGLE_ANALYTICS_ID?: string
  FACEBOOK_PIXEL_ID?: string
  GOOGLE_MAPS_API_KEY?: string
  SENTRY_DSN?: string
}

// 創建 Hono 應用實例
const app = new Hono<{ Bindings: Env }>()

// ============ 全局中間件 ============
// 數據庫連接中間件
app.use('*', async (c, next) => {
  c.set('db', createDatabase(c.env.DB))
  await next()
})

// 請求 ID 生成
app.use('*', requestIdMiddleware())

// 日誌記錄（僅開發環境）
app.use('*', async (c, next) => {
  if (c.env.NODE_ENV === 'development' && c.env.DEBUG === 'true') {
    return logger()(c, next)
  }
  await next()
})

// 安全標頭
app.use('*', secureHeaders())

// CORS 配置
app.use('*', cors({
  origin: '*', // 暫時允許所有來源，生產環境應該限制
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
}))

// JSON 格式化（僅開發環境）
app.use('*', async (c, next) => {
  if (c.env.NODE_ENV === 'development') {
    return prettyJSON()(c, next)
  }
  await next()
})

// 速率限制
app.use('/api/*', rateLimitMiddleware())

// ============ 健康檢查端點 ============
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'MickeyShop Beauty API 服務運行正常',
    version: c.env.API_VERSION || 'v1',
    environment: c.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  })
})

app.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      cache: 'connected',
      storage: 'connected'
    }
  })
})

// ============ API 路由 ============
// 前台 API 路由 (v1)
app.route('/api/v1', publicRoutes)

// 後台管理 API 路由 (admin/v1)
app.route('/api/admin/v1', adminRoutes)

// 系統 API 路由 (system/v1)
app.route('/api/system/v1', systemRoutes)

// ============ 404 處理 ============
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'API 端點不存在',
      path: c.req.path,
      method: c.req.method,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    }
  }, 404)
})

// ============ 全局錯誤處理 ============
app.onError(errorHandler)

// ============ Cron 作業處理 ============
const cronHandler = async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
  console.log('執行定時任務:', event.cron)
  
  // 這裡可以添加定時任務邏輯，例如：
  // - 清理過期的 session
  // - 生成報表
  // - 同步第三方數據
  // - 發送提醒郵件
  
  switch (event.cron) {
    case '0 0 * * *': // 每日午夜
      // 執行每日清理任務
      console.log('執行每日清理任務')
      break
      
    case '0 */6 * * *': // 每6小時
      // 執行數據同步任務
      console.log('執行數據同步任務')
      break
      
    default:
      console.log('未知的定時任務:', event.cron)
  }
}

// ============ 導出處理器 ============
export default {
  fetch: app.fetch,
  scheduled: cronHandler,
}

// 導出應用實例供測試使用
export { app }