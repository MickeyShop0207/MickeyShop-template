/**
 * 日誌記錄中間件
 * 記錄請求和回應信息
 */

import { MiddlewareHandler } from 'hono'

// 日誌級別
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// 日誌接口
export interface LogEntry {
  timestamp: string
  level: string
  message: string
  requestId?: string
  method?: string
  path?: string
  statusCode?: number
  responseTime?: number
  userAgent?: string
  ip?: string
  userId?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
  extra?: Record<string, any>
}

/**
 * 日誌記錄器類
 */
export class Logger {
  private level: LogLevel

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level
  }

  private log(level: LogLevel, message: string, extra?: Record<string, any>) {
    if (level > this.level) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      ...extra
    }

    console.log(JSON.stringify(entry))
  }

  error(message: string, extra?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, extra)
  }

  warn(message: string, extra?: Record<string, any>) {
    this.log(LogLevel.WARN, message, extra)
  }

  info(message: string, extra?: Record<string, any>) {
    this.log(LogLevel.INFO, message, extra)
  }

  debug(message: string, extra?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, extra)
  }
}

// 全局日誌實例
export const logger = new Logger()

/**
 * 請求日誌中間件
 */
export const requestLogging = (options: {
  logLevel?: LogLevel
  includeRequestBody?: boolean
  includeResponseBody?: boolean
  maxBodySize?: number
} = {}): MiddlewareHandler => {
  const {
    logLevel = LogLevel.INFO,
    includeRequestBody = false,
    includeResponseBody = false,
    maxBodySize = 1024 * 10 // 10KB
  } = options

  return async (c, next) => {
    const startTime = Date.now()
    const requestId = c.get('requestId')
    const method = c.req.method
    const path = c.req.path
    const userAgent = c.req.header('User-Agent')
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')

    // 記錄請求開始
    const requestLog: Partial<LogEntry> = {
      requestId,
      method,
      path,
      userAgent,
      ip
    }

    // 記錄請求體（如果啟用）
    if (includeRequestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const contentType = c.req.header('Content-Type')
        if (contentType?.includes('application/json')) {
          const body = await c.req.text()
          if (body.length <= maxBodySize) {
            requestLog.extra = { requestBody: JSON.parse(body) }
          }
        }
      } catch (error) {
        // 忽略請求體解析錯誤
      }
    }

    logger.info('Request started', requestLog)

    // 繼續執行請求
    await next()

    // 計算響應時間
    const responseTime = Date.now() - startTime
    const statusCode = c.res.status

    // 記錄響應
    const responseLog: Partial<LogEntry> = {
      requestId,
      method,
      path,
      statusCode,
      responseTime
    }

    // 記錄響應體（如果啟用且不是錯誤響應）
    if (includeResponseBody && statusCode < 400) {
      try {
        const responseText = await c.res.clone().text()
        if (responseText.length <= maxBodySize) {
          responseLog.extra = { responseBody: JSON.parse(responseText) }
        }
      } catch (error) {
        // 忽略響應體解析錯誤
      }
    }

    // 根據狀態碼選擇日誌級別
    if (statusCode >= 500) {
      logger.error('Request completed with server error', responseLog)
    } else if (statusCode >= 400) {
      logger.warn('Request completed with client error', responseLog)
    } else {
      logger.info('Request completed successfully', responseLog)
    }
  }
}

/**
 * 錯誤日誌中間件（配合錯誤處理中間件使用）
 */
export const errorLogging = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      await next()
    } catch (error) {
      // 記錄錯誤
      logger.error('Unhandled error occurred', {
        requestId: c.get('requestId'),
        method: c.req.method,
        path: c.req.path,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })

      // 重新拋出錯誤讓錯誤處理中間件處理
      throw error
    }
  }
}

/**
 * 性能監控中間件
 */
export const performanceLogging = (thresholdMs: number = 1000): MiddlewareHandler => {
  return async (c, next) => {
    const startTime = Date.now()

    await next()

    const responseTime = Date.now() - startTime

    // 如果響應時間超過閾值，記錄性能警告
    if (responseTime > thresholdMs) {
      logger.warn('Slow request detected', {
        requestId: c.get('requestId'),
        method: c.req.method,
        path: c.req.path,
        responseTime,
        threshold: thresholdMs
      })
    }
  }
}