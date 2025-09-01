/**
 * 頁面頭部組件
 */

import React, { useState } from 'react'
import { 
  Layout, 
  Menu, 
  Button, 
  Badge, 
  Dropdown, 
  Avatar, 
  Space,
  Input,
  Drawer,
  Typography,
  Divider
} from 'antd'
import {
  MenuOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, useWishlist, useAuth } from '../../../hooks'
import { ROUTES } from '../../../router'
import './style.scss'

const { Header: AntHeader } = Layout
const { Search } = Input
const { Text } = Typography

interface HeaderProps {
  onMenuClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { itemCount: cartItemCount } = useCart()
  const { itemCount: wishlistItemCount } = useWishlist()
  const [searchDrawerVisible, setSearchDrawerVisible] = useState(false)

  // 處理搜尋
  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(value.trim())}`)
      setSearchDrawerVisible(false)
    }
  }

  // 用戶菜單
  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <Link to={ROUTES.PROFILE}>
          <Space>
            <UserOutlined />
            個人資料
          </Space>
        </Link>
      ),
    },
    {
      key: 'orders',
      label: (
        <Link to={ROUTES.ORDERS}>
          <Space>
            <SettingOutlined />
            我的訂單
          </Space>
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          登出
        </Space>
      ),
      onClick: logout,
    },
  ]

  return (
    <AntHeader className="main-header">
      <div className="header-content">
        {/* 左側：Logo 和選單按鈕 */}
        <div className="header-left">
          {onMenuClick && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={onMenuClick}
              className="menu-button"
            />
          )}
          <Link to={ROUTES.HOME} className="logo">
            <img 
              src="/logo.png" 
              alt="MickeyShop Beauty" 
              className="logo-image"
            />
            <span className="logo-text">MickeyShop Beauty</span>
          </Link>
        </div>

        {/* 中間：搜尋框（桌面端） */}
        <div className="header-center desktop-only">
          <Search
            placeholder="搜尋商品..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            className="header-search"
          />
        </div>

        {/* 右側：功能按鈕 */}
        <div className="header-right">
          <Space size="middle">
            {/* 移動端搜尋按鈕 */}
            <Button
              type="text"
              icon={<SearchOutlined />}
              onClick={() => setSearchDrawerVisible(true)}
              className="mobile-only search-button"
            />

            {/* 購物車 */}
            <Badge count={cartItemCount} >
              <Button
                type="text"
                icon={<ShoppingCartOutlined />}
                onClick={() => navigate(ROUTES.CART)}
                className="action-button"
              />
            </Badge>

            {/* 願望清單 */}
            {isAuthenticated && (
              <Badge count={wishlistItemCount} >
                <Button
                  type="text"
                  icon={<HeartOutlined />}
                  onClick={() => navigate(ROUTES.WISHLIST)}
                  className="action-button"
                />
              </Badge>
            )}

            {/* 通知 */}
            {isAuthenticated && (
              <Badge count={0} >
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={() => navigate(ROUTES.NOTIFICATIONS)}
                  className="action-button"
                />
              </Badge>
            )}

            {/* 用戶菜單或登入按鈕 */}
            {isAuthenticated && user ? (
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button type="text" className="user-button">
                  <Space>
                    <Avatar 
                       
                      src={user.avatar} 
                      icon={<UserOutlined />}
                    />
                    <span className="desktop-only">
                      {user.firstName || user.email}
                    </span>
                  </Space>
                </Button>
              </Dropdown>
            ) : (
              <Space>
                <Button 
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="login-button"
                >
                  登入
                </Button>
                <Button 
                  type="primary"
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className="register-button"
                >
                  註冊
                </Button>
              </Space>
            )}
          </Space>
        </div>
      </div>

      {/* 移動端搜尋抽屜 */}
      <Drawer
        title="搜尋商品"
        placement="top"
        open={searchDrawerVisible}
        onClose={() => setSearchDrawerVisible(false)}
        height={200}
      >
        <Search
          placeholder="搜尋商品..."
          allowClear
          enterButton="搜尋"
          size="large"
          onSearch={handleSearch}
          autoFocus
        />
      </Drawer>
    </AntHeader>
  )
}

export default Header