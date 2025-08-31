// 本地存儲 Hook
import { useState, useEffect, useCallback } from 'react'

/**
 * 使用本地存儲的 Hook
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 讀取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // 設置值的函數
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // 允許函數式更新
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      // 保存到 localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        
        // 觸發存儲事件，讓其他組件知道值已更改
        window.dispatchEvent(new Event('localStorage'))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // 移除值的函數
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
        window.dispatchEvent(new Event('localStorage'))
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // 監聽存儲變化
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent | Event) => {
      if (e instanceof StorageEvent && e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage key "${key}":`, error)
        }
      } else if (e.type === 'localStorage') {
        // 處理自定義的 localStorage 事件
        try {
          const item = window.localStorage.getItem(key)
          setStoredValue(item ? JSON.parse(item) : initialValue)
        } catch (error) {
          console.warn(`Error reading localStorage key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('localStorage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorage', handleStorageChange)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

/**
 * 使用會話存儲的 Hook
 */
export function useSessionStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

/**
 * 檢查本地存儲是否可用
 */
export function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    if (typeof window === 'undefined') return false
    
    const storage = window[type]
    const x = '__storage_test__'
    storage.setItem(x, x)
    storage.removeItem(x)
    return true
  } catch (e) {
    return false
  }
}

/**
 * 獲取存儲使用情況
 */
export function getStorageUsage(type: 'localStorage' | 'sessionStorage'): {
  used: number
  available: number
  percentage: number
} {
  if (typeof window === 'undefined' || !isStorageAvailable(type)) {
    return { used: 0, available: 0, percentage: 0 }
  }

  const storage = window[type]
  let used = 0
  
  // 計算已使用空間
  for (let key in storage) {
    if (storage.hasOwnProperty(key)) {
      used += storage[key].length + key.length
    }
  }

  // 估算總可用空間 (通常是 5-10MB)
  const available = type === 'localStorage' ? 5 * 1024 * 1024 : 5 * 1024 * 1024
  const percentage = (used / available) * 100

  return { used, available, percentage }
}

/**
 * 清空存儲
 */
export function clearStorage(type: 'localStorage' | 'sessionStorage'): void {
  if (typeof window !== 'undefined' && isStorageAvailable(type)) {
    window[type].clear()
    window.dispatchEvent(new Event(type))
  }
}

/**
 * 批量設置存儲項目
 */
export function setStorageItems(
  type: 'localStorage' | 'sessionStorage',
  items: Record<string, any>
): void {
  if (typeof window === 'undefined' || !isStorageAvailable(type)) return

  const storage = window[type]
  
  Object.entries(items).forEach(([key, value]) => {
    try {
      storage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error setting ${type} key "${key}":`, error)
    }
  })

  window.dispatchEvent(new Event(type))
}

/**
 * 批量獲取存儲項目
 */
export function getStorageItems(
  type: 'localStorage' | 'sessionStorage',
  keys: string[]
): Record<string, any> {
  if (typeof window === 'undefined' || !isStorageAvailable(type)) return {}

  const storage = window[type]
  const result: Record<string, any> = {}

  keys.forEach(key => {
    try {
      const item = storage.getItem(key)
      if (item !== null) {
        result[key] = JSON.parse(item)
      }
    } catch (error) {
      console.warn(`Error getting ${type} key "${key}":`, error)
    }
  })

  return result
}

/**
 * 使用存儲同步 - 在多個標籤頁間同步數據
 */
export function useStorageSync<T>(key: string, initialValue: T) {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    value,
    setValue,
    removeValue,
    isOnline,
    isSynced: true // 本地存儲始終是同步的
  }
}