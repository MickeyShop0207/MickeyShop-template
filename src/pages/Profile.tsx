import React, { useState } from 'react'
import { Layout, Menu, Avatar, Typography, Card, Row, Col } from 'antd'
import { 
  UserOutlined, 
  ShoppingOutlined, 
  HomeOutlined,
  HeartOutlined,
  StarOutlined,
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'

const { Sider, Content } = Layout
const { Title, Text } = Typography

const ProfilePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: t('profile.overview') || '總覽',
      path: '/profile'
    },
    {
      key: '/orders',
      icon: <ShoppingOutlined />,
      label: t('profile.orders') || '我的訂單',
      path: '/orders'
    },
    {
      key: '/profile/addresses',
      icon: <HomeOutlined />,
      label: t('profile.addresses') || '收件地址',
      path: '/profile/addresses'
    },
    {
      key: '/profile/wishlist',
      icon: <HeartOutlined />,
      label: t('profile.wishlist') || '心願清單',
      path: '/profile/wishlist'
    },
    {
      key: '/profile/reviews',
      icon: <StarOutlined />,
      label: t('profile.reviews') || '我的評論',
      path: '/profile/reviews'
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: t('profile.notifications') || '通知中心',
      path: '/notifications'
    },
    {
      key: '/profile/settings',
      icon: <SettingOutlined />,
      label: t('profile.settings') || '帳戶設定',
      path: '/profile/settings'
    }
  ]

  const handleMenuClick = (path: string) => {
    navigate(path)
  }

  const getSelectedKey = () => {
    const currentPath = location.pathname
    // 找到匹配的菜單項
    const matchedItem = menuItems.find(item => 
      currentPath === item.path || 
      (item.path !== '/profile' && currentPath.startsWith(item.path))
    )
    return matchedItem?.key || '/profile'
  }

  // 如果是 profile 根路由，顯示總覽頁面
  const isProfileRoot = location.pathname === '/profile'

  const renderOverview = () => (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center space-x-4 mb-6">
          <Avatar size={80} src={user?.avatar} icon={<UserOutlined />} />
          <div>
            <Title level={3} className="mb-1">
              {user?.firstName} {user?.lastName}
            </Title>
            <Text type="secondary" className="text-base">
              {user?.email}
            </Text>
            <div className="mt-2">
              <Text className="text-sm text-gray-500">
                {t('profile.memberSince') || '會員自'}: {new Date(user?.createdAt || '2024-01-01').toLocaleDateString()}
              </Text>
            </div>
          </div>
        </div>

        <Row gutter={16} className="mt-6">
          <Col span={6}>
            <Card  className="text-center hover:shadow-md cursor-pointer" onClick={() => navigate('/orders')}>
              <ShoppingOutlined className="text-2xl text-blue-600 mb-2" />
              <div className="text-lg font-semibold">12</div>
              <div className="text-gray-600">{t('profile.totalOrders') || '總訂單'}</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card  className="text-center hover:shadow-md cursor-pointer" onClick={() => navigate('/profile/wishlist')}>
              <HeartOutlined className="text-2xl text-red-600 mb-2" />
              <div className="text-lg font-semibold">8</div>
              <div className="text-gray-600">{t('profile.wishlistItems') || '心願商品'}</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card  className="text-center hover:shadow-md cursor-pointer" onClick={() => navigate('/profile/reviews')}>
              <StarOutlined className="text-2xl text-yellow-600 mb-2" />
              <div className="text-lg font-semibold">15</div>
              <div className="text-gray-600">{t('profile.totalReviews') || '評論數'}</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card  className="text-center hover:shadow-md cursor-pointer" onClick={() => navigate('/profile/addresses')}>
              <HomeOutlined className="text-2xl text-green-600 mb-2" />
              <div className="text-lg font-semibold">3</div>
              <div className="text-gray-600">{t('profile.savedAddresses') || '儲存地址'}</div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title={t('profile.recentOrders') || '最近訂單'} >
            <div className="text-center py-8 text-gray-500">
              <ShoppingOutlined className="text-3xl mb-2" />
              <div>{t('profile.noRecentOrders') || '暫無最近訂單'}</div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={t('profile.accountSecurity') || '帳戶安全'} >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Text>{t('profile.emailVerification') || '電子郵件驗證'}</Text>
                <Text type={user?.emailVerified ? 'success' : 'danger'}>
                  {user?.emailVerified ? (t('profile.verified') || '已驗證') : (t('profile.unverified') || '未驗證')}
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Text>{t('profile.phoneVerification') || '手機號碼驗證'}</Text>
                <Text type={user?.phoneVerified ? 'success' : 'danger'}>
                  {user?.phoneVerified ? (t('profile.verified') || '已驗證') : (t('profile.unverified') || '未驗證')}
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Text>{t('profile.twoFactorAuth') || '兩步驟驗證'}</Text>
                <Text type="secondary">{t('profile.disabled') || '未啟用'}</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto py-6">
      <Title level={2} className="mb-6">
        {t('profile.title') || '我的帳戶'}
      </Title>
      
      <Layout className="bg-white rounded-lg shadow-sm min-h-[600px]">
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={250}
          collapsedWidth={80}
          className="bg-gray-50"
        >
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            className="border-r-0"
            items={menuItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              onClick: () => handleMenuClick(item.path)
            }))}
          />
        </Sider>
        
        <Layout>
          <Content className="p-6">
            {isProfileRoot ? renderOverview() : <Outlet />}
          </Content>
        </Layout>
      </Layout>
    </div>
  )
}

export default ProfilePage