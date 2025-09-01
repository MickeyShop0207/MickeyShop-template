/**
 * 管理後台品牌管理
 * 提供品牌的完整 CRUD 操作功能
 */

import React, { useState } from 'react'
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Tag,
  Avatar,
  Popconfirm,
  message,
  Modal,
  Form,
  Row,
  Col,
  Switch,
  Typography,
  Tooltip,
  Upload
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UploadOutlined,
  GlobalOutlined,
  ShopOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api'
import { Brand } from '@/api/types'
import { withPermission } from '@/components/admin/withPermission'
import { usePermission } from '@/hooks/usePermission'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input

interface BrandFormData extends Omit<Brand, 'id' | 'createdAt' | 'updatedAt'> {
  logoFile?: any
}

const AdminBrands: React.FC = () => {
  const { can } = usePermission()
  const queryClient = useQueryClient()

  // 狀態管理
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [brandModal, setBrandModal] = useState<{
    visible: boolean
    mode: 'create' | 'edit'
    brand?: Brand
  }>({ visible: false, mode: 'create' })

  const [form] = Form.useForm<BrandFormData>()

  // 獲取品牌列表
  const { data: brands, isLoading, refetch } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: Brand[] }>('/admin/brands')
        return response.data.data
      } catch (error) {
        // 模擬數據用於開發測試
        return [
          {
            id: '1',
            name: '蘭蔻',
            nameEn: 'Lancome',
            slug: 'lancome',
            description: '法國高端化妝品品牌，以其奢華護膚和彩妝產品而聞名',
            logo: '/images/brands/lancome-logo.jpg',
            website: 'https://www.lancome.com.tw',
            sortOrder: 1,
            isActive: true,
            seoTitle: '蘭蔻 Lancome | MickeyShop Beauty',
            seoDescription: '蘭蔻官方授權商品，法國高端護膚彩妝品牌',
            createdAt: dayjs().subtract(60, 'day').toISOString(),
            updatedAt: dayjs().toISOString(),
            productCount: 45
          },
          {
            id: '2',
            name: 'SK-II',
            nameEn: 'SK-II',
            slug: 'sk-ii',
            description: '日本頂級護膚品牌，以神奇活膚因子Pitera™聞名全球',
            logo: '/images/brands/skii-logo.jpg',
            website: 'https://www.sk-ii.com.tw',
            sortOrder: 2,
            isActive: true,
            seoTitle: 'SK-II | MickeyShop Beauty',
            seoDescription: 'SK-II官方授權商品，日本頂級護膚品牌',
            createdAt: dayjs().subtract(50, 'day').toISOString(),
            updatedAt: dayjs().toISOString(),
            productCount: 28
          },
          {
            id: '3',
            name: '雅詩蘭黛',
            nameEn: 'Estee Lauder',
            slug: 'estee-lauder',
            description: '美國知名化妝品集團，提供護膚、彩妝及香水產品',
            logo: '/images/brands/estee-lauder-logo.jpg',
            website: 'https://www.esteelauder.com.tw',
            sortOrder: 3,
            isActive: true,
            seoTitle: '雅詩蘭黛 Estee Lauder | MickeyShop Beauty',
            seoDescription: '雅詩蘭黛官方授權商品，美國知名護膚彩妝品牌',
            createdAt: dayjs().subtract(40, 'day').toISOString(),
            updatedAt: dayjs().toISOString(),
            productCount: 38
          },
          {
            id: '4',
            name: '香奈兒',
            nameEn: 'Chanel',
            slug: 'chanel',
            description: '法國奢華時尚品牌，以其經典香水和高端彩妝聞名',
            logo: '/images/brands/chanel-logo.jpg',
            website: 'https://www.chanel.com',
            sortOrder: 4,
            isActive: false,
            createdAt: dayjs().subtract(30, 'day').toISOString(),
            updatedAt: dayjs().toISOString(),
            productCount: 0
          }
        ] as Brand[]
      }
    }
  })

  // 創建品牌
  const createMutation = useMutation({
    mutationFn: async (data: BrandFormData) => {
      const response = await apiClient.post('/admin/brands', data)
      return response.data
    },
    onSuccess: () => {
      message.success('品牌創建成功')
      setBrandModal({ visible: false, mode: 'create' })
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '創建失敗')
    }
  })

  // 更新品牌
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<BrandFormData> }) => {
      const response = await apiClient.put(`/admin/brands/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      message.success('品牌更新成功')
      setBrandModal({ visible: false, mode: 'edit' })
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '更新失敗')
    }
  })

  // 刪除品牌
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/admin/brands/${id}`)
      return response.data
    },
    onSuccess: () => {
      message.success('品牌刪除成功')
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '刪除失敗')
    }
  })

  // 批量操作
  const batchMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: 'delete' | 'activate' | 'deactivate', ids: string[] }) => {
      const response = await apiClient.post('/admin/brands/batch', { action, ids })
      return response.data
    },
    onSuccess: () => {
      message.success('批量操作成功')
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '批量操作失敗')
    }
  })

  // 處理品牌操作
  const handleBrandAction = (action: 'create' | 'edit', brand?: Brand) => {
    setBrandModal({ visible: true, mode: action, brand })
    
    if (brand && action === 'edit') {
      form.setFieldsValue({
        name: brand.name,
        nameEn: brand.nameEn,
        slug: brand.slug,
        description: brand.description,
        website: brand.website,
        sortOrder: brand.sortOrder,
        isActive: brand.isActive,
        seoTitle: brand.seoTitle,
        seoDescription: brand.seoDescription
      })
    } else if (action === 'create') {
      form.resetFields()
    }
  }

  // 處理表單提交
  const handleFormSubmit = async (values: BrandFormData) => {
    if (brandModal.mode === 'create') {
      createMutation.mutate(values)
    } else if (brandModal.mode === 'edit' && brandModal.brand) {
      updateMutation.mutate({ id: brandModal.brand.id, data: values })
    }
  }

  // 處理刪除
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  // 處理批量操作
  const handleBatchAction = (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedRowKeys.length === 0) {
      message.warning('請選擇要操作的品牌')
      return
    }
    batchMutation.mutate({ action, ids: selectedRowKeys as string[] })
  }

  // 篩選品牌
  const filteredBrands = brands?.filter(brand =>
    brand.name.toLowerCase().includes(searchText.toLowerCase()) ||
    brand.nameEn?.toLowerCase().includes(searchText.toLowerCase())
  ) || []

  // 上傳配置
  const uploadProps = {
    name: 'file',
    action: '/api/upload',
    beforeUpload: () => false,
    accept: 'image/*',
    showUploadList: false
  }

  // 表格列配置
  const columns = [
    {
      title: '品牌信息',
      key: 'brand',
      width: 350,
      render: (record: Brand) => (
        <Space>
          <Avatar
            size={64}
            shape="square"
            src={record.logo}
            icon={<ShopOutlined />}
            style={{ backgroundColor: '#f0f0f0' }}
          />
          <div>
            <div className="font-medium text-lg">{record.name}</div>
            <Text type="secondary" className="text-sm">
              {record.nameEn}
            </Text>
            <br />
            <Text type="secondary" className="text-sm">
              Slug: {record.slug}
            </Text>
            {record.website && (
              <div className="mt-1">
                <Button
                  type="link"
                  
                  icon={<GlobalOutlined />}
                  href={record.website}
                  target="_blank"
                  style={{ padding: 0 }}
                >
                  官網
                </Button>
              </div>
            )}
          </div>
        </Space>
      )
    },
    {
      title: '品牌描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (description: string) => (
        <div className="max-w-xs">
          <Text ellipsis={{ tooltip: description }}>
            {description || '-'}
          </Text>
        </div>
      )
    },
    {
      title: '商品數量',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 100,
      sorter: (a: Brand, b: Brand) => (a.productCount || 0) - (b.productCount || 0),
      render: (count: number) => (
        <div className="text-center">
          <Text strong className="text-blue-600">
            {count || 0}
          </Text>
          <div>
            <Text type="secondary" className="text-xs">
              個商品
            </Text>
          </div>
        </div>
      )
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a: Brand, b: Brand) => a.sortOrder - b.sortOrder,
      render: (order: number) => (
        <div className="text-center">
          <Text>{order}</Text>
        </div>
      )
    },
    {
      title: '狀態',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      filters: [
        { text: '啟用', value: true },
        { text: '禁用', value: false }
      ],
      onFilter: (value: any, record: Brand) => record.isActive === value,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '啟用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a: Brand, b: Brand) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (date: string) => (
        <div>
          <div>{dayjs(date).format('YYYY-MM-DD')}</div>
          <Text type="secondary" className="text-sm">
            {dayjs(date).format('HH:mm')}
          </Text>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (record: Brand) => (
        <Space>
          {can(['brand:write']) && (
            <Tooltip title="編輯">
              <Button
                type="text"
                
                icon={<EditOutlined />}
                onClick={() => handleBrandAction('edit', record)}
              />
            </Tooltip>
          )}
          {can(['brand:delete']) && (
            <Tooltip title="刪除">
              <Popconfirm
                title="確定要刪除此品牌嗎？"
                description="刪除品牌將影響相關商品的品牌信息"
                onConfirm={() => handleDelete(record.id)}
                okText="確定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  // 行選擇配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: Brand) => ({
      disabled: !can(['brand:write'])
    })
  }

  return (
    <div className="space-y-6">
      {/* 標題和操作區域 */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={2} className="mb-0">品牌管理</Title>
          <Space>
            {can(['brand:write']) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleBrandAction('create')}
              >
                新增品牌
              </Button>
            )}
          </Space>
        </div>

        {/* 搜索區域 */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} lg={8}>
            <Input.Search
              placeholder="搜索品牌名稱"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={16}>
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 批量操作區域 */}
        {selectedRowKeys.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <Space>
              <span>已選擇 {selectedRowKeys.length} 項</span>
              {can(['brand:write']) && (
                <>
                  <Button
                    
                    onClick={() => handleBatchAction('activate')}
                  >
                    批量啟用
                  </Button>
                  <Button
                    
                    onClick={() => handleBatchAction('deactivate')}
                  >
                    批量禁用
                  </Button>
                </>
              )}
              {can(['brand:delete']) && (
                <Popconfirm
                  title="確定要刪除選中的品牌嗎？"
                  onConfirm={() => handleBatchAction('delete')}
                  okText="確定"
                  cancelText="取消"
                >
                  <Button  danger>
                    批量刪除
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </div>
        )}
      </Card>

      {/* 品牌列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredBrands}
          loading={isLoading}
          rowKey="id"
          rowSelection={can(['brand:write']) ? rowSelection : undefined}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 項`
          }}
        />
      </Card>

      {/* 品牌表單彈窗 */}
      <Modal
        title={brandModal.mode === 'create' ? '新增品牌' : '編輯品牌'}
        open={brandModal.visible}
        onCancel={() => setBrandModal({ visible: false, mode: 'create' })}
        width={700}
        footer={
          <Space>
            <Button onClick={() => setBrandModal({ visible: false, mode: 'create' })}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {brandModal.mode === 'create' ? '創建' : '更新'}
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="品牌名稱"
                rules={[{ required: true, message: '請輸入品牌名稱' }]}
              >
                <Input placeholder="請輸入品牌名稱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nameEn"
                label="英文名稱"
              >
                <Input placeholder="請輸入英文名稱" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="slug"
                label="URL標識"
                rules={[{ required: true, message: '請輸入URL標識' }]}
              >
                <Input placeholder="例如: lancome" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="website" label="官方網站">
                <Input 
                  placeholder="https://www.example.com" 
                  prefix={<GlobalOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="品牌描述"
          >
            <TextArea rows={3} placeholder="請輸入品牌描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sortOrder"
                label="排序"
                initialValue={0}
              >
                <Input type="number" placeholder="數字越小排序越前" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="是否啟用" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="logoFile" label="品牌LOGO">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                選擇LOGO
              </Button>
            </Upload>
            <div className="text-sm text-gray-500 mt-1">
              建議尺寸: 200x200 像素，支援 JPG, PNG 格式
            </div>
          </Form.Item>

          {/* SEO 設置 */}
          <div className="border-t pt-4 mt-4">
            <Title level={5}>SEO 設置</Title>
            <Form.Item name="seoTitle" label="SEO 標題">
              <Input placeholder="用於搜索引擎優化的頁面標題" maxLength={60} />
            </Form.Item>
            
            <Form.Item name="seoDescription" label="SEO 描述">
              <TextArea 
                rows={2} 
                placeholder="用於搜索引擎優化的頁面描述" 
                maxLength={160} 
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default withPermission(AdminBrands, ['brand:read'])