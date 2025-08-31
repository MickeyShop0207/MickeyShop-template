/**
 * 檔案上傳服務層
 * 處理檔案上傳、儲存和管理的業務邏輯
 */

import { eq, desc, asc, and, gte, lte, like, sql, or, inArray } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { fileUploads, type FileUpload as DbFileUpload, type NewFileUpload } from '@/core/database/schema/orders'
import type {
  FileUpload,
  FileUploadRequest,
  BatchUploadRequest,
  FileListQuery,
  FileValidationConfig,
  FileValidationResult,
  StorageProvider,
  R2UploadOptions,
  ThumbnailConfig,
  ImageProcessingOptions,
  FileCleanupOptions,
  FileCleanupResult,
  UploadStats,
  UploadError,
  FILE_CATEGORY_CONFIGS,
  DEFAULT_THUMBNAIL_SIZES
} from './types'

export class UploadService {
  constructor(
    private db: DrizzleD1Database,
    private r2Bucket: R2Bucket,
    private baseUrl: string = 'https://your-domain.com'
  ) {}

  // ============ 檔案上傳 ============

  /**
   * 單檔上傳
   */
  async uploadFile(request: FileUploadRequest, uploadedBy?: string, uploadedByType?: 'admin' | 'customer'): Promise<FileUpload> {
    try {
      // 1. 驗證檔案
      const validationResult = await this.validateFile(request.file, request.category, request.originalName)
      if (!validationResult.valid) {
        throw this.createError('FILE_VALIDATION_FAILED', validationResult.errors?.join(', ') || '檔案驗證失敗', 400, {
          errors: validationResult.errors,
          warnings: validationResult.warnings
        })
      }

      // 2. 準備檔案資訊
      const fileInfo = validationResult.fileInfo!
      const fileId = this.generateFileId()
      const fileExtension = fileInfo.extension
      const fileName = this.generateFileName(fileId, fileExtension)
      const storageKey = this.generateStorageKey(request.category, fileName)

      // 3. 處理檔案資料
      let fileBuffer: ArrayBuffer
      if (request.file instanceof File) {
        fileBuffer = await request.file.arrayBuffer()
      } else {
        fileBuffer = request.file
      }

      // 4. 如果是圖片且需要處理，進行圖片處理
      let processedBuffer = fileBuffer
      let imageWidth = fileInfo.imageWidth
      let imageHeight = fileInfo.imageHeight

      if (fileInfo.isImage && request.category !== 'thumbnail') {
        // 可在此處添加圖片處理邏輯（壓縮、調整大小等）
        // const processedResult = await this.processImage(fileBuffer, { ... })
        // processedBuffer = processedResult.buffer
        // imageWidth = processedResult.width
        // imageHeight = processedResult.height
      }

      // 5. 上傳到 R2
      const uploadOptions: R2UploadOptions = {
        contentType: fileInfo.mimeType,
        cacheControl: request.isPublic !== false ? 'public, max-age=31536000' : 'private, max-age=3600',
        customMetadata: {
          originalName: request.originalName,
          category: request.category,
          fileId: fileId,
          uploadedBy: uploadedBy || 'system',
          uploadedAt: new Date().toISOString()
        }
      }

      await this.uploadToR2(storageKey, processedBuffer, uploadOptions)

      // 6. 生成縮圖（如果需要且是圖片）
      let thumbnails: Array<{ size: string; url: string; width: number; height: number }> = []
      if (request.generateThumbnails && fileInfo.isImage && request.category !== 'thumbnail') {
        thumbnails = await this.generateThumbnails(
          fileBuffer,
          fileInfo.mimeType,
          request.thumbnailSizes || DEFAULT_THUMBNAIL_SIZES,
          storageKey
        )
      }

      // 7. 儲存檔案資訊到資料庫
      const storageUrl = this.getR2Url(storageKey)
      const cdnUrl = this.getCdnUrl(storageKey)

      const fileData: NewFileUpload = {
        fileId,
        originalName: request.originalName,
        fileName,
        mimeType: fileInfo.mimeType,
        fileSize: fileInfo.size,
        fileExtension,
        storageProvider: 'r2',
        storageKey,
        storageUrl,
        cdnUrl,
        category: request.category,
        purpose: request.purpose,
        relatedType: request.relatedType,
        relatedId: request.relatedId,
        imageWidth,
        imageHeight,
        thumbnails: thumbnails.length > 0 ? JSON.stringify(thumbnails) : null,
        status: 'active',
        isPublic: request.isPublic !== false,
        uploadedBy,
        uploadedByType,
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await this.db.insert(fileUploads).values(fileData)

      return this.transformDbFileToFile(await this.getFileById(fileId))
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError('UPLOAD_ERROR', error instanceof Error ? error.message : '檔案上傳時發生錯誤', 500)
    }
  }

  /**
   * 批量上傳
   */
  async uploadFiles(request: BatchUploadRequest, uploadedBy?: string, uploadedByType?: 'admin' | 'customer'): Promise<{
    uploads: FileUpload[]
    failed: Array<{ originalName: string; error: string }>
  }> {
    const uploads: FileUpload[] = []
    const failed: Array<{ originalName: string; error: string }> = []

    for (const fileRequest of request.files) {
      try {
        const uploadRequest: FileUploadRequest = {
          ...fileRequest,
          isPublic: request.isPublic,
          generateThumbnails: request.generateThumbnails
        }

        const uploadedFile = await this.uploadFile(uploadRequest, uploadedBy, uploadedByType)
        uploads.push(uploadedFile)
      } catch (error) {
        failed.push({
          originalName: fileRequest.originalName,
          error: error instanceof Error ? error.message : '未知錯誤'
        })
      }
    }

    return { uploads, failed }
  }

  // ============ 檔案管理 ============

  /**
   * 根據 ID 獲取檔案
   */
  async getFileById(fileId: string): Promise<DbFileUpload> {
    const file = await this.db
      .select()
      .from(fileUploads)
      .where(and(eq(fileUploads.fileId, fileId), eq(fileUploads.deletedAt, null)))
      .get()

    if (!file) {
      throw this.createError('FILE_NOT_FOUND', '檔案不存在', 404)
    }

    return file
  }

  /**
   * 獲取檔案列表
   */
  async getFiles(query: FileListQuery): Promise<{ files: FileUpload[], total: number, summary: any }> {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        status,
        relatedType,
        relatedId,
        uploadedBy,
        isPublic,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate
      } = query

      const offset = (page - 1) * limit

      // 建立查詢條件
      const conditions = [eq(fileUploads.deletedAt, null)]

      if (category) conditions.push(eq(fileUploads.category, category))
      if (status) conditions.push(eq(fileUploads.status, status))
      if (relatedType) conditions.push(eq(fileUploads.relatedType, relatedType))
      if (relatedId) conditions.push(eq(fileUploads.relatedId, relatedId))
      if (uploadedBy) conditions.push(eq(fileUploads.uploadedBy, uploadedBy))
      if (isPublic !== undefined) conditions.push(eq(fileUploads.isPublic, isPublic))
      if (startDate) conditions.push(gte(fileUploads.createdAt, startDate))
      if (endDate) conditions.push(lte(fileUploads.createdAt, endDate))
      if (search) {
        conditions.push(
          or(
            like(fileUploads.originalName, `%${search}%`),
            like(fileUploads.fileName, `%${search}%`)
          )
        )
      }

      // 排序條件
      const orderByColumn = sortBy === 'createdAt' ? fileUploads.createdAt :
                          sortBy === 'fileSize' ? fileUploads.fileSize :
                          fileUploads.originalName
      const orderDirection = sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn)

