/**
 * 主題配置系統 - 統一主題變數與配置管理
 */
import { theme as antTheme } from 'antd'

// 主題色彩配置
export const themeColors = {
  light: {
    // 品牌主色
    primary: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e', // 主色
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
      950: '#4c0519',
    },
    
    // 輔助色
    secondary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    
    // 強調色
    accent: {
      50: '#fef7ee',
      100: '#feecd3',
      200: '#fdd5a6',
      300: '#fbb96e',
      400: '#f89334',
      500: '#f57c00', // 強調色
      600: '#e65100',
      700: '#c14200',
      800: '#9a3400',
      900: '#7c2d00',
      950: '#441400',
    },
    
    // 中性色
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    
    // 語義化顏色
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    
    // 背景顏色
    background: {
      primary: '#ffffff',
      secondary: '#fafafa',
      tertiary: '#f5f5f5',
      inverse: '#171717',
    },
    
    // 文字顏色
    text: {
      primary: '#171717',
      secondary: '#525252',
      tertiary: '#a3a3a3',
      inverse: '#ffffff',
      link: '#f43f5e',
      linkHover: '#e11d48',
    },
    
    // 邊框顏色
    border: {
      primary: '#e5e5e5',
      secondary: '#d4d4d4',
      focus: '#f43f5e',
      error: '#ef4444',
    },
  },
  
  dark: {
    // 品牌主色
    primary: {
      50: '#4c0519',
      100: '#881337',
      200: '#9f1239',
      300: '#be123c',
      400: '#e11d48',
      500: '#f43f5e', // 主色
      600: '#fb7185',
      700: '#fda4af',
      800: '#fecdd3',
      900: '#ffe4e6',
      950: '#fff1f2',
    },
    
    // 輔助色
    secondary: {
      50: '#450a0a',
      100: '#7f1d1d',
      200: '#991b1b',
      300: '#b91c1c',
      400: '#dc2626',
      500: '#ef4444',
      600: '#f87171',
      700: '#fca5a5',
      800: '#fecaca',
      900: '#fee2e2',
      950: '#fef2f2',
    },
    
    // 強調色
    accent: {
      50: '#441400',
      100: '#7c2d00',
      200: '#9a3400',
      300: '#c14200',
      400: '#e65100',
      500: '#f57c00', // 強調色
      600: '#f89334',
      700: '#fbb96e',
      800: '#fdd5a6',
      900: '#feecd3',
      950: '#fef7ee',
    },
    
    // 中性色
    neutral: {
      50: '#0a0a0a',
      100: '#171717',
      200: '#262626',
      300: '#404040',
      400: '#525252',
      500: '#737373',
      600: '#a3a3a3',
      700: '#d4d4d4',
      800: '#e5e5e5',
      900: '#f5f5f5',
      950: '#fafafa',
    },
    
    // 語義化顏色
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    
    // 背景顏色
    background: {
      primary: '#0a0a0a',
      secondary: '#171717',
      tertiary: '#262626',
      inverse: '#ffffff',
    },
    
    // 文字顏色
    text: {
      primary: '#fafafa',
      secondary: '#d4d4d4',
      tertiary: '#a3a3a3',
      inverse: '#171717',
      link: '#fb7185',
      linkHover: '#fda4af',
    },
    
    // 邊框顏色
    border: {
      primary: '#404040',
      secondary: '#525252',
      focus: '#f43f5e',
      error: '#ef4444',
    },
  },
} as const

// 字體配置
export const typography = {
  fontFamily: {
    sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
    serif: ['Noto Serif TC', 'serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    display: ['Inter Display', 'Noto Sans TC', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    xs: { size: '0.75rem', lineHeight: '1rem' },
    sm: { size: '0.875rem', lineHeight: '1.25rem' },
    base: { size: '1rem', lineHeight: '1.5rem' },
    lg: { size: '1.125rem', lineHeight: '1.75rem' },
    xl: { size: '1.25rem', lineHeight: '1.75rem' },
    '2xl': { size: '1.5rem', lineHeight: '2rem' },
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' },
    '5xl': { size: '3rem', lineHeight: '1.2' },
    '6xl': { size: '3.75rem', lineHeight: '1.1' },
  },
  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
} as const

// 間距配置
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '5rem',   // 80px
  '5xl': '6rem',   // 96px
  '6xl': '8rem',   // 128px
} as const

// 陰影配置
export const shadows = {
  none: 'none',
  soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
  medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  strong: '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 8px -5px rgba(0, 0, 0, 0.08)',
  glow: '0 0 20px rgba(244, 63, 94, 0.3)',
  glowAccent: '0 0 20px rgba(245, 124, 0, 0.3)',
} as const

// 圓角配置
export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  md: '0.25rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  '4xl': '2rem',
  '5xl': '2.5rem',
  full: '9999px',
} as const

