// 管理後台用戶管理
import React, { useState } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  Modal, 
  Form, 
  message, 
  Tag, 
  Avatar, 
  Tooltip, 
  Statistic,
  Row,
  Col,
  Typography,
  Badge,
  Switch,
  DatePicker,
  Tabs,
  Descriptions,
  List,
  Divider,
  Progress
} from 'antd'
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  UserOutlined,
  ShoppingOutlined,
  StarOutlined,
  GiftOutlined,
  StopOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { withPermission } from '@/components/admin/withPermission'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

// 用戶數據接口
interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  avatar?: string
  phone?: string
  gender?: 'male' | 'female' | 'other'
  birthDate?: string
  status: 'active' | 'inactive' | 'banned'
  memberTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  totalSpent: number
  totalOrders: number
  averageOrderValue: number
  lastLoginAt: string
  registeredAt: string
  tags: string[]
  notes?: string
}

// 用戶訂單記錄接口
interface UserOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  itemCount: number
}

// 用戶統計接口
interface UserStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  membersByTier: {
    bronze: number
    silver: number
    gold: number
    platinum: number
    diamond: number
  }
}

// 模擬數據
const mockUsers: User[] = [
  {
    id: '1',
    email: 'alice.chen@example.com',
    username: 'alice_chen',
    firstName: 'Alice',
    lastName: 'Chen',
    avatar: 'https://i.pravatar.cc/150?img=1',
    phone: '+886-912-345-678',
    gender: 'female',
    birthDate: '1992-05-15',
    status: 'active',
    memberTier: 'gold',
    totalSpent: 28500,
    totalOrders: 15,
    averageOrderValue: 1900,
    lastLoginAt: '2024-01-20T14:30:00Z',
    registeredAt: '2023-03-15T10:00:00Z',
    tags: ['VIP客戶', '忠實顧客'],
    notes: '經常購買高端護膚品，對品質要求很高'
  },
  {
    id: '2',
    email: 'bob.wang@example.com',
    username: 'bob_wang',
    firstName: 'Bob',
    lastName: 'Wang',
    phone: '+886-923-456-789',
    gender: 'male',
    birthDate: '1988-08-22',
    status: 'active',
    memberTier: 'silver',
    totalSpent: 12300,
    totalOrders: 8,
    averageOrderValue: 1537,
    lastLoginAt: '2024-01-19T09:15:00Z',
    registeredAt: '2023-07-20T16:30:00Z',
    tags: ['新客戶'],
    notes: '對男士護膚產品感興趣'
  },
  {
    id: '3',
    email: 'carol.liu@example.com',
    username: 'carol_liu',
    firstName: 'Carol',
    lastName: 'Liu',
    avatar: 'https://i.pravatar.cc/150?img=3',
    phone: '+886-934-567-890',
    gender: 'female',
    birthDate: '1995-12-08',
    status: 'inactive',
    memberTier: 'bronze',
    totalSpent: 5600,
    totalOrders: 4,
    averageOrderValue: 1400,
    lastLoginAt: '2024-01-10T11:20:00Z',
    registeredAt: '2023-11-01T14:45:00Z',
    tags: ['潛在流失'],
    notes: '最近活躍度下降，需要關注'
  },
  {
    id: '4',
    email: 'david.zhang@example.com',
    username: 'david_zhang',
    firstName: 'David',
    lastName: 'Zhang',
    phone: '+886-945-678-901',
    gender: 'male',
    status: 'banned',
    memberTier: 'bronze',
    totalSpent: 2100,
    totalOrders: 2,
    averageOrderValue: 1050,
    lastLoginAt: '2024-01-05T08:45:00Z',
    registeredAt: '2023-12-15T13:20:00Z',
    tags: ['問題用戶'],
    notes: '因為濫用優惠券被暫停帳戶'
  },
  {
    id: '5',
    email: 'emma.huang@example.com',
    username: 'emma_huang',
    firstName: 'Emma',
    lastName: 'Huang',
    avatar: 'https://i.pravatar.cc/150?img=5',
    phone: '+886-956-789-012',
    gender: 'female',
    birthDate: '1990-03-25',
    status: 'active',
    memberTier: 'platinum',
    totalSpent: 45200,
    totalOrders: 23,
    averageOrderValue: 1965,
    lastLoginAt: '2024-01-20T16:45:00Z',
    registeredAt: '2022-08-10T09:30:00Z',
    tags: ['VIP客戶', '品牌大使', '忠實顧客'],
    notes: '頂級VIP客戶，經常參與品牌活動'
  }
]

