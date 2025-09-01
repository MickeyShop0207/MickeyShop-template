/**
 * 本地存儲工具函數
 */

// 安全的 localStorage 操作
export const localStorage = {
  // 設置項目
  setItem: (key: string, value: any): boolean => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn('localStorage.setItem failed:', error)
      return false
    }
  },
  
  // 獲取項目
  getItem: <T = any>(key: string, defaultValue?: T): T | null => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : (defaultValue ?? null)
    } catch (error) {
      console.warn('localStorage.getItem failed:', error)
      return defaultValue ?? null
    }
  },
  
  // 移除項目
  removeItem: (key: string): boolean => {
    try {
      window.localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error)
      return false
    }
  },
  
  // 清空所有項目
  clear: (): boolean => {
    try {
      window.localStorage.clear()
      return true
    } catch (error) {
      console.warn('localStorage.clear failed:', error)
      return false
    }
  },
  
  // 獲取所有鍵
  getAllKeys: (): string[] => {
    try {
      return Object.keys(window.localStorage)
    } catch (error) {
      console.warn('localStorage.getAllKeys failed:', error)
      return []
    }
  }
}

// 安全的 sessionStorage 操作
export const sessionStorage = {
  // 設置項目
  setItem: (key: string, value: any): boolean => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn('sessionStorage.setItem failed:', error)
      return false
    }
  },
  
  // 獲取項目
  getItem: <T = any>(key: string, defaultValue?: T): T | null => {
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : (defaultValue ?? null)
    } catch (error) {
      console.warn('sessionStorage.getItem failed:', error)
      return defaultValue ?? null
    }
  },
  
  // 移除項目
  removeItem: (key: string): boolean => {
    try {
      window.sessionStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn('sessionStorage.removeItem failed:', error)
      return false
    }
  },
  
  // 清空所有項目
  clear: (): boolean => {
    try {
      window.sessionStorage.clear()
      return true
    } catch (error) {
      console.warn('sessionStorage.clear failed:', error)
      return false
    }
  },
  
  // 獲取所有鍵
  getAllKeys: (): string[] => {
    try {
      return Object.keys(window.sessionStorage)
    } catch (error) {
      console.warn('sessionStorage.getAllKeys failed:', error)
      return []
    }
  }
}

// 帶過期時間的存儲
export const expirationStorage = {
  // 設置帶過期時間的項目
  setItem: (key: string, value: any, expirationMinutes: number = 60): boolean => {
    const expiration = new Date()
    expiration.setMinutes(expiration.getMinutes() + expirationMinutes)
    
    const item = {
      value,
      expiration: expiration.getTime()
    }
    
    return localStorage.setItem(key, item)
  },
  
  // 獲取項目（檢查過期時間）
  getItem: <T = any>(key: string, defaultValue?: T): T | null => {
    const item = localStorage.getItem<{value: T, expiration: number}>(key)
    
    if (!item) {
      return defaultValue ?? null
    }
    
    if (Date.now() > item.expiration) {
      localStorage.removeItem(key)
      return defaultValue ?? null
    }
    
    return item.value
  },
  
  // 移除項目
  removeItem: (key: string): boolean => {
    return localStorage.removeItem(key)
  },
  
  // 檢查項目是否過期
  isExpired: (key: string): boolean => {
    const item = localStorage.getItem<{value: any, expiration: number}>(key)
    
    if (!item) {
      return true
    }
    
    return Date.now() > item.expiration
  }
}

// Cookie 工具
export const cookie = {
  // 設置 Cookie
  set: (
    name: string,
    value: string,
    options: {
      expires?: number | Date
      path?: string
      domain?: string
      secure?: boolean
      sameSite?: 'strict' | 'lax' | 'none'
    } = {}
  ): void => {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
    
    if (options.expires) {
      const expires = options.expires instanceof Date 
        ? options.expires 
        : new Date(Date.now() + options.expires * 24 * 60 * 60 * 1000)
      cookieString += `; expires=${expires.toUTCString()}`
    }
    
    if (options.path) {
      cookieString += `; path=${options.path}`
    }
    
    if (options.domain) {
      cookieString += `; domain=${options.domain}`
    }
    
    if (options.secure) {
      cookieString += `; secure`
    }
    
    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`
    }
    
    document.cookie = cookieString
  },
  
  // 獲取 Cookie
  get: (name: string): string | null => {
    const nameEQ = `${encodeURIComponent(name)}=`
    const cookies = document.cookie.split(';')
    
    for (let cookie of cookies) {
      let c = cookie.trim()
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length))
      }
    }
    
    return null
  },
  
  // 移除 Cookie
  remove: (name: string, options: { path?: string; domain?: string } = {}): void => {
    cookie.set(name, '', {
      ...options,
      expires: new Date(0)
    })
  },
  
  // 獲取所有 Cookie
  getAll: (): Record<string, string> => {
    const cookies: Record<string, string> = {}
    
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value)
      }
    })
    
    return cookies
  }
}

// 存儲容量檢測
export const storageQuota = {
  // 檢測 localStorage 剩餘容量
  getLocalStorageUsage: (): { used: number; total: number } => {
    let used = 0
    let total = 5 * 1024 * 1024 // 5MB default estimate
    
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }
    } catch (error) {
      console.warn('Failed to calculate localStorage usage:', error)
    }
    
    return { used, total }
  },
  
  // 測試存儲容量
  testStorageCapacity: (): number => {
    const test = 'test'
    let size = 0
    
    try {
      while (true) {
        localStorage.setItem(test, test.repeat(size))
        size += test.length
      }
    } catch {
      localStorage.removeItem(test)
    }
    
    return size
  }
}