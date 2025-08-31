// 防抖相關 Hooks
import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * 防抖 Hook - 延遲更新值直到指定時間內沒有新的更新
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // 設置定時器，在指定延遲後更新防抖值
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 清除定時器（如果值在延遲期間發生變化）
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 防抖回調 Hook - 返回一個防抖的回調函數
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef<T>(callback)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // 更新回調引用
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // 創建防抖回調
  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      // 清除之前的定時器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 設置新的定時器
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T,
    [delay]
  )

  // 清理函數
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * 防抖搜索 Hook - 專門用於搜索場景
 */
export function useDebounceSearch(
  initialValue = '',
  delay = 300
) {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, delay)

  // 當搜索詞改變時，設置搜索狀態
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [searchTerm, debouncedSearchTerm])

  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    clearSearch,
    hasSearchTerm: debouncedSearchTerm.length > 0
  }
}

/**
 * 防抖狀態 Hook - 結合狀態管理和防抖
 */
export function useDebounceState<T>(
  initialValue: T,
  delay: number
): [T, T, (value: T) => void, boolean] {
  const [immediateValue, setImmediateValue] = useState<T>(initialValue)
  const debouncedValue = useDebounce(immediateValue, delay)
  const [isPending, setIsPending] = useState(false)

  // 跟蹤是否有待處理的更新
  useEffect(() => {
    const pending = immediateValue !== debouncedValue
    setIsPending(pending)
  }, [immediateValue, debouncedValue])

  return [immediateValue, debouncedValue, setImmediateValue, isPending]
}

/**
 * 防抖異步操作 Hook
 */
export function useDebounceAsync<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  delay: number
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<Awaited<ReturnType<T>> | null>(null)
  
  const abortControllerRef = useRef<AbortController>()
  const timeoutRef = useRef<NodeJS.Timeout>()

  const debouncedFn = useCallback(
    async (...args: Parameters<T>) => {
      // 取消之前的請求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // 清除之前的定時器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setError(null)

      return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            setIsLoading(true)
            
            // 創建新的 AbortController
            abortControllerRef.current = new AbortController()
            
            const result = await asyncFn(...args)
            setData(result)
            setIsLoading(false)
            resolve(result)
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error')
            setError(error)
            setIsLoading(false)
            reject(error)
          }
        }, delay)
      })
    },
    [asyncFn, delay]
  )

  // 取消操作
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
  }, [])

  // 清理函數
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  return {
    execute: debouncedFn,
    isLoading,
    error,
    data,
    cancel
  }
}

/**
 * 防抖輸入 Hook - 專門用於輸入框
 */
export function useDebounceInput(
  initialValue = '',
  delay = 300,
  minLength = 0
) {
  const [inputValue, setInputValue] = useState(initialValue)
  const debouncedValue = useDebounce(inputValue, delay)
  
  // 只有當值長度達到最小要求時才返回防抖值
  const effectiveValue = debouncedValue.length >= minLength ? debouncedValue : ''
  const isValidLength = inputValue.length >= minLength
  const isPending = inputValue !== debouncedValue && isValidLength

  const handleChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInputValue(event.target.value)
  }, [])

  const clear = useCallback(() => {
    setInputValue('')
  }, [])

  const reset = useCallback(() => {
    setInputValue(initialValue)
  }, [initialValue])

  return {
    value: inputValue,
    debouncedValue: effectiveValue,
    onChange: handleChange,
    clear,
    reset,
    isPending,
    isValidLength,
    hasValue: inputValue.length > 0
  }
}

/**
 * 防抖效果 Hook - 防抖執行副作用
 */
export function useDebounceEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const cleanupRef = useRef<(() => void) | void>()

  useEffect(() => {
    // 清除之前的定時器和清理函數
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (cleanupRef.current) {
      cleanupRef.current()
    }

    // 設置新的定時器
    timeoutRef.current = setTimeout(() => {
      cleanupRef.current = effect()
    }, delay)

    // 清理函數
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [...deps, delay])
}