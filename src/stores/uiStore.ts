// UI 狀態管理 - Zustand Store
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface UIState {
  // 主題設置
  theme: 'light' | 'dark' | 'auto'
  
  // 語言設置
  language: 'zh-TW' | 'zh-CN' | 'en-US'
  
  // 佈局設置
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
  
  // 搜索相關
  searchHistory: string[]
  quickSearchVisible: boolean
  
  // 模態框狀態
  modals: {
    productQuickView: {
      open: boolean
      productId?: string
    }
    loginModal: {
      open: boolean
    }
    cartDrawer: {
      open: boolean
    }
    wishlistDrawer: {
      open: boolean
    }
    filterPanel: {
      open: boolean
    }
  }
  
  // 載入狀態
  globalLoading: boolean
  pageLoading: boolean
  
  // 通知設置
  notifications: {
    enabled: boolean
    sound: boolean
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  }
  
  // 頁面設置
  pageSettings: {
    productsView: 'grid' | 'list'
    productsPerPage: number
    sortBy: string
    showFilters: boolean
  }
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  setLanguage: (language: 'zh-TW' | 'zh-CN' | 'en-US') => void
  
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  
  addSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  removeSearchHistory: (query: string) => void
  
  setQuickSearchVisible: (visible: boolean) => void
  
  // 模態框控制
  openModal: (modalName: keyof UIState['modals'], data?: any) => void
  closeModal: (modalName: keyof UIState['modals']) => void
  closeAllModals: () => void
  
  // 載入狀態控制
  setGlobalLoading: (loading: boolean) => void
  setPageLoading: (loading: boolean) => void
  
  // 通知設置
  setNotificationSettings: (settings: Partial<UIState['notifications']>) => void
  
  // 頁面設置
  setPageSettings: (settings: Partial<UIState['pageSettings']>) => void
  setProductsView: (view: 'grid' | 'list') => void
  setProductsPerPage: (count: number) => void
  setSortBy: (sortBy: string) => void
  toggleFilters: () => void
  
  // 初始化
  initializeUI: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始狀態
        theme: 'light',
        language: 'zh-TW',
        
        sidebarCollapsed: false,
        mobileMenuOpen: false,
        
        searchHistory: [],
        quickSearchVisible: false,
        
        modals: {
          productQuickView: { open: false },
          loginModal: { open: false },
          cartDrawer: { open: false },
          wishlistDrawer: { open: false },
          filterPanel: { open: false }
        },
        
        globalLoading: false,
        pageLoading: false,
        
        notifications: {
          enabled: true,
          sound: true,
          position: 'top-right'
        },
        
        pageSettings: {
          productsView: 'grid',
          productsPerPage: 20,
          sortBy: 'created_desc',
          showFilters: false
        },
        
        // Actions
        setTheme: (theme) => {
          set({ theme })
          
          // 更新 DOM class
          if (typeof document !== 'undefined') {
            const root = document.documentElement
            if (theme === 'dark') {
              root.setAttribute('data-theme', 'dark')
            } else if (theme === 'light') {
              root.setAttribute('data-theme', 'light')
            } else {
              // auto theme
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
              root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
            }
          }
        },
        
        setLanguage: (language) => {
          set({ language })
        },
        
        toggleSidebar: () => {
          set((state) => ({
            sidebarCollapsed: !state.sidebarCollapsed
          }))
        },
        
        setSidebarCollapsed: (collapsed) => {
          set({ sidebarCollapsed: collapsed })
        },
        
        toggleMobileMenu: () => {
          set((state) => ({
            mobileMenuOpen: !state.mobileMenuOpen
          }))
        },
        
        setMobileMenuOpen: (open) => {
          set({ mobileMenuOpen: open })
        },
        
        addSearchHistory: (query) => {
          if (!query.trim()) return
          
          set((state) => {
            const filteredHistory = state.searchHistory.filter(item => item !== query)
            const newHistory = [query, ...filteredHistory].slice(0, 10) // 最多保存10條
            return { searchHistory: newHistory }
          })
        },
        
        clearSearchHistory: () => {
          set({ searchHistory: [] })
        },
        
        removeSearchHistory: (query) => {
          set((state) => ({
            searchHistory: state.searchHistory.filter(item => item !== query)
          }))
        },
        
        setQuickSearchVisible: (visible) => {
          set({ quickSearchVisible: visible })
        },
        
        // 模態框控制
        openModal: (modalName, data) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modalName]: {
                ...state.modals[modalName],
                open: true,
                ...(data || {})
              }
            }
          }))
        },
        
        closeModal: (modalName) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modalName]: {
                ...state.modals[modalName],
                open: false
              }
            }
          }))
        },
        
        closeAllModals: () => {
          set((state) => {
            const closedModals = Object.keys(state.modals).reduce((acc, key) => {
              acc[key as keyof UIState['modals']] = {
                ...state.modals[key as keyof UIState['modals']],
                open: false
              }
              return acc
            }, {} as UIState['modals'])
            
            return { modals: closedModals }
          })
        },
        
        // 載入狀態控制
        setGlobalLoading: (loading) => {
          set({ globalLoading: loading })
        },
        
        setPageLoading: (loading) => {
          set({ pageLoading: loading })
        },
        
        // 通知設置
        setNotificationSettings: (settings) => {
          set((state) => ({
            notifications: {
              ...state.notifications,
              ...settings
            }
          }))
        },
        
        // 頁面設置
        setPageSettings: (settings) => {
          set((state) => ({
            pageSettings: {
              ...state.pageSettings,
              ...settings
            }
          }))
        },
        
        setProductsView: (view) => {
          set((state) => ({
            pageSettings: {
              ...state.pageSettings,
              productsView: view
            }
          }))
        },
        
        setProductsPerPage: (count) => {
          set((state) => ({
            pageSettings: {
              ...state.pageSettings,
              productsPerPage: count
            }
          }))
        },
        
        setSortBy: (sortBy) => {
          set((state) => ({
            pageSettings: {
              ...state.pageSettings,
              sortBy
            }
          }))
        },
        
        toggleFilters: () => {
          set((state) => ({
            pageSettings: {
              ...state.pageSettings,
              showFilters: !state.pageSettings.showFilters
            }
          }))
        },
        
        // 初始化
        initializeUI: () => {
          const { theme } = get()
          
          // 初始化主題
          if (typeof document !== 'undefined') {
            const root = document.documentElement
            if (theme === 'auto') {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
              root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
              
              // 監聽系統主題變化
              window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (get().theme === 'auto') {
                  root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
                }
              })
            } else {
              root.setAttribute('data-theme', theme)
            }
          }
        }
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          sidebarCollapsed: state.sidebarCollapsed,
          searchHistory: state.searchHistory,
          notifications: state.notifications,
          pageSettings: state.pageSettings
        })
      }
    ),
    { name: 'ui-store' }
  )
)

