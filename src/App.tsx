import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConfigProvider, App as AntdApp } from 'antd'
import { useTranslation } from 'react-i18next'
import zhTW from 'antd/locale/zh_TW'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'

// 路由和組件
import { AppRouter } from './router'
import { useUIStore } from './stores'

// 配置
import { queryClientConfig } from './config/query-client'
import { theme as themeConfig } from './config/theme'

// 樣式
import './styles/index.scss'

// 創建 QueryClient 實例
const queryClient = new QueryClient(queryClientConfig)

// 設置 dayjs 語言
dayjs.locale('zh-tw')

const App: React.FC = () => {
  const { initializeUI, theme, language } = useUIStore()
  const { i18n } = useTranslation()

  // 初始化應用
  useEffect(() => {
    initializeUI()
  }, [initializeUI])

  // 監聽語言變化
  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language, i18n])

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhTW}
        theme={{
          algorithm: theme === 'dark' ? themeConfig.darkAlgorithm : themeConfig.defaultAlgorithm,
          token: themeConfig.token,
          components: themeConfig.components
        }}
      >
        <AntdApp>
          <AppRouter />
        </AntdApp>
      </ConfigProvider>
      
      {/* 開發環境顯示 React Query DevTools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

export default App