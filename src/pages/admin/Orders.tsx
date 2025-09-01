/**
 * 管理後台訂單管理
 * 提供訂單的查看、狀態管理和詳細信息功能
 */

import React, { useState } from 'react'
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Select,
  Tag,
  Avatar,
  message,
  Modal,
  Form,
  Row,
  Col,
  Typography,
  Tooltip,
  Timeline,
  Descriptions,
  Divider,
  DatePicker,
  InputNumber,
  Steps
} from 'antd'
import {
  EyeOutlined,
  SearchOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  PrinterOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api'
import { Order, OrderSearchParams, PaginatedResponse } from '@/api/types'
import { withPermission } from '@/components/admin/withPermission'
import { usePermission } from '@/hooks/usePermission'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { Step } = Steps

const AdminOrders: React.FC = () => {
  const { can } = usePermission()
  const queryClient = useQueryClient()

  // 狀態管理
  const [searchParams, setSearchParams] = useState<OrderSearchParams>({
    page: 1,
    limit: 10,
    sort: 'created_desc'
  })
  const [orderDetailModal, setOrderDetailModal] = useState<{
    visible: boolean
    order?: Order
  }>({ visible: false })
  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    visible: boolean
    order?: Order
  }>({ visible: false })

  const [statusForm] = Form.useForm()

  // 獲取訂單列表
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)))
          } else {
            params.append(key, String(value))
          }
        }
      })

      try {
        const response = await apiClient.get<PaginatedResponse<Order>>(`/admin/orders?${params}`)
        return response.data
      } catch (error) {
        // 模擬數據用於開發測試
        return {
          data: [
            {
              id: '1',
              orderNumber: 'ORD-2024-001',
              userId: '1',
              status: 'paid',
              subtotal: 2890,
              shippingFee: 100,
              tax: 0,
              discountAmount: 0,
              total: 2990,
              currency: 'TWD',
              paymentMethod: 'credit_card',
              paymentStatus: 'paid',
              shippingAddress: {
                recipientName: '王小明',
                phone: '0912345678',
                address: '台北市信義區信義路五段7號',
                city: '台北市',
                state: '台灣',
                countryCode: 'TW',
                district: '信義區',
                postalCode: '110',
                type: 'shipping',
                isDefault: true
              },
              notes: '請放在管理室',
              trackingNumber: 'TW123456789',
              createdAt: dayjs().subtract(2, 'day').toISOString(),
              updatedAt: dayjs().subtract(1, 'day').toISOString(),
              user: { 
                id: '1', 
                firstName: '王', 
                lastName: '小明', 
                email: 'wang@example.com' 
              },
              items: [
                {
                  id: '1',
                  orderId: '1',
                  productId: '1',
                  quantity: 1,
                  price: 2890,
                  subtotal: 2890,
                  createdAt: dayjs().subtract(2, 'day').toISOString(),
                  product: {
                    id: '1',
                    name: '蘭蔻超進化肌因賦活露',
                    images: ['/images/products/lancome-1.jpg']
                  }
                }
              ]
            },
            {
              id: '2',
              orderNumber: 'ORD-2024-002',
              userId: '2',
              status: 'processing',
              subtotal: 4200,
              shippingFee: 100,
              tax: 0,
              discountAmount: 200,
              total: 4100,
              currency: 'TWD',
              paymentMethod: 'credit_card',
              paymentStatus: 'paid',
              shippingAddress: {
                recipientName: '李小華',
                phone: '0987654321',
                address: '新北市板橋區中山路一段99號',
                city: '新北市',
                state: '台灣',
                countryCode: 'TW',
                district: '板橋區',
                postalCode: '220',
                type: 'shipping',
                isDefault: true
              },
              createdAt: dayjs().subtract(1, 'day').toISOString(),
              updatedAt: dayjs().subtract(1, 'hour').toISOString(),
              user: { 
                id: '2', 
                firstName: '李', 
                lastName: '小華', 
                email: 'lee@example.com' 
              },
              items: [
                {
                  id: '2',
                  orderId: '2',
                  productId: '2',
                  quantity: 1,
                  price: 4200,
                  subtotal: 4200,
                  createdAt: dayjs().subtract(1, 'day').toISOString(),
                  product: {
                    id: '2',
                    name: 'SK-II 青春露',
                    images: ['/images/products/skii-1.jpg']
                  }
                }
              ]
            }
          ] as Order[],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          },
          success: true
        } as PaginatedResponse<Order>
      }
    }
  })

  // 更新訂單狀態
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string, status: string, notes?: string }) => {
      const response = await apiClient.put(`/admin/orders/${id}/status`, { status, notes })
      return response.data
    },
    onSuccess: () => {
      message.success('訂單狀態更新成功')
      setStatusUpdateModal({ visible: false })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      statusForm.resetFields()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '狀態更新失敗')
    }
  })

  // 處理搜索
  const handleSearch = (value: string) => {
    setSearchParams({ ...searchParams, q: value, page: 1 })
  }

  // 處理篩選
  const handleFilter = (key: string, value: any) => {
    setSearchParams({ ...searchParams, [key]: value, page: 1 })
  }

  // 處理表格變化
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const newParams: OrderSearchParams = {
      ...searchParams,
      page: pagination.current,
      limit: pagination.pageSize
    }

    if (sorter.field) {
      const order = sorter.order === 'ascend' ? 'asc' : 'desc'
      newParams.sort = `${sorter.field}_${order}` as any
    }

    setSearchParams(newParams)
  }

  // 處理狀態更新
  const handleStatusUpdate = (order: Order) => {
    setStatusUpdateModal({ visible: true, order })
    statusForm.setFieldsValue({
      status: order.status,
      notes: ''
    })
  }

  // 處理狀態更新提交
  const handleStatusSubmit = async (values: any) => {
    if (statusUpdateModal.order) {
      updateStatusMutation.mutate({
        id: statusUpdateModal.order.id,
        status: values.status,
        notes: values.notes
      })
    }
  }

  // 訂單狀態配置
  const orderStatusConfig = {
    pending: { color: 'orange', text: '待付款', step: 0 },
    paid: { color: 'blue', text: '已付款', step: 1 },
    confirmed: { color: 'cyan', text: '已確認', step: 2 },
    processing: { color: 'purple', text: '處理中', step: 3 },
    shipped: { color: 'geekblue', text: '已出貨', step: 4 },
    delivered: { color: 'green', text: '已送達', step: 5 },
    completed: { color: 'green', text: '已完成', step: 6 },
    cancelled: { color: 'red', text: '已取消', step: -1 },
    refunded: { color: 'red', text: '已退款', step: -1 }
  }

  // 獲取訂單步驟
  const getOrderSteps = (status: string) => {
    const steps = [
      { title: '待付款', description: '等待客戶付款' },
      { title: '已付款', description: '付款成功' },
      { title: '已確認', description: '訂單確認' },
      { title: '處理中', description: '準備商品中' },
      { title: '已出貨', description: '商品已出貨' },
      { title: '已送達', description: '商品已送達' },
      { title: '已完成', description: '訂單完成' }
    ]

    const currentStep = orderStatusConfig[status as keyof typeof orderStatusConfig]?.step || 0
    return { steps, current: currentStep >= 0 ? currentStep : steps.length }
  }

  // 表格列配置
  const columns = [
    {
      title: '訂單信息',
      key: 'order',
      width: 200,
      render: (record: Order) => (
        <div>
          <div className="font-medium">{record.orderNumber}</div>
          <Text type="secondary" className="text-sm">
            {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
          </Text>
        </div>
      )
    },
    {
      title: '客戶信息',
      key: 'customer',
      width: 150,
      render: (record: Order) => (
        <Space>
          <Avatar icon={<UserOutlined />}  />
          <div>
            <div className="font-medium">
              {record.user?.firstName} {record.user?.lastName}
            </div>
            <Text type="secondary" className="text-sm">
              {record.user?.email}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '商品信息',
      key: 'items',
      width: 200,
      render: (record: Order) => (
        <div>
          <Text className="text-sm">
            共 {record.items.length} 件商品
          </Text>
          {record.items.slice(0, 2).map(item => (
            <div key={item.id} className="text-xs text-gray-500 truncate">
              {item.product.name} × {item.quantity}
            </div>
          ))}
          {record.items.length > 2 && (
            <Text className="text-xs text-gray-400">
              ...等 {record.items.length - 2} 項
            </Text>
          )}
        </div>
      )
    },
    {
      title: '金額',
      key: 'amount',
      width: 120,
      sorter: true,
      render: (record: Order) => (
        <div>
          <div className="font-medium text-green-600">
            NT$ {record.total.toLocaleString()}
          </div>
          {record.discountAmount > 0 && (
            <Text className="text-sm text-red-500">
              折扣 NT$ {record.discountAmount.toLocaleString()}
            </Text>
          )}
        </div>
      )
    },
    {
      title: '付款狀態',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      filters: [
        { text: '待付款', value: 'pending' },
        { text: '已付款', value: 'paid' },
        { text: '付款失敗', value: 'failed' },
        { text: '已退款', value: 'refunded' }
      ],
      render: (paymentStatus: string) => {
        const config = {
          pending: { color: 'orange', text: '待付款' },
          paid: { color: 'green', text: '已付款' },
          failed: { color: 'red', text: '付款失敗' },
          refunded: { color: 'red', text: '已退款' }
        }
        const statusConfig = config[paymentStatus as keyof typeof config]
        return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
      }
    },
    {
      title: '訂單狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: Object.entries(orderStatusConfig).map(([key, config]) => ({
        text: config.text,
        value: key
      })),
      render: (status: string) => {
        const config = orderStatusConfig[status as keyof typeof orderStatusConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '配送信息',
      key: 'shipping',
      width: 150,
      render: (record: Order) => (
        <div>
          <div className="text-sm">
            {record.shippingAddress.recipientName}
          </div>
          <Text type="secondary" className="text-xs">
            {record.shippingAddress.city} {record.shippingAddress.district}
          </Text>
          {record.trackingNumber && (
            <div className="text-xs text-blue-500">
              追蹤號: {record.trackingNumber}
            </div>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (record: Order) => (
        <Space>
          <Tooltip title="查看詳情">
            <Button
              type="text"
              
              icon={<EyeOutlined />}
              onClick={() => setOrderDetailModal({ visible: true, order: record })}
            />
          </Tooltip>
          {can(['order:write']) && (
            <Tooltip title="更新狀態">
              <Button
                type="text"
                
                icon={<TruckOutlined />}
                onClick={() => handleStatusUpdate(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="列印訂單">
            <Button
              type="text"
              
              icon={<PrinterOutlined />}
              onClick={() => message.info('列印功能開發中')}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* 標題和操作區域 */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={2} className="mb-0">訂單管理</Title>
          <Space>
            <Button icon={<DownloadOutlined />}>
              導出訂單
            </Button>
          </Space>
        </div>

        {/* 搜索和篩選區域 */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8} lg={6}>
            <Input.Search
              placeholder="搜索訂單編號或客戶"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={16} lg={18}>
            <Space wrap>
              <Select
                placeholder="訂單狀態"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilter('status', value)}
              >
                {Object.entries(orderStatusConfig).map(([key, config]) => (
                  <Option key={key} value={key}>{config.text}</Option>
                ))}
              </Select>
              <Select
                placeholder="付款狀態"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilter('paymentStatus', value)}
              >
                <Option value="pending">待付款</Option>
                <Option value="paid">已付款</Option>
                <Option value="failed">付款失敗</Option>
                <Option value="refunded">已退款</Option>
              </Select>
              <RangePicker
                placeholder={['開始日期', '結束日期']}
                onChange={(dates) => {
                  if (dates) {
                    handleFilter('dateFrom', dates[0]?.format('YYYY-MM-DD'))
                    handleFilter('dateTo', dates[1]?.format('YYYY-MM-DD'))
                  } else {
                    handleFilter('dateFrom', undefined)
                    handleFilter('dateTo', undefined)
                  }
                }}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 訂單列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={ordersData?.data}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.limit,
            total: ordersData?.pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 項`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 訂單詳情彈窗 */}
      <Modal
        title={`訂單詳情 - ${orderDetailModal.order?.orderNumber}`}
        open={orderDetailModal.visible}
        onCancel={() => setOrderDetailModal({ visible: false })}
        width={900}
        footer={
          <Button onClick={() => setOrderDetailModal({ visible: false })}>
            關閉
          </Button>
        }
      >
        {orderDetailModal.order && (
          <div className="space-y-6">
            {/* 訂單進度 */}
            <Card title="訂單進度" >
              <Steps 
                current={getOrderSteps(orderDetailModal.order.status).current}
                items={getOrderSteps(orderDetailModal.order.status).steps}
                
              />
            </Card>

            <Row gutter={16}>
              {/* 基本信息 */}
              <Col span={12}>
                <Card title="訂單信息" >
                  <Descriptions column={1} >
                    <Descriptions.Item label="訂單編號">
                      {orderDetailModal.order.orderNumber}
                    </Descriptions.Item>
                    <Descriptions.Item label="訂單狀態">
                      <Tag color={orderStatusConfig[orderDetailModal.order.status as keyof typeof orderStatusConfig].color}>
                        {orderStatusConfig[orderDetailModal.order.status as keyof typeof orderStatusConfig].text}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="付款方式">
                      {orderDetailModal.order.paymentMethod === 'credit_card' ? '信用卡' : orderDetailModal.order.paymentMethod}
                    </Descriptions.Item>
                    <Descriptions.Item label="付款狀態">
                      <Tag color={orderDetailModal.order.paymentStatus === 'paid' ? 'green' : 'orange'}>
                        {orderDetailModal.order.paymentStatus === 'paid' ? '已付款' : '待付款'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="創建時間">
                      {dayjs(orderDetailModal.order.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              {/* 客戶信息 */}
              <Col span={12}>
                <Card title="客戶信息" >
                  <Descriptions column={1} >
                    <Descriptions.Item label="姓名">
                      {orderDetailModal.order.user?.firstName} {orderDetailModal.order.user?.lastName}
                    </Descriptions.Item>
                    <Descriptions.Item label="郵箱">
                      {orderDetailModal.order.user?.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="收件人">
                      {orderDetailModal.order.shippingAddress.recipientName}
                    </Descriptions.Item>
                    <Descriptions.Item label="電話">
                      {orderDetailModal.order.shippingAddress.phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="地址">
                      {orderDetailModal.order.shippingAddress.address}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {/* 商品清單 */}
            <Card title="商品清單" >
              <Table
                dataSource={orderDetailModal.order.items}
                pagination={false}
                
                rowKey="id"
                columns={[
                  {
                    title: '商品',
                    key: 'product',
                    render: (record: any) => (
                      <Space>
                        <Avatar src={record.product.images[0]} shape="square" />
                        <span>{record.product.name}</span>
                      </Space>
                    )
                  },
                  {
                    title: '單價',
                    dataIndex: 'price',
                    render: (price: number) => `NT$ ${price.toLocaleString()}`
                  },
                  {
                    title: '數量',
                    dataIndex: 'quantity'
                  },
                  {
                    title: '小計',
                    dataIndex: 'subtotal',
                    render: (subtotal: number) => `NT$ ${subtotal.toLocaleString()}`
                  }
                ]}
              />
            </Card>

            {/* 金額明細 */}
            <Card title="金額明細" >
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} >
                    <Descriptions.Item label="商品小計">
                      NT$ {orderDetailModal.order.subtotal.toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="運費">
                      NT$ {orderDetailModal.order.shippingFee.toLocaleString()}
                    </Descriptions.Item>
                    {orderDetailModal.order.discountAmount > 0 && (
                      <Descriptions.Item label="折扣">
                        -NT$ {orderDetailModal.order.discountAmount.toLocaleString()}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="總計">
                      <Text strong className="text-lg text-green-600">
                        NT$ {orderDetailModal.order.total.toLocaleString()}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* 備註信息 */}
            {orderDetailModal.order.notes && (
              <Card title="備註信息" >
                <Text>{orderDetailModal.order.notes}</Text>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* 狀態更新彈窗 */}
      <Modal
        title="更新訂單狀態"
        open={statusUpdateModal.visible}
        onCancel={() => setStatusUpdateModal({ visible: false })}
        footer={
          <Space>
            <Button onClick={() => setStatusUpdateModal({ visible: false })}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => statusForm.submit()}
              loading={updateStatusMutation.isPending}
            >
              更新
            </Button>
          </Space>
        }
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleStatusSubmit}
        >
          <Form.Item
            name="status"
            label="訂單狀態"
            rules={[{ required: true, message: '請選擇訂單狀態' }]}
          >
            <Select placeholder="請選擇訂單狀態">
              {Object.entries(orderStatusConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  <Tag color={config.color}>{config.text}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="備註">
            <Input.TextArea
              rows={3}
              placeholder="請輸入狀態更新備註"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default withPermission(AdminOrders, ['order:read'])