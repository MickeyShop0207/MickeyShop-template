// 路由配置
import React, { Suspense, lazy } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Spin } from 'antd'
import { MainLayout } from '../components/layout'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminRoute } from './AdminRoute'
import ErrorBoundary from './ErrorBoundary'

// 頁面組件懶加載
const HomePage = lazy(() => import('../pages/Home'))
const ProductsPage = lazy(() => import('../pages/Products'))
const ProductDetailPage = lazy(() => import('../pages/ProductDetail'))
const CartPage = lazy(() => import('../pages/Cart'))
const CheckoutPage = lazy(() => import('../pages/Checkout'))
const OrdersPage = lazy(() => import('../pages/Orders'))
const OrderDetailPage = lazy(() => import('../pages/OrderDetail'))
const ProfilePage = lazy(() => import('../pages/Profile'))
const LoginPage = lazy(() => import('../pages/Auth/Login'))
const RegisterPage = lazy(() => import('../pages/Auth/Register'))
const NotFoundPage = lazy(() => import('../pages/NotFound'))
const AboutPage = lazy(() => import('../pages/About'))
const ContactPage = lazy(() => import('../pages/Contact'))

// 管理後台頁面
const AdminLayout = lazy(() => import('../pages/Admin/Layout'))
const AdminDashboard = lazy(() => import('../pages/Admin/Dashboard'))
const AdminProducts = lazy(() => import('../pages/Admin/Products'))
const AdminOrders = lazy(() => import('../pages/Admin/Orders'))
const AdminUsers = lazy(() => import('../pages/Admin/Users'))

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

// 管理後台佈局包裝器
const AdminLayoutWrapper: React.FC = () => (
  <AdminRoute>
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorBoundary>
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </ErrorBoundary>
    </Suspense>
  </AdminRoute>
)

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayoutWrapper />,
    errorElement: <ErrorBoundary />,
    children: [
      // 公開頁面
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'products',
        children: [
          {
            index: true,
            element: <ProductsPage />
          },
          {
            path: ':id',
            element: <ProductDetailPage />
          }
        ]
      },
      {
        path: 'categories/:slug',
        element: <ProductsPage />
      },
      {
        path: 'brands/:slug',
        element: <ProductsPage />
      },
      {
        path: 'search',
        element: <ProductsPage />
      },
      {
        path: 'about',
        element: <AboutPage />
      },
      {
        path: 'contact',
        element: <ContactPage />
      },
      
      // 需要登錄的頁面
      {
        path: 'cart',
        element: (
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'checkout',
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            )
          },
          {
            path: ':sessionId',
            element: (
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            )
          }
        ]
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'orders',
            element: <OrdersPage />
          },
          {
            path: 'addresses',
            lazy: () => import('../pages/Profile/Addresses')
          },
          {
            path: 'wishlist',
            lazy: () => import('../pages/Profile/Wishlist')
          },
          {
            path: 'reviews',
            lazy: () => import('../pages/Profile/Reviews')
          },
          {
            path: 'settings',
            lazy: () => import('../pages/Profile/Settings')
          }
        ]
      },
      {
        path: 'wishlist',
        element: (
          <ProtectedRoute>
            {React.createElement(lazy(() => import('../pages/Profile/Wishlist')))}
          </ProtectedRoute>
        )
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            {React.createElement(lazy(() => import('../pages/Notifications')))}
          </ProtectedRoute>
        )
      }
    ]
  },
  
  // 認證頁面 (不使用主佈局)
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LoginPage />
      </Suspense>
    )
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <RegisterPage />
      </Suspense>
    )
  },
  {
    path: '/forgot-password',
    lazy: () => import('../pages/Auth/ForgotPassword')
  },
  {
    path: '/reset-password',
    lazy: () => import('../pages/Auth/ResetPassword')
  },
  {
    path: '/verify-email',
    lazy: () => import('../pages/Auth/VerifyEmail')
  },
  
  // 管理後台
  {
    path: '/admin',
    element: <AdminLayoutWrapper />,
    children: [
      {
        index: true,
        element: <AdminDashboard />
      },
      {
        path: 'products',
        children: [
          {
            index: true,
            element: <AdminProducts />
          },
          {
            path: 'create',
            lazy: () => import('../pages/Admin/Products/Create')
          },
          {
            path: ':id/edit',
            lazy: () => import('../pages/Admin/Products/Edit')
          }
        ]
      },
      {
        path: 'categories',
        lazy: () => import('../pages/Admin/Categories')
      },
      {
        path: 'brands',
        lazy: () => import('../pages/Admin/Brands')
      },
      {
        path: 'orders',
        children: [
          {
            index: true,
            element: <AdminOrders />
          },
          {
            path: ':id',
            lazy: () => import('../pages/Admin/Orders/Detail')
          }
        ]
      },
      {
        path: 'users',
        children: [
          {
            index: true,
            element: <AdminUsers />
          },
          {
            path: ':id',
            lazy: () => import('../pages/Admin/Users/Detail')
          }
        ]
      },
      {
        path: 'analytics',
        lazy: () => import('../pages/Admin/Analytics')
      },
      {
        path: 'coupons',
        lazy: () => import('../pages/Admin/Coupons')
      },
      {
        path: 'reviews',
        lazy: () => import('../pages/Admin/Reviews')
      },
      {
        path: 'settings',
        lazy: () => import('../pages/Admin/Settings')
      }
    ]
  },
  
  // 管理員登錄
  {
    path: '/admin/login',
    lazy: () => import('../pages/Admin/Login')
  },
  
  // 特殊頁面
  {
    path: '/order-complete/:orderId',
    lazy: () => import('../pages/OrderComplete')
  },
  
  // 404 頁面
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <NotFoundPage />
      </Suspense>
    )
  }
])

// 路由提供者組件
export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />
}

// 路由常量
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  CATEGORY: (slug: string) => `/categories/${slug}`,
  BRAND: (slug: string) => `/brands/${slug}`,
  SEARCH: '/search',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  PROFILE: '/profile',
  WISHLIST: '/wishlist',
  NOTIFICATIONS: '/notifications',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  ABOUT: '/about',
  CONTACT: '/contact',
  
  // 管理後台
  ADMIN: '/admin',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
  
  // 特殊頁面
  ORDER_COMPLETE: (orderId: string) => `/order-complete/${orderId}`,
  NOT_FOUND: '/404'
} as const

export default AppRouter