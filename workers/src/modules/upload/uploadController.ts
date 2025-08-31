/**
 * 檔案上傳控制器
 * 處理檔案上傳相關的 HTTP 請求
 */

import type { Context } from 'hono'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { UploadService } from './uploadService'
import type {
  FileUploadRequest,
  BatchUploadRequest,
  FileListQuery,
  FileUploadResponse,
  BatchUploadResponse,
  FileListResponse,
  UploadError
} from './types'

export class UploadController {
  private uploadService: UploadService

  constructor(db: DrizzleD1Database, r2Bucket: R2Bucket) {
    this.uploadService = new UploadService(db, r2Bucket)
  }

  // ============ 檔案上傳 ============

  /**
   * 單檔上傳
   * POST /upload
   */
  async uploadFile(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const currentUser = c.get('currentUser')

      // 檢查內容類型
      const contentType = c.req.header('content-type')
      if (!contentType || !contentType.includes('multipart/form-data')) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: '請使用 multipart/form-data 格式上傳檔案'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 解析表單資料
      const formData = await c.req.formData()
      const file = formData.get('file') as File
      const category = formData.get('category') as string
      const purpose = formData.get('purpose') as string | null
      const relatedType = formData.get('relatedType') as string | null
      const relatedId = formData.get('relatedId') as string | null
      const isPublic = formData.get('isPublic') === 'true'
      const generateThumbnails = formData.get('generateThumbnails') === 'true'

      // 驗證必要欄位
      if (!file) {
        return c.json({
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: '請選擇要上傳的檔案'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      if (!category) {
        return c.json({
          success: false,
          error: {
            code: 'MISSING_CATEGORY',
            message: '請指定檔案分類'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 檢查檔案大小限制
      const maxSize = 20 * 1024 * 1024 // 20MB
      if (file.size > maxSize) {
        return c.json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `檔案過大，最大允許 ${Math.floor(maxSize / 1024 / 1024)}MB`
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 準備上傳請求
      const uploadRequest: FileUploadRequest = {
        file,
        originalName: file.name,
        category: category as any,
        purpose: purpose || undefined,
        relatedType: relatedType as any || undefined,
        relatedId: relatedId || undefined,
        isPublic,
        generateThumbnails
      }

      // 執行上傳
      const uploadedFile = await this.uploadService.uploadFile(
        uploadRequest,
        currentUser?.customerId || currentUser?.adminId,
        currentUser?.role === 'admin' ? 'admin' : 'customer'
      )

      const response: FileUploadResponse = {
        success: true,
        data: uploadedFile,
        message: '檔案上傳成功',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response, 201)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 批量上傳
   * POST /upload/batch
   */
  async uploadFiles(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const currentUser = c.get('currentUser')

      // 檢查內容類型
      const contentType = c.req.header('content-type')
      if (!contentType || !contentType.includes('multipart/form-data')) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: '請使用 multipart/form-data 格式上傳檔案'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 解析表單資料
      const formData = await c.req.formData()
      const files = formData.getAll('files') as File[]
      const isPublic = formData.get('isPublic') === 'true'
      const generateThumbnails = formData.get('generateThumbnails') === 'true'

      if (!files || files.length === 0) {
        return c.json({
          success: false,
          error: {
            code: 'NO_FILES',
            message: '請選擇要上傳的檔案'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 限制批量上傳數量
      const maxFiles = 10
      if (files.length > maxFiles) {
        return c.json({
          success: false,
          error: {
            code: 'TOO_MANY_FILES',
            message: `一次最多可上傳 ${maxFiles} 個檔案`
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 準備批量上傳請求
      const batchRequest: BatchUploadRequest = {
        files: files.map((file, index) => ({
          file,
          originalName: file.name,
          category: (formData.get(`category_${index}`) as string) || 'gallery', // 預設分類
          purpose: formData.get(`purpose_${index}`) as string || undefined,
          relatedType: formData.get(`relatedType_${index}`) as string || undefined,
          relatedId: formData.get(`relatedId_${index}`) as string || undefined
        })),
        isPublic,
        generateThumbnails
      }

      // 執行批量上傳
      const result = await this.uploadService.uploadFiles(
        batchRequest,
        currentUser?.customerId || currentUser?.adminId,
        currentUser?.role === 'admin' ? 'admin' : 'customer'
      )

      const response: BatchUploadResponse = {
        success: true,
        data: {
          uploads: result.uploads,
          failed: result.failed,
          summary: {
            total: batchRequest.files.length,
            success: result.uploads.length,
            failed: result.failed.length
          }
        },
        message: `成功上傳 ${result.uploads.length} 個檔案${result.failed.length > 0 ? `，${result.failed.length} 個失敗` : ''}`,
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response, 201)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  // ============ 檔案管理 ============

  /**
   * 獲取檔案列表
   * GET /files
   */
  async getFiles(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const currentUser = c.get('currentUser')

      // 從查詢參數獲取篩選條件
      const query: FileListQuery = {
        page: parseInt(c.req.query('page') || '1'),
        limit: Math.min(parseInt(c.req.query('limit') || '20'), 100),
        category: c.req.query('category') || undefined,
        status: c.req.query('status') || undefined,
        relatedType: c.req.query('relatedType') || undefined,
        relatedId: c.req.query('relatedId') || undefined,
        isPublic: c.req.query('isPublic') ? c.req.query('isPublic') === 'true' : undefined,
        search: c.req.query('search') || undefined,
        sortBy: (c.req.query('sortBy') as any) || 'createdAt',
        sortOrder: (c.req.query('sortOrder') as any) || 'desc',
        startDate: c.req.query('startDate') || undefined,
        endDate: c.req.query('endDate') || undefined
      }

      // 如果不是管理員，只能查看自己上傳的檔案
      if (currentUser?.role !== 'admin') {
        query.uploadedBy = currentUser?.customerId || currentUser?.adminId
      } else if (c.req.query('uploadedBy')) {
        query.uploadedBy = c.req.query('uploadedBy')
      }

      const { files, total, summary } = await this.uploadService.getFiles(query)

      const response: FileListResponse = {
        success: true,
        data: {
          files,
          pagination: {
            page: query.page || 1,
            limit: query.limit || 20,
            total,
            totalPages: Math.ceil(total / (query.limit || 20))
          },
          summary
        },
        message: '獲取檔案列表成功',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 獲取單一檔案詳情
   * GET /files/:fileId
   */
  async getFile(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const fileId = c.req.param('fileId')
      const currentUser = c.get('currentUser')

      if (!fileId) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '檔案 ID 不能為空'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      const file = await this.uploadService.getFileById(fileId)
      const transformedFile = await this.uploadService['transformDbFileToFile'](file)

      // 檢查權限（只有上傳者或管理員可以查看私有檔案）
      if (!transformedFile.isPublic && currentUser?.role !== 'admin' && 
          transformedFile.uploadedBy !== currentUser?.customerId) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '沒有權限查看此檔案'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 403)
      }

      const response: FileUploadResponse = {
        success: true,
        data: transformedFile,
        message: '獲取檔案詳情成功',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 更新檔案資訊
   * PATCH /files/:fileId
   */
  async updateFile(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const fileId = c.req.param('fileId')
      const currentUser = c.get('currentUser')
      const body = await c.req.json()

      if (!fileId) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '檔案 ID 不能為空'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 檢查檔案是否存在和權限
      const dbFile = await this.uploadService.getFileById(fileId)
      const file = await this.uploadService['transformDbFileToFile'](dbFile)

      if (currentUser?.role !== 'admin' && file.uploadedBy !== currentUser?.customerId) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '沒有權限修改此檔案'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 403)
      }

      // 更新檔案
      const updatedFile = await this.uploadService.updateFile(fileId, body)

      const response: FileUploadResponse = {
        success: true,
        data: updatedFile,
        message: '檔案資訊更新成功',
        timestamp: new Date().toISOString(),
        requestId
      }

      return c.json(response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 刪除檔案
   * DELETE /files/:fileId
   */
  async deleteFile(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const fileId = c.req.param('fileId')
      const currentUser = c.get('currentUser')
      const hardDelete = c.req.query('hard') === 'true'

      if (!fileId) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '檔案 ID 不能為空'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 檢查檔案是否存在和權限
      const dbFile = await this.uploadService.getFileById(fileId)
      const file = await this.uploadService['transformDbFileToFile'](dbFile)

      if (currentUser?.role !== 'admin' && file.uploadedBy !== currentUser?.customerId) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '沒有權限刪除此檔案'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 403)
      }

      // 只有管理員可以硬刪除
      if (hardDelete && currentUser?.role !== 'admin') {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '沒有權限永久刪除檔案'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 403)
      }

      await this.uploadService.deleteFile(fileId, hardDelete)

      return c.json({
        success: true,
        message: hardDelete ? '檔案已永久刪除' : '檔案已刪除',
        timestamp: new Date().toISOString(),
        requestId
      })
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 批量刪除檔案
   * DELETE /files
   */
  async deleteFiles(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const currentUser = c.get('currentUser')
      const body = await c.req.json()
      const fileIds = body.fileIds as string[]
      const hardDelete = body.hardDelete === true

      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: '請提供要刪除的檔案 ID 列表'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 限制批量刪除數量
      const maxFiles = 50
      if (fileIds.length > maxFiles) {
        return c.json({
          success: false,
          error: {
            code: 'TOO_MANY_FILES',
            message: `一次最多可刪除 ${maxFiles} 個檔案`
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 只有管理員可以硬刪除
      if (hardDelete && currentUser?.role !== 'admin') {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '沒有權限永久刪除檔案'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 403)
      }

      // 如果不是管理員，需要檢查每個檔案的權限
      if (currentUser?.role !== 'admin') {
        for (const fileId of fileIds) {
          try {
            const dbFile = await this.uploadService.getFileById(fileId)
            const file = await this.uploadService['transformDbFileToFile'](dbFile)
            if (file.uploadedBy !== currentUser?.customerId) {
              return c.json({
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: `沒有權限刪除檔案 ${fileId}`
                },
                timestamp: new Date().toISOString(),
                requestId
              }, 403)
            }
          } catch (error) {
            // 檔案不存在，跳過
            continue
          }
        }
      }

      const result = await this.uploadService.deleteFiles(fileIds, hardDelete)

      return c.json({
        success: true,
        data: result,
        message: `成功刪除 ${result.success} 個檔案${result.failed.length > 0 ? `，${result.failed.length} 個失敗` : ''}`,
        timestamp: new Date().toISOString(),
        requestId
      })
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  // ============ 統計功能 ============

  /**
   * 獲取上傳統計
   * GET /files/stats
   */
  async getUploadStats(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const currentUser = c.get('currentUser')

      // 只有管理員可以查看全域統計
      if (currentUser?.role !== 'admin') {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '沒有權限查看統計資料'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 403)
      }

      const startDate = c.req.query('startDate')
      const endDate = c.req.query('endDate')

      const stats = await this.uploadService.getUploadStats(startDate, endDate)

      return c.json({
        success: true,
        data: stats,
        message: '獲取上傳統計成功',
        timestamp: new Date().toISOString(),
        requestId
      })
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 檔案清理
   * POST /files/cleanup
   */
  async cleanupFiles(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId')
      const currentUser = c.get('currentUser')

      // 只有管理員可以執行檔案清理
      if (currentUser?.role !== 'admin') {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '沒有權限執行檔案清理'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 403)
      }

      const body = await c.req.json()
      const result = await this.uploadService.cleanupFiles(body)

      return c.json({
        success: true,
        data: result,
        message: `清理完成，刪除 ${result.deletedFiles} 個檔案，釋放 ${this.formatFileSize(result.freedSpace)} 空間`,
        timestamp: new Date().toISOString(),
        requestId
      })
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  // ============ 輔助方法 ============

  /**
   * 格式化檔案大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  // ============ 錯誤處理 ============

  private handleError(c: Context, error: unknown): Response {
    const requestId = c.get('requestId')
    
    if (error && typeof error === 'object' && 'code' in error && 'statusCode' in error) {
      const uploadError = error as UploadError
      return c.json({
        success: false,
        error: {
          code: uploadError.code,
          message: uploadError.message,
          details: uploadError.details
        },
        timestamp: new Date().toISOString(),
        requestId
      }, uploadError.statusCode)
    }

    // 預設錯誤處理
    console.error('Unexpected error in UploadController:', error)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服務器內部錯誤'
      },
      timestamp: new Date().toISOString(),
      requestId
    }, 500)
  }
}