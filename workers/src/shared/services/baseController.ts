/**
 * 基礎控制器類
 * 提供通用的控制器功能
 */

import { Context } from 'hono'
import { Database } from '@/core/database'
import { ServiceResponse, PaginatedResponse, PaginationParams } from './baseService'
import { AuthUser } from '@/middlewares'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Array<{
    field?: string
    message: string
    code?: string
  }>
  metadata?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    requestId?: string
    timestamp?: string
    version?: string
  }
}

/**
 * 基礎控制器類
 */
export abstract class BaseController {
  
  /**
   * 獲取資料庫連接
   */
  protected getDatabase(c: Context): Database {
    // 這裡需要實現資料庫連接獲取邏輯
    // 暫時返回 undefined，需要在具體實現中處理
    return c.get('db') as Database
  }

  /**
   * 獲取當前用戶信息
   */
  protected getCurrentUser(c: Context): AuthUser | undefined {
    return c.get('user') as AuthUser | undefined
  }

  /**
   * 獲取請求 ID
   */
  protected getRequestId(c: Context): string {
    return c.get('requestId') as string
  }

  /**
   * 獲取分頁參數
   */
  protected getPaginationParams(c: Context): PaginationParams {
    const page = Math.max(1, parseInt(c.req.query('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '10')))
    const sort = c.req.query('sort')
    const order = (c.req.query('order') as 'asc' | 'desc') || 'desc'

    return { page, limit, sort, order }
  }

  /**
   * 獲取搜尋參數
   */
  protected getSearchParams(c: Context) {
    return {
      keyword: c.req.query('keyword'),
      status: c.req.query('status'),
      category: c.req.query('category'),
      dateFrom: c.req.query('dateFrom'),
      dateTo: c.req.query('dateTo')
    }
  }

  /**
   * 創建成功響應
   */
  protected success<T>(
    c: Context,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      metadata: {
        requestId: this.getRequestId(c),
        timestamp: new Date().toISOString(),
        version: c.env?.API_VERSION || 'v1'
      }
    }

    return c.json(response, statusCode)
  }

  /**
   * 創建分頁響應
   */
  protected successWithPagination<T>(
    c: Context,
    paginatedData: PaginatedResponse<T>,
    message?: string
  ): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      data: paginatedData.data,
      message,
      metadata: {
        pagination: paginatedData.pagination,
        requestId: this.getRequestId(c),
        timestamp: new Date().toISOString(),
        version: c.env?.API_VERSION || 'v1'
      }
    }

    return c.json(response)
  }

  /**
   * 創建錯誤響應
   */
  protected error(
    c: Context,
    message: string,
    errors?: Array<{ field?: string; message: string; code?: string }>,
    statusCode: number = 400
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
      metadata: {
        requestId: this.getRequestId(c),
        timestamp: new Date().toISOString(),
        version: c.env?.API_VERSION || 'v1'
      }
    }

    return c.json(response, statusCode)
  }

  /**
   * 處理服務響應
   */
  protected handleServiceResponse<T>(
    c: Context,
    response: ServiceResponse<T>,
    successStatusCode: number = 200,
    errorStatusCode: number = 400
  ): Response {
    if (response.success) {
      return this.success(c, response.data, response.message, successStatusCode)
    } else {
      return this.error(c, response.message || '操作失敗', response.errors, errorStatusCode)
    }
  }

  /**
   * 處理服務分頁響應
   */
  protected handleServicePaginationResponse<T>(
    c: Context,
    response: ServiceResponse<PaginatedResponse<T>>
  ): Response {
    if (response.success && response.data) {
      return this.successWithPagination(c, response.data, response.message)
    } else {
      return this.error(c, response.message || '操作失敗', response.errors)
    }
  }

  /**
   * 驗證必填參數
   */
  protected validateRequired(
    c: Context,
    data: Record<string, any>,
    requiredFields: string[]
  ): Response | null {
    const errors: Array<{ field: string; message: string; code: string }> = []

    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push({
          field,
          message: `${field} 為必填參數`,
          code: 'REQUIRED'
        })
      }
    }

    if (errors.length > 0) {
      return this.error(c, '參數驗證失敗', errors, 422)
    }

    return null
  }

  /**
   * 處理異常錯誤
   */
  protected handleError(c: Context, error: any): Response {
    console.error('Controller error:', {
      error: error.message,
      stack: error.stack,
      requestId: this.getRequestId(c),
      path: c.req.path,
      method: c.req.method
    })

    // 根據錯誤類型返回不同的狀態碼和訊息
    if (error.name === 'UnauthorizedError') {
      return this.error(c, '未授權訪問', [], 401)
    }

    if (error.name === 'ForbiddenError') {
      return this.error(c, '權限不足', [], 403)
    }

    if (error.name === 'ValidationError') {
      return this.error(c, '參數驗證失敗', [], 422)
    }

    if (error.name === 'NotFoundError') {
      return this.error(c, '資源不存在', [], 404)
    }

    // 預設內部伺服器錯誤
    return this.error(c, '伺服器內部錯誤', [], 500)
  }

  /**
   * 記錄操作日誌
   */
  protected logAction(
    c: Context,
    action: string,
    resource?: string,
    additionalData?: Record<string, any>
  ) {
    const user = this.getCurrentUser(c)
    
    console.log('Controller action:', {
      action,
      resource,
      userId: user?.id,
      userType: user?.type,
      requestId: this.getRequestId(c),
      path: c.req.path,
      method: c.req.method,
      ...additionalData
    })
  }
}