const mockUserStats: UserStats = {
  totalUsers: 12547,
  activeUsers: 8923,
  newUsersToday: 23,
  membersByTier: {
    bronze: 6234,
    silver: 3456,
    gold: 2123,
    platinum: 567,
    diamond: 167
  }
}

const mockUserOrders: UserOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001234',
    status: 'completed',
    total: 2450,
    createdAt: '2024-01-18T10:30:00Z',
    itemCount: 3
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-001189',
    status: 'completed',
    total: 1800,
    createdAt: '2024-01-12T14:20:00Z',
    itemCount: 2
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-001156',
    status: 'completed',
    total: 3200,
    createdAt: '2024-01-05T16:15:00Z',
    itemCount: 4
  }
]

// 會員等級配置
const memberTierConfig = {
  bronze: { label: '青銅會員', color: '#CD7F32', icon: '🥉', minSpent: 0 },
  silver: { label: '白銀會員', color: '#C0C0C0', icon: '🥈', minSpent: 10000 },
  gold: { label: '黃金會員', color: '#FFD700', icon: '🥇', minSpent: 25000 },
  platinum: { label: '白金會員', color: '#E5E4E2', icon: '💎', minSpent: 50000 },
  diamond: { label: '鑽石會員', color: '#B9F2FF', icon: '💎', minSpent: 100000 }
}

// 狀態配置
const statusConfig = {
  active: { label: '正常', color: 'success', icon: <CheckCircleOutlined /> },
  inactive: { label: '非活躍', color: 'warning', icon: <WarningOutlined /> },
  banned: { label: '已封禁', color: 'error', icon: <StopOutlined /> }
}

