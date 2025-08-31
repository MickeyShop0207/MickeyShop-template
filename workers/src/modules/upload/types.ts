/**
 * 檔案上傳模組類型定義
 * 完整的檔案上傳和管理相關介面
 */

// ============ 檔案上傳相關介面 ============

export interface FileUploadRequest {
  file: File | ArrayBuffer
  originalName: string
  category: 'avatar' | 'product' | 'banner' | 'document' | 'gallery' | 'thumbnail'
  purpose?: string // 具體用途描述
  relatedType?: 'customer' | 'product' | 'order' | 'category' | 'admin'
  relatedId?: string
  isPublic?: boolean
  generateThumbnails?: boolean
  thumbnailSizes?: Array<{ width: number; height: number; suffix: string }>
}

export interface BatchUploadRequest {
  files: Array<{
    file: File | ArrayBuffer
    originalName: string
    category: FileUploadRequest['category']
    purpose?: string
    relatedType?: string
    relatedId?: string
  }>
  isPublic?: boolean
  generateThumbnails?: boolean
}

export interface FileUpload {
  fileId: string
  originalName: string
  fileName: string
  mimeType: string
  fileSize: number
  fileExtension: string
  
  // 儲存資訊
  storageProvider: 'r2' | 's3' | 'local'
  storageKey: string
  storageUrl: string
  cdnUrl?: string
  
  // 分類和用途
  category: 'avatar' | 'product' | 'banner' | 'document' | 'gallery' | 'thumbnail'
  purpose?: string
  
  // 關聯資訊
  relatedType?: 'customer' | 'product' | 'order' | 'category' | 'admin'
  relatedId?: string
  
  // 圖片特定資訊
  imageWidth?: number
  imageHeight?: number
  thumbnails?: Array<{
    size: string // "150x150", "300x300", etc.
    url: string
    width: number
    height: number
  }>
  
  // 狀態
  status: 'active' | 'deleted' | 'processing'
  isPublic: boolean
  
  // 上傳者資訊
  uploadedBy?: string
  uploadedByType?: 'admin' | 'customer'
  
  // 處理資訊
  processedAt?: string
  