      // 獲取檔案列表
      const fileList = await this.db
        .select()
        .from(fileUploads)
        .where(and(...conditions))
        .orderBy(orderDirection)
        .limit(limit)
        .offset(offset)
        .all()

      // 獲取總數和統計
      const [{ count, totalSize }] = await this.db
        .select({ 
          count: sql<number>`count(*)`,
          totalSize: sql<number>`sum(${fileUploads.fileSize})`
        })
        .from(fileUploads)
        .where(and(...conditions))
        .all()

      // 檔案類型統計
      const fileTypeStats = await this.db
        .select({
          mimeType: fileUploads.mimeType,
          count: sql<number>`count(*)`
        })
        .from(fileUploads)
        .where(and(...conditions))
        .groupBy(fileUploads.mimeType)
        .all()

      const fileTypes = fileTypeStats.reduce((acc, stat) => {
        acc[stat.mimeType] = stat.count
        return acc
      }, {} as Record<string, number>)

      const files = fileList.map(file => this.transformDbFileToFile(file))

      return {
        files,
        total: count,
        summary: {
          totalSize: totalSize || 0,
          totalFiles: count,
          fileTypes
        }
      }
    } catch (error) {
      throw this.createError('GET_FILES_ERROR', error instanceof Error ? error.message : '獲取檔案列表時發生錯誤', 500)
    }
  }

  /**
   * 更新檔案資訊
   */
  async updateFile(fileId: string, updates: Partial<Pick<FileUpload, 'category' | 'purpose' | 'relatedType' | 'relatedId' | 'isPublic' | 'status'>>): Promise<FileUpload> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      }

      const result = await this.db
        .update(fileUploads)
        .set(updateData)
        .where(eq(fileUploads.fileId, fileId))
        .returning()
        .get()

      if (!result) {
        throw this.createError('FILE_NOT_FOUND', '檔案不存在', 404)
      }

      return this.transformDbFileToFile(result)
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError('UPDATE_FILE_ERROR', error instanceof Error ? error.message : '更新檔案時發生錯誤', 500)
    }
  }

  /**
   * 刪除檔案
   */
  async deleteFile(fileId: string, hardDelete: boolean = false): Promise<void> {
    try {
      const file = await this.getFileById(fileId)

      if (hardDelete) {
        // 從 R2 刪除實際檔案
        await this.deleteFromR2(file.storageKey)

        // 如果有縮圖，也要刪除
        if (file.thumbnails) {
          const thumbnails = JSON.parse(file.thumbnails as string)
          for (const thumb of thumbnails) {
            try {
              const thumbKey = this.extractKeyFromUrl(thumb.url)
              await this.deleteFromR2(thumbKey)
            } catch (error) {
              console.warn(`Failed to delete thumbnail: ${thumb.url}`, error)
            }
          }
        }

        // 從資料庫刪除記錄
        await this.db
          .delete(fileUploads)
          .where(eq(fileUploads.fileId, fileId))
      } else {
        // 軟刪除
        await this.db
          .update(fileUploads)
          .set({
            status: 'deleted',
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .where(eq(fileUploads.fileId, fileId))
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError('DELETE_FILE_ERROR', error instanceof Error ? error.message : '刪除檔案時發生錯誤', 500)
    }
  }

  /**
   * 批量刪除檔案
   */
  async deleteFiles(fileIds: string[], hardDelete: boolean = false): Promise<{
    success: number
    failed: Array<{ fileId: string; error: string }>
  }> {
    const failed: Array<{ fileId: string; error: string }> = []
    let success = 0

    for (const fileId of fileIds) {
      try {
        await this.deleteFile(fileId, hardDelete)
        success++
      } catch (error) {
        failed.push({
          fileId,
          error: error instanceof Error ? error.message : '未知錯誤'
        })
      }
    }

    return { success, failed }
  }

  // ============ 檔案驗證 ============

  /**
   * 驗證檔案
   */
  async validateFile(file: File | ArrayBuffer, category: string, originalName: string): Promise<FileValidationResult> {
    try {
      const errors: string[] = []
      const warnings: string[] = []

      // 獲取分類配置
      const config = FILE_CATEGORY_CONFIGS[category]
      if (!config) {
        errors.push(`不支援的檔案分類: ${category}`)
        return { valid: false, errors }
      }

      // 獲取檔案基本資訊
      let buffer: ArrayBuffer
      let size: number

      if (file instanceof File) {
        buffer = await file.arrayBuffer()
        size = file.size
      } else {
        buffer = file
        size = buffer.byteLength
      }

      // 從檔案名稱獲取副檔名
      const extension = this.getFileExtension(originalName).toLowerCase()
      
      // 檢測 MIME 類型
      const mimeType = this.detectMimeType(new Uint8Array(buffer), extension)

      // 驗證副檔名
      if (!config.allowedExtensions.includes(extension)) {
        errors.push(`不支援的檔案格式: ${extension}。支援格式: ${config.allowedExtensions.join(', ')}`)
      }

      // 驗證 MIME 類型
      if (!config.allowedMimeTypes.includes(mimeType)) {
        errors.push(`不支援的檔案類型: ${mimeType}。支援類型: ${config.allowedMimeTypes.join(', ')}`)
      }

      // 驗證檔案大小
      if (size > config.maxFileSize) {
        errors.push(`檔案過大: ${this.formatFileSize(size)}。最大允許: ${this.formatFileSize(config.maxFileSize)}`)
      }

      if (config.minFileSize && size < config.minFileSize) {
        errors.push(`檔案過小: ${this.formatFileSize(size)}。最小要求: ${this.formatFileSize(config.minFileSize)}`)
      }

      // 如果是圖片，驗證圖片尺寸
      let imageWidth: number | undefined
      let imageHeight: number | undefined
      const isImage = this.isImageType(mimeType)

      if (isImage) {
        try {
          const dimensions = await this.getImageDimensions(buffer)
          imageWidth = dimensions.width
          imageHeight = dimensions.height

          if (config.maxImageWidth && imageWidth > config.maxImageWidth) {
            errors.push(`圖片寬度過大: ${imageWidth}px。最大允許: ${config.maxImageWidth}px`)
          }

          if (config.maxImageHeight && imageHeight > config.maxImageHeight) {
            errors.push(`圖片高度過大: ${imageHeight}px。最大允許: ${config.maxImageHeight}px`)
          }

          if (config.minImageWidth && imageWidth < config.minImageWidth) {
            errors.push(`圖片寬度過小: ${imageWidth}px。最小要求: ${config.minImageWidth}px`)
          }

          if (config.minImageHeight && imageHeight < config.minImageHeight) {
            errors.push(`圖片高度過小: ${imageHeight}px。最小要求: ${config.minImageHeight}px`)
          }

          // 品質警告
          if (imageWidth < 800 || imageHeight < 600) {
            warnings.push('圖片解析度較低，可能影響顯示品質')
          }
        } catch (error) {
          errors.push('無法讀取圖片資訊，檔案可能損壞')
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        fileInfo: {
          mimeType,
          extension,
          size,
          isImage,
          imageWidth,
          imageHeight
        }
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`檔案驗證失敗: ${error instanceof Error ? error.message : '未知錯誤'}`]
      }
    }
  }

  // ============ 檔案清理 ============

  /**
   * 清理檔案
   */
  async cleanupFiles(options: FileCleanupOptions): Promise<FileCleanupResult> {
    try {
      const conditions = [eq(fileUploads.deletedAt, null)]

      // 根據選項設置條件
      if (options.deleteOlderThan) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - options.deleteOlderThan)
        conditions.push(lte(fileUploads.createdAt, cutoffDate.toISOString()))
      }

      if (options.deleteByStatus) {
        conditions.push(inArray(fileUploads.status, options.deleteByStatus))
      }

      if (options.deleteByCategory) {
        conditions.push(inArray(fileUploads.category, options.deleteByCategory))
      }

      // 獲取要刪除的檔案
      const filesToDelete = await this.db
        .select()
        .from(fileUploads)
        .where(and(...conditions))
        .all()

      if (options.dryRun) {
        const totalSize = filesToDelete.reduce((sum, file) => sum + file.fileSize, 0)
        return {
          deletedFiles: filesToDelete.length,
          freedSpace: totalSize,
          errors: []
        }
      }

      // 實際刪除
      const errors: Array<{ fileId: string; error: string }> = []
      let deletedFiles = 0
      let freedSpace = 0

      for (const file of filesToDelete) {
        try {
          await this.deleteFile(file.fileId, true)
          deletedFiles++
          freedSpace += file.fileSize
        } catch (error) {
          errors.push({
            fileId: file.fileId,
            error: error instanceof Error ? error.message : '未知錯誤'
          })
        }
      }

      return {
        deletedFiles,
        freedSpace,
        errors
      }
    } catch (error) {
      throw this.createError('CLEANUP_ERROR', error instanceof Error ? error.message : '檔案清理時發生錯誤', 500)
    }
  }

  // ============ 統計功能 ============

  /**
   * 獲取上傳統計
   */
  async getUploadStats(startDate?: string, endDate?: string): Promise<UploadStats> {
    try {
      const conditions = [eq(fileUploads.deletedAt, null)]
      
      if (startDate) conditions.push(gte(fileUploads.createdAt, startDate))
      if (endDate) conditions.push(lte(fileUploads.createdAt, endDate))

      // 基本統計
      const [stats] = await this.db
        .select({
          totalFiles: sql<number>`count(*)`,
          totalSize: sql<number>`sum(${fileUploads.fileSize})`
        })
        .from(fileUploads)
        .where(and(...conditions))
        .all()

      // 分類統計
      const categoryStats = await this.db
        .select({
          category: fileUploads.category,
          count: sql<number>`count(*)`
        })
        .from(fileUploads)
        .where(and(...conditions))
        .groupBy(fileUploads.category)
        .all()

      const filesByCategory = categoryStats.reduce((acc, stat) => {
        acc[stat.category] = stat.count
        return acc
      }, {} as Record<string, number>)

      // 類型統計
      const typeStats = await this.db
        .select({
          mimeType: fileUploads.mimeType,
          count: sql<number>`count(*)`
        })
        .from(fileUploads)
        .where(and(...conditions))
        .groupBy(fileUploads.mimeType)
        .all()

      const filesByType = typeStats.reduce((acc, stat) => {
        acc[stat.mimeType] = stat.count
        return acc
      }, {} as Record<string, number>)

      // 每日上傳統計
      const dailyStats = await this.db
        .select({
          date: sql<string>`date(${fileUploads.createdAt})`,
          count: sql<number>`count(*)`,
          size: sql<number>`sum(${fileUploads.fileSize})`
        })
        .from(fileUploads)
        .where(and(...conditions))
        .groupBy(sql`date(${fileUploads.createdAt})`)
        .orderBy(sql`date(${fileUploads.createdAt})`)
        .all()

      return {
        totalFiles: stats.totalFiles || 0,
        totalSize: stats.totalSize || 0,
        filesByCategory,
        filesByType,
        uploadsByDate: dailyStats,
        storageUsage: {
          used: stats.totalSize || 0
          // available 和 percentage 需要根據實際儲存空間配置計算
        }
      }
    } catch (error) {
      throw this.createError('GET_STATS_ERROR', error instanceof Error ? error.message : '獲取統計資料時發生錯誤', 500)
    }
  }

  // ============ 輔助方法 ============

  /**
   * 生成檔案 ID
   */
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成檔案名稱
   */
  private generateFileName(fileId: string, extension: string): string {
    return `${fileId}${extension}`
  }

  /**
   * 生成儲存路徑
   */
  private generateStorageKey(category: string, fileName: string): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    
    return `uploads/${category}/${year}/${month}/${day}/${fileName}`
  }

  /**
   * 上傳到 R2
   */
  private async uploadToR2(key: string, data: ArrayBuffer, options: R2UploadOptions): Promise<void> {
    try {
      await this.r2Bucket.put(key, data, {
        httpMetadata: {
          contentType: options.contentType,
          cacheControl: options.cacheControl
        },
        customMetadata: options.customMetadata
      })
    } catch (error) {
      throw this.createError('R2_UPLOAD_ERROR', `R2 上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}`, 500)
    }
  }

  /**
   * 從 R2 刪除
   */
  private async deleteFromR2(key: string): Promise<void> {
    try {
      await this.r2Bucket.delete(key)
    } catch (error) {
      throw this.createError('R2_DELETE_ERROR', `R2 刪除失敗: ${error instanceof Error ? error.message : '未知錯誤'}`, 500)
    }
  }

  /**
   * 獲取 R2 URL
   */
  private getR2Url(key: string): string {
    // 這裡需要根據實際的 R2 配置修改
    return `https://your-r2-domain/${key}`
  }

  /**
   * 獲取 CDN URL
   */
  private getCdnUrl(key: string): string {
    // 這裡需要根據實際的 CDN 配置修改
    return `https://your-cdn-domain/${key}`
  }

  /**
   * 從 URL 提取 key
   */
  private extractKeyFromUrl(url: string): string {
    const urlObj = new URL(url)
    return urlObj.pathname.substring(1) // 移除開頭的 /
  }

  /**
   * 獲取檔案副檔名
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.substring(lastDot) : ''
  }

  /**
   * 檢測 MIME 類型
   */
  private detectMimeType(buffer: Uint8Array, extension: string): string {
    // 簡化的 MIME 類型檢測，實際應該根據檔案簽名檢測
    // 這裡基於副檔名進行基本映射
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.csv': 'text/csv'
    }

    return mimeMap[extension.toLowerCase()] || 'application/octet-stream'
  }

  /**
   * 檢查是否為圖片類型
   */
  private isImageType(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * 獲取圖片尺寸
   */
  private async getImageDimensions(buffer: ArrayBuffer): Promise<{ width: number; height: number }> {
    // 這裡需要實現圖片尺寸檢測邏輯
    // 可以使用圖片處理庫或直接解析圖片標頭
    // 暫時返回預設值
    return { width: 800, height: 600 }
  }

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

  /**
   * 生成縮圖
   */
  private async generateThumbnails(
    originalBuffer: ArrayBuffer,
    mimeType: string,
    configs: ThumbnailConfig[],
    originalKey: string
  ): Promise<Array<{ size: string; url: string; width: number; height: number }>> {
    const thumbnails: Array<{ size: string; url: string; width: number; height: number }> = []

    for (const config of configs) {
      try {
        // 這裡需要實現圖片縮放邏輯
        // 可以使用圖片處理庫
        // 暫時跳過縮圖生成
        console.log(`Generating thumbnail: ${config.width}x${config.height}`)
        
        // const resizedBuffer = await this.resizeImage(originalBuffer, config)
        // const thumbKey = originalKey.replace(/(\.[^.]+)$/, `_${config.suffix}$1`)
        // await this.uploadToR2(thumbKey, resizedBuffer, { contentType: `image/${config.format}` })
        
        // thumbnails.push({
        //   size: `${config.width}x${config.height}`,
        //   url: this.getR2Url(thumbKey),
        //   width: config.width,
        //   height: config.height
        // })
      } catch (error) {
        console.warn(`Failed to generate thumbnail ${config.width}x${config.height}:`, error)
      }
    }

    return thumbnails
  }

  /**
   * 轉換資料庫檔案為 API 格式
   */
  private transformDbFileToFile(file: DbFileUpload): FileUpload {
    return {
      fileId: file.fileId,
      originalName: file.originalName,
      fileName: file.fileName,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      fileExtension: file.fileExtension,
      storageProvider: file.storageProvider as any,
      storageKey: file.storageKey,
      storageUrl: file.storageUrl,
      cdnUrl: file.cdnUrl || undefined,
      category: file.category as any,
      purpose: file.purpose || undefined,
      relatedType: file.relatedType as any || undefined,
      relatedId: file.relatedId || undefined,
      imageWidth: file.imageWidth || undefined,
      imageHeight: file.imageHeight || undefined,
      thumbnails: file.thumbnails ? JSON.parse(file.thumbnails as string) : undefined,
      status: file.status as any,
      isPublic: !!file.isPublic,
      uploadedBy: file.uploadedBy || undefined,
      uploadedByType: file.uploadedByType as any || undefined,
      processedAt: file.processedAt || undefined,
      metadata: file.metadata ? JSON.parse(file.metadata as string) : undefined,
      createdAt: file.createdAt!,
      updatedAt: file.updatedAt!
    }
  }

  /**
   * 創建錯誤對象
   */
  private createError(code: string, message: string, statusCode: number, details?: Record<string, any>): UploadError {
    const error = new Error(message) as UploadError
    error.code = code
    error.statusCode = statusCode
    error.details = details
    return error
  }
}