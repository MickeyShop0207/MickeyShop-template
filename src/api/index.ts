// API Client - 統一 API 客戶端
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'

// 基礎配置
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

// 響應數據類型
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: {
    code: string
    message: string
    errors?: Array<{
      field: string
      message: string
      code: string
    }>
    timestamp: string
    requestId: string
  }
}

// 分頁響應類型
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 錯誤處理
export class ApiError extends Error {
  public code: string
  public statusCode: number
  public errors?: Array<{ field: string; message: string; code: string }>

  constructor(
    message: string,
    code: string,
    statusCode: number,
    errors?: Array<{ field: string; message: string; code: string }>
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.errors = errors
  }
}

// API 客戶端類
class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 請求攔截器
    this.instance.interceptors.request.use(
      (config) => {
        // 添加 Authorization header
        const token = this.getAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 響應攔截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // 成功響應直接返回
        return response
      },
      async (error) => {
        const originalRequest = error.config

        // Token 過期處理
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            await this.refreshToken()
            const token = this.getAccessToken()
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return this.instance(originalRequest)
            }
          } catch (refreshError) {
            // Refresh token 也失效，清除所有 token
            this.clearTokens()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        // 處理錯誤響應
        if (error.response?.data) {
          const errorData = error.response.data
          const apiError = new ApiError(
            errorData.error?.message || 'API 請求失敗',
            errorData.error?.code || 'API_ERROR',
            error.response.status,
            errorData.error?.errors
          )

          // 顯示錯誤消息
          if (error.response.status >= 400 && error.response.status < 500) {
            message.error(apiError.message)
          } else if (error.response.status >= 500) {
            message.error('服務器錯誤，請稍後重試')
          }

          return Promise.reject(apiError)
        }

        return Promise.reject(error)
      }
    )
  }

  // Token 管理
  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken')
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  }

  private clearTokens() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  // 刷新 Token
  private async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await axios.post(
      `${BASE_URL}/api/v1/auth/refresh`,
      { refreshToken },
      { timeout: 5000 }
    )

    if (response.data.success && response.data.data.tokens) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens
      this.setTokens(accessToken, newRefreshToken)
    } else {
      throw new Error('Token refresh failed')
    }
  }

  // 通用請求方法
  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance(config)
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new ApiError(
          response.data.error?.message || '請求失敗',
          response.data.error?.code || 'REQUEST_FAILED',
          response.status,
          response.data.error?.errors
        )
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('網絡錯誤', 'NETWORK_ERROR', 0)
    }
  }

  // GET 請求
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url })
  }

  // POST 請求
  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data })
  }

  // PUT 請求
  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data })
  }

  // DELETE 請求
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url })
  }

  // PATCH 請求
  public async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data })
  }

  // 上傳文件
  public async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
        ? (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            )
            onProgress(progress)
          }
        : undefined
    })
  }
}

// 創建 API 客戶端實例
export const apiClient = new ApiClient()

// 導出類型
export type { AxiosRequestConfig, AxiosResponse }