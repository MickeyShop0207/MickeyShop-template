/**
 * 管理後台商品管理
 * 提供商品的完整 CRUD 操作功能
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
  Popconfirm,
  message,
  Modal,
  Form,
  Row,
  Col,
  InputNumber,
  Switch,
  Upload,
  Typography,
  Tooltip,
  Badge,
  Progress,
  Drawer
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  UploadOutlined,
  ShopOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
  PictureOutlined,
  TagsOutlined,
  DollarOutlined,
  InboxOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api'
import { Product, Category, Brand, PaginatedResponse, ProductSearchParams } from '@/api/types'
import { withPermission } from '@/components/admin/withPermission'
import { usePermission } from '@/hooks/usePermission'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input
const { Dragger } = Upload

interface ProductFormData extends Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
  uploadImages?: any[]
}

const AdminProducts: React.FC = () => {
  const { can } = usePermission()
  const queryClient = useQueryClient()

  // 狀態管理
  const [searchParams, setSearchParams] = useState<ProductSearchParams>({
    page: 1,
    limit: 10,
    sort: 'created_desc'
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [productModal, setProductModal] = useState<{
    visible: boolean
    mode: 'create' | 'edit' | 'detail'
    product?: Product
  }>({ visible: false, mode: 'create' })
  const [filterDrawer, setFilterDrawer] = useState(false)

  const [form] = Form.useForm<ProductFormData>()

  // 獲取商品列表
  const { data: productsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-products', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value))
        }
      })

      try {
        const response = await apiClient.get<PaginatedResponse<Product>>(`/admin/products?${params}`)
        return response.data
      } catch (error) {
        // 模擬數據用於開發測試
        return {
          data: [
            {
              id: '1',
              name: '蘭蔻超進化肌因賦活露',
              nameEn: 'Lancome Advanced Genifique',
              description: '肌膚修護精華，提升肌膚彈性與光澤',
              descriptionEn: 'Advanced skin repair serum',
              sku: 'LANCOME-001',
              categoryId: '1',
              brandId: '1',
              price: 2890,
              originalPrice: 3200,
              discountPercentage: 10,
              stock: 25,
              minStock: 5,
              maxStock: 100,
              status: 'active' as const,
              isRecommended: true,
              isFeatured: true,
              isNewArrival: false,
              images: ['/images/products/lancome-1.jpg', '/images/products/lancome-2.jpg'],
              tags: ['抗老', '精華液'],
              attributes: { volume: '30ml', origin: 'France' },
              createdAt: dayjs().subtract(30, 'day').toISOString(),
              updatedAt: dayjs().toISOString(),
              category: { id: '1', name: '面部護理', nameEn: 'Face Care', slug: 'face-care' },
              brand: { id: '1', name: '蘭蔻', nameEn: 'Lancome', slug: 'lancome' },
              avgRating: 4.5,
              reviewCount: 128
            },
            {
              id: '2', 
              name: 'SK-II 青春露',
              nameEn: 'SK-II Facial Treatment Essence',
              description: '經典保濕精華液，改善肌膚質感',
              descriptionEn: 'Classic moisturizing essence',
              sku: 'SKII-001',
              categoryId: '1',
              brandId: '2', 
              price: 4200,
              originalPrice: 4200,
              stock: 15,
              minStock: 3,
              maxStock: 50,
              status: 'active' as const,
              isRecommended: false,
              isFeatured: false,
              isNewArrival: true,
              images: ['/images/products/skii-1.jpg'],
              tags: ['保濕', '精華液'],
              attributes: { volume: '75ml', origin: 'Japan' },
              createdAt: dayjs().subtract(15, 'day').toISOString(),
              updatedAt: dayjs().toISOString(),
              category: { id: '1', name: '面部護理', nameEn: 'Face Care', slug: 'face-care' },
              brand: { id: '2', name: 'SK-II', nameEn: 'SK-II', slug: 'sk-ii' },
              avgRating: 4.7,
              reviewCount: 89
            }
          ] as Product[],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          },
          success: true
        } as PaginatedResponse<Product>
      }
    }
  })

  // 獲取分類列表
  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: Category[] }>('/admin/categories')
        return response.data.data
      } catch (error) {
        return [
          { id: '1', name: '面部護理', nameEn: 'Face Care', slug: 'face-care' },
          { id: '2', name: '眼部護理', nameEn: 'Eye Care', slug: 'eye-care' },
          { id: '3', name: '身體護理', nameEn: 'Body Care', slug: 'body-care' }
        ] as Category[]
      }
    }
  })

  // 獲取品牌列表
  const { data: brands } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: Brand[] }>('/admin/brands')
        return response.data.data
      } catch (error) {
        return [
          { id: '1', name: '蘭蔻', nameEn: 'Lancome', slug: 'lancome' },
          { id: '2', name: 'SK-II', nameEn: 'SK-II', slug: 'sk-ii' },
          { id: '3', name: '雅詩蘭黛', nameEn: 'Estee Lauder', slug: 'estee-lauder' }
        ] as Brand[]
      }
    }
  })

  // 創建商品
  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiClient.post('/admin/products', data)
      return response.data
    },
    onSuccess: () => {
      message.success('商品創建成功')
      setProductModal({ visible: false, mode: 'create' })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '創建失敗')
    }
  })

  // 更新商品
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ProductFormData> }) => {
      const response = await apiClient.put(`/admin/products/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      message.success('商品更新成功')
      setProductModal({ visible: false, mode: 'edit' })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '更新失敗')
    }
  })

  // 刪除商品
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/admin/products/${id}`)
      return response.data
    },
    onSuccess: () => {
      message.success('商品刪除成功')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '刪除失敗')
    }
  })

  // 批量操作
  const batchMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: 'delete' | 'activate' | 'deactivate', ids: string[] }) => {
      const response = await apiClient.post('/admin/products/batch', { action, ids })
      return response.data
    },
    onSuccess: () => {
      message.success('批量操作成功')
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '批量操作失敗')
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

  // 重置篩選
  const handleResetFilter = () => {
    setSearchParams({ page: 1, limit: 10, sort: 'created_desc' })
    setFilterDrawer(false)
  }

  // 處理表格變化
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const newParams: ProductSearchParams = {
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

  // 處理商品操作
  const handleProductAction = (action: 'create' | 'edit' | 'detail', product?: Product) => {
    setProductModal({ visible: true, mode: action, product })
    
    if (product && (action === 'edit' || action === 'detail')) {
      form.setFieldsValue({
        name: product.name,
        nameEn: product.nameEn,
        description: product.description,
        descriptionEn: product.descriptionEn,
        sku: product.sku,
        categoryId: product.categoryId,
        brandId: product.brandId,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        minStock: product.minStock,
        maxStock: product.maxStock,
        status: product.status,
        isRecommended: product.isRecommended,
        isFeatured: product.isFeatured,
        isNewArrival: product.isNewArrival,
        tags: product.tags,
        attributes: product.attributes
      })
    } else if (action === 'create') {
      form.resetFields()
    }
  }

  // 處理表單提交
  const handleFormSubmit = async (values: ProductFormData) => {
    if (productModal.mode === 'create') {
      createMutation.mutate(values)
    } else if (productModal.mode === 'edit' && productModal.product) {
      updateMutation.mutate({ id: productModal.product.id, data: values })
    }
  }

  // 處理刪除
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  // 處理批量操作
  const handleBatchAction = (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedRowKeys.length === 0) {
      message.warning('請選擇要操作的商品')
      return
    }
    batchMutation.mutate({ action, ids: selectedRowKeys as string[] })
  }

  // 上傳配置
  const uploadProps = {
    name: 'file',
    multiple: true,
    action: '/api/upload',
    beforeUpload: () => false, // 阻止自動上傳
    accept: 'image/*'
  }

  // 表格列配置
  const columns = [
    {
      title: '商品信息',
      key: 'product',
      width: 300,
      render: (record: Product) => (
        <Space>
          <Avatar
            size={64}
            shape="square"
            src={record.images[0]}
            icon={<ShopOutlined />}
          />
          <div>
            <div className="font-medium">{record.name}</div>
            <Text type="secondary" className="text-sm">
              SKU: {record.sku}
            </Text>
            <br />
            <Text type="secondary" className="text-sm">
              {record.brand?.name} | {record.category?.name}
            </Text>
            {record.tags.length > 0 && (
              <div className="mt-1">
                {record.tags.map(tag => (
                  <Tag key={tag} >{tag}</Tag>
                ))}
              </div>
            )}
          </div>
        </Space>
      )
    },
    {
      title: '價格',
      key: 'price',
      width: 120,
      sorter: true,
      render: (record: Product) => (
        <div>
          <div className="font-medium text-green-600">
            NT$ {record.price.toLocaleString()}
          </div>
          {record.originalPrice && record.originalPrice > record.price && (
            <div className="text-sm text-gray-500 line-through">
              NT$ {record.originalPrice.toLocaleString()}
            </div>
          )}
          {record.discountPercentage && (
            <Tag color="red" >-{record.discountPercentage}%</Tag>
          )}
        </div>
      )
    },
    {
      title: '庫存',
      key: 'stock',
      width: 120,
      sorter: true,
      render: (record: Product) => {
        const percentage = (record.stock / record.maxStock) * 100
        const status = percentage > 50 ? 'success' : percentage > 20 ? 'warning' : 'exception'
        return (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span>{record.stock}</span>
              <span className="text-sm text-gray-500">/{record.maxStock}</span>
            </div>
            <Progress
              percent={percentage}
              
              status={status}
              showInfo={false}
              strokeWidth={6}
            />
            {record.stock <= record.minStock && (
              <Tag color="orange" >庫存不足</Tag>
            )}
          </div>
        )
      }
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '上架', value: 'active' },
        { text: '下架', value: 'inactive' },
        { text: '草稿', value: 'draft' }
      ],
      render: (status: string) => {
        const statusMap = {
          active: { color: 'green', text: '上架' },
          inactive: { color: 'red', text: '下架' },
          draft: { color: 'orange', text: '草稿' }
        }
        const config = statusMap[status as keyof typeof statusMap]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '標籤',
      key: 'labels',
      width: 100,
      render: (record: Product) => (
        <Space direction="vertical" >
          {record.isRecommended && <Badge status="processing" text="推薦" />}
          {record.isFeatured && <Badge status="success" text="精選" />}
          {record.isNewArrival && <Badge status="warning" text="新品" />}
        </Space>
      )
    },
    {
      title: '評價',
      key: 'rating',
      width: 100,
      render: (record: Product) => (
        <div>
          <div>⭐ {record.avgRating?.toFixed(1) || 'N/A'}</div>
          <Text type="secondary" className="text-sm">
            {record.reviewCount || 0} 評論
          </Text>
        </div>
      )
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: true,
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
      width: 150,
      fixed: 'right' as const,
      render: (record: Product) => (
        <Space>
          <Tooltip title="查看詳情">
            <Button
              type="text"
              
              icon={<EyeOutlined />}
              onClick={() => handleProductAction('detail', record)}
            />
          </Tooltip>
          {can(['product:write']) && (
            <Tooltip title="編輯">
              <Button
                type="text"
                
                icon={<EditOutlined />}
                onClick={() => handleProductAction('edit', record)}
              />
            </Tooltip>
          )}
          {can(['product:delete']) && (
            <Tooltip title="刪除">
              <Popconfirm
                title="確定要刪除此商品嗎？"
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
    getCheckboxProps: (record: Product) => ({
      disabled: !can(['product:write'])
    })
  }

  return (
    <div className="space-y-6">
      {/* 標題和操作區域 */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={2} className="mb-0">商品管理</Title>
          <Space>
            {can(['product:write']) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleProductAction('create')}
              >
                新增商品
              </Button>
            )}
          </Space>
        </div>

        {/* 搜索和篩選區域 */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8} lg={6}>
            <Input.Search
              placeholder="搜索商品名稱或SKU"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={16} lg={18}>
            <Space wrap>
              <Select
                placeholder="選擇分類"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilter('categoryId', value)}
                value={searchParams.categoryId}
              >
                {categories?.map(cat => (
                  <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                ))}
              </Select>
              <Select
                placeholder="選擇品牌"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilter('brandId', value)}
                value={searchParams.brandId}
              >
                {brands?.map(brand => (
                  <Option key={brand.id} value={brand.id}>{brand.name}</Option>
                ))}
              </Select>
              <Select
                placeholder="商品狀態"
                allowClear
                style={{ width: 100 }}
                onChange={(value) => handleFilter('status', value)}
                value={searchParams.status}
              >
                <Option value="active">上架</Option>
                <Option value="inactive">下架</Option>
                <Option value="draft">草稿</Option>
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawer(true)}
              >
                高級篩選
              </Button>
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
              {can(['product:write']) && (
                <>
                  <Button
                    
                    onClick={() => handleBatchAction('activate')}
                  >
                    批量上架
                  </Button>
                  <Button
                    
                    onClick={() => handleBatchAction('deactivate')}
                  >
                    批量下架
                  </Button>
                </>
              )}
              {can(['product:delete']) && (
                <Popconfirm
                  title="確定要刪除選中的商品嗎？"
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

      {/* 商品列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={productsData?.data}
          loading={isLoading}
          rowKey="id"
          rowSelection={can(['product:write']) ? rowSelection : undefined}
          scroll={{ x: 1200 }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.limit,
            total: productsData?.pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 項`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 商品表單彈窗 */}
      <Modal
        title={
          productModal.mode === 'create' ? '新增商品' :
          productModal.mode === 'edit' ? '編輯商品' : '商品詳情'
        }
        open={productModal.visible}
        onCancel={() => setProductModal({ visible: false, mode: 'create' })}
        width={800}
        footer={
          productModal.mode === 'detail' ? (
            <Button onClick={() => setProductModal({ visible: false, mode: 'create' })}>
              關閉
            </Button>
          ) : (
            <Space>
              <Button onClick={() => setProductModal({ visible: false, mode: 'create' })}>
                取消
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {productModal.mode === 'create' ? '創建' : '更新'}
              </Button>
            </Space>
          )
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          disabled={productModal.mode === 'detail'}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="商品名稱"
                rules={[{ required: true, message: '請輸入商品名稱' }]}
              >
                <Input placeholder="請輸入商品名稱" />
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

          <Form.Item
            name="description"
            label="商品描述"
            rules={[{ required: true, message: '請輸入商品描述' }]}
          >
            <TextArea rows={3} placeholder="請輸入商品描述" />
          </Form.Item>

          <Form.Item name="descriptionEn" label="英文描述">
            <TextArea rows={3} placeholder="請輸入英文描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="sku"
                label="商品編號 (SKU)"
                rules={[{ required: true, message: '請輸入商品編號' }]}
              >
                <Input placeholder="請輸入商品編號" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="categoryId"
                label="商品分類"
                rules={[{ required: true, message: '請選擇商品分類' }]}
              >
                <Select placeholder="請選擇商品分類">
                  {categories?.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="brandId"
                label="商品品牌"
                rules={[{ required: true, message: '請選擇商品品牌' }]}
              >
                <Select placeholder="請選擇商品品牌">
                  {brands?.map(brand => (
                    <Option key={brand.id} value={brand.id}>{brand.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="售價"
                rules={[{ required: true, message: '請輸入售價' }]}
              >
                <InputNumber
                  placeholder="請輸入售價"
                  min={0}
                  style={{ width: '100%' }}
                  formatter={value => `NT$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/NT\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="originalPrice" label="原價">
                <InputNumber
                  placeholder="請輸入原價"
                  min={0}
                  style={{ width: '100%' }}
                  formatter={value => `NT$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/NT\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discountPercentage" label="折扣 (%)">
                <InputNumber
                  placeholder="折扣百分比"
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="stock"
                label="當前庫存"
                rules={[{ required: true, message: '請輸入庫存數量' }]}
              >
                <InputNumber
                  placeholder="請輸入庫存數量"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="minStock" label="最低庫存">
                <InputNumber
                  placeholder="請輸入最低庫存"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxStock" label="最高庫存">
                <InputNumber
                  placeholder="請輸入最高庫存"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="status" label="商品狀態" initialValue="active">
                <Select>
                  <Option value="active">上架</Option>
                  <Option value="inactive">下架</Option>
                  <Option value="draft">草稿</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isRecommended" label="推薦商品" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isFeatured" label="精選商品" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isNewArrival" label="新品" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="tags" label="商品標籤">
            <Select
              mode="tags"
              placeholder="請輸入標籤"
              tokenSeparators={[',']}
              style={{ width: '100%' }}
            />
          </Form.Item>

          {productModal.mode !== 'detail' && (
            <Form.Item name="uploadImages" label="商品圖片">
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">點擊或拖拽文件到此區域上傳</p>
                <p className="ant-upload-hint">支持單個或批量上傳，僅支持圖片格式</p>
              </Dragger>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 高級篩選抽屜 */}
      <Drawer
        title="高級篩選"
        placement="right"
        onClose={() => setFilterDrawer(false)}
        open={filterDrawer}
        width={400}
        extra={
          <Space>
            <Button onClick={handleResetFilter}>重置</Button>
            <Button type="primary" onClick={() => setFilterDrawer(false)}>
              應用
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>價格範圍</Text>
            <Row gutter={8} className="mt-2">
              <Col span={12}>
                <InputNumber
                  placeholder="最低價格"
                  min={0}
                  style={{ width: '100%' }}
                  value={searchParams.minPrice}
                  onChange={(value) => handleFilter('minPrice', value)}
                />
              </Col>
              <Col span={12}>
                <InputNumber
                  placeholder="最高價格"
                  min={0}
                  style={{ width: '100%' }}
                  value={searchParams.maxPrice}
                  onChange={(value) => handleFilter('maxPrice', value)}
                />
              </Col>
            </Row>
          </div>

          <div>
            <Text strong>商品屬性</Text>
            <div className="mt-2 space-y-2">
              <div>
                <Switch
                  checked={searchParams.isRecommended}
                  onChange={(checked) => handleFilter('isRecommended', checked || undefined)}
                />
                <span className="ml-2">推薦商品</span>
              </div>
              <div>
                <Switch
                  checked={searchParams.isFeatured}
                  onChange={(checked) => handleFilter('isFeatured', checked || undefined)}
                />
                <span className="ml-2">精選商品</span>
              </div>
              <div>
                <Switch
                  checked={searchParams.isNewArrival}
                  onChange={(checked) => handleFilter('isNewArrival', checked || undefined)}
                />
                <span className="ml-2">新品</span>
              </div>
            </div>
          </div>

          <div>
            <Text strong>排序方式</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={searchParams.sort}
              onChange={(value) => handleFilter('sort', value)}
            >
              <Option value="created_desc">創建時間 (新到舊)</Option>
              <Option value="created_asc">創建時間 (舊到新)</Option>
              <Option value="price_desc">價格 (高到低)</Option>
              <Option value="price_asc">價格 (低到高)</Option>
              <Option value="name_asc">名稱 (A-Z)</Option>
              <Option value="name_desc">名稱 (Z-A)</Option>
            </Select>
          </div>
        </Space>
      </Drawer>
    </div>
  )
}

export default withPermission(AdminProducts, ['product:read'])