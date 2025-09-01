// 簡化路由配置 - 僅包含現有頁面
import React, { Suspense, lazy } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Spin } from 'antd'
import { MainLayout } from '../components/layout'
import ErrorBoundary from './ErrorBoundary'

// 頁面組件懶加載 - 僅包含確實存在的頁面
const HomePage = lazy(() => import('../pages/Home'))
const NotFoundPage = lazy(() => import('../pages/NotFound'))
const AboutPage = lazy(() => import('../pages/About'))
const ContactPage = lazy(() => import('../pages/Contact'))

// 加載組件
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Spin size="large" tip="載入中..." />
  </div>
)

// 主佈局包裝器
const MainLayoutWrapper: React.FC = () => (
  <MainLayout>
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </Suspense>
  </MainLayout>
)

// 路由配置
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayoutWrapper />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'about',
        element: <AboutPage />
      },
      {
        path: 'contact', 
        element: <ContactPage />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
])

// 路由提供者組件
const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />
}

export default AppRouter