/**
 * 通用類型定義
 * MickeyShop Beauty API 通用類型
 */

// ============ 基礎類型 ============

export type Status = 'active' | 'inactive' | 'suspended' | 'deleted'
export type UserType = 'admin' | 'customer'
export type LogLevel = 'error' | 'warn' | 'info' | 'debug'
export type SortOrder = 'asc' | 'desc'

// ============ API 響應類型 ============

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: ApiError[]
  metadata?: ResponseMetadata
}

export interface ApiError {
  field?: string
  message: string
  code?: string
}

export interface ResponseMetadata {
  pagination?: PaginationMeta
  requestId?: string
  timestamp?: string
  version?: string
  [key: string]: any
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ============ 分頁和搜尋類型 ============

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: SortOrder
}

export interface SearchParams {
  keyword?: string
  status?: string
  category?: string
  dateFrom?: string
  dateTo?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

// ============ 資料庫記錄基礎類型 ============

export interface BaseRecord {
  createdAt: string
  updatedAt: string
}

export interface SoftDeleteRecord extends BaseRecord {
  deletedAt?: string
}

export interface CreatorRecord extends BaseRecord {
  createdBy?: string
  updatedBy?: string
}

export interface FullTrackingRecord extends CreatorRecord, SoftDeleteRecord {
  deletedBy?: string
}

// ============ 使用者相關類型 ============

export interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  avatar?: string
  phone?: string
  status: Status
  type: UserType
}

export interface AuthContext {
  user?: UserProfile
  sessionId?: string
  permissions?: string[]
  roles?: string[]
}

// ============ 檔案和媒體類型 ============

export interface FileUpload {
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  thumbnailUrl?: string
  metadata?: Record<string, any>
}

export interface ImageDimensions {
  width: number
  height: number
}

export interface MediaFile extends FileUpload {
  dimensions?: ImageDimensions
  alt?: string
  caption?: string
}

// ============ 地址類型 ============

export interface Address {
  country: string
  city: string
  district?: string
  zipCode?: string
  addressLine1: string
  addressLine2?: string
}

export interface FullAddress extends Address {
  id: string
  type: 'shipping' | 'billing' | 'both'
  label?: string
  recipientName: string
  phone?: string
  isDefault: boolean
  isActive: boolean
}

// ============ 金額和定價類型 ============

export interface Price {
  amount: number
  currency: string
  formatted?: string
}

export interface PriceRange {
  min: Price
  max: Price
}

export interface Discount {
  type: 'percentage' | 'fixed'
  value: number
  minAmount?: number
  maxAmount?: number
}

// ============ 庫存和產品類型 ============

export type StockStatus = 'instock' | 'outofstock' | 'onbackorder'
export type ProductType = 'simple' | 'variable' | 'grouped' | 'external'
export type ProductStatus = 'draft' | 'published' | 'archived' | 'deleted'
export type ProductVisibility = 'visible' | 'hidden' | 'catalog' | 'search'

export interface StockInfo {
  quantity: number
  status: StockStatus
  threshold?: number
  backorders?: 'no' | 'notify' | 'yes'
}

// ============ 訂單和支付類型 ============

export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded'

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'refunded' 
  | 'cancelled'

export type PaymentMethod = 
  | 'credit_card' 
  | 'bank_transfer' 
  | 'cash_on_delivery' 
  | 'digital_wallet'

export interface OrderItem {
  productId: string
  variationId?: string
  name: string
  quantity: number
  price: number
  total: number
  metadata?: Record<string, any>
}

// ============ 通知和訊息類型 ============

export type NotificationType = 'email' | 'sms' | 'push' | 'webhook' | 'slack'
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  subject?: string
  content: string
  variables?: string[]
}

// ============ 系統和設定類型 ============

export type SettingType = 'string' | 'number' | 'boolean' | 'json' | 'text'

export interface SystemSetting {
  id: string
  category: string
  key: string
  value?: string
  defaultValue?: string
  type: SettingType
  description?: string
  isEditable: boolean
  isPublic: boolean
  options?: Record<string, any>
}

// ============ 任務和作業類型 ============

export type TaskType = 'cron' | 'queue' | 'immediate' | 'scheduled'
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type TaskPriority = 'low' | 'normal' | 'high'

export interface SystemTask {
  id: string
  name: string
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  payload?: Record<string, any>
  result?: Record<string, any>
  error?: string
  progress: number
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
}

// ============ 權限和角色類型 ============

export interface Permission {
  id: string
  name: string
  module: string
  operation: string
  resource?: string
  description?: string
}

export interface Role {
  id: string
  name: string
  displayName: string
  description?: string
  type: string
  permissions: Permission[]
}

// ============ 統計和分析類型 ============

export interface StatisticData {
  metric: string
  period: 'hour' | 'day' | 'week' | 'month' | 'year'
  value: number
  count?: number
  periodStart: string
  periodEnd: string
  data?: Record<string, any>
}

export interface DashboardWidget {
  id: string
  type: 'chart' | 'number' | 'list' | 'table'
  title: string
  data: any
  config?: Record<string, any>
}

// ============ 工具類型 ============

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type WithTimestamps<T> = T & BaseRecord

export type WithSoftDelete<T> = T & SoftDeleteRecord

export type WithCreator<T> = T & CreatorRecord

export type WithFullTracking<T> = T & FullTrackingRecord

// ============ 環境變數類型 ============

export interface AppEnvironment {
  NODE_ENV: string
  DEBUG?: string
  API_VERSION?: string
  CORS_ORIGINS?: string
  JWT_SECRET?: string
  BCRYPT_ROUNDS?: string
  
  // 外部服務
  ECPAY_MERCHANT_ID?: string
  ECPAY_HASH_KEY?: string
  ECPAY_HASH_IV?: string
  RESEND_API_KEY?: string
  SENDGRID_API_KEY?: string
}

// ============ 錯誤類型 ============

export interface AppError {
  name: string
  message: string
  code?: string
  statusCode?: number
  details?: Record<string, any>
  stack?: string
}