import React, { useState, useEffect } from 'react'
import {
  Card,
  List,
  Button,
  Badge,
  Empty,
  Spin,
  message,
  Avatar,
  Typography,
  Space,
  Tag,
  Checkbox,
  Modal,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Tabs,
  Input,
  Select,
  Divider
} from 'antd'
import {
  BellOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  TruckOutlined,
  GiftOutlined,
  WarningOutlined,
  StarOutlined,
  HeartOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  FireOutlined,
  FilterOutlined,
  MailOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Notification, NotificationType } from '../types'
import { useAuth } from '../hooks/useAuth'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const { Option } = Select
const { TabPane } = Tabs

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all')
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'type'>('newest')

  // Mock data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        userId: user?.id || '1',
        type: 'order_update',
        title: '訂單已出貨',
        message: '您的訂單 #ORD-2024-001 已經出貨，預計1-2個工作日內送達。',
        data: {
          orderId: 'ORD-2024-001',
          trackingNumber: '1234567890'
        },
        isRead: false,
        createdAt: '2024-08-31T10:30:00Z'
      },
      {
        id: '2',
        userId: user?.id || '1',
        type: 'payment_success',
        title: '付款成功',
        message: '您的付款 NT$ 2,680 已成功處理，感謝您的購買！',
        data: {
          orderId: 'ORD-2024-002',
          amount: 2680
        },
        isRead: false,
        createdAt: '2024-08-30T15:20:00Z'
      },
      {
        id: '3',
        userId: user?.id || '1',
        type: 'promotion',
        title: '🎉 限時特惠活動',
        message: '精選美妝商品最高 5 折優惠，活動僅限 3 天！',
        data: {
          promoCode: 'BEAUTY50',
          expiryDate: '2024-09-05T23:59:59Z'
        },
        isRead: true,
        createdAt: '2024-08-29T09:00:00Z'
      },
      {
        id: '4',
        userId: user?.id || '1',
        type: 'wishlist_price_drop',
        title: '心願清單商品降價',
        message: 'YSL 超模光感粉底液現在特價 NT$ 2,280，比您加入心願清單時便宜了 15%！',
        data: {
          productId: '2',
          oldPrice: 2680,
          newPrice: 2280,
          discount: 15
        },
        isRead: true,
        createdAt: '2024-08-28T12:00:00Z'
      },
      {
        id: '5',
        userId: user?.id || '1',
        type: 'review_reminder',
        title: '評論提醒',
        message: '您購買的 Dior 烈焰藍金唇膏使用體驗如何？分享您的評論來幫助其他買家。',
        data: {
          productId: '1',
          orderId: 'ORD-2024-001'
        },
        isRead: false,
        createdAt: '2024-08-27T14:00:00Z'
      },
      {
        id: '6',
        userId: user?.id || '1',
        type: 'system',
        title: '系統維護通知',
        message: '系統將於今晚 23:00-01:00 進行例行維護，期間可能影響部分功能使用。',
        isRead: true,
        createdAt: '2024-08-26T18:00:00Z'
      }
    ]

    setTimeout(() => {
      setNotifications(mockNotifications)
      setLoading(false)
    }, 1000)
  }, [user?.id])

  const getNotificationIcon = (type: NotificationType) => {
    const iconMap = {
      order_update: <TruckOutlined className="text-blue-600" />,
      payment_success: <CreditCardOutlined className="text-green-600" />,
      payment_failed: <WarningOutlined className="text-red-600" />,
      shipping_update: <TruckOutlined className="text-orange-600" />,
      promotion: <GiftOutlined className="text-purple-600" />,
      system: <BellOutlined className="text-gray-600" />,
      review_reminder: <StarOutlined className="text-yellow-600" />,
      wishlist_price_drop: <HeartOutlined className="text-pink-600" />
    }
    return iconMap[type] || <BellOutlined />
  }

  const getNotificationTypeText = (type: NotificationType) => {
    const typeMap = {
      order_update: t('notifications.orderUpdate') || '訂單更新',
      payment_success: t('notifications.paymentSuccess') || '付款成功',
      payment_failed: t('notifications.paymentFailed') || '付款失敗',
      shipping_update: t('notifications.shippingUpdate') || '物流更新',
      promotion: t('notifications.promotion') || '促銷活動',
      system: t('notifications.system') || '系統通知',
      review_reminder: t('notifications.reviewReminder') || '評論提醒',
      wishlist_price_drop: t('notifications.wishlistPriceDrop') || '降價通知'
    }
    return typeMap[type] || type
  }

  const getNotificationTypeColor = (type: NotificationType) => {
    const colorMap = {
      order_update: 'blue',
      payment_success: 'green',
      payment_failed: 'red',
      shipping_update: 'orange',
      promotion: 'purple',
      system: 'default',
      review_reminder: 'gold',
      wishlist_price_drop: 'pink'
    }
    return colorMap[type] || 'default'
  }

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      )
      message.success(t('notifications.markAsReadSuccess') || '已標記為已讀')
    } catch (error) {
      message.error(t('notifications.markAsReadError') || '標記失敗')
    }
  }

  const handleMarkAsUnread = async (notificationIds: string[]) => {
    try {
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: false, readAt: undefined }
            : notification
        )
      )
      message.success(t('notifications.markAsUnreadSuccess') || '已標記為未讀')
    } catch (error) {
      message.error(t('notifications.markAsUnreadError') || '標記失敗')
    }
  }

  const handleDeleteNotifications = async (notificationIds: string[]) => {
    try {
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)))
      setSelectedNotifications(prev => prev.filter(id => !notificationIds.includes(id)))
      message.success(t('notifications.deleteSuccess') || '通知已刪除')
    } catch (error) {
      message.error(t('notifications.deleteError') || '刪除失敗')
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // 標記為已讀
    if (!notification.isRead) {
      handleMarkAsRead([notification.id])
    }

    // 根據通知類型導航
    switch (notification.type) {
      case 'order_update':
      case 'payment_success':
      case 'shipping_update':
        if (notification.data?.orderId) {
          navigate(`/orders/${notification.data.orderId}`)
        }
        break
      case 'review_reminder':
        if (notification.data?.productId) {
          navigate(`/products/${notification.data.productId}`)
        }
        break
      case 'wishlist_price_drop':
        if (notification.data?.productId) {
          navigate(`/products/${notification.data.productId}`)
        }
        break
      case 'promotion':
        navigate('/products')
        break
      default:
        // 系統通知等不需要特定導航
        break
    }
  }

  const handleMarkAllAsRead = () => {
    const unreadIds = filteredNotifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length > 0) {
      handleMarkAsRead(unreadIds)
    }
  }

  const handleDeleteAll = () => {
    Modal.confirm({
      title: t('notifications.deleteAllTitle') || '確定要刪除所有通知嗎？',
      content: t('notifications.deleteAllContent') || '此操作無法復原',
      onOk: () => {
        const allIds = filteredNotifications.map(n => n.id)
        handleDeleteNotifications(allIds)
      }
    })
  }

  // 篩選和排序通知
  const filteredNotifications = notifications
    .filter(notification => {
      // 按標籤篩選
      if (activeTab === 'unread' && notification.isRead) return false
      if (activeTab === 'read' && !notification.isRead) return false
      
      // 按類型篩選
      if (filterType !== 'all' && notification.type !== filterType) return false
      
      // 搜尋篩選
      if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const readCount = notifications.filter(n => n.isRead).length

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="mb-0 flex items-center">
          <BellOutlined className="mr-3" />
          {t('notifications.title') || '通知中心'}
          {unreadCount > 0 && (
            <Badge count={unreadCount} className="ml-3" />
          )}
        </Title>
        
        <Space>
          {selectedNotifications.length > 0 ? (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleMarkAsRead(selectedNotifications)}
              >
                {t('notifications.markSelectedAsRead') || `標記為已讀 (${selectedNotifications.length})`}
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteNotifications(selectedNotifications)}
              >
                {t('notifications.deleteSelected') || '刪除選中'}
              </Button>
            </>
          ) : (
            <>
              <Button
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                {t('notifications.markAllAsRead') || '全部標記為已讀'}
              </Button>
              <Button
                icon={<DeleteOutlined />}
                onClick={handleDeleteAll}
                disabled={notifications.length === 0}
              >
                {t('notifications.deleteAll') || '清空所有'}
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* 篩選工具列 */}
      <Card className="mb-4" bodyStyle={{ padding: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder={t('notifications.searchPlaceholder') || '搜尋通知內容...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 150 }}
              placeholder={t('notifications.filterByType') || '篩選類型'}
            >
              <Option value="all">{t('notifications.allTypes') || '全部類型'}</Option>
              <Option value="order_update">{getNotificationTypeText('order_update')}</Option>
              <Option value="payment_success">{getNotificationTypeText('payment_success')}</Option>
              <Option value="promotion">{getNotificationTypeText('promotion')}</Option>
              <Option value="wishlist_price_drop">{getNotificationTypeText('wishlist_price_drop')}</Option>
              <Option value="review_reminder">{getNotificationTypeText('review_reminder')}</Option>
              <Option value="system">{getNotificationTypeText('system')}</Option>
            </Select>
          </Col>
          <Col>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 120 }}
            >
              <Option value="newest">{t('notifications.sortNewest') || '最新'}</Option>
              <Option value="oldest">{t('notifications.sortOldest') || '最舊'}</Option>
              <Option value="type">{t('notifications.sortType') || '類型'}</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as any)}
        items={[
          {
            key: 'all',
            label: (
              <span>
                {t('notifications.all') || '全部'}
                <Badge count={notifications.length} className="ml-2" showZero />
              </span>
            )
          },
          {
            key: 'unread',
            label: (
              <span>
                {t('notifications.unread') || '未讀'}
                <Badge count={unreadCount} className="ml-2" showZero />
              </span>
            )
          },
          {
            key: 'read',
            label: (
              <span>
                {t('notifications.read') || '已讀'}
                <Badge count={readCount} className="ml-2" showZero />
              </span>
            )
          }
        ]}
      />

      {/* 全選操作 */}
      {filteredNotifications.length > 0 && (
        <Card className="mb-4" bodyStyle={{ padding: '12px 16px' }}>
          <div className="flex items-center justify-between">
            <Checkbox
              checked={selectedNotifications.length === filteredNotifications.length}
              indeterminate={selectedNotifications.length > 0 && selectedNotifications.length < filteredNotifications.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedNotifications(filteredNotifications.map(n => n.id))
                } else {
                  setSelectedNotifications([])
                }
              }}
            >
              {t('notifications.selectAll') || '全選'}
              {selectedNotifications.length > 0 && ` (${selectedNotifications.length})`}
            </Checkbox>

            {selectedNotifications.length > 0 && (
              <Space>
                <Button
                  
                  icon={<CheckOutlined />}
                  onClick={() => handleMarkAsRead(selectedNotifications)}
                >
                  {t('notifications.markAsRead') || '標記已讀'}
                </Button>
                <Button
                  
                  icon={<EyeOutlined />}
                  onClick={() => handleMarkAsUnread(selectedNotifications)}
                >
                  {t('notifications.markAsUnread') || '標記未讀'}
                </Button>
                <Button
                  
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteNotifications(selectedNotifications)}
                >
                  {t('notifications.delete') || '刪除'}
                </Button>
              </Space>
            )}
          </div>
        </Card>
      )}

      {/* 通知列表 */}
      {filteredNotifications.length === 0 ? (
        <Empty
          description={
            searchQuery || filterType !== 'all' 
              ? (t('notifications.noMatchingResults') || '沒有符合條件的通知')
              : (t('notifications.empty') || '暫無通知')
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={filteredNotifications}
          renderItem={(notification) => (
            <List.Item
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              } ${selectedNotifications.includes(notification.id) ? 'bg-blue-100' : ''}`}
              actions={[
                <Checkbox
                  key="select"
                  checked={selectedNotifications.includes(notification.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedNotifications(prev => [...prev, notification.id])
                    } else {
                      setSelectedNotifications(prev => prev.filter(id => id !== notification.id))
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />,
                <Tooltip
                  key="read"
                  title={notification.isRead ? (t('notifications.markAsUnread') || '標記為未讀') : (t('notifications.markAsRead') || '標記為已讀')}
                >
                  <Button
                    type="text"
                    
                    icon={notification.isRead ? <EyeOutlined /> : <CheckOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (notification.isRead) {
                        handleMarkAsUnread([notification.id])
                      } else {
                        handleMarkAsRead([notification.id])
                      }
                    }}
                  />
                </Tooltip>,
                <Popconfirm
                  key="delete"
                  title={t('notifications.deleteConfirm') || '確定要刪除這個通知嗎？'}
                  onConfirm={(e) => {
                    e?.stopPropagation()
                    handleDeleteNotifications([notification.id])
                  }}
                  okText={t('common.confirm') || '確定'}
                  cancelText={t('common.cancel') || '取消'}
                >
                  <Button
                    type="text"
                    
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              ]}
              onClick={() => handleNotificationClick(notification)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={getNotificationIcon(notification.type)}
                    className="flex-shrink-0"
                  />
                }
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Text strong={!notification.isRead}>
                        {notification.title}
                      </Text>
                      {!notification.isRead && (
                        <Badge dot />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tag color={getNotificationTypeColor(notification.type)} >
                        {getNotificationTypeText(notification.type)}
                      </Tag>
                      <Text type="secondary" className="text-xs">
                        {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </div>
                  </div>
                }
                description={
                  <Paragraph
                    className={`mb-0 ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}
                    ellipsis={{ rows: 2, expandable: false }}
                  >
                    {notification.message}
                  </Paragraph>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  )
}

export default NotificationsPage