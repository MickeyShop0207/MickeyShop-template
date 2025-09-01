/**
 * 認證初始化 Hook
 * 在應用啟動時初始化用戶認證狀態
 */

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'

export const useAuthInit = () => {
  const { initAuth, startTokenRefreshTimer, stopTokenRefreshTimer, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // 初始化認證狀態
    initAuth()

    // 清理函數：組件卸載時停止 Token 刷新計時器
    return () => {
      stopTokenRefreshTimer()
    }
  }, [initAuth, stopTokenRefreshTimer])

  // 當認證狀態改變時，管理 Token 刷新計時器
  useEffect(() => {
    if (isAuthenticated) {
      startTokenRefreshTimer()
    } else {
      stopTokenRefreshTimer()
    }
  }, [isAuthenticated, startTokenRefreshTimer, stopTokenRefreshTimer])
}

export default useAuthInit