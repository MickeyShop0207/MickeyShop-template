/**
 * 性能監控工具函數
 */

// 性能測量結果接口
export interface PerformanceMeasurement {
  name: string
  duration: number
  startTime: number
  endTime: number
}

// 內存使用情況接口
export interface MemoryUsage {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  percentage: number
}

// 頁面性能指標接口
export interface PagePerformance {
  loadTime: number
  domReadyTime: number
  firstPaintTime: number
  firstContentfulPaintTime: number
  largestContentfulPaintTime?: number
  firstInputDelayTime?: number
  cumulativeLayoutShiftScore?: number
}

// 性能計時器
export class PerformanceTimer {
  private startTimes: Map<string, number> = new Map()
  private measurements: PerformanceMeasurement[] = []

  // 開始計時
  start(name: string): void {
    this.startTimes.set(name, performance.now())
  }

  // 結束計時
  end(name: string): PerformanceMeasurement | null {
    const startTime = this.startTimes.get(name)
    if (!startTime) {
      console.warn(`No start time found for measurement: ${name}`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - startTime
    
    const measurement: PerformanceMeasurement = {
      name,
      duration,
      startTime,
      endTime
    }

    this.measurements.push(measurement)
    this.startTimes.delete(name)
    
    return measurement
  }

  // 獲取所有測量結果
  getMeasurements(): PerformanceMeasurement[] {
    return [...this.measurements]
  }

  // 獲取特定測量結果
  getMeasurement(name: string): PerformanceMeasurement | undefined {
    return this.measurements.find(m => m.name === name)
  }

  // 清除所有測量結果
  clear(): void {
    this.measurements = []
    this.startTimes.clear()
  }
}

// 創建全局性能計時器實例
export const performanceTimer = new PerformanceTimer()

// 測量函數執行時間
export const measureFunction = <T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T => {
  return ((...args: any[]) => {
    const measureName = name || fn.name || 'anonymous'
    performanceTimer.start(measureName)
    
    try {
      const result = fn(...args)
      
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceTimer.end(measureName)
        })
      }
      
      performanceTimer.end(measureName)
      return result
    } catch (error) {
      performanceTimer.end(measureName)
      throw error
    }
  }) as T
}

// 測量異步函數執行時間
export const measureAsyncFunction = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name?: string
): T => {
  return (async (...args: any[]) => {
    const measureName = name || fn.name || 'anonymous'
    performanceTimer.start(measureName)
    
    try {
      const result = await fn(...args)
      performanceTimer.end(measureName)
      return result
    } catch (error) {
      performanceTimer.end(measureName)
      throw error
    }
  }) as T
}

// 獲取內存使用情況
export const getMemoryUsage = (): MemoryUsage | null => {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }
  }
  return null
}

// 獲取頁面性能指標
export const getPagePerformance = (): PagePerformance | null => {
  if (!performance.timing) {
    return null
  }

  const timing = performance.timing
  const navigation = performance.navigation
  
  const loadTime = timing.loadEventEnd - timing.navigationStart
  const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart
  
  // 獲取 Paint Timing API 數據
  let firstPaintTime = 0
  let firstContentfulPaintTime = 0
  
  if ('getEntriesByType' in performance) {
    const paintEntries = performance.getEntriesByType('paint')
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        firstPaintTime = entry.startTime
      } else if (entry.name === 'first-contentful-paint') {
        firstContentfulPaintTime = entry.startTime
      }
    })
  }

  return {
    loadTime,
    domReadyTime,
    firstPaintTime,
    firstContentfulPaintTime
  }
}

// 監控 Core Web Vitals
export const observeCoreWebVitals = (callback: (metric: any) => void): void => {
  // 觀察 LCP (Largest Contentful Paint)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        callback({
          name: 'LCP',
          value: lastEntry.startTime,
          entries
        })
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // LCP 可能不被支持
    }

    // 觀察 FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          callback({
            name: 'FID',
            value: (entry as any).processingStart - entry.startTime,
            entries
          })
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'], buffered: true })
    } catch (e) {
      // FID 可能不被支持
    }

    // 觀察 CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        })
        
        callback({
          name: 'CLS',
          value: clsValue,
          entries
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'], buffered: true })
    } catch (e) {
      // CLS 可能不被支持
    }
  }
}

// 節流函數
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  
  return ((...args: any[]) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }) as T
}

// 防抖函數
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null
  
  return ((...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }) as T
}

// 空閒時間執行
export const requestIdleCallback = (callback: () => void, timeout = 5000): void => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout })
  } else {
    setTimeout(callback, 1)
  }
}

// 監控資源加載性能
export const observeResourceTiming = (callback: (entry: PerformanceResourceTiming) => void): void => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[]
      entries.forEach(callback)
    })
    
    observer.observe({ entryTypes: ['resource'] })
  }
}

// 批量處理任務
export const batchProcess = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize = 10,
  delay = 10
): Promise<R[]> => {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
    
    // 在批次之間添加小延遲，避免阻塞主線程
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return results
}

// 性能監控報告
export const generatePerformanceReport = (): Record<string, any> => {
  const measurements = performanceTimer.getMeasurements()
  const memoryUsage = getMemoryUsage()
  const pagePerformance = getPagePerformance()
  
  return {
    timestamp: Date.now(),
    measurements: measurements.map(m => ({
      name: m.name,
      duration: Math.round(m.duration * 100) / 100 // 保留兩位小數
    })),
    memory: memoryUsage,
    page: pagePerformance,
    userAgent: navigator.userAgent,
    url: window.location.href
  }
}