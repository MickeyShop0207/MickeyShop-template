/**
 * 管理後台佈局組件
 * 提供統一的管理後台佈局和導航
 */

import React from 'react'
import { Layout, Breadcrumb, theme } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import { useAuthInit } from '@/hooks/useAuthInit'
import { AdminRoute } from '@/router/AdminRoute'

const { Header, Content, Sider } = Layout

interface AdminLayoutProps {
  children?: React.ReactNode
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  // 初始化認證狀態
  useAuthInit()

  // 生成面包屑
  const generateBreadcrumb = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i)
    
    const breadcrumbNameMap: Record<string, string> = {
      admin: '管理後台',
      dashboard: '控制台',
      products: '商品管理',
      categories: '分類管理',
      brands: '品牌管理',
      inventory: '庫存管理',
      orders: '訂單管理',
      members: '會員管理',
      content: '內容管理',
      banners: '橫幅管理',
      pages: '頁面管理',
      promotions: '促銷活動',
      coupons: '優惠券管理',
      analytics: '報表分析',
      system: '系統管理',
      users: '用戶管理',
      roles: '角色權限',
      settings: '系統設定'
    }

    const breadcrumbItems = pathSnippets.map((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`
      const name = breadcrumbNameMap[snippet] || snippet
      
      return {
        title: name,
        href: index === pathSnippets.length - 1 ? undefined : url
      }
    })

    return breadcrumbItems
  }

  return (
    <AdminRoute>
      <Layout style={{ minHeight: '100vh' }}>
        {/* 側邊欄 */}
        <Sider
          width={250}
          style={{
            background: colorBgContainer,
            borderRight: '1px solid #f0f0f0'
          }}
          theme="light"
        >
          <div className="h-16 flex items-center justify-center border-b bg-gradient-to-r from-indigo-600 to-purple-600">
            <h1 className="text-white text-lg font-semibold">
              MickeyShop 後台
            </h1>
          </div>
          <AdminSidebar />
        </Sider>

        {/* 主內容區 */}
        <Layout>
          {/* 頂部區域 */}
          <Header 
            style={{ 
              padding: '0 24px',
              background: colorBgContainer,
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Breadcrumb items={generateBreadcrumb()} />
          </Header>

          {/* 內容區域 */}
          <Content
            style={{
              margin: '24px',
              padding: '24px',
              background: colorBgContainer,
              borderRadius: '8px',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              minHeight: 'calc(100vh - 112px)'
            }}
          >
            {children || <Outlet />}
          </Content>
        </Layout>
      </Layout>
    </AdminRoute>
  )
}

export default AdminLayout