const AdminUsers: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [tierFilter, setTierFilter] = useState<string>('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isUserModalVisible, setIsUserModalVisible] = useState(false)
  const [isUserDetailVisible, setIsUserDetailVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // 獲取用戶統計
  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockUserStats
    },
  })

  // 獲取用戶列表
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchText, statusFilter, tierFilter],
    queryFn: async () => {
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 800))
      
      let filteredUsers = mockUsers
      
      if (searchText) {
        filteredUsers = filteredUsers.filter(user =>
          user.email.toLowerCase().includes(searchText.toLowerCase()) ||
          user.username.toLowerCase().includes(searchText.toLowerCase()) ||
          user.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchText.toLowerCase())
        )
      }
      
      if (statusFilter) {
        filteredUsers = filteredUsers.filter(user => user.status === statusFilter)
      }
      
      if (tierFilter) {
        filteredUsers = filteredUsers.filter(user => user.memberTier === tierFilter)
      }
      
      return filteredUsers
    },
  })

  // 獲取用戶訂單
  const { data: userOrders } = useQuery({
    queryKey: ['userOrders', viewingUser?.id],
    queryFn: async () => {
      if (!viewingUser?.id) return []
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockUserOrders
    },
    enabled: !!viewingUser?.id,
  })

  // 更新用戶狀態
  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true }
    },
    onSuccess: () => {
      message.success('用戶狀態更新成功')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: () => {
      message.error('用戶狀態更新失敗')
    }
  })

  // 批量操作
  const batchUpdateUsers = useMutation({
    mutationFn: async ({ userIds, operation }: { userIds: string[]; operation: string }) => {
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 1500))
      return { success: true }
    },
    onSuccess: () => {
      message.success('批量操作執行成功')
      setSelectedUsers([])
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: () => {
      message.error('批量操作執行失敗')
    }
  })

  // 表格列定義
  const columns: ColumnsType<User> = [
    {
      title: '用戶信息',
      key: 'userInfo',
      width: 280,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar 
            size={48} 
            src={record.avatar} 
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              {record.firstName} {record.lastName}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
              @{record.username}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '會員等級',
      dataIndex: 'memberTier',
      key: 'memberTier',
      width: 120,
      render: (tier: keyof typeof memberTierConfig) => {
        const config = memberTierConfig[tier]
        return (
          <Tag color={config.color} style={{ fontWeight: 500 }}>
            {config.icon} {config.label}
          </Tag>
        )
      },
      filters: [
        { text: '🥉 青銅會員', value: 'bronze' },
        { text: '🥈 白銀會員', value: 'silver' },
        { text: '🥇 黃金會員', value: 'gold' },
        { text: '💎 白金會員', value: 'platinum' },
        { text: '💎 鑽石會員', value: 'diamond' },
      ],
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: keyof typeof statusConfig) => {
        const config = statusConfig[status]
        return (
          <Badge 
            status={config.color as any} 
            text={
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {config.icon}
                {config.label}
              </span>
            }
          />
        )
      },
      filters: [
        { text: '正常', value: 'active' },
        { text: '非活躍', value: 'inactive' },
        { text: '已封禁', value: 'banned' },
      ],
    },
    {
      title: '消費統計',
      key: 'spendingStats',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: 4 }}>
            總消費: ₹{record.totalSpent.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
            訂單數: {record.totalOrders}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            平均客單價: ₹{record.averageOrderValue.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: '註冊時間',
      dataIndex: 'registeredAt',
      key: 'registeredAt',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.registeredAt).unix() - dayjs(b.registeredAt).unix(),
    },
    {
      title: '最後登入',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 120,
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.lastLoginAt).unix() - dayjs(b.lastLoginAt).unix(),
    },
    {
      title: '標籤',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <div>
          {tags.slice(0, 2).map((tag, index) => (
            <Tag key={index}  style={{ marginBottom: 2 }}>
              {tag}
            </Tag>
          ))}
          {tags.length > 2 && (
            <Tag  style={{ marginBottom: 2 }}>
              +{tags.length - 2}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space >
          <Tooltip title="查看詳情">
            <Button
              type="text"
              
              icon={<EyeOutlined />}
              onClick={() => handleViewUser(record)}
            />
          </Tooltip>
          <Tooltip title="編輯用戶">
            <Button
              type="text"
              
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? '停用' : '啟用'}>
            <Button
              type="text"
              
              danger={record.status === 'active'}
              icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // 處理查看用戶詳情
  const handleViewUser = (user: User) => {
    setViewingUser(user)
    setIsUserDetailVisible(true)
  }

  // 處理編輯用戶
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue({
      ...user,
      birthDate: user.birthDate ? dayjs(user.birthDate) : null,
    })
    setIsUserModalVisible(true)
  }

  // 處理狀態切換
  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    updateUserStatus.mutate({ 
      userId: user.id, 
      status: newStatus 
    })
  }

  // 處理批量操作
  const handleBatchOperation = (operation: string) => {
    if (selectedUsers.length === 0) {
      message.warning('請選擇要操作的用戶')
      return
    }

    Modal.confirm({
      title: '確認批量操作',
      content: `確定要對選中的 ${selectedUsers.length} 個用戶執行 ${operation} 操作嗎？`,
      onOk: () => {
        batchUpdateUsers.mutate({ userIds: selectedUsers, operation })
      },
    })
  }

  // 處理表單提交
  const handleFormSubmit = async (values: any) => {
    try {
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      message.success(editingUser ? '用戶更新成功' : '用戶創建成功')
      setIsUserModalVisible(false)
      form.resetFields()
      setEditingUser(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (error) {
      message.error('操作失敗')
    }
  }

  return (
    <div>
      {/* 統計卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="總用戶數"
              value={userStats?.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活躍用戶"
              value={userStats?.activeUsers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={userStats?.newUsersToday}
              prefix={<PlusOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活躍率"
              value={userStats ? ((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(1) : 0}
              suffix="%"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 會員等級分佈 */}
      <Card title="會員等級分佈" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          {Object.entries(memberTierConfig).map(([tier, config]) => {
            const count = userStats?.membersByTier[tier as keyof typeof memberTierConfig.bronze] || 0
            const percentage = userStats ? (count / userStats.totalUsers * 100).toFixed(1) : 0
            
            return (
              <Col key={tier} xs={24} sm={12} lg={8} xl={4.8} style={{ marginBottom: 16 }}>
                <Card >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: 8 }}>
                      {config.icon}
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {config.label}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: config.color, marginBottom: 4 }}>
                      {count.toLocaleString()}
                    </div>
                    <Progress
                      percent={Number(percentage)}
                      
                      strokeColor={config.color}
                      showInfo={false}
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                      {percentage}%
                    </div>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Card>

      {/* 主內容 */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              用戶管理
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingUser(null)
                form.resetFields()
                setIsUserModalVisible(true)
              }}
            >
              新增用戶
            </Button>
          </div>
        }
      >
        {/* 搜索和篩選 */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="搜索用戶名、郵箱、姓名..."
                allowClear
                onSearch={setSearchText}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="用戶狀態"
                allowClear
                style={{ width: '100%' }}
                onChange={setStatusFilter}
              >
                <Option value="active">正常</Option>
                <Option value="inactive">非活躍</Option>
                <Option value="banned">已封禁</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="會員等級"
                allowClear
                style={{ width: '100%' }}
                onChange={setTierFilter}
              >
                <Option value="bronze">青銅會員</Option>
                <Option value="silver">白銀會員</Option>
                <Option value="gold">黃金會員</Option>
                <Option value="platinum">白金會員</Option>
                <Option value="diamond">鑽石會員</Option>
              </Select>
            </Col>
          </Row>
        </div>

        {/* 批量操作 */}
        {selectedUsers.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>已選擇 {selectedUsers.length} 個用戶</span>
              <Button 
                 
                onClick={() => handleBatchOperation('activate')}
                loading={batchUpdateUsers.isPending}
              >
                批量啟用
              </Button>
              <Button 
                 
                onClick={() => handleBatchOperation('deactivate')}
                loading={batchUpdateUsers.isPending}
              >
                批量停用
              </Button>
              <Button 
                 
                onClick={() => handleBatchOperation('upgrade')}
                loading={batchUpdateUsers.isPending}
              >
                批量升級
              </Button>
              <Button 
                 
                danger 
                onClick={() => handleBatchOperation('delete')}
                loading={batchUpdateUsers.isPending}
              >
                批量刪除
              </Button>
            </Space>
          </div>
        )}

        {/* 用戶表格 */}
        <Table
          columns={columns}
          dataSource={users}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            total: users?.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
          rowSelection={{
            selectedRowKeys: selectedUsers,
            onChange: setSelectedUsers,
          }}
        />
      </Card>

      {/* 用戶表單模態框 */}
      <Modal
        title={editingUser ? '編輯用戶' : '新增用戶'}
        open={isUserModalVisible}
        onCancel={() => {
          setIsUserModalVisible(false)
          form.resetFields()
          setEditingUser(null)
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="名字"
                rules={[{ required: true, message: '請輸入名字' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="姓氏"
                rules={[{ required: true, message: '請輸入姓氏' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用戶名"
                rules={[{ required: true, message: '請輸入用戶名' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="郵箱"
                rules={[
                  { required: true, message: '請輸入郵箱' },
                  { type: 'email', message: '請輸入有效的郵箱地址' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="電話"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="性別"
              >
                <Select placeholder="請選擇性別">
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="birthDate"
                label="生日"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="memberTier"
                label="會員等級"
                rules={[{ required: true, message: '請選擇會員等級' }]}
              >
                <Select placeholder="請選擇會員等級">
                  <Option value="bronze">青銅會員</Option>
                  <Option value="silver">白銀會員</Option>
                  <Option value="gold">黃金會員</Option>
                  <Option value="platinum">白金會員</Option>
                  <Option value="diamond">鑽石會員</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="狀態"
                rules={[{ required: true, message: '請選擇狀態' }]}
              >
                <Select placeholder="請選擇狀態">
                  <Option value="active">正常</Option>
                  <Option value="inactive">非活躍</Option>
                  <Option value="banned">已封禁</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="avatar"
                label="頭像URL"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="備註"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsUserModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '創建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 用戶詳情模態框 */}
      <Modal
        title="用戶詳情"
        open={isUserDetailVisible}
        onCancel={() => {
          setIsUserDetailVisible(false)
          setViewingUser(null)
        }}
        footer={[
          <Button key="close" onClick={() => setIsUserDetailVisible(false)}>
            關閉
          </Button>
        ]}
        width={800}
      >
        {viewingUser && (
          <Tabs defaultActiveKey="info">
            <Tabs.TabPane tab="基本信息" key="info">
              <div style={{ display: 'flex', alignItems: 'start', gap: 24, marginBottom: 24 }}>
                <Avatar 
                  size={80} 
                  src={viewingUser.avatar} 
                  icon={<UserOutlined />}
                />
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                    {viewingUser.firstName} {viewingUser.lastName}
                  </Title>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color={memberTierConfig[viewingUser.memberTier].color}>
                      {memberTierConfig[viewingUser.memberTier].icon} {memberTierConfig[viewingUser.memberTier].label}
                    </Tag>
                    <Badge 
                      status={statusConfig[viewingUser.status].color as any} 
                      text={statusConfig[viewingUser.status].label}
                      style={{ marginLeft: 8 }}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    {viewingUser.tags.map((tag, index) => (
                      <Tag key={index} style={{ marginBottom: 4 }}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>

              <Descriptions bordered column={2}>
                <Descriptions.Item label="用戶名">{viewingUser.username}</Descriptions.Item>
                <Descriptions.Item label="郵箱">{viewingUser.email}</Descriptions.Item>
                <Descriptions.Item label="電話">{viewingUser.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="性別">
                  {viewingUser.gender === 'male' ? '男' : 
                   viewingUser.gender === 'female' ? '女' : 
                   viewingUser.gender === 'other' ? '其他' : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="生日">
                  {viewingUser.birthDate ? dayjs(viewingUser.birthDate).format('YYYY-MM-DD') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="註冊時間">
                  {dayjs(viewingUser.registeredAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="最後登入">
                  {dayjs(viewingUser.lastLoginAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="總消費">
                  ₹{viewingUser.totalSpent.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="總訂單數">
                  {viewingUser.totalOrders}
                </Descriptions.Item>
                <Descriptions.Item label="平均客單價">
                  ₹{viewingUser.averageOrderValue.toLocaleString()}
                </Descriptions.Item>
              </Descriptions>

              {viewingUser.notes && (
                <div style={{ marginTop: 16 }}>
                  <Title level={5}>備註</Title>
                  <div style={{ padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                    {viewingUser.notes}
                  </div>
                </div>
              )}
            </Tabs.TabPane>

            <Tabs.TabPane tab="訂單記錄" key="orders">
              <List
                loading={!userOrders}
                dataSource={userOrders}
                renderItem={(order) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{order.orderNumber}</span>
                          <Tag color={order.status === 'completed' ? 'success' : 'processing'}>
                            {order.status === 'completed' ? '已完成' : '處理中'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div>金額: ₹{order.total.toLocaleString()} | 商品數: {order.itemCount}</div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Tabs.TabPane>

            <Tabs.TabPane tab="活動記錄" key="activities">
              <List
                dataSource={[
                  { type: 'login', description: '用戶登入', time: '2024-01-20 14:30' },
                  { type: 'order', description: '創建訂單 ORD-2024-001234', time: '2024-01-18 10:30' },
                  { type: 'profile', description: '更新個人資料', time: '2024-01-15 16:20' },
                ]}
                renderItem={(activity) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        activity.type === 'login' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                        activity.type === 'order' ? <ShoppingOutlined style={{ color: '#1890ff' }} /> :
                        <EditOutlined style={{ color: '#faad14' }} />
                      }
                      title={activity.description}
                      description={activity.time}
                    />
                  </List.Item>
                )}
              />
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  )
}

export default withPermission(AdminUsers, ['admin', 'user_manager'])