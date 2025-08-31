/**
 * 格式化工具函數
 */

import type { CurrencyCode, LocaleCode } from '@/types'

// 貨幣符號映射
const currencySymbols: Record<CurrencyCode, string> = {
  TWD: 'NT$',
  CNY: '¥',
  HKD: 'HK$',
  USD: '$',
  JPY: '¥',
  KRW: '₩',
}

// 貨幣格式化選項
const currencyFormats: Record<CurrencyCode, { locale: LocaleCode; minimumFractionDigits?: number }> = {
  TWD: { locale: 'zh-TW' },
  CNY: { locale: 'zh-CN' },
  HKD: { locale: 'zh-HK' },
  USD: { locale: 'en-US' },
  JPY: { locale: 'ja-JP', minimumFractionDigits: 0 },
  KRW: { locale: 'ko-KR', minimumFractionDigits: 0 },
}

/**
 * 格式化價格
 */
export function formatPrice(
  amount: number,
  currency: CurrencyCode = 'TWD',
  options: {
    showSymbol?: boolean
    showCurrency?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    locale?: LocaleCode
  } = {}
): string {
  const {
    showSymbol = true,
    showCurrency = false,
    minimumFractionDigits,
    maximumFractionDigits = 2,
    locale: customLocale,
  } = options

  const formatConfig = currencyFormats[currency]
  const locale = customLocale || formatConfig.locale

  const numberFormatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: minimumFractionDigits ?? formatConfig.minimumFractionDigits ?? 2,
    maximumFractionDigits,
  }

  if (showCurrency) {
    numberFormatOptions.style = 'currency'
    numberFormatOptions.currency = currency
  }

  const formatted = new Intl.NumberFormat(locale, numberFormatOptions).format(amount)

  if (!showCurrency && showSymbol) {
    return `${currencySymbols[currency]}${formatted}`
  }

  return formatted
}

/**
 * 格式化折扣百分比
 */
export function formatDiscount(percentage: number): string {
  return `${Math.round(percentage)}% OFF`
}

/**
 * 格式化數字（千分位）
 */
export function formatNumber(
  num: number,
  options: {
    locale?: LocaleCode
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  } = {}
): string {
  const { locale = 'zh-TW', minimumFractionDigits = 0, maximumFractionDigits = 2 } = options

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * 格式化手機號碼
 */
export function formatPhoneNumber(phone: string, countryCode = '+886'): string {
  // 移除所有非數字字符
  const cleaned = phone.replace(/\D/g, '')

  // 台灣手機號碼格式化
  if (countryCode === '+886' && cleaned.length === 10) {
    return `${countryCode} ${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  // 其他格式保持原樣
  return `${countryCode} ${phone}`
}

/**
 * 格式化地址
 */
export function formatAddress(address: {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}): string {
  const { addressLine1, addressLine2, city, state, postalCode, country } = address

  const parts = [
    addressLine1,
    addressLine2,
    `${city}, ${state} ${postalCode}`,
    country,
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * 截取文字並加上省略號
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

/**
 * 格式化商品 SKU
 */
export function formatSKU(sku: string): string {
  return sku.toUpperCase()
}

/**
 * 格式化訂單號
 */
export function formatOrderNumber(orderNumber: string): string {
  // 格式：ORD-YYYYMMDD-XXXXX
  const match = orderNumber.match(/^(\w+)-(\d{8})-(\d+)$/)
  if (match) {
    const [, prefix, date, serial] = match
    return `${prefix}-${date}-${serial.padStart(5, '0')}`
  }
  return orderNumber
}

/**
 * 格式化評分
 */
export function formatRating(rating: number, maxRating = 5): string {
  return `${rating.toFixed(1)}/${maxRating}`
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化庫存狀態
 */
export function formatStockStatus(
  stockStatus: 'in-stock' | 'out-of-stock' | 'backorder',
  locale: LocaleCode = 'zh-TW'
): string {
  const statusMap = {
    'zh-TW': {
      'in-stock': '有貨',
      'out-of-stock': '缺貨',
      'backorder': '預購',
    },
    'zh-CN': {
      'in-stock': '有货',
      'out-of-stock': '缺货',
      'backorder': '预购',
    },
    'en-US': {
      'in-stock': 'In Stock',
      'out-of-stock': 'Out of Stock',
      'backorder': 'Backorder',
    },
    'ja-JP': {
      'in-stock': '在庫あり',
      'out-of-stock': '在庫切れ',
      'backorder': '予約注文',
    },
  }

  return statusMap[locale]?.[stockStatus] || statusMap['en-US'][stockStatus]
}

/**
 * 格式化會員等級
 */
export function formatMembershipLevel(
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond',
  locale: LocaleCode = 'zh-TW'
): string {
  const levelMap = {
    'zh-TW': {
      bronze: '銅牌會員',
      silver: '銀牌會員',
      gold: '金牌會員',
      platinum: '白金會員',
      diamond: '鑽石會員',
    },
    'zh-CN': {
      bronze: '铜牌会员',
      silver: '银牌会员',
      gold: '金牌会员',
      platinum: '白金会员',
      diamond: '钻石会员',
    },
    'en-US': {
      bronze: 'Bronze Member',
      silver: 'Silver Member',
      gold: 'Gold Member',
      platinum: 'Platinum Member',
      diamond: 'Diamond Member',
    },
  }

  return levelMap[locale]?.[level] || levelMap['en-US'][level]
}

/**
 * 格式化時間範圍
 */
export function formatTimeRange(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分鐘`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours} 小時`
  }
  
  return `${hours} 小時 ${remainingMinutes} 分鐘`
}

/**
 * 格式化重量
 */
export function formatWeight(grams: number): string {
  if (grams < 1000) {
    return `${grams}g`
  }
  return `${(grams / 1000).toFixed(1)}kg`
}

/**
 * 首字母大寫
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * 駝峰式命名轉換
 */
export function camelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
}

/**
 * 短橫線命名轉換
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

/**
 * 蛇形命名轉換
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toLowerCase()
}