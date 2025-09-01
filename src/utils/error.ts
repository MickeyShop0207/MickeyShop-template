/**
 * 錯誤處理工具函數
 */

// 錯誤類型定義
export interface ErrorInfo {
  name: string
  message: string
  stack?: string
  code?: string | number
  status?: number
  timestamp: number
  url: string
  userAgent: string
}

// 自定義錯誤類
export class CustomError extends Error {
  public code?: string | number
  public status?: number
  public timestamp: number

  constructor(message: string, code?: string | number, status?: number) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.status = status
    this.timestamp = Date.now()
  }
}

// API 錯誤類
export class APIError extends CustomError {
  constructor(message: string, status: number, code?: string | number) {
    super(message, code, status)
    this.name = 'APIError'
  }
}

// 驗證錯誤類
export class ValidationError extends CustomError {
  public field?: string

  constructor(message: string, field?: string) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

// 網路錯誤類
export class NetworkError extends CustomError {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

// 權限錯誤類
export class PermissionError extends CustomError {
  constructor(message: string) {
    super(message, 'PERMISSION_DENIED', 403)
    this.name = 'PermissionError'
  }
}

// 捕獲並格式化錯誤信息
export const captureError = (error: Error | any): ErrorInfo => {
  return {
    name: error?.name || 'UnknownError',
    message: error?.message || String(error),
    stack: error?.stack,
    code: error?.code,
    status: error?.status,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent
  }
}

// 錯誤日誌記錄
export const logError = (error: Error | any, context?: Record<string, any>): void => {
  const errorInfo = captureError(error)
  
  console.error('Error captured:', {
    ...errorInfo,
    context
  })
  
  // 在生產環境中，這裡可以發送錯誤到日誌服務
  if (process.env.NODE_ENV === 'production') {
    // 發送到錯誤監控服務 (如 Sentry, LogRocket 等)
    // sendErrorToService(errorInfo, context)
  }
}

// 異步錯誤處理包裝器
export const asyncErrorHandler = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): T => {
  return ((...args: any[]) => {
    return fn(...args).catch((error: Error) => {
      logError(error, { function: fn.name, args })
      throw error
    })
  }) as T
}

// 同步錯誤處理包裝器
export const errorHandler = <T extends (...args: any[]) => any>(
  fn: T
): T => {
  return ((...args: any[]) => {
    try {
      return fn(...args)
    } catch (error) {
      logError(error, { function: fn.name, args })
      throw error
    }
  }) as T
}

// 錯誤重試機制
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
  backoff = 2
): Promise<T> => {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        break
      }
      
      // 等待指定時間後重試
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt)))
    }
  }
  
  throw lastError!
}

// 錯誤邊界處理
export const withErrorBoundary = <T>(
  component: T,
  fallback: React.ComponentType<{ error: Error; resetError: () => void }>
): T => {
  // 這裡需要配合 React Error Boundary 使用
  return component
}

// 解析 API 錯誤
export const parseAPIError = (error: any): APIError => {
  if (error instanceof APIError) {
    return error
  }
  
  const status = error?.response?.status || error?.status || 500
  const message = error?.response?.data?.message || error?.message || '未知錯誤'
  const code = error?.response?.data?.code || error?.code
  
  return new APIError(message, status, code)
}

// 格式化錯誤消息供用戶查看
export const formatErrorMessage = (error: Error | any): string => {
  if (error instanceof ValidationError) {
    return `驗證錯誤: ${error.message}`
  }
  
  if (error instanceof NetworkError) {
    return '網路連接錯誤，請檢查您的網路連接'
  }
  
  if (error instanceof PermissionError) {
    return '您沒有執行此操作的權限'
  }
  
  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        return '請求參數錯誤'
      case 401:
        return '請先登入'
      case 403:
        return '權限不足'
      case 404:
        return '請求的資源不存在'
      case 500:
        return '服務器內部錯誤'
      default:
        return error.message || '系統錯誤'
    }
  }
  
  return error?.message || '未知錯誤'
}

// 檢查錯誤類型
export const isNetworkError = (error: any): boolean => {
  return error instanceof NetworkError || 
         error?.code === 'NETWORK_ERROR' ||
         error?.message?.includes('Network Error')
}

export const isAPIError = (error: any): boolean => {
  return error instanceof APIError || error?.response?.status
}

export const isValidationError = (error: any): boolean => {
  return error instanceof ValidationError || error?.name === 'ValidationError'
}

// 全局錯誤處理器
export const setupGlobalErrorHandler = (): void => {
  // 處理未捕獲的 Promise 錯誤
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, { type: 'unhandledrejection' })
  })
  
  // 處理未捕獲的 JavaScript 錯誤
  window.addEventListener('error', (event) => {
    logError(event.error, { 
      type: 'javascript',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })
}