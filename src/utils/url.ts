/**
 * URL 和路由工具函數
 */

// 解析 URL 查詢參數
export const parseQuery = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search)
  const result: Record<string, string> = {}
  
  for (const [key, value] of params.entries()) {
    result[key] = value
  }
  
  return result
}

// 構建查詢字符串
export const buildQuery = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })
  
  return searchParams.toString()
}

// 更新 URL 查詢參數
export const updateQuery = (
  currentSearch: string,
  updates: Record<string, any>
): string => {
  const currentParams = parseQuery(currentSearch)
  const newParams = { ...currentParams, ...updates }
  
  // 移除空值
  Object.keys(newParams).forEach(key => {
    if (newParams[key] === null || newParams[key] === undefined || newParams[key] === '') {
      delete newParams[key]
    }
  })
  
  return buildQuery(newParams)
}

// 獲取文件擴展名
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// 獲取文件名（不含擴展名）
export const getFileNameWithoutExtension = (filename: string): string => {
  return filename.replace(/\.[^/.]+$/, '')
}

// 檢查是否為外部鏈接
export const isExternalUrl = (url: string): boolean => {
  try {
    const targetUrl = new URL(url)
    const currentUrl = new URL(window.location.href)
    return targetUrl.hostname !== currentUrl.hostname
  } catch {
    return false
  }
}

// 安全地構建內部路由路徑
export const buildPath = (path: string, params?: Record<string, string | number>): string => {
  let result = path
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, String(value))
    })
  }
  
  return result
}

// 獲取頁面 slug
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 將空格和底線轉為連字符
    .replace(/^-+|-+$/g, '') // 移除開頭和結尾的連字符
}

// URL 編碼
export const safeEncodeURIComponent = (str: string): string => {
  try {
    return encodeURIComponent(str)
  } catch {
    return str
  }
}

// URL 解碼
export const safeDecodeURIComponent = (str: string): string => {
  try {
    return decodeURIComponent(str)
  } catch {
    return str
  }
}

// 獲取域名
export const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

// 檢查是否為有效的 URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 構建完整的 URL
export const buildFullUrl = (baseUrl: string, path: string, query?: Record<string, any>): string => {
  let url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  
  if (query) {
    const queryString = buildQuery(query)
    if (queryString) {
      url += `?${queryString}`
    }
  }
  
  return url
}

// 獲取 URL 路徑段
export const getPathSegments = (path: string): string[] => {
  return path
    .split('/')
    .filter(segment => segment.length > 0)
}

// 檢查路徑是否匹配模式
export const matchPath = (pattern: string, path: string): boolean => {
  const patternSegments = getPathSegments(pattern)
  const pathSegments = getPathSegments(path)
  
  if (patternSegments.length !== pathSegments.length) {
    return false
  }
  
  return patternSegments.every((segment, index) => {
    if (segment.startsWith(':')) {
      return true // 動態段，總是匹配
    }
    return segment === pathSegments[index]
  })
}

// 從路徑中提取參數
export const extractParams = (pattern: string, path: string): Record<string, string> => {
  const params: Record<string, string> = {}
  const patternSegments = getPathSegments(pattern)
  const pathSegments = getPathSegments(path)
  
  if (patternSegments.length !== pathSegments.length) {
    return params
  }
  
  patternSegments.forEach((segment, index) => {
    if (segment.startsWith(':')) {
      const paramName = segment.slice(1)
      params[paramName] = pathSegments[index]
    }
  })
  
  return params
}