/**
 * 管理後台側邊欄組件
 * 根據用戶權限動態顯示菜單項
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Avatar, Typography, Divider } from 'antd'
import {
  DashboardOutlined,
  ShopOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  FileTextOutlined,
  TagOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/hooks/usePermission'
import type { AdminUser } from '@/types'

const { Text } = Typography

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  path: string
  permissions?: string[]
  children?: MenuItem[]
}

const AdminSidebar: React.FC = () => {
  const location = useLocation()
  const { user, adminLogout } = useAuthStore()
  const { can } = usePermission()

  const adminUser = user as AdminUser

  // 菜單配置
  const menuItems: MenuItem[] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '控制台',
      path: '/admin/dashboard'
    },
    {
      key: 'products',
      icon: <ShopOutlined />,
      label: '商品管理',
      path: '/admin/products',
      permissions: ['product:read'],
      children: [
        {
          key: 'products-list',
          icon: <ShopOutlined />,
          label: '商品列表',
          path: '/admin/products',
          permissions: ['product:read']
        },
        {
          key: 'categories',
          icon: <FileTextOutlined />,
          label: '分類管理',
          path: '/admin/categories',
          permissions: ['category:read']
        },
        {
          key: 'brands',
          icon: <TagOutlined />,
          label: '品牌管理',
          path: '/admin/brands',
          permissions: ['brand:read']
        }
      ]
    },
    {
      key: 'inventory',
      icon: <InboxOutlined />,
      label: '庫存管理',
      path: '/admin/inventory',
      permissions: ['inventory:read']
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: '訂單管理',
      path: '/admin/orders',
      permissions: ['order:read']
    },
    {
      key: 'members',
      icon: <TeamOutlined />,
      label: '會員管理',
      path: '/admin/members',
      permissions: ['member:read']
    },
    {
      key: 'content',
      icon: <FileTextOutlined />,
      label: '內容管理',
      path: '/admin/content',
      permissions: ['content:read'],
      children: [
        {
          key: 'banners',
          icon: <FileTextOutlined />,
          label: '橫幅管理',
          path: '/admin/banners',
          permissions: ['banner:read']
        },
        {
          key: 'pages',
          icon: <FileTextOutlined />,
          label: '頁面管理',
          path: '/admin/pages',
          permissions: ['content:read']
        }
      ]
    },
    {
      key: 'promotions',
      icon: <TagOutlined />,
      label: '促銷活動',
      path: '/admin/promotions',
      permissions: ['promotion:read'],
      children: [
        {
          key: 'promotions-list',
          icon: <TagOutlined />,
          label: '活動列表',
          path: '/admin/promotions',
          permissions: ['promotion:read']
        },
        {
          key: 'coupons',
          icon: <TagOutlined />,
          label: '優惠券管理',
          path: '/admin/coupons',
          permissions: ['coupon:read']
        }
      ]
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: '報表分析',
      path: '/admin/analytics',
      permissions: ['analytics:read']
    },
    {
      key: 'system',
      icon: <SettingOutlined />,
      label: '系統管理',
      path: '/admin/system',
      permissions: ['system:read'],
      children: [
        {
          key: 'users',
          icon: <UserOutlined />,
          label: '用戶管理',
          path: '/admin/users',
          permissions: ['user:read']
        },
        {
          key: 'roles',
          icon: <TeamOutlined />,
          label: '角色權限',
          path: '/admin/roles',
          permissions: ['role:read']
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: '系統設定',
          path: '/admin/settings',
          permissions: ['system:write']
        }
      ]
    }
  ]

  // 過濾菜單項 - 只顯示有權限的菜單
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      // 檢查權限
      if (item.permissions && !can(item.permissions as any)) {
        return false
      }

      // 如果有子菜單，遞歸過濾
      if (item.children) {
        item.children = filterMenuItems(item.children)
        // 如果子菜單全部被過濾掉，則隱藏父菜單
        return item.children.length > 0
      }

      return true
    })
  }

  // 轉換為 Ant Design Menu 項格式
  const convertToAntdMenu = (items: MenuItem[]): any[] => {
    return items.map(item => ({
      key: item.key,
      icon: item.icon,
      label: item.children ? (
        item.label
      ) : (
        <Link to={item.path}>{item.label}</Link>
      ),
      children: item.children ? convertToAntdMenu(item.children) : undefined
    }))
  }

  const filteredMenuItems = filterMenuItems(menuItems)
  const antdMenuItems = convertToAntdMenu(filteredMenuItems)

  // 獲取當前選中的菜單項
  const getSelectedKeys = (): string[] => {
    const path = location.pathname
    
    // 查找匹配的菜單項
    const findMatchingKey = (items: MenuItem[]): string | null => {
      for (const item of items) {
        if (item.path === path) {
          return item.key
        }
        if (item.children) {
          const childKey = findMatchingKey(item.children)
          if (childKey) return childKey
        }
      }
      return null
    }

    const selectedKey = findMatchingKey(filteredMenuItems)
    return selectedKey ? [selectedKey] : []
  }

  // 獲取展開的菜單項
  const getOpenKeys = (): string[] => {
    const path = location.pathname
    const openKeys: string[] = []

    const findOpenKeys = (items: MenuItem[]): void => {
      for (const item of items) {
        if (item.children) {
          const hasMatchingChild = item.children.some(child => 
            path.startsWith(child.path) || path === child.path
          )
          if (hasMatchingChild) {
            openKeys.push(item.key)
          }
          findOpenKeys(item.children)
        }
      }
    }

    findOpenKeys(filteredMenuItems)
    return openKeys
  }

  const handleLogout = async () => {
    try {
      adminLogout()
      // 重定向到管理員登錄頁面
      window.location.href = '/auth/admin-login'
    } catch (error) {
      console.error('登出失敗:', error)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 用戶信息 */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar 
            size={40} 
            icon={<UserOutlined />}
            src={adminUser?.avatar}
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {adminUser?.firstName} {adminUser?.lastName}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {adminUser?.roles.join(', ')}
            </div>
          </div>
        </div>
      </div>

      {/* 導航菜單 */}
      <div className="flex-1 overflow-y-auto">
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={antdMenuItems}
          className="border-0"
        />
      </div>

      {/* 底部操作 */}
      <div className="border-t">
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <LogoutOutlined className="mr-3" />
            登出
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar