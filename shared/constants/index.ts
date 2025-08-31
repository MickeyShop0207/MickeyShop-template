/**
 * 共享常數定義
 * 定義系統中使用的所有常數
 */

// ============ 應用程式常數 ============
export const APP = {
  NAME: 'MickeyShop Beauty',
  VERSION: '1.0.0',
  DESCRIPTION: '專業美妝電商平台',
  AUTHOR: 'MickeyShop Beauty Team',
  WEBSITE: 'https://mickeyshop.com',
  EMAIL: 'contact@mickeyshop.com',
  PHONE: '+886-2-1234-5678',
} as const

// ============ API 常數 ============
export const API = {
  VERSION: 'v1',
  BASE_PATH: '/api',
  PUBLIC_PATH: '/api/v1',
  ADMIN_PATH: '/api/admin/v1',
  SYSTEM_PATH: '/api/system/v1',
  
  // 默認分頁設定
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // 速率限制
  RATE_LIMIT: {
    GENERAL: { requests: 1000, window: 3600000 }, // 1000 requests per hour
    LOGIN: { requests: 5, window: 300000 },       // 5 requests per 5 minutes
    REGISTER: { requests: 3, window: 300000 },    // 3 requests per 5 minutes
    SEARCH: { requests: 100, window: 300000 },    // 100 requests per 5 minutes
  },
  
  // 請求超時
  TIMEOUT: 30000, // 30 seconds
} as const

// ============ 認證常數 ============
export const AUTH = {
  // JWT 設定
  JWT: {
    ACCESS_TOKEN_EXPIRES: '1h',
    REFRESH_TOKEN_EXPIRES: '7d',
    ALGORITHM: 'HS256',
  },
  
  // 密碼設定
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
  },
  
  // Session 設定
  SESSION: {
    COOKIE_NAME: 'session_id',
    MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
    SECURE: true,
    HTTP_ONLY: true,
    SAME_SITE: 'lax' as const,
  },
  
  // 加密設定
  BCRYPT_ROUNDS: 12,
} as const

// ============ 檔案上傳常數 ============
export const UPLOAD = {
  // 檔案大小限制（bytes）
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,  // 5MB
  
  // 允許的檔案類型
  ALLOWED_FILE_TYPES: [
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    'pdf', 'doc', 'docx', 'xlsx', 'csv'
  ],
  
  ALLOWED_IMAGE_TYPES: [
    'jpg', 'jpeg', 'png', 'gif', 'webp'
  ],
  
  // 圖片處理設定
  IMAGE: {
    QUALITY: 85,
    THUMBNAIL_SIZES: [150, 300, 600, 1200],
    MAX_WIDTH: 2048,
    MAX_HEIGHT: 2048,
  },
  
  // 上傳路徑
  PATHS: {
    PRODUCTS: 'products',
    USERS: 'users',
    CATEGORIES: 'categories',
    TEMP: 'temp',
  },
} as const

// ============ 會員系統常數 ============
export const MEMBER = {
  // 會員等級
  TIERS: {
    BRONZE: { name: '青銅會員', minSpent: 0, pointsRate: 0.01, discountRate: 0 },
    SILVER: { name: '白銀會員', minSpent: 10000, pointsRate: 0.015, discountRate: 0.02 },
    GOLD: { name: '黃金會員', minSpent: 50000, pointsRate: 0.02, discountRate: 0.05 },
    PLATINUM: { name: '白金會員', minSpent: 100000, pointsRate: 0.025, discountRate: 0.08 },
    DIAMOND: { name: '鑽石會員', minSpent: 200000, pointsRate: 0.03, discountRate: 0.1 },
  },
  
  // 積分設定
  POINTS: {
    RATE: 0.01, // 1% 回饋率
    MIN_REDEMPTION: 100, // 最低兌換點數
    EXPIRY_MONTHS: 12, // 積分過期月數
  },
  
  // 註冊來源
  REGISTRATION_SOURCES: [
    'web', 'mobile', 'social', 'referral', 'promotion'
  ],
} as const

// ============ 商品常數 ============
export const PRODUCT = {
  // 商品狀態
  STATUSES: ['draft', 'active', 'inactive', 'archived'] as const,
  
  // 庫存管理
  INVENTORY: {
    LOW_STOCK_THRESHOLD: 10,
    REORDER_POINT: 5,
    REORDER_QUANTITY: 50,
    MAX_QUANTITY_PER_ORDER: 999,
    RESERVATION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  },
  
  // 商品圖片
  IMAGES: {
    MAX_COUNT: 10,
    REQUIRED_SIZES: ['thumbnail', 'medium', 'large', 'original'],
    ASPECT_RATIO: 1, // 1:1
  },
  
  // 商品屬性
  ATTRIBUTE_TYPES: [
    'text', 'number', 'boolean', 'date', 'color', 'image', 'select', 'multiselect'
  ] as const,
  
  // SKU 生成
  SKU: {
    PREFIX: 'MS',
    LENGTH: 10,
    INCLUDE_DATE: true,
  },
} as const

// ============ 訂單常數 ============
export const ORDER = {
  // 訂單號生成
  NUMBER: {
    PREFIX: 'MS',
    LENGTH: 12,
    INCLUDE_DATE: true,
  },
  
  // 訂單狀態
  STATUSES: {
    CREATED: 'created',
    CONFIRMED: 'confirmed',
    PAID: 'paid',
    PREPARING: 'preparing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  } as const,
  
  // 付款狀態
  PAYMENT_STATUSES: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIAL_REFUND: 'partial_refund',
  } as const,
  
  // 物流狀態
  FULFILLMENT_STATUSES: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    RETURNED: 'returned',
  } as const,
  
  // 訂單設定
  TIMEOUT: 30 * 60 * 1000, // 30 minutes
  AUTO_CONFIRM: true,
  AUTO_CANCEL_UNPAID: true,
  CANCEL_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
} as const

// ============ 付款常數 ============
export const PAYMENT = {
  // 付款方式
  METHODS: {
    CREDIT_CARD: 'credit_card',
    BANK_TRANSFER: 'bank_transfer',
    ECPAY: 'ecpay',
    LINEPAY: 'linepay',
    CASH_ON_DELIVERY: 'cod',
  } as const,
  
  // 幣別
  CURRENCIES: ['TWD', 'USD', 'JPY'] as const,
  DEFAULT_CURRENCY: 'TWD',
  
  // 付款超時
  TIMEOUT: 30 * 60 * 1000, // 30 minutes
} as const

// ============ 物流常數 ============
export const SHIPPING = {
  // 物流方式
  METHODS: {
    STANDARD: { name: '標準宅配', days: '3-5', price: 100 },
    EXPRESS: { name: '快速宅配', days: '1-2', price: 200 },
    CONVENIENCE: { name: '超商取貨', days: '3-7', price: 60 },
    FREE: { name: '免運費', days: '3-5', price: 0 },
  },
  
  // 免運設定
  FREE_SHIPPING_THRESHOLD: 1500,
  
  // 計算方式
  CALCULATION_METHOD: 'weight', // 'weight' | 'price' | 'quantity'
  
  // 重量設定
  WEIGHT_UNIT: 'kg',
  MAX_WEIGHT: 50, // kg
} as const

// ============ 促銷常數 ============
export const PROMOTION = {
  // 促銷類型
  TYPES: ['discount', 'gift', 'shipping', 'bundle'] as const,
  
  // 折扣類型
  DISCOUNT_TYPES: [
    'percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping'
  ] as const,
  
  // 條件類型
  CONDITION_TYPES: [
    'min_amount', 'min_quantity', 'product', 'category', 'customer_group'
  ] as const,
  
  // 使用限制
  USAGE: {
    DEFAULT_LIMIT: 1000,
    DEFAULT_CUSTOMER_LIMIT: 1,
  },
} as const

// ============ 快取常數 ============
export const CACHE = {
  // TTL 設定 (秒)
  TTL: {
    DEFAULT: 300,        // 5 minutes
    SHORT: 60,          // 1 minute
    MEDIUM: 900,        // 15 minutes
    LONG: 3600,         // 1 hour
    PRODUCTS: 600,      // 10 minutes
    CATEGORIES: 1800,   // 30 minutes
    SETTINGS: 3600,     // 1 hour
  },
  
  // 快取鍵前綴
  KEYS: {
    PRODUCT: 'product:',
    CATEGORY: 'category:',
    USER: 'user:',
    SESSION: 'session:',
    CART: 'cart:',
    CONFIG: 'config:',
  },
  
  // 快取標籤
  TAGS: {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    USERS: 'users',
    ORDERS: 'orders',
  },
} as const

// ============ 通知常數 ============
export const NOTIFICATION = {
  // 通知類型
  TYPES: {
    ORDER_CREATED: 'order_created',
    ORDER_PAID: 'order_paid',
    ORDER_SHIPPED: 'order_shipped',
    ORDER_DELIVERED: 'order_delivered',
    ORDER_CANCELLED: 'order_cancelled',
    PRODUCT_LOW_STOCK: 'product_low_stock',
    CUSTOMER_REGISTERED: 'customer_registered',
    PROMOTION_STARTED: 'promotion_started',
  } as const,
  
  // 通知渠道
  CHANNELS: ['email', 'sms', 'push', 'in_app'] as const,
  
  // 優先級
  PRIORITIES: ['low', 'normal', 'high', 'urgent'] as const,
} as const

// ============ 驗證常數 ============
export const VALIDATION = {
  // 正則表達式
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[\d\-\+\(\)\s]+$/,
    URL: /^https?:\/\/.+/,
    COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    SKU: /^[A-Z0-9\-_]+$/,
  },
  
  // 字串長度限制
  LENGTH: {
    PRODUCT_NAME: { min: 1, max: 200 },
    PRODUCT_DESCRIPTION: { min: 0, max: 5000 },
    CATEGORY_NAME: { min: 1, max: 100 },
    USER_NAME: { min: 1, max: 100 },
    ADDRESS: { min: 5, max: 500 },
    NOTES: { min: 0, max: 1000 },
  },
} as const

// ============ 錯誤訊息常數 ============
export const ERROR_MESSAGES = {
  // 通用錯誤
  REQUIRED: '此欄位為必填',
  INVALID_FORMAT: '格式不正確',
  TOO_SHORT: '長度太短',
  TOO_LONG: '長度太長',
  NOT_FOUND: '資源未找到',
  ALREADY_EXISTS: '資源已存在',
  UNAUTHORIZED: '未授權訪問',
  FORBIDDEN: '權限不足',
  
  // 特定錯誤
  INVALID_EMAIL: '電子郵件格式不正確',
  INVALID_PHONE: '電話號碼格式不正確',
  PASSWORD_TOO_WEAK: '密碼強度不足',
  PASSWORDS_NOT_MATCH: '密碼不匹配',
  INSUFFICIENT_STOCK: '庫存不足',
  ORDER_ALREADY_PAID: '訂單已付款',
  PRODUCT_NOT_AVAILABLE: '商品暫時無法購買',
} as const

// ============ 日期時間常數 ============
export const DATETIME = {
  // 時區
  TIMEZONE: 'Asia/Taipei',
  
  // 格式
  FORMATS: {
    DATE: 'YYYY-MM-DD',
    TIME: 'HH:mm:ss',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    DISPLAY_DATE: 'YYYY年MM月DD日',
    DISPLAY_DATETIME: 'YYYY年MM月DD日 HH:mm',
  },
  
  // 語言
  LOCALES: ['zh-TW', 'en-US', 'ja-JP'] as const,
  DEFAULT_LOCALE: 'zh-TW',
} as const

// ============ 環境常數 ============
export const ENV = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
} as const

// ============ 日誌常數 ============
export const LOG = {
  LEVELS: ['error', 'warn', 'info', 'debug'] as const,
  MAX_SIZE: '100MB',
  MAX_FILES: 5,
  DATE_PATTERN: 'YYYY-MM-DD',
} as const