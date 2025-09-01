/**
 * 路由配置入口文件
 */

export { ProtectedRoute, default as ProtectedRouteDefault } from './ProtectedRoute'
export { AdminRoute, withAdminAuth, default as AdminRouteDefault } from './AdminRoute'

// 從 index.tsx 重新導出路由相關內容
export { AppRouter, router, ROUTES } from './index.tsx'