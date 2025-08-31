/**
 * 應用程式配置文件 - 統一配置管理
 */

// 環境配置
export const env = {
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  SSR: import.meta.env.SSR
} as const

// API 配置
export const apiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000')
} as const

// 應用程式配置
export const appConfig = {
  name: 'MickeyShop Beauty',
  version: '1.0.0',
  description: '美妝電商平台 - 專業美妝產品一站式購物',
  author: 'MickeyShop Beauty Team',
  defaultLocale: 'zh-TW',
  supportedLocales: ['zh-TW', 'zh-CN', 'zh-HK', 'en-US', 'ja-JP', 'ko-KR'] as const,
  defaultCurrency: 'TWD',
  supportedCurrencies: ['TWD', 'CNY', 'HKD', 'USD', 'JPY', 'KRW'] as const,
  defaultTheme: 'light',
  supportedThemes: ['light', 'dark'] as const,
} as const

// 效能配置
export const performanceConfig = {
  // React Query
  queryStaleTime: 5 * 60 * 1000, // 5 分鐘
  queryCacheTime: 10 * 60 * 1000, // 10 分鐘
  queryRetryAttempts: 3,
  queryRetryDelay: 1000,
  
  // 動畫效能
  animationPerformanceMode: 'auto' as 'auto' | 'high' | 'reduced' | 'disabled',
  reducedMotionEnabled: false,
  
  // 圖片懶載入
  imageIntersectionThreshold: 0.1,
  imageRootMargin: '50px',
  
  // 虛擬滾動
  virtualScrollItemHeight: 100,
  virtualScrollBuffer: 5,
} as const

// 安全配置
export const securityConfig = {
  // JWT
  tokenStorageKey: 'auth-token',
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 分鐘前刷新
  
  // CSRF
  csrfHeaderName: 'X-CSRF-Token',
  
  // 內容安全政策
  cspEnabled: env.PROD,
  
  // API 安全
  apiKeyHeader: 'X-API-Key',
} as const

// 快取配置
export const cacheConfig = {
  // 本地存儲前綴
  storagePrefix: 'mickeyshop_',
  
  // Service Worker 快取
  swCacheName: 'mickeyshop-v1',
  swCacheMaxAge: 24 * 60 * 60 * 1000, // 24 小時
  
  // API 快取
  apiCacheEnabled: true,
  apiCacheMaxAge: 60 * 60 * 1000, // 1 小時
  
  // 靜態資源快取
  staticCacheMaxAge: 30 * 24 * 60 * 60 * 1000, // 30 天
} as const

// 監控配置
export const monitoringConfig = {
  // 效能監控
  performanceMonitoringEnabled: env.PROD,
  performanceMetricsInterval: 30000, // 30 秒
  
  // 錯誤監控
  errorReportingEnabled: env.PROD,
  errorReportingUrl: import.meta.env.VITE_ERROR_REPORTING_URL,
  
  // 用戶行為追蹤
  analyticsEnabled: env.PROD,
  analyticsId: import.meta.env.VITE_ANALYTICS_ID,
} as const

// 功能特性開關
export const featureFlags = {
  // PWA 功能
  pwaEnabled: true,
  swEnabled: true,
  offlineEnabled: true,
  
  // 實驗性功能
  experimentalAnimations: env.DEV,
  experimentalFeatures: env.DEV,
  
  // A/B 測試
  abTestingEnabled: env.PROD,
  
  // 社交功能
  socialSharingEnabled: true,
  socialLoginEnabled: true,
  
  // 第三方整合
  paymentGatewayEnabled: true,
  shippingIntegrationEnabled: true,
} as const

// 業務規則配置
export const businessConfig = {
  // 購物車
  cartMaxItems: 50,
  cartSessionTimeout: 24 * 60 * 60 * 1000, // 24 小時
  
  // 訂單
  orderTimeoutMinutes: 15,
  maxOrderItemsPerTransaction: 20,
  
  // 用戶
  maxWishlistItems: 100,
  passwordMinLength: 8,
  
  // 商品
  maxProductImagesPerItem: 10,
  productReviewMaxLength: 1000,
  
  // 分頁
  defaultPageSize: 20,
  maxPageSize: 100,
} as const

// 開發工具配置
export const devConfig = {
  // React DevTools
  reactDevToolsEnabled: env.DEV,
  
  // 狀態管理 DevTools
  zustandDevToolsEnabled: env.DEV,
  
  // 日誌配置
  logLevel: env.DEV ? 'debug' : 'info',
  loggerEnabled: true,
  
  // 模擬延遲（開發測試用）
  mockApiDelay: env.DEV ? 1000 : 0,
  mockApiEnabled: env.DEV && import.meta.env.VITE_MOCK_API === 'true',
} as const

// 導出統一配置對象
export const config = {
  env,
  api: apiConfig,
  app: appConfig,
  performance: performanceConfig,
  security: securityConfig,
  cache: cacheConfig,
  monitoring: monitoringConfig,
  features: featureFlags,
  business: businessConfig,
  dev: devConfig,
} as const

// 類型導出
export type Config = typeof config
export type AppLocale = typeof appConfig.supportedLocales[number]
export type AppCurrency = typeof appConfig.supportedCurrencies[number]
export type AppTheme = typeof appConfig.supportedThemes[number]