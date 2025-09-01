/**
 * 日期時間工具函數
 */
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/zh-tw'

// 載入插件
dayjs.extend(relativeTime)
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.locale('zh-tw')

// 格式化日期
export const formatDate = (date: string | number | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

// 格式化日期時間
export const formatDateTime = (date: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format)
}

// 相對時間 (例如: 2小時前)
export const formatRelativeTime = (date: string | number | Date): string => {
  return dayjs(date).fromNow()
}

// 格式化時間範圍
export const formatDateRange = (
  startDate: string | number | Date,
  endDate: string | number | Date,
  format = 'MM-DD'
): string => {
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  
  if (start.isSame(end, 'day')) {
    return start.format('YYYY-MM-DD')
  }
  
  if (start.isSame(end, 'year')) {
    return `${start.format(format)} 至 ${end.format(format)}`
  }
  
  return `${start.format('YYYY-MM-DD')} 至 ${end.format('YYYY-MM-DD')}`
}

// 獲取今天的開始時間
export const getStartOfDay = (date?: string | number | Date): Date => {
  return dayjs(date).startOf('day').toDate()
}

// 獲取今天的結束時間
export const getEndOfDay = (date?: string | number | Date): Date => {
  return dayjs(date).endOf('day').toDate()
}

// 獲取本週的開始時間
export const getStartOfWeek = (date?: string | number | Date): Date => {
  return dayjs(date).startOf('week').toDate()
}

// 獲取本週的結束時間
export const getEndOfWeek = (date?: string | number | Date): Date => {
  return dayjs(date).endOf('week').toDate()
}

// 獲取本月的開始時間
export const getStartOfMonth = (date?: string | number | Date): Date => {
  return dayjs(date).startOf('month').toDate()
}

// 獲取本月的結束時間
export const getEndOfMonth = (date?: string | number | Date): Date => {
  return dayjs(date).endOf('month').toDate()
}

// 計算兩個日期之間的天數差
export const getDaysDifference = (
  date1: string | number | Date,
  date2: string | number | Date
): number => {
  return dayjs(date2).diff(dayjs(date1), 'day')
}

// 檢查日期是否在指定範圍內
export const isDateInRange = (
  date: string | number | Date,
  startDate: string | number | Date,
  endDate: string | number | Date
): boolean => {
  const target = dayjs(date)
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  
  return target.isAfter(start) && target.isBefore(end)
}

// 檢查是否為今天
export const isToday = (date: string | number | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'day')
}

// 檢查是否為昨天
export const isYesterday = (date: string | number | Date): boolean => {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day')
}

// 檢查是否為本週
export const isThisWeek = (date: string | number | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'week')
}

// 檢查是否為本月
export const isThisMonth = (date: string | number | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'month')
}

// 獲取生日年齡
export const getAge = (birthDate: string | number | Date): number => {
  return dayjs().diff(dayjs(birthDate), 'year')
}

// 格式化持續時間 (秒)
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 時區轉換
export const convertTimezone = (
  date: string | number | Date,
  timezone = 'Asia/Taipei'
): Date => {
  return dayjs(date).tz(timezone).toDate()
}