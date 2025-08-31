/**
 * 主要佈局組件
 * 包含頭部、側邊欄、內容區域、底部
 */

import React from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'

const { Header, Content, Footer } = Layout

const MainLayout: React.FC = () => {
  return (
    <Layout className="min-h-screen">
      {/* 頭部 */}
      <Header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-8">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                MickeyShop Beauty
              </h1>
            </div>
            
            {/* 主導航 */}
            <nav className="hidden md:flex space-x-6">
              <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                首頁
              </a>
              <a href="/products" className="text-gray-600 hover:text-gray-900 transition-colors">
                商品
              </a>
              <a href="/categories" className="text-gray-600 hover:text-gray-900 transition-colors">
                分類
              </a>
              <a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                關於我們
              </a>
            </nav>
          </div>
          
          {/* 右側操作區 */}
          <div className="flex items-center space-x-4">
            {/* 搜尋框 */}
            <div className="hidden lg:block">
              <input
                type="text"
                placeholder="搜尋商品..."
                className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            {/* 購物車 */}
            <a href="/cart" className="text-gray-600 hover:text-gray-900 transition-colors">
              🛒 購物車
            </a>
            
            {/* 會員登入 */}
            <a href="/auth/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              登入
            </a>
          </div>
        </div>
      </Header>
      
      {/* 內容區域 */}
      <Content className="flex-1">
        <Outlet />
      </Content>
      
      {/* 底部 */}
      <Footer className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">關於我們</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                    公司簡介
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                    聯絡我們
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">客戶服務</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/help" className="text-gray-600 hover:text-gray-900 transition-colors">
                    幫助中心
                  </a>
                </li>
                <li>
                  <a href="/shipping" className="text-gray-600 hover:text-gray-900 transition-colors">
                    運送資訊
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">會員專區</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/profile" className="text-gray-600 hover:text-gray-900 transition-colors">
                    會員中心
                  </a>
                </li>
                <li>
                  <a href="/orders" className="text-gray-600 hover:text-gray-900 transition-colors">
                    訂單查詢
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">追蹤我們</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Facebook
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Instagram
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
            <p>© 2024 MickeyShop Beauty. 版權所有。</p>
          </div>
        </div>
      </Footer>
    </Layout>
  )
}

export default MainLayout