// 動畫配置
export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '1000ms',
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const

// 斷點配置
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const

// 主題配置類
export class ThemeConfig {
  private currentTheme: 'light' | 'dark' = 'light'
  
  constructor() {
    this.detectSystemTheme()
  }
  
  // 檢測系統主題
  detectSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  
  // 設定主題
  setTheme(theme: 'light' | 'dark') {
    this.currentTheme = theme
    this.applyTheme(theme)
  }
  
  // 獲取當前主題
  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme
  }
  
  // 切換主題
  toggleTheme(): 'light' | 'dark' {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    this.setTheme(newTheme)
    return newTheme
  }
  
  // 應用主題到 DOM
  applyTheme(theme: 'light' | 'dark') {
    if (typeof document === 'undefined') return
    
    const root = document.documentElement
    const colors = themeColors[theme]
    
    // 設定 data-theme 屬性
    root.setAttribute('data-theme', theme)
    
    // 設定 CSS 自定義屬性
    Object.entries(colors).forEach(([colorName, colorValue]) => {
      if (typeof colorValue === 'object') {
        Object.entries(colorValue).forEach(([shade, value]) => {
          root.style.setProperty(`--color-${colorName}-${shade}`, value)
        })
      } else {
        root.style.setProperty(`--color-${colorName}`, colorValue)
      }
    })
    
    // 設定語義化顏色
    root.style.setProperty('--color-success', colors.success)
    root.style.setProperty('--color-warning', colors.warning)
    root.style.setProperty('--color-danger', colors.danger)
    root.style.setProperty('--color-info', colors.info)
  }
  
  // 生成 CSS 變數
  generateCSSVariables(): Record<string, string> {
    const theme = this.currentTheme
    const colors = themeColors[theme]
    const variables: Record<string, string> = {}
    
    // 顏色變數
    Object.entries(colors).forEach(([colorName, colorValue]) => {
      if (typeof colorValue === 'object') {
        Object.entries(colorValue).forEach(([shade, value]) => {
          variables[`--color-${colorName}-${shade}`] = value
        })
      } else {
        variables[`--color-${colorName}`] = colorValue
      }
    })
    
    // 字體變數
    Object.entries(typography.fontFamily).forEach(([name, family]) => {
      variables[`--font-${name}`] = Array.isArray(family) ? family.join(', ') : family
    })
    
    // 間距變數
    Object.entries(spacing).forEach(([name, value]) => {
      variables[`--spacing-${name}`] = value
    })
    
    // 陰影變數
    Object.entries(shadows).forEach(([name, value]) => {
      variables[`--shadow-${name}`] = value
    })
    
    // 圓角變數
    Object.entries(borderRadius).forEach(([name, value]) => {
      variables[`--radius-${name}`] = value
    })
    
    return variables
  }
}

// 預設主題配置實例
export const themeConfig = new ThemeConfig()

// 主題相關的工具函數
export const themeUtils = {
  // 獲取顏色值
  getColor: (theme: 'light' | 'dark', colorPath: string): string => {
    const path = colorPath.split('.')
    let value: any = themeColors[theme]
    
    for (const key of path) {
      value = value?.[key]
    }
    
    return value || ''
  },
  
  // 檢查是否為深色主題
  isDark: (theme: 'light' | 'dark'): boolean => theme === 'dark',
  
  // 檢查是否為淺色主題
  isLight: (theme: 'light' | 'dark'): boolean => theme === 'light',
  
  // 獲取對比主題
  getOppositeTheme: (theme: 'light' | 'dark'): 'light' | 'dark' => 
    theme === 'light' ? 'dark' : 'light',
}

// Ant Design 主題配置
export const theme = {
  token: {
    colorPrimary: themeColors.light.primary[500],
    colorSuccess: themeColors.light.success,
    colorWarning: themeColors.light.warning,
    colorError: themeColors.light.danger,
    colorInfo: themeColors.light.info,
    fontFamily: typography.fontFamily.sans.join(', '),
    borderRadius: 8,
  },
  components: {
    Button: {
      borderRadius: 8,
      fontWeight: 500,
    },
    Card: {
      borderRadius: 12,
    },
    Input: {
      borderRadius: 8,
    },
  },
  defaultAlgorithm: antTheme.defaultAlgorithm,
  darkAlgorithm: antTheme.darkAlgorithm,
}

// 類型導出
export type ThemeMode = 'light' | 'dark'
export type ThemeColors = typeof themeColors.light
export type ColorName = keyof ThemeColors
export type Typography = typeof typography
export type Spacing = typeof spacing
export type Shadows = typeof shadows
export type BorderRadius = typeof borderRadius
export type Animations = typeof animations
export type Breakpoints = typeof breakpoints