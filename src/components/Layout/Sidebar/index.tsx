/**
 * 側邊導航組件
 */

import React from 'react'
import { Layout, Menu } from 'antd'
import {
  HomeOutlined,
  ShoppingOutlined,
  HeartOutlined,
  UserOutlined,
  GiftOutlined,
  FireOutlined,
  StarOutlined,
  TagsOutlined
} from '@ant-design/icons'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '../../../router'
import './style.scss'

const { Sider } = Layout

interface SidebarProps {
  collapsed: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const location = useLocation()

  const menuItems = [
    {
      key: ROUTES.HOME,
      icon: <HomeOutlined />,
      label: <Link to={ROUTES.HOME}>首頁</Link>,
    },
    {
      key: ROUTES.PRODUCTS,
      icon: <ShoppingOutlined />,
      label: <Link to={ROUTES.PRODUCTS}>所有商品</Link>,
    },
    {
      key: 'categories',
      icon: <TagsOutlined />,
      label: '商品分類',
      children: [
        {
          key: '/categories/skincare',
          label: <Link to="/categories/skincare">護膚保養</Link>,
        },
        {
          key: '/categories/makeup',
          label: <Link to="/categories/makeup">彩妝美容</Link>,
        },
        {
          key: '/categories/fragrance',
          label: <Link to="/categories/fragrance">香水香氛</Link>,
        },
        {
          key: '/categories/body-care',
          label: <Link to="/categories/body-care">身體護理</Link>,
        },
        {
          key: '/categories/hair-care',
          label: <Link to="/categories/hair-care">髮品護理</Link>,
        },
      ],
    },
    {
      key: 'brands',
      icon: <StarOutlined />,
      label: '熱門品牌',
      children: [
        {
          key: '/brands/lancome',
          label: <Link to="/brands/lancome">蘭蔻</Link>,
        },
        {
          key: '/brands/estee-lauder',
          label: <Link to="/brands/estee-lauder">雅詩蘭黛</Link>,
        },
        {
          key: '/brands/shiseido',
          label: <Link to="/brands/shiseido">資生堂</Link>,
        },
        {
          key: '/brands/sk-ii',
          label: <Link to="/brands/sk-ii">SK-II</Link>,
        },
        {
          key: '/brands/loreal',
          label: <Link to="/brands/loreal">萊雅</Link>,
        },
      ],
    },
    {
      key: 'special',
      icon: <FireOutlined />,
      label: '特殊專區',
      children: [
        {
          key: '/products?featured=true',
          label: <Link to="/products?featured=true">精選商品</Link>,
        },
        {
          key: '/products?on-sale=true',
          label: <Link to="/products?on-sale=true">特價商品</Link>,
        },
        {
          key: '/products?new-arrival=true',
          label: <Link to="/products?new-arrival=true">新品上市</Link>,
        },
      ],
    },
    {
      key: ROUTES.WISHLIST,
      icon: <HeartOutlined />,
      label: <Link to={ROUTES.WISHLIST}>願望清單</Link>,
    },
    {
      key: 'account',
      icon: <UserOutlined />,
      label: '會員專區',
      children: [
        {
          key: ROUTES.PROFILE,
          label: <Link to={ROUTES.PROFILE}>個人資料</Link>,
        },
        {
          key: ROUTES.ORDERS,
          label: <Link to={ROUTES.ORDERS}>訂單查詢</Link>,
        },
        {
          key: ROUTES.PROFILE_ADDRESSES,
          label: <Link to={ROUTES.PROFILE_ADDRESSES}>地址管理</Link>,
        },
        {
          key: ROUTES.PROFILE_REVIEWS,
          label: <Link to={ROUTES.PROFILE_REVIEWS}>我的評價</Link>,
        },
      ],
    },
    {
      key: ROUTES.ABOUT,
      icon: <GiftOutlined />,
      label: <Link to={ROUTES.ABOUT}>關於我們</Link>,
    },
  ]

  // 獲取當前選中的菜單項
  const getSelectedKeys = () => {
    const path = location.pathname
    
    // 精確匹配
    if (menuItems.some(item => item.key === path)) {
      return [path]
    }
    
    // 檢查子菜單
    for (const item of menuItems) {
      if (item.children) {
        const matchedChild = item.children.find(child => 
          path.startsWith(child.key as string)
        )
        if (matchedChild) {
          return [matchedChild.key as string]
        }
      }
    }
    
    return [ROUTES.HOME]
  }

  // 獲取展開的菜單項
  const getOpenKeys = () => {
    const path = location.pathname
    const openKeys: string[] = []
    
    for (const item of menuItems) {
      if (item.children) {
        const hasMatchedChild = item.children.some(child => 
          path.startsWith(child.key as string)
        )
        if (hasMatchedChild) {
          openKeys.push(item.key as string)
        }
      }
    }
    
    return openKeys
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      className="main-sidebar"
      theme="light"
    >
      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        className="sidebar-menu"
      />
    </Sider>
  )
}

export default Sidebar