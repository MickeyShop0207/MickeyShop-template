/**
 * 請求驗證中間件
 * 基於 Zod Schema 的請求參數驗證
 */

import { MiddlewareHandler } from 'hono'
import { z } from 'zod'

// 驗證錯誤類型
export class ValidationError extends Error {
  constructor(message: string, public issues: z.ZodIssue[]) {
    super(message)
    this.name = 'ValidationError'
  }
}

// 驗證類型
type ValidationTarget = 'body' | 'query' | 'params' | 'headers'

/**
 * 驗證中間件工廠函數
 */
export const validate = (
  target: ValidationTarget,
  schema: z.ZodSchema
): MiddlewareHandler => {
  return async (c, next) => {
    try {
      let data: unknown

      switch (target) {
        case 'body':
          // 處理 JSON 請求體
          try {
            data = await c.req.json()
          } catch {
            throw new ValidationError('請求體必須為有效的 JSON 格式', [])
          }
          break

        case 'query':
          // 處理查詢參數
          const query = c.req.query()
          data = Object.keys(query).length > 0 ? query : {}
          break

        case 'params':
          // 處理路由參數
          data = c.req.param()
          break

        case 'headers':
          // 處理請求頭
          const headers: Record<string, string> = {}
          for (const [key, value] of Object.entries(c.req.header())) {
            headers[key.toLowerCase()] = value
          }
          data = headers
          break

        default:
          throw new ValidationError('不支援的驗證目標', [])
      }

      // 執行 Schema 驗證
      const result = schema.safeParse(data)
      
      if (!result.success) {
        throw new ValidationError('請求參數驗證失敗', result.error.issues)
      }

      // 將驗證後的數據存儲到 context 中
      c.set(`validated_${target}`, result.data)

      await next()
    } catch (error) {
      if (error instanceof ValidationError) {
        return c.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message,
              code: issue.code
            })),
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        }, 400)
      }
      
      throw error
    }
  }
}

/**
 * 便捷的驗證函數
 */
export const validateBody = (schema: z.ZodSchema) => validate('body', schema)
export const validateQuery = (schema: z.ZodSchema) => validate('query', schema)
export const validateParams = (schema: z.ZodSchema) => validate('params', schema)
export const validateHeaders = (schema: z.ZodSchema) => validate('headers', schema)

/**
 * 常用的驗證 Schema
 */
export const commonSchemas = {
  // 分頁參數
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  }),

  // ID 參數
  id: z.object({
    id: z.string().min(1, 'ID 不能為空')
  }),

  // 搜尋參數
  search: z.object({
    keyword: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional()
  }),

  // JWT Token
  authHeaders: z.object({
    authorization: z.string().regex(/^Bearer .+/, '無效的 Authorization 標頭格式')
  })
}