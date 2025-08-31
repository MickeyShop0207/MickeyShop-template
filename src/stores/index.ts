// Zustand Stores 統一導出
export { useAuthStore } from './auth'
export { useThemeStore } from './themeStore'
export { useProductStore, useProductSelectors, productSelectors } from './productStore'
export { useUIStore, uiSelectors, useTheme, useModals, usePageSettings } from './uiStore'

// 導出類型
export type { AuthState } from './auth'
export type { ProductState } from './productStore'
export type { UIState } from './uiStore'

// 重新導出現有的主題 store 作為向後兼容
export { useThemeStore as useOldThemeStore } from './themeStore'