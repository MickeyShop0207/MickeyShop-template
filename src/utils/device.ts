/**
 * 設備檢測工具函數
 */

// 獲取用戶代理
export const getUserAgent = (): string => {
  return navigator.userAgent || ''
}

// 檢查是否為移動設備
export const isMobile = (): boolean => {
  const userAgent = getUserAgent()
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
}

// 檢查是否為平板設備
export const isTablet = (): boolean => {
  const userAgent = getUserAgent()
  return /iPad|Android(?!.*Mobile)/i.test(userAgent)
}

// 檢查是否為桌面設備
export const isDesktop = (): boolean => {
  return !isMobile() && !isTablet()
}

// 檢查是否為 iOS 設備
export const isIOS = (): boolean => {
  const userAgent = getUserAgent()
  return /iPad|iPhone|iPod/.test(userAgent)
}

// 檢查是否為 Android 設備
export const isAndroid = (): boolean => {
  const userAgent = getUserAgent()
  return /Android/.test(userAgent)
}

// 檢查是否為 Chrome 瀏覽器
export const isChrome = (): boolean => {
  const userAgent = getUserAgent()
  return /Chrome/.test(userAgent) && !/Edg/.test(userAgent)
}

// 檢查是否為 Firefox 瀏覽器
export const isFirefox = (): boolean => {
  const userAgent = getUserAgent()
  return /Firefox/.test(userAgent)
}

// 檢查是否為 Safari 瀏覽器
export const isSafari = (): boolean => {
  const userAgent = getUserAgent()
  return /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
}

// 檢查是否為 Edge 瀏覽器
export const isEdge = (): boolean => {
  const userAgent = getUserAgent()
  return /Edg/.test(userAgent)
}

// 檢查是否為 IE 瀏覽器
export const isIE = (): boolean => {
  const userAgent = getUserAgent()
  return /MSIE|Trident/.test(userAgent)
}

// 獲取瀏覽器名稱
export const getBrowserName = (): string => {
  if (isChrome()) return 'Chrome'
  if (isFirefox()) return 'Firefox'
  if (isSafari()) return 'Safari'
  if (isEdge()) return 'Edge'
  if (isIE()) return 'Internet Explorer'
  return 'Unknown'
}

// 獲取操作系統
export const getOS = (): string => {
  const userAgent = getUserAgent()
  
  if (/Windows NT 10.0/.test(userAgent)) return 'Windows 10'
  if (/Windows NT 6.3/.test(userAgent)) return 'Windows 8.1'
  if (/Windows NT 6.2/.test(userAgent)) return 'Windows 8'
  if (/Windows NT 6.1/.test(userAgent)) return 'Windows 7'
  if (/Windows NT 6.0/.test(userAgent)) return 'Windows Vista'
  if (/Windows NT 5.1/.test(userAgent)) return 'Windows XP'
  if (/Windows/.test(userAgent)) return 'Windows'
  
  if (/Mac OS X 10_15/.test(userAgent)) return 'macOS Catalina'
  if (/Mac OS X 10_14/.test(userAgent)) return 'macOS Mojave'
  if (/Mac OS X 10_13/.test(userAgent)) return 'macOS High Sierra'
  if (/Mac OS X/.test(userAgent)) return 'macOS'
  
  if (/iPhone OS/.test(userAgent)) return 'iOS'
  if (/iPad/.test(userAgent)) return 'iPadOS'
  if (/Android/.test(userAgent)) return 'Android'
  if (/Linux/.test(userAgent)) return 'Linux'
  
  return 'Unknown'
}

// 獲取屏幕尺寸
export const getScreenSize = (): { width: number; height: number } => {
  return {
    width: window.screen.width,
    height: window.screen.height
  }
}

// 獲取視窗尺寸
export const getViewportSize = (): { width: number; height: number } => {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  }
}

// 獲取設備像素比
export const getDevicePixelRatio = (): number => {
  return window.devicePixelRatio || 1
}

// 檢查是否支持觸摸
export const supportsTouchEvents = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// 檢查是否支持地理位置
export const supportsGeolocation = (): boolean => {
  return 'geolocation' in navigator
}

// 檢查是否支持本地存儲
export const supportsLocalStorage = (): boolean => {
  try {
    const test = 'test'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// 檢查是否支持 Session Storage
export const supportsSessionStorage = (): boolean => {
  try {
    const test = 'test'
    sessionStorage.setItem(test, test)
    sessionStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// 檢查是否支持 IndexedDB
export const supportsIndexedDB = (): boolean => {
  return 'indexedDB' in window
}

// 檢查是否支持 Service Worker
export const supportsServiceWorker = (): boolean => {
  return 'serviceWorker' in navigator
}

// 檢查是否支持 Push 通知
export const supportsPushNotifications = (): boolean => {
  return 'PushManager' in window && 'Notification' in window && 'serviceWorker' in navigator
}

// 檢查是否支持 WebRTC
export const supportsWebRTC = (): boolean => {
  return 'RTCPeerConnection' in window || 'webkitRTCPeerConnection' in window || 'mozRTCPeerConnection' in window
}

// 檢查網路連接狀態
export const isOnline = (): boolean => {
  return navigator.onLine
}

// 獲取網路連接類型
export const getConnectionType = (): string => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  return connection ? connection.effectiveType || 'unknown' : 'unknown'
}

// 檢查是否為深色模式
export const isDarkMode = (): boolean => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

// 檢查是否為縮小動畫偏好
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// 獲取設備信息摘要
export const getDeviceInfo = () => {
  return {
    userAgent: getUserAgent(),
    browser: getBrowserName(),
    os: getOS(),
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
    screenSize: getScreenSize(),
    viewportSize: getViewportSize(),
    devicePixelRatio: getDevicePixelRatio(),
    supportsTouch: supportsTouchEvents(),
    isOnline: isOnline(),
    connectionType: getConnectionType(),
    isDarkMode: isDarkMode(),
    prefersReducedMotion: prefersReducedMotion()
  }
}