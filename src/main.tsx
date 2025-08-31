import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { HelmetProvider } from 'react-helmet-async'
import { ConfigProvider } from 'antd'
import zhTW from 'antd/locale/zh_TW'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'

// 本地導入
import App from './App'
import { queryClient } from '@/config/query-client'
import { config } from '@/config'
import './styles/globals.css'
import './config/i18n'

// 設置 dayjs 語言
dayjs.locale('zh-tw')

// React Query 客戶端已在 config/query-client.ts 中配置

// Ant Design 主題配置
const antdTheme = {
  token: {
    colorPrimary: '#f43f5e', // primary-500
    colorSuccess: '#22c55e', // success-500
    colorWarning: '#f59e0b',  // warning-500
    colorError: '#ef4444',   // danger-500
    colorInfo: '#3b82f6',    // info-500
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'Inter, Noto Sans TC, system-ui, sans-serif',
    boxShadow: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
    boxShadowSecondary: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 44,
      fontWeight: 500,
      boxShadow: 'none',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 44,
      paddingBlock: 8,
      paddingInline: 12,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 44,
    },
    Card: {
      borderRadius: 12,
      boxShadowTertiary: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
    },
    Modal: {
      borderRadius: 16,
      boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 8px -5px rgba(0, 0, 0, 0.08)',
    },
    Menu: {
      borderRadius: 8,
      itemSelectedBg: 'rgba(244, 63, 94, 0.1)',
      itemSelectedColor: '#f43f5e',
    },
    Drawer: {
      borderRadius: 0,
      boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 8px -5px rgba(0, 0, 0, 0.08)',
    },
  },
}

// 錯誤邊界組件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo)
    // 這裡可以發送錯誤到監控服務
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              哎呀！發生了一些問題
            </h1>
            <p className="text-gray-600 mb-6">
              我們遇到了一個意外錯誤，請重新整理頁面或稍後再試。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              重新整理頁面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 渲染應用
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element')
}

const root = ReactDOM.createRoot(rootElement)

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider locale={zhTW} theme={antdTheme}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ConfigProvider>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
)