// 選擇器
export const uiSelectors = {
  theme: (state: UIState) => state.theme,
  language: (state: UIState) => state.language,
  
  sidebarCollapsed: (state: UIState) => state.sidebarCollapsed,
  mobileMenuOpen: (state: UIState) => state.mobileMenuOpen,
  
  searchHistory: (state: UIState) => state.searchHistory,
  quickSearchVisible: (state: UIState) => state.quickSearchVisible,
  
  modals: (state: UIState) => state.modals,
  globalLoading: (state: UIState) => state.globalLoading,
  pageLoading: (state: UIState) => state.pageLoading,
  
  notifications: (state: UIState) => state.notifications,
  pageSettings: (state: UIState) => state.pageSettings,
  
  // 計算屬性
  isDarkTheme: (state: UIState) => {
    if (state.theme === 'dark') return true
    if (state.theme === 'light') return false
    // auto theme
    return typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  },
  
  hasSearchHistory: (state: UIState) => state.searchHistory.length > 0,
  
  anyModalOpen: (state: UIState) => 
    Object.values(state.modals).some(modal => modal.open),
  
  isProductQuickViewOpen: (state: UIState) => state.modals.productQuickView.open,
  isLoginModalOpen: (state: UIState) => state.modals.loginModal.open,
  isCartDrawerOpen: (state: UIState) => state.modals.cartDrawer.open,
  isWishlistDrawerOpen: (state: UIState) => state.modals.wishlistDrawer.open,
  isFilterPanelOpen: (state: UIState) => state.modals.filterPanel.open
}

// 自定義 Hooks
export const useTheme = () => {
  const theme = useUIStore(uiSelectors.theme)
  const setTheme = useUIStore(state => state.setTheme)
  const isDark = useUIStore(uiSelectors.isDarkTheme)
  
  return { theme, setTheme, isDark }
}

export const useModals = () => {
  const modals = useUIStore(uiSelectors.modals)
  const openModal = useUIStore(state => state.openModal)
  const closeModal = useUIStore(state => state.closeModal)
  const closeAllModals = useUIStore(state => state.closeAllModals)
  
  return { modals, openModal, closeModal, closeAllModals }
}

export const usePageSettings = () => {
  const pageSettings = useUIStore(uiSelectors.pageSettings)
  const setPageSettings = useUIStore(state => state.setPageSettings)
  const setProductsView = useUIStore(state => state.setProductsView)
  const setProductsPerPage = useUIStore(state => state.setProductsPerPage)
  const setSortBy = useUIStore(state => state.setSortBy)
  const toggleFilters = useUIStore(state => state.toggleFilters)
  
  return {
    pageSettings,
    setPageSettings,
    setProductsView,
    setProductsPerPage,
    setSortBy,
    toggleFilters
  }
}