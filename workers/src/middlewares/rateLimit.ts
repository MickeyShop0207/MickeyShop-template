/**
 * 速率限制中間件
 */

import { MiddlewareHandler } from 'hono'

// 簡單的內存速率限制器（生產環境應使用 KV 或其他持久化儲存）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export const rateLimitMiddleware = (options = {
  requests: 1000,
  windowMs: 60 * 60 * 1000, // 1 hour
}): MiddlewareHandler => {
  return async (c, next) => {
    // 獲取客戶端 IP（Cloudflare Workers 中通過 CF-Connecting-IP 頭部）
    const clientIP = c.req.header('CF-Connecting-IP') || 
                    c.req.header('X-Forwarded-For') || 
                    'unknown'
    
    const now = Date.now()
    const key = `rate_limit:${clientIP}`
    
    // 獲取當前計數
    let rateLimitInfo = rateLimitStore.get(key)
    
    // 如果不存在或已過期，初始化
    if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
      rateLimitInfo = {
        count: 0,
        resetTime: now + options.windowMs
      }
    }
    
    // 遞增計數
    rateLimitInfo.count++
    rateLimitStore.set(key, rateLimitInfo)
    
    // 設置回傳 Header
    c.header('X-RateLimit-Limit', options.requests.toString())
    c.header('X-RateLimit-Remaining', Math.max(0, options.requests - rateLimitInfo.count).toString())
    c.header('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime / 1000).toString())
    
    // 檢查是否超過限制
    if (rateLimitInfo.count > options.requests) {
      return c.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '請求頻率過高，請稍後再試',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 429)
    }
    
    await next()
  }
}