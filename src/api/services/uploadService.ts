// 檔案上傳 API 服務
import { apiClient } from '../index'
import type { UploadResponse } from '../types'

// 上傳配置
export interface UploadConfig {
  maxSize?: number // 最大文件大小 (bytes)
  allowedTypes?: string[] // 允許的文件類型
  folder?: string // 上傳到特定文件夾
  resize?: {
    width?: number
    height?: number
    quality?: number
  }
  onProgress?: (progress: number) => void
}

// 批量上傳響應
export interface BatchUploadResponse {
  successful: UploadResponse[]
  failed: Array<{
    filename: string
    error: string
  }>
  total: number
  successCount: number
  failureCount: number
}

// 圖片處理選項
export interface ImageProcessOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpg' | 'png' | 'webp'
  crop?: 'fit' | 'fill' | 'pad'
}

export class UploadService {
  private readonly baseUrl = '/api/v1/uploads'
  private readonly adminBaseUrl = '/api/admin/v1/uploads'

  // ===================
  // 通用上傳 API
  // ===================

  /**
   * 上傳單個文件
   */
  async uploadFile(
    file: File, 
    config?: UploadConfig
  ): Promise<UploadResponse> {
    // 驗證文件大小
    if (config?.maxSize && file.size > config.maxSize) {
      throw new Error(`文件大小不能超過 ${Math.round(config.maxSize / 1024 / 1024)}MB`)
    }

    // 驗證文件類型
    if (config?.allowedTypes && !config.allowedTypes.includes(file.type)) {
      throw new Error(`不支持的文件類型: ${file.type}`)
    }

    const formData = new FormData()
    formData.append('file', file)
    
    if (config?.folder) {
      formData.append('folder', config.folder)
    }

    if (config?.resize) {
      formData.append('resize', JSON.stringify(config.resize))
    }

    return apiClient.request<UploadResponse>({
      method: 'POST',
      url: this.baseUrl,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: config?.onProgress ? (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        )
        config.onProgress!(progress)
      } : undefined
    })
  }

  /**
   * 批量上傳文件
   */
  async uploadFiles(
    files: File[],
    config?: UploadConfig
  ): Promise<BatchUploadResponse> {
    const formData = new FormData()
    
    files.forEach((file, index) => {
      // 驗證每個文件
      if (config?.maxSize && file.size > config.maxSize) {
        throw new Error(`文件 ${file.name} 大小不能超過 ${Math.round(config.maxSize / 1024 / 1024)}MB`)
      }

      if (config?.allowedTypes && !config.allowedTypes.includes(file.type)) {
        throw new Error(`文件 ${file.name} 類型不支持: ${file.type}`)
      }

      formData.append(`files`, file)
    })
    
    if (config?.folder) {
      formData.append('folder', config.folder)
    }

    if (config?.resize) {
      formData.append('resize', JSON.stringify(config.resize))
    }

    return apiClient.request<BatchUploadResponse>({
      method: 'POST',
      url: `${this.baseUrl}/batch`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: config?.onProgress ? (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        )
        config.onProgress!(progress)
      } : undefined
    })
  }

  // ===================
  // 圖片上傳專用 API
  // ===================

  /**
   * 上傳圖片 (自動處理和優化)
   */
  async uploadImage(
    file: File,
    options?: ImageProcessOptions & {
      folder?: string
      onProgress?: (progress: number) => void
    }
  ): Promise<UploadResponse> {
    // 驗證是否為圖片文件
    if (!file.type.startsWith('image/')) {
      throw new Error('只能上傳圖片文件')
    }

    return this.uploadFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      folder: options?.folder || 'images',
      resize: options ? {
        width: options.width,
        height: options.height,
        quality: options.quality
      } : undefined,
      onProgress: options?.onProgress
    })
  }

  /**
   * 上傳商品圖片
   */
  async uploadProductImage(
    file: File,
    options?: {
      onProgress?: (progress: number) => void
    }
  ): Promise<UploadResponse> {
    return this.uploadImage(file, {
      folder: 'products',
      width: 800,
      height: 800,
      quality: 85,
      onProgress: options?.onProgress
    })
  }

  /**
   * 上傳用戶頭像
   */
  async uploadAvatar(
    file: File,
    options?: {
      onProgress?: (progress: number) => void
    }
  ): Promise<UploadResponse> {
    return this.uploadImage(file, {
      folder: 'avatars',
      width: 200,
      height: 200,
      quality: 80,
      onProgress: options?.onProgress
    })
  }

  /**
   * 上傳分類圖片
   */
  async uploadCategoryImage(
    file: File,
    options?: {
      onProgress?: (progress: number) => void
    }
  ): Promise<UploadResponse> {
    return this.uploadImage(file, {
      folder: 'categories',
      width: 400,
      height: 300,
      quality: 85,
      onProgress: options?.onProgress
    })
  }

  /**
   * 上傳品牌標誌
   */
  async uploadBrandLogo(
    file: File,
    options?: {
      onProgress?: (progress: number) => void
    }
  ): Promise<UploadResponse> {
    return this.uploadImage(file, {
      folder: 'brands',
      width: 300,
      height: 200,
      quality: 90,
      onProgress: options?.onProgress
    })
  }

  // ===================
  // 圖片處理 API
  // ===================

  /**
   * 處理已上傳的圖片
   */
  async processImage(
    imageUrl: string,
    options: ImageProcessOptions
  ): Promise<UploadResponse> {
    return apiClient.post<UploadResponse>(`${this.baseUrl}/process`, {
      imageUrl,
      options
    })
  }

  /**
   * 生成圖片的多種尺寸
   */
  async generateImageSizes(
    imageUrl: string,
    sizes: Array<{ name: string; width: number; height: number; quality?: number }>
  ): Promise<Record<string, UploadResponse>> {
    return apiClient.post<Record<string, UploadResponse>>(`${this.baseUrl}/generate-sizes`, {
      imageUrl,
      sizes
    })
  }

  // ===================
  // Base64 上傳 API
  // ===================

  /**
   * 上傳 Base64 圖片
   */
  async uploadBase64Image(
    base64Data: string,
    filename: string,
    options?: {
      folder?: string
      resize?: ImageProcessOptions
    }
  ): Promise<UploadResponse> {
    return apiClient.post<UploadResponse>(`${this.baseUrl}/base64`, {
      data: base64Data,
      filename,
      folder: options?.folder || 'images',
      resize: options?.resize
    })
  }

  // ===================
  // 文件管理 API
  // ===================

  /**
   * 獲取已上傳文件列表
   */
  async getUploadedFiles(params?: {
    folder?: string
    type?: string
    page?: number
    limit?: number
    sort?: string
  }): Promise<{
    files: Array<{
      id: string
      filename: string
      url: string
      size: number
      mimetype: string
      folder: string
      createdAt: string
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const url = searchParams.toString()
      ? `${this.baseUrl}/files?${searchParams.toString()}`
      : `${this.baseUrl}/files`

    return apiClient.get<{
      files: Array<{
        id: string
        filename: string
        url: string
        size: number
        mimetype: string
        folder: string
        createdAt: string
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(url)
  }

  /**
   * 刪除文件
   */
  async deleteFile(fileId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.baseUrl}/files/${fileId}`)
  }

  /**
   * 批量刪除文件
   */
  async deleteFiles(fileIds: string[]): Promise<{ 
    deletedCount: number
    failedCount: number
    message: string 
  }> {
    return apiClient.delete<{
      deletedCount: number
      failedCount: number
      message: string
    }>(`${this.baseUrl}/files/batch`, {
      data: { fileIds }
    })
  }

  // ===================
  // 管理後台 API (需要管理員權限)
  // ===================

  /**
   * 獲取上傳統計 (管理員)
   */
  async getUploadStats(): Promise<{
    totalFiles: number
    totalSize: number
    filesByType: Record<string, number>
    recentUploads: Array<{
      filename: string
      size: number
      mimetype: string
      createdAt: string
    }>
  }> {
    return apiClient.get<{
      totalFiles: number
      totalSize: number
      filesByType: Record<string, number>
      recentUploads: Array<{
        filename: string
        size: number
        mimetype: string
        createdAt: string
      }>
    }>(`${this.adminBaseUrl}/stats`)
  }

  /**
   * 清理無用文件 (管理員)
   */
  async cleanupOrphanedFiles(): Promise<{
    deletedCount: number
    freedSpace: number
    message: string
  }> {
    return apiClient.post<{
      deletedCount: number
      freedSpace: number
      message: string
    }>(`${this.adminBaseUrl}/cleanup`)
  }

  // ===================
  // 工具方法
  // ===================

  /**
   * 驗證文件類型
   */
  isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    return validTypes.includes(file.type)
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 預覽文件 (生成本地 URL)
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  /**
   * 釋放預覽 URL
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }
}

// 導出服務實例
export const uploadService = new UploadService()