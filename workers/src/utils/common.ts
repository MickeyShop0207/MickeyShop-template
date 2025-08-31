/**
 * 通用工具函數
 */

import { customAlphabet } from 'nanoid'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// 擴展 dayjs 功能
dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * ID 生成相關
 */
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 12)

export function generateId(prefix?: string): string {
  const id = nanoid()
  return prefix ? `${prefix}_${id}` : id
}

export function generateShortId(length: number = 8): string {
  return customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', length)()
}

export function generateNumericId(length: number = 10): string {
  return customAlphabet('1234567890', length)()
}

/**
 * 字串處理
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 將空格和下劃線替換為連字號
    .replace(/^-+|-+$/g, '') // 移除開頭和結尾的連字號
}

export function truncate(text: string, length: number, suffix: string = '...'): string {
  if (text.length <= length) return text
  return text.slice(0, length) + suffix
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function titleCase(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * 數字處理
 */
export function formatPrice(price: number, currency: string = 'TWD'): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: currency,
  }).format(price)
}

export function formatNumber(num: number, locale: string = 'zh-TW'): string {
  return new Intl.NumberFormat(locale).format(num)
}

export function roundToDecimals(num: number, decimals: number = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export function percentage(value: number, total: number, decimals: number = 2): number {
  if (total === 0) return 0
  return roundToDecimals((value / total) * 100, decimals)
}

/**
 * 日期時間處理
 */
export function now(): string {
  return dayjs().utc().format()
}

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format)
}

export function formatDateTZ(
  date: string | Date, 
  timezone: string = 'Asia/Taipei',
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  return dayjs(date).tz(timezone).format(format)
}

export function isExpired(expirationDate: string | Date): boolean {
  return dayjs().isAfter(dayjs(expirationDate))
}

export function addTime(
  date: string | Date,
  amount: number,
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
): string {
  return dayjs(date).add(amount, unit).utc().format()
}

export function diffTime(
  date1: string | Date,
  date2: string | Date,
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' = 'day'
): number {
  return dayjs(date1).diff(dayjs(date2), unit)
}

/**
 * 物件處理
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export function isEmpty(value: any): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 陣列處理
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 驗證函數
 */
export function isEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isPhoneTW(phone: string): boolean {
  const phoneRegex = /^09\d{8}$|^0[2-8]\d{7,8}$/
  return phoneRegex.test(phone.replace(/[-\s]/g, ''))
}

export function isUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 加密相關工具
 */
export function hashString(str: string): string {
  let hash = 0
  if (str.length === 0) return hash.toString()
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16)
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!domain) return email
  
  if (localPart.length <= 3) {
    return `${localPart[0]}***@${domain}`
  }
  
  return `${localPart.slice(0, 2)}***${localPart.slice(-1)}@${domain}`
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 4) return phone
  
  const start = cleaned.slice(0, 2)
  const end = cleaned.slice(-2)
  const middle = '*'.repeat(cleaned.length - 4)
  
  return `${start}${middle}${end}`
}

/**
 * 錯誤處理
 */
export class AppError extends Error {
  public statusCode: number
  public code: string
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    
    Error.captureStackTrace(this, this.constructor)
  }
}

export function createError(message: string, statusCode: number = 500, code?: string): AppError {
  return new AppError(message, statusCode, code)
}

/**
 * 性能測量
 */
export function measureTime<T>(fn: () => T, label?: string): { result: T; duration: number } {
  const start = Date.now()
  const result = fn()
  const duration = Date.now() - start
  
  if (label) {
    console.log(`${label}: ${duration}ms`)
  }
  
  return { result, duration }
}

export async function measureTimeAsync<T>(
  fn: () => Promise<T>, 
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = Date.now()
  const result = await fn()
  const duration = Date.now() - start
  
  if (label) {
    console.log(`${label}: ${duration}ms`)
  }
  
  return { result, duration }
}