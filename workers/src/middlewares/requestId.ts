/**
 * 請求 ID 中間件
 * 為每個請求生成唯一 ID
 */

import { MiddlewareHandler } from 'hono'

// 生成随機 ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export const requestIdMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    // 從 Header 中獲取或生成新的請求 ID
    const requestId = c.req.header('X-Request-ID') || generateRequestId()
    
    // 儲存到上下文中
    c.set('requestId', requestId)
    
    // 記錄請求開始時間
    c.set('startTime', Date.now())
    
    // 繼續執行
    await next()
    
    // 計算處理時間
    const endTime = Date.now()
    const startTime = c.get('startTime') as number
    const processingTime = endTime - startTime
    
    // 設置回傳 Header
    c.header('X-Request-ID', requestId)
    c.header('X-Response-Time', `${processingTime}ms`)
  }
}