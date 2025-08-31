/**
 * API 響應類型定義
 * 統一前後台API響應格式
 */

// ============ 基礎響應類型 ============
export interface BaseResponse {
  success: boolean
  timestamp: string
  requestId: string
}

// 成功響應
export interface SuccessResponse<T = any> extends BaseResponse {
  success: true
  data: T
  meta?: ResponseMeta
  message?: string
}

// 錯誤響應
export interface ErrorResponse extends BaseResponse {
  success: false
  error: APIError
}

// 響應元數據
export interface ResponseMeta {
  pagination?: PaginationMeta
  total?: number
  filters?: Record<string, any>
  sort?: string
  operation?: 'created' | 'updated' | 'deleted'
  changes?: string[]
}

// 分頁元數據
export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// API 錯誤
export interface APIError {
  code: string
  message: string
  details?: any
  field?: string
  validation?: ValidationError[]
}

// 驗證錯誤
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

// ============ 請求類型 ============
// 基礎請求
export interface BaseRequest {
  requestId?: string
  timestamp?: string
}

// 分頁請求
export interface PaginationRequest {
  page?: number
  pageSize?: number
  limit?: number
}

// 排序請求
export interface SortRequest {
  sort?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 篩選請求
export interface FilterRequest {
  filters?: Record<string, any>
  search?: string
  searchFields?: string[]
}

// 查詢請求（組合型）
export interface QueryRequest 
  extends PaginationRequest, 
          SortRequest, 
          FilterRequest {
  include?: string[]
  fields?: string[]
  dateFrom?: string
  dateTo?: string
}

// ============ 錯誤代碼枚舉 ============
export enum APIErrorCode {
  // 系統級錯誤 (1000-1999)
  INTERNAL_SERVER_ERROR = 'SYS_1000',
  DATABASE_ERROR = 'SYS_1001',
  CACHE_ERROR = 'SYS_1002',
  EXTERNAL_SERVICE_ERROR = 'SYS_1003',
  CONFIGURATION_ERROR = 'SYS_1004',

  // 認證授權錯誤 (2000-2999)
  UNAUTHORIZED = 'AUTH_2000',
  FORBIDDEN = 'AUTH_2001',
  TOKEN_EXPIRED = 'AUTH_2002',
  TOKEN_INVALID = 'AUTH_2003',
  LOGIN_FAILED = 'AUTH_2004',
  ACCOUNT_LOCKED = 'AUTH_2005',
  ACCOUNT_INACTIVE = 'AUTH_2006',
  INSUFFICIENT_PERMISSIONS = 'AUTH_2007',

  // 驗證錯誤 (3000-3999)
  VALIDATION_FAILED = 'VAL_3000',
  REQUIRED_FIELD = 'VAL_3001',
  INVALID_FORMAT = 'VAL_3002',
  INVALID_LENGTH = 'VAL_3003',
  INVALID_RANGE = 'VAL_3004',
  DUPLICATE_VALUE = 'VAL_3005',
  INVALID_FILE_TYPE = 'VAL_3006',
  FILE_TOO_LARGE = 'VAL_3007',

  // 業務邏輯錯誤 (4000-4999)
  RESOURCE_NOT_FOUND = 'BIZ_4000',
  RESOURCE_CONFLICT = 'BIZ_4001',
  INSUFFICIENT_INVENTORY = 'BIZ_4002',
  ORDER_CANNOT_BE_CANCELLED = 'BIZ_4003',
  PAYMENT_FAILED = 'BIZ_4004',
  SHIPPING_NOT_AVAILABLE = 'BIZ_4005',
  PROMOTION_NOT_APPLICABLE = 'BIZ_4006',
  OPERATION_NOT_ALLOWED = 'BIZ_4007',

  // 外部服務錯誤 (5000-5999)
  PAYMENT_GATEWAY_ERROR = 'EXT_5000',
  LOGISTICS_API_ERROR = 'EXT_5001',
  EMAIL_SERVICE_ERROR = 'EXT_5002',
  SMS_SERVICE_ERROR = 'EXT_5003',
  STORAGE_SERVICE_ERROR = 'EXT_5004',
  THIRD_PARTY_API_ERROR = 'EXT_5005',

  // 速率限制錯誤 (6000-6999)
  RATE_LIMIT_EXCEEDED = 'RATE_6000',
  TOO_MANY_REQUESTS = 'RATE_6001',
  QUOTA_EXCEEDED = 'RATE_6002',
}

// ============ HTTP 狀態碼映射 ============
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

// ============ API 版本 ============
export type APIVersion = 'v1'

// ============ 工具類型 ============
// API 響應類型（聯合類型）
export type APIResponse<T = any> = SuccessResponse<T> | ErrorResponse

// 請求處理器類型
export type RequestHandler<T = any> = (
  request: any,
  context?: any
) => Promise<APIResponse<T>>

// 中間件類型
export type Middleware = (
  request: any,
  context: any,
  next: () => Promise<any>
) => Promise<any>

// 路由定義類型
export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  handler: RequestHandler
  middleware?: Middleware[]
  auth?: boolean
  permissions?: string[]
  rateLimit?: {
    requests: number
    window: number
  }
}

// ============ 響應構建器工具函數類型 ============
export interface ResponseBuilder {
  success<T>(data: T, meta?: ResponseMeta, status?: number): APIResponse<T>
  error(
    code: APIErrorCode | string,
    message: string,
    status?: number,
    details?: any
  ): ErrorResponse
  paginated<T>(
    data: T[],
    pagination: PaginationMeta,
    filters?: any,
    sort?: string
  ): SuccessResponse<T[]>
  created<T>(data: T, meta?: ResponseMeta): SuccessResponse<T>
  updated<T>(data: T, changes?: string[]): SuccessResponse<T>
  deleted(): APIResponse<null>
  notFound(resource?: string): ErrorResponse
  unauthorized(message?: string): ErrorResponse
  forbidden(message?: string): ErrorResponse
  validationError(errors: ValidationError[]): ErrorResponse
}

// ============ 類型守衛 ============
export function isSuccessResponse<T>(
  response: APIResponse<T>
): response is SuccessResponse<T> {
  return response.success === true
}

export function isErrorResponse(
  response: APIResponse<any>
): response is ErrorResponse {
  return response.success === false
}

// ============ 常用響應模板 ============
export const COMMON_RESPONSES = {
  UNAUTHORIZED: {
    success: false,
    error: {
      code: APIErrorCode.UNAUTHORIZED,
      message: '未授權訪問',
    }
  } as ErrorResponse,
  
  FORBIDDEN: {
    success: false,
    error: {
      code: APIErrorCode.FORBIDDEN,
      message: '權限不足',
    }
  } as ErrorResponse,
  
  NOT_FOUND: {
    success: false,
    error: {
      code: APIErrorCode.RESOURCE_NOT_FOUND,
      message: '資源未找到',
    }
  } as ErrorResponse,
  
  INTERNAL_ERROR: {
    success: false,
    error: {
      code: APIErrorCode.INTERNAL_SERVER_ERROR,
      message: '伺服器內部錯誤',
    }
  } as ErrorResponse,
}