/**
 * 主佈局組件
 * 為前端用戶提供統一的頁面佈局，包含頭部、側邊欄、主內容區域和底部
 */

import React, { useState } from 'react'
import { Layout, Drawer } from 'antd'
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar } from './Sidebar'
import { useUIStore } from '../../stores'
import './style.scss'

const { Content } = Layout

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className = ''
}) => {
  const { sidebarCollapsed, setSidebarCollapsed, isMobile } = useUIStore()
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false)

  // 處理移動端側邊欄
  const handleMobileDrawerToggle = () => {
    setMobileDrawerVisible(!mobileDrawerVisible)
  }

  const closeMobileDrawer = () => {
    setMobileDrawerVisible(false)
  }

  return (
    <Layout className={`main-layout ${className}`}>
      {/* 頭部 */}
      <Header 
        onMenuClick={isMobile ? handleMobileDrawerToggle : () => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <Layout className="main-layout-body">
        {/* 桌面端側邊欄 */}
        {!isMobile && (
          <Sidebar 
            collapsed={sidebarCollapsed}
          />
        )}

        {/* 移動端側邊欄（抽屜） */}
        {isMobile && (
          <Drawer
            title="選單"
            placement="left"
            open={mobileDrawerVisible}
            onClose={closeMobileDrawer}
            bodyStyle={{ padding: 0 }}
            width={280}
          >
            <Sidebar collapsed={false} />
          </Drawer>
        )}

        {/* 主內容區域 */}
        <Layout className="main-content-layout">
          <Content className="main-content">
            {children}
          </Content>
          
          {/* 底部 */}
          <Footer />
        </Layout>
      </Layout>
    </Layout>
  )
}

export default MainLayout