/**
 * 管理後台儀表板
 * 顯示系統統計數據和數據可視化
 */

import React, { useState, useEffect } from 'react'
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Space, 
  Tag, 
  Table, 
  Avatar,
  Progress,
  Button,
  DatePicker,
  Select,
  Spin,
  message
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  EyeOutlined,
  EditOutlined,
  RiseOutlined
} from '@ant-design/icons'
import * as echarts from 'echarts'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api'
import { DashboardStats, Order, Product, User } from '@/api/types'
import { withPermission } from '@/components/admin/withPermission'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface ChartProps {
  id: string
  title: string
  height?: number
}

// 銷售趨勢圖表組件
const SalesChart: React.FC<ChartProps> = ({ id, title, height = 300 }) => {
  useEffect(() => {
    const chartDom = document.getElementById(id)
    if (chartDom) {
      const myChart = echarts.init(chartDom)
      const option = {
        title: {
          text: title,
          textStyle: {
            fontSize: 14,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['銷售額', '訂單數']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
        },
        yAxis: [
          {
            type: 'value',
            name: '銷售額 (NT$)',
            position: 'left'
          },
          {
            type: 'value',
            name: '訂單數',
            position: 'right'
          }
        ],
        series: [
          {
            name: '銷售額',
            type: 'line',
            smooth: true,
            data: [120000, 132000, 101000, 134000, 190000, 230000, 210000],
            itemStyle: {
              color: '#1890ff'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
              ])
            }
          },
          {
            name: '訂單數',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            data: [220, 282, 201, 234, 290, 330, 310],
            itemStyle: {
              color: '#52c41a'
            }
          }
        ]
      }
      myChart.setOption(option)

      // 響應式調整
      const resizeHandler = () => myChart.resize()
      window.addEventListener('resize', resizeHandler)
      
      return () => {
        window.removeEventListener('resize', resizeHandler)
        myChart.dispose()
      }
    }
  }, [id, title])

  return <div id={id} style={{ height, width: '100%' }} />
}

// 商品類別分布圖表
const CategoryChart: React.FC<ChartProps> = ({ id, title, height = 300 }) => {
  useEffect(() => {
    const chartDom = document.getElementById(id)
    if (chartDom) {
      const myChart = echarts.init(chartDom)
      const option = {
        title: {
          text: title,
          left: 'center',
          textStyle: {
            fontSize: 14,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'horizontal',
          bottom: '5%'
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '20',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: 35, name: '面部護理', itemStyle: { color: '#1890ff' } },
              { value: 28, name: '眼部護理', itemStyle: { color: '#52c41a' } },
              { value: 22, name: '身體護理', itemStyle: { color: '#faad14' } },
              { value: 15, name: '彩妝', itemStyle: { color: '#f5222d' } }
            ]
          }
        ]
      }
      myChart.setOption(option)

      const resizeHandler = () => myChart.resize()
      window.addEventListener('resize', resizeHandler)
      
      return () => {
        window.removeEventListener('resize', resizeHandler)
        myChart.dispose()
      }
    }
  }, [id, title])

  return <div id={id} style={{ height, width: '100%' }} />
}

const AdminDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ])

  // 獲取儀表板統計數據
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats', dateRange],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: DashboardStats }>('/admin/dashboard/stats', {
          params: {
            startDate: dateRange[0].format('YYYY-MM-DD'),
            endDate: dateRange[1].format('YYYY-MM-DD')
          }
        })
        return response.data.data
      } catch (error) {
        // 模擬數據 - 用於開發測試
        return {
          totalOrders: 1234,
          totalRevenue: 567890,
          totalCustomers: 890,
          totalProducts: 456,
          orderGrowth: 12.5,
          revenueGrowth: 8.3,
          customerGrowth: 15.2,
          productGrowth: 5.7
        } as DashboardStats
      }
    }
  })

  // 獲取最近訂單
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: Order[] }>('/admin/orders', {
          params: { limit: 5, sort: 'created_desc' }
        })
        return response.data.data
      } catch (error) {
        // 模擬數據
        return [
          {
            id: '1',
            orderNumber: 'ORD-2024-001',
            userId: '1',
            status: 'paid' as const,
            total: 2890,
            currency: 'TWD',
            createdAt: dayjs().subtract(1, 'hour').toISOString(),
            user: { id: '1', firstName: '王', lastName: '小明', email: 'wang@example.com' },
            items: [],
            subtotal: 2890,
            shippingFee: 0,
            tax: 0,
            discountAmount: 0,
            paymentMethod: 'credit_card',
            paymentStatus: 'paid' as const,
            shippingAddress: {
              recipientName: '王小明',
              phone: '0912345678',
              address: '台北市信義區信義路五段7號',
              city: '台北市',
              state: '台灣',
              countryCode: 'TW',
              district: '信義區',
              postalCode: '110',
              type: 'shipping' as const,
              isDefault: true
            },
            updatedAt: dayjs().subtract(1, 'hour').toISOString()
          }
        ] as Order[]
      }
    }
  })

  // 獲取熱銷商品
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: Product[] }>('/admin/products/top', {
          params: { limit: 5 }
        })
        return response.data.data
      } catch (error) {
        // 模擬數據
        return [
          {
            id: '1',
            name: '蘭蔻超進化肌因賦活露',
            sku: 'LANCOME-001',
            price: 2890,
            stock: 25,
            status: 'active' as const,
            images: ['/images/products/lancome-1.jpg'],
            categoryId: '1',
            brandId: '1',
            nameEn: 'Lancome Advanced Genifique',
            description: '高效抗老精華液',
            descriptionEn: 'Advanced anti-aging serum',
            originalPrice: 3200,
            discountPercentage: 10,
            minStock: 5,
            maxStock: 100,
            isRecommended: true,
            isFeatured: true,
            isNewArrival: false,
            tags: ['抗老', '精華液'],
            attributes: {},
            createdAt: dayjs().subtract(30, 'day').toISOString(),
            updatedAt: dayjs().toISOString()
          }
        ] as Product[]
      }
    }
  })

  const orderColumns = [
    {
      title: '訂單編號',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string) => <Text copyable>{text}</Text>
    },
    {
      title: '客戶',
      key: 'customer',
      render: (record: Order) => (
        <Space>
          <Avatar icon={<UserOutlined />}  />
          <span>{record.user?.firstName} {record.user?.lastName}</span>
        </Space>
      )
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'orange', text: '待付款' },
          paid: { color: 'green', text: '已付款' },
          confirmed: { color: 'blue', text: '已確認' },
          processing: { color: 'purple', text: '處理中' },
          shipped: { color: 'cyan', text: '已出貨' },
          delivered: { color: 'green', text: '已送達' },
          cancelled: { color: 'red', text: '已取消' }
        }
        const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '金額',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => (
        <Text strong>NT$ {amount.toLocaleString()}</Text>
      )
    },
    {
      title: '時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MM/DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Order) => (
        <Button 
          type="link" 
           
          icon={<EyeOutlined />}
          onClick={() => window.open(`/admin/orders/${record.id}`, '_blank')}
        >
          查看
        </Button>
      )
    }
  ]

  const productColumns = [
    {
      title: '商品',
      key: 'product',
      render: (record: Product) => (
        <Space>
          <Avatar 
            src={record.images[0]} 
            icon={<ShopOutlined />} 
            
            shape="square"
          />
          <div>
            <div>{record.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              SKU: {record.sku}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '價格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong>NT$ {price.toLocaleString()}</Text>
      )
    },
    {
      title: '庫存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: Product) => {
        const percentage = (stock / record.maxStock) * 100
        const status = percentage > 50 ? 'success' : percentage > 20 ? 'warning' : 'exception'
        return (
          <div>
            <div>{stock} 件</div>
            <Progress
              percent={percentage}
              
              status={status}
              showInfo={false}
              strokeWidth={4}
            />
          </div>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Product) => (
        <Button 
          type="link" 
           
          icon={<EditOutlined />}
          onClick={() => window.open(`/admin/products/${record.id}/edit`, '_blank')}
        >
          編輯
        </Button>
      )
    }
  ]

  if (statsLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 標題和日期選擇器 */}
      <div className="flex justify-between items-center">
        <Title level={2} className="mb-0">管理後台儀表板</Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            format="YYYY-MM-DD"
          />
        </Space>
      </div>

      {/* 統計卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="總訂單數"
              value={stats?.totalOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span className="text-xs">
                  {(stats?.orderGrowth || 0) > 0 ? (
                    <Tag color="green" icon={<ArrowUpOutlined />}>
                      {stats?.orderGrowth.toFixed(1)}%
                    </Tag>
                  ) : (
                    <Tag color="red" icon={<ArrowDownOutlined />}>
                      {Math.abs(stats?.orderGrowth || 0).toFixed(1)}%
                    </Tag>
                  )}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="總銷售額"
              value={stats?.totalRevenue || 0}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `NT$ ${value.toLocaleString()}`}
              suffix={
                <span className="text-xs">
                  {(stats?.revenueGrowth || 0) > 0 ? (
                    <Tag color="green" icon={<ArrowUpOutlined />}>
                      {stats?.revenueGrowth.toFixed(1)}%
                    </Tag>
                  ) : (
                    <Tag color="red" icon={<ArrowDownOutlined />}>
                      {Math.abs(stats?.revenueGrowth || 0).toFixed(1)}%
                    </Tag>
                  )}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="註冊會員"
              value={stats?.totalCustomers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix={
                <span className="text-xs">
                  {(stats?.customerGrowth || 0) > 0 ? (
                    <Tag color="green" icon={<ArrowUpOutlined />}>
                      {stats?.customerGrowth.toFixed(1)}%
                    </Tag>
                  ) : (
                    <Tag color="red" icon={<ArrowDownOutlined />}>
                      {Math.abs(stats?.customerGrowth || 0).toFixed(1)}%
                    </Tag>
                  )}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="商品總數"
              value={stats?.totalProducts || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix={
                <span className="text-xs">
                  {(stats?.productGrowth || 0) > 0 ? (
                    <Tag color="green" icon={<ArrowUpOutlined />}>
                      {stats?.productGrowth.toFixed(1)}%
                    </Tag>
                  ) : (
                    <Tag color="red" icon={<ArrowDownOutlined />}>
                      {Math.abs(stats?.productGrowth || 0).toFixed(1)}%
                    </Tag>
                  )}
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 圖表區域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="銷售趨勢" extra={<RiseOutlined />}>
            <SalesChart id="sales-chart" title="最近7個月銷售數據" height={350} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="商品類別分布">
            <CategoryChart id="category-chart" title="商品類別銷量占比" height={350} />
          </Card>
        </Col>
      </Row>

      {/* 數據表格區域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="最近訂單" loading={ordersLoading}>
            <Table
              dataSource={recentOrders}
              columns={orderColumns}
              pagination={false}
              
              rowKey="id"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="熱銷商品" loading={productsLoading}>
            <Table
              dataSource={topProducts}
              columns={productColumns}
              pagination={false}
              
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default withPermission(AdminDashboard, ['dashboard:read'])