/**
 * 數據處理工具函數
 */

// 深拷貝
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as T
    Object.keys(obj).forEach(key => {
      (clonedObj as any)[key] = deepClone((obj as any)[key])
    })
    return clonedObj
  }
  
  return obj
}

// 深度比較對象
export const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) {
    return true
  }
  
  if (obj1 == null || obj2 == null) {
    return obj1 === obj2
  }
  
  if (typeof obj1 !== typeof obj2) {
    return false
  }
  
  if (typeof obj1 !== 'object') {
    return obj1 === obj2
  }
  
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  if (keys1.length !== keys2.length) {
    return false
  }
  
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false
    }
  }
  
  return true
}

// 數組去重
export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array))
}

// 根據指定屬性去重
export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

// 數組分組
export const groupBy = <T>(
  array: T[],
  key: keyof T | ((item: T) => string | number)
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    const stringKey = String(groupKey)
    
    if (!groups[stringKey]) {
      groups[stringKey] = []
    }
    
    groups[stringKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

// 數組排序
export const sortBy = <T>(
  array: T[],
  key: keyof T | ((item: T) => any),
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aValue = typeof key === 'function' ? key(a) : a[key]
    const bValue = typeof key === 'function' ? key(b) : b[key]
    
    if (aValue < bValue) {
      return order === 'asc' ? -1 : 1
    }
    
    if (aValue > bValue) {
      return order === 'asc' ? 1 : -1
    }
    
    return 0
  })
}

// 數組分頁
export const paginate = <T>(
  array: T[],
  page: number,
  pageSize: number
): { items: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } } => {
  const total = array.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const items = array.slice(startIndex, endIndex)
  
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  }
}

// 對象屬性選取
export const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

// 對象屬性排除
export const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result
}

// 扁平化數組
export const flatten = <T>(array: (T | T[])[]): T[] => {
  const result: T[] = []
  
  array.forEach(item => {
    if (Array.isArray(item)) {
      result.push(...flatten(item))
    } else {
      result.push(item)
    }
  })
  
  return result
}

// 數組分塊
export const chunk = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = []
  
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  
  return result
}

// 數組求和
export const sum = (array: number[]): number => {
  return array.reduce((total, num) => total + num, 0)
}

// 數組求平均值
export const average = (array: number[]): number => {
  return array.length === 0 ? 0 : sum(array) / array.length
}

// 數組求最大值
export const max = (array: number[]): number | undefined => {
  return array.length === 0 ? undefined : Math.max(...array)
}

// 數組求最小值
export const min = (array: number[]): number | undefined => {
  return array.length === 0 ? undefined : Math.min(...array)
}

// 隨機排列數組
export const shuffle = <T>(array: T[]): T[] => {
  const result = [...array]
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  
  return result
}

// 數組交集
export const intersection = <T>(array1: T[], array2: T[]): T[] => {
  return array1.filter(item => array2.includes(item))
}

// 數組差集
export const difference = <T>(array1: T[], array2: T[]): T[] => {
  return array1.filter(item => !array2.includes(item))
}

// 數組並集
export const union = <T>(array1: T[], array2: T[]): T[] => {
  return unique([...array1, ...array2])
}