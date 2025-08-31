/**
 * 基礎服務類
 * 提供通用的服務層功能
 */

import { Database } from '@/core/database'
import { Logger, logger } from '@/middlewares'

export interface ServiceContext {
  db: Database
  logger: Logger
  userId?: string
  userType?: 'admin' | 'customer'
  sessionId?: string
  requestId?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Array<{
    field?: string
    message: string
    code?: string
  }>
  metadata?: Record<string, any>
}

/**
 * 基礎服務類
 */
export abstract class BaseService {
  protected db: Database
  protected logger: Logger
  protected context?: ServiceContext

  constructor(context: ServiceContext) {
    this.db = context.db
    this.logger = context.logger
    this.context = context
  }

  /**
   * 創建成功響應
   */
  protected success<T>(data?: T, message?: string): ServiceResponse<T> {
    return {
      success: true,
      data,
      message
    }
  }

  /**
   * 創建錯誤響應
   */
  protected error(
    message: string,
    errors?: Array<{ field?: string; message: string; code?: string }>
  ): ServiceResponse {
    return {
      success: false,
      message,
      errors
    }
  }

  /**
   * 創建分頁響應
   */
  protected paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit)
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  /**
   * 處理資料庫錯誤
   */
  protected handleDbError(error: any): ServiceResponse {
    this.logger.error('Database error occurred', {
      error: error.message,
      stack: error.stack,
      requestId: this.context?.requestId,
      userId: this.context?.userId
    })

    if (error.message?.includes('UNIQUE constraint failed')) {
      return this.error('資料重複，請檢查唯一欄位')
    }

    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return this.error('資料關聯錯誤，請檢查相關資料是否存在')
    }

    return this.error('資料庫操作失敗')
  }

  /**
   * 驗證必填欄位
   */
  protected validateRequired(data: Record<string, any>, requiredFields: string[]): ServiceResponse | null {
    const errors: Array<{ field: string; message: string; code: string }> = []

    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push({
          field,
          message: `${field} 為必填欄位`,
          code: 'REQUIRED'
        })
      }
    }

    if (errors.length > 0) {
      return this.error('欄位驗證失敗', errors)
    }

    return null
  }

  /**
   * 生成唯一ID
   */
  protected generateId(prefix?: string): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 15)
    const id = `${timestamp}${random}`
    
    return prefix ? `${prefix}_${id}` : id
  }

  /**
   * 記錄操作日誌
   */
  protected logAction(action: string, resource?: string, oldValue?: any, newValue?: any) {
    this.logger.info(`Service action: ${action}`, {
      action,
      resource,
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
      userId: this.context?.userId,
      userType: this.context?.userType,
      sessionId: this.context?.sessionId,
      requestId: this.context?.requestId
    })
  }
}

/**
 * 創建服務上下文工廠函數
 */
export function createServiceContext(
  db: Database,
  options: Partial<ServiceContext> = {}
): ServiceContext {
  return {
    db,
    logger,
    ...options
  }
}