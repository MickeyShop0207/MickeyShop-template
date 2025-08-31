// React Query 配置
import { QueryClientConfig } from '@tanstack/react-query'

export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // 緩存時間配置
      staleTime: 5 * 60 * 1000, // 5 分鐘
      gcTime: 10 * 60 * 1000, // 10 分鐘
      
      // 重試配置
      retry: (failureCount, error: any) => {
        // 不重試的狀態碼
        const noRetryStatuses = [400, 401, 403, 404, 422]
        if (error?.statusCode && noRetryStatuses.includes(error.statusCode)) {
          return false
        }
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => {
        return Math.min(1000 * 2 ** attemptIndex, 30000) // 指數退避，最多 30 秒
      },
      
      // 網路重連時重新獲取
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      
      // 錯誤處理
      throwOnError: false,
      
      // 網路模式
      networkMode: 'online',
    },
    mutations: {
      // Mutation 預設不重試
      retry: false,
      
      // 錯誤處理
      throwOnError: (error: any) => {
        // 對於某些錯誤類型拋出異常
        return error?.statusCode >= 500
      },
      
      // 網路模式
      networkMode: 'online',
    },
  },
}