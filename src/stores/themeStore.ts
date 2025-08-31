/**
 * 主題狀態管理
 * 使用 Zustand 管理應用主題狀態
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  systemTheme: 'light' | 'dark'
  actualTheme: 'light' | 'dark'
  
  // Actions
  setTheme: (theme: Theme) => void
  setSystemTheme: (theme: 'light' | 'dark') => void
  initializeTheme: () => void
  toggleTheme: () => void
}

// 獲取系統主題
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 計算實際主題
const getActualTheme = (theme: Theme, systemTheme: 'light' | 'dark'): 'light' | 'dark' => {
  return theme === 'system' ? systemTheme : theme as 'light' | 'dark'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      systemTheme: getSystemTheme(),
      actualTheme: getActualTheme('system', getSystemTheme()),
      
      setTheme: (theme) => {
        const { systemTheme } = get()
        const actualTheme = getActualTheme(theme, systemTheme)
        
        set({ theme, actualTheme })
        
        // 應用主題到 document
        document.documentElement.classList.toggle('dark', actualTheme === 'dark')
      },
      
      setSystemTheme: (systemTheme) => {
        const { theme } = get()
        const actualTheme = getActualTheme(theme, systemTheme)
        
        set({ systemTheme, actualTheme })
        
        // 如果是系統主題模式，更新實際主題
        if (theme === 'system') {
          document.documentElement.classList.toggle('dark', actualTheme === 'dark')
        }
      },
      
      initializeTheme: () => {
        const { theme, setSystemTheme } = get()
        
        // 設置初始系統主題
        setSystemTheme(getSystemTheme())
        
        // 監聽系統主題變化
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          
          const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light')
          }
          
          mediaQuery.addEventListener('change', handleSystemThemeChange)
          
          // 應用初始主題
          const { actualTheme } = get()
          document.documentElement.classList.toggle('dark', actualTheme === 'dark')
          
          // 返回清理函數
          return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange)
          }
        }
      },
      
      toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
)