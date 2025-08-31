// 頁面頭部組件
import React, { useState } from 'react'
import { Layout, Menu, Badge, Avatar, Dropdown, Input, Button } from 'antd'
import { 
  ShoppingCartOutlined, 
  UserOutlined, 
  HeartOutlined, 
  MenuOutlined,
  SearchOutlined,
  BellOutlined 
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useCart, useUnreadNotificationCount } from '../../../hooks'
import { useDebounceSearch } from '../../../hooks'
import './style.scss'

const { Header: AntHeader } = Layout
const { Search } = Input

export interface HeaderProps {
  className?: string
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const { cart } = useCart()
  const { data: notificationData } = useUnreadNotificationCount()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const { 
    searchTerm, 
    setSearchTerm, 
    debouncedSearchTerm, 
    clearSearch 
  } = useDebounceSearch()

  // 搜索處理
  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/products?q=${encodeURIComponent(value.trim())}`)
    }
  }

  // 用戶菜單
  const userMenuItems = [
    {
      key: 'profile',
      label: <Link to="/profile">個人中心</Link>
    },
    {
      key: 'orders',
      label: <Link to="/orders">我的訂單</Link>
    },
    {
      key: 'wishlist',
      label: <Link to="/wishlist">願望清單</Link>
    },
    {
      key: 'addresses',
      label: <Link to="/profile/addresses">收貨地址</Link>
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: '登出',
      onClick: logout
    }
  ]

  // 主導航菜單
  const mainMenuItems = [
    {
      key: 'home',
      label: <Link to="/">首頁</Link>
    },
    {
      key: 'products',
      label: <Link to="/products">商品</Link>
    },
    {
      key: 'categories',
      label: '分類',
      children: [
        { key: 'skincare', label: <Link to="/categories/skincare">護膚</Link> },
        { key: 'makeup', label: <Link to="/categories/makeup">彩妝</Link> },
        { key: 'fragrance', label: <Link to="/categories/fragrance">香水</Link> },
        { key: 'haircare', label: <Link to="/categories/haircare">護髮</Link> }
      ]
    },
    {
      key: 'brands',
      label: <Link to="/brands">品牌</Link>
    },
    {
      key: 'about',
      label: <Link to="/about">關於我們</Link>
    }
  ]

  return (
    <AntHeader className={`app-header ${className || ''}`}>
      <div className="app-header__container">
        {/* Logo */}
        <div className="app-header__logo">
          <Link to="/" className="app-header__logo-link">
            <img 
              src="/logo.png" 
              alt="MickeyShop Beauty" 
              className="app-header__logo-img"
            />
            <span className="app-header__logo-text">MickeyShop Beauty</span>
          </Link>
        </div>

        {/* 搜索框 */}
        <div className="app-header__search">
          <Search
            placeholder="搜索美妝商品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            className="app-header__search-input"
          />
        </div>

        {/* 主導航 - 桌面版 */}
        <div className="app-header__nav app-header__nav--desktop">
          <Menu
            mode="horizontal"
            items={mainMenuItems}
            className="app-header__menu"
          />
        </div>

        {/* 右側操作區 */}
        <div className="app-header__actions">
          {isAuthenticated ? (
            <>
              {/* 通知 */}
              <Badge count={notificationData?.count || 0} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={() => navigate('/notifications')}
                  className="app-header__action-btn"
                />
              </Badge>

              {/* 願望清單 */}
              <Button
                type="text"
                icon={<HeartOutlined />}
                onClick={() => navigate('/wishlist')}
                className="app-header__action-btn"
              />

              {/* 購物車 */}
              <Badge count={cart.itemCount} size="small">
                <Button
                  type="text"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => navigate('/cart')}
                  className="app-header__action-btn"
                />
              </Badge>

              {/* 用戶菜單 */}
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div className="app-header__user">
                  <Avatar
                    src={user?.avatar}
                    icon={<UserOutlined />}
                    className="app-header__avatar"
                  />
                  <span className="app-header__username">
                    {user?.firstName || 'User'}
                  </span>
                </div>
              </Dropdown>
            </>
          ) : (
            <div className="app-header__auth-actions">
              <Button type="text" onClick={() => navigate('/login')}>
                登入
              </Button>
              <Button type="primary" onClick={() => navigate('/register')}>
                註冊
              </Button>
            </div>
          )}

          {/* 移動端菜單按鈕 */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="app-header__mobile-menu-btn"
          />
        </div>
      </div>

      {/* 移動端導航菜單 */}
      {mobileMenuOpen && (
        <div className="app-header__mobile-nav">
          <Menu
            mode="inline"
            items={mainMenuItems}
            className="app-header__mobile-menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {!isAuthenticated && (
            <div className="app-header__mobile-auth">
              <Button 
                type="default" 
                onClick={() => {
                  navigate('/login')
                  setMobileMenuOpen(false)
                }}
                block
              >
                登入
              </Button>
              <Button 
                type="primary" 
                onClick={() => {
                  navigate('/register')
                  setMobileMenuOpen(false)
                }}
                block
                style={{ marginTop: 8 }}
              >
                註冊
              </Button>
            </div>
          )}
        </div>
      )}
    </AntHeader>
  )
}

export default Header