  // 系統欄位
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface FileListQuery {
  page?: number
  limit?: number
  category?: string
  status?: string
  relatedType?: string
  relatedId?: string
  uploadedBy?: string
  isPublic?: boolean
  search?: string // 搜尋檔案名稱
  sortBy?: 'createdAt' | 'fileSize' | 'originalName'
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
}

// ============ API 回應介面 ============

export interface FileUploadResponse {
  success: boolean
  data: FileUpload
  message: string
  timestamp: string
  requestId: string
}

export interface BatchUploadResponse {
  success: boolean
  data: {
    uploads: FileUpload[]
    failed: Array<{
      originalName: string
      error: string
    }>
    summary: {
      total: number
      success: number
      failed: number
    }
  }
  message: string
  timestamp: string
  requestId: string
}

export interface FileListResponse {
  success: boolean
  data: {
    files: FileUpload[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    summary: {
      totalSize: number
      totalFiles: number
      fileTypes: Record<string, number>
    }
  }
  message: string
  timestamp: string
  requestId: string
}

// ============ 圖片處理介面 ============

export interface ImageProcessingOptions {
  resize?: {
    width?: number
    height?: number
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  }
  quality?: number // 1-100
  format?: 'jpeg' | 'png' | 'webp' | 'avif'
  blur?: number
  sharpen?: boolean
  grayscale?: boolean
}

export interface ThumbnailConfig {
  width: number
  height: number
  suffix: string
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

// ============ 檔案驗證介面 ============

export interface FileValidationConfig {
  allowedMimeTypes: string[]
  allowedExtensions: string[]
  maxFileSize: number // bytes
  minFileSize?: number // bytes
  maxImageWidth?: number
  maxImageHeight?: number
  minImageWidth?: number
  minImageHeight?: number
}

export interface FileValidationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
  fileInfo?: {
    mimeType: string
    extension: string
    size: number
    isImage: boolean
    imageWidth?: number
    imageHeight?: number
  }
}

// ============ 儲存提供者介面 ============

export interface StorageProvider {
  name: 'r2' | 's3' | 'local'
  upload(key: string, data: ArrayBuffer, options?: StorageUploadOptions): Promise<string>
  delete(key: string): Promise<void>
  getUrl(key: string): string
  exists(key: string): Promise<boolean>
}

export interface StorageUploadOptions {
  contentType?: string
  cacheControl?: string
  metadata?: Record<string, string>
}

// ============ R2 特定介面 ============

export interface R2UploadOptions extends StorageUploadOptions {
  customMetadata?: Record<string, string>
}

export interface R2FileInfo {
  key: string
  size: number
  etag: string
  lastModified: Date
  contentType?: string
  customMetadata?: Record<string, string>
}

// ============ 檔案清理介面 ============

export interface FileCleanupOptions {
  deleteOlderThan?: number // days
  deleteByStatus?: Array<'active' | 'deleted' | 'processing'>
  deleteByCategory?: string[]
  dryRun?: boolean
}

export interface FileCleanupResult {
  deletedFiles: number
  freedSpace: number // bytes
  errors: Array<{
    fileId: string
    error: string
  }>
}

// ============ 錯誤類型 ============

export interface UploadError extends Error {
  code: string
  statusCode: number
  details?: Record<string, any>
}

// ============ 統計介面 ============

export interface UploadStats {
  totalFiles: number
  totalSize: number
  filesByCategory: Record<string, number>
  filesByType: Record<string, number>
  uploadsByDate: Array<{
    date: string
    count: number
    size: number
  }>
  storageUsage: {
    used: number
    available?: number
    percentage?: number
  }
}

// ============ 常數定義 ============

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
] as const

export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json'
] as const

export const DEFAULT_THUMBNAIL_SIZES: ThumbnailConfig[] = [
  { width: 150, height: 150, suffix: 'thumb', quality: 80, format: 'webp' },
  { width: 300, height: 300, suffix: 'small', quality: 85, format: 'webp' },
  { width: 600, height: 600, suffix: 'medium', quality: 90, format: 'webp' },
  { width: 1200, height: 1200, suffix: 'large', quality: 95, format: 'webp' }
]

export const FILE_CATEGORY_CONFIGS: Record<string, FileValidationConfig> = {
  avatar: {
    allowedMimeTypes: SUPPORTED_IMAGE_TYPES.slice(),
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxImageWidth: 1024,
    maxImageHeight: 1024,
    minImageWidth: 100,
    minImageHeight: 100
  },
  product: {
    allowedMimeTypes: SUPPORTED_IMAGE_TYPES.slice(),
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxImageWidth: 2048,
    maxImageHeight: 2048,
    minImageWidth: 200,
    minImageHeight: 200
  },
  banner: {
    allowedMimeTypes: SUPPORTED_IMAGE_TYPES.slice(),
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxImageWidth: 4096,
    maxImageHeight: 2048,
    minImageWidth: 800,
    minImageHeight: 400
  },
  document: {
    allowedMimeTypes: [...SUPPORTED_DOCUMENT_TYPES],
    allowedExtensions: ['.pdf', '.txt', '.csv', '.json'],
    maxFileSize: 20 * 1024 * 1024, // 20MB
  },
  gallery: {
    allowedMimeTypes: SUPPORTED_IMAGE_TYPES.slice(),
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxFileSize: 8 * 1024 * 1024, // 8MB
    maxImageWidth: 3840,
    maxImageHeight: 2160
  },
  thumbnail: {
    allowedMimeTypes: SUPPORTED_IMAGE_TYPES.slice(),
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSize: 1 * 1024 * 1024, // 1MB
    maxImageWidth: 512,
    maxImageHeight: 512
  }
}