/**
 * CORS 中間件
 * 處理跨域請求
 */

import { MiddlewareHandler } from 'hono'

export interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

export const corsMiddleware = (options: CorsOptions = {}): MiddlewareHandler => {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials = false,
    maxAge = 86400 // 24 hours
  } = options

  return async (c, next) => {
    const requestOrigin = c.req.header('Origin')
    
    // 處理 origin 檢查
    let allowOrigin = '*'
    if (typeof origin === 'string') {
      allowOrigin = origin
    } else if (Array.isArray(origin)) {
      if (requestOrigin && origin.includes(requestOrigin)) {
        allowOrigin = requestOrigin
      }
    } else if (typeof origin === 'function' && requestOrigin) {
      if (origin(requestOrigin)) {
        allowOrigin = requestOrigin
      }
    }

    // 設置 CORS Headers
    c.header('Access-Control-Allow-Origin', allowOrigin)
    c.header('Access-Control-Allow-Methods', methods.join(', '))
    c.header('Access-Control-Allow-Headers', allowedHeaders.join(', '))
    
    if (credentials) {
      c.header('Access-Control-Allow-Credentials', 'true')
    }
    
    c.header('Access-Control-Max-Age', maxAge.toString())

    // 處理 OPTIONS 預檢請求
    if (c.req.method === 'OPTIONS') {
      return c.text('', 204)
    }

    await next()
  }
}