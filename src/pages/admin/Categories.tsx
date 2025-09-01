/**
 * 管理後台分類管理
 * 提供商品分類的完整 CRUD 操作功能
 */

import React, { useState } from 'react'
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Tag,
  Popconfirm,
  message,
  Modal,
  Form,
  Row,
  Col,
  Switch,
  Typography,
  Tooltip,
  Tree,
  Avatar,
  Upload
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  FileOutlined,
  ReloadOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api'
import { Category } from '@/api/types'
import { withPermission } from '@/components/admin/withPermission'
import { usePermission } from '@/hooks/usePermission'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input
const { TreeNode } = Tree

interface CategoryFormData extends Omit<Category, 'id' | 'createdAt' | 'updatedAt'> {
  imageFile?: any
}

const AdminCategories: React.FC = () => {
  const { can } = usePermission()
  const queryClient = useQueryClient()

  // 狀態管理
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [categoryModal, setCategoryModal] = useState<{
    visible: boolean
    mode: 'create' | 'edit'
    category?: Category
  }>({ visible: false, mode: 'create' })

  const [form] = Form.useForm<CategoryFormData>()

  // 獲取分類列表
  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: Category[] }>('/admin/categories')
        return response.data.data
      } catch (error) {
        // 模擬數據用於開發測試
        return [
          {
            id: '1',
            name: '面部護理',
            nameEn: 'Face Care',
            slug: 'face-care',
            description: '專為臉部肌膚設計的護理產品',
            image: '/images/categories/face-care.jpg',
            icon: '🧴',
            sortOrder: 1,
            isActive: true,
            seoTitle: '面部護理產品 | MickeyShop Beauty',
            seoDescription: '精選面部護理產品，滿足您的肌膚需求',
            createdAt: dayjs().subtract(30, 'day').toISOString(),
            updatedAt: dayjs().toISOString(),
            productCount: 45,
            children: [
              {
                id: '11',
                name: '潔面產品',
                nameEn: 'Cleansers',
                slug: 'cleansers',
                parentId: '1',
                sortOrder: 1,
                isActive: true,
                createdAt: dayjs().subtract(25, 'day').toISOString(),
                updatedAt: dayjs().toISOString(),
                productCount: 15
              },
              {
                id: '12',
                name: '精華液',
                nameEn: 'Serums',
                slug: 'serums',
                parentId: '1',
                sortOrder: 2,
                isActive: true,
                createdAt: dayjs().subtract(20, 'day').toISOString(),
                updatedAt: dayjs().toISOString(),
                productCount: 20
              }
            ]
          },
          {
            id: '2',
            name: '眼部護理',
            nameEn: 'Eye Care',
            slug: 'eye-care',
            description: '專門針對眼周肌膚的護理產品',
            image: '/images/categories/eye-care.jpg',
            icon: '👁️',
            sortOrder: 2,
            isActive: true,
            createdAt: dayjs().subtract(25, 'day').toISOString(),
            updatedAt: dayjs().toISOString(),
            productCount: 28
          },
          {
            id: '3',
            name: '身體護理',
            nameEn: 'Body Care',
            slug: 'body-care',
            description: '全身護理產品系列',
            image: '/images/categories/body-care.jpg',
            icon: '🧴',
            sortOrder: 3,
            isActive: true,
            createdAt: dayjs().subtract(20, 'day').toISOString(),
            updatedAt: dayjs().toISOString(),
            productCount: 32
          }
        ] as Category[]
      }
    }
  })

  // 創建分類
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await apiClient.post('/admin/categories', data)
      return response.data
    },
    onSuccess: () => {
      message.success('分類創建成功')
      setCategoryModal({ visible: false, mode: 'create' })
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '創建失敗')
    }
  })

  // 更新分類
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<CategoryFormData> }) => {
      const response = await apiClient.put(`/admin/categories/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      message.success('分類更新成功')
      setCategoryModal({ visible: false, mode: 'edit' })
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '更新失敗')
    }
  })

  // 刪除分類
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/admin/categories/${id}`)
      return response.data
    },
    onSuccess: () => {
      message.success('分類刪除成功')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '刪除失敗')
    }
  })

  // 批量操作
  const batchMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: 'delete' | 'activate' | 'deactivate', ids: string[] }) => {
      const response = await apiClient.post('/admin/categories/batch', { action, ids })
      return response.data
    },
    onSuccess: () => {
      message.success('批量操作成功')
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '批量操作失敗')
    }
  })

  // 處理分類操作
  const handleCategoryAction = (action: 'create' | 'edit', category?: Category) => {
    setCategoryModal({ visible: true, mode: action, category })
    
    if (category && action === 'edit') {
      form.setFieldsValue({
        name: category.name,
        nameEn: category.nameEn,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        seoTitle: category.seoTitle,
        seoDescription: category.seoDescription
      })
    } else if (action === 'create') {
      form.resetFields()
    }
  }

  // 處理表單提交
  const handleFormSubmit = async (values: CategoryFormData) => {
    if (categoryModal.mode === 'create') {
      createMutation.mutate(values)
    } else if (categoryModal.mode === 'edit' && categoryModal.category) {
      updateMutation.mutate({ id: categoryModal.category.id, data: values })
    }
  }

  // 處理刪除
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  // 處理批量操作
  const handleBatchAction = (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedRowKeys.length === 0) {
      message.warning('請選擇要操作的分類')
      return
    }
    batchMutation.mutate({ action, ids: selectedRowKeys as string[] })
  }

  // 構建樹形結構數據
  const buildTreeData = (categories: Category[]): any[] => {
    const rootCategories = categories?.filter(cat => !cat.parentId) || []
    return rootCategories.map(category => ({
      title: (
        <Space>
          <span>{category.icon}</span>
          <span>{category.name}</span>
          <Text type="secondary">({category.productCount} 個商品)</Text>
        </Space>
      ),
      key: category.id,
      icon: category.children && category.children.length > 0 ? 
        <FolderOpenOutlined /> : <FileOutlined />,
      children: category.children?.map(child => ({
        title: (
          <Space>
            <span>{child.name}</span>
            <Text type="secondary">({child.productCount} 個商品)</Text>
          </Space>
        ),
        key: child.id,
        icon: <FileOutlined />
      }))
    }))
  }

  // 獲取扁平化的分類列表
  const getFlatCategories = (categories: Category[]): Category[] => {
    const flatCategories: Category[] = []
    
    categories?.forEach(category => {
      flatCategories.push(category)
      if (category.children) {
        flatCategories.push(...category.children)
      }
    })
    
    return flatCategories
  }

  // 篩選分類
  const filteredCategories = getFlatCategories(categories || []).filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase()) ||
    category.nameEn?.toLowerCase().includes(searchText.toLowerCase())
  )

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
      title: '分類信息',
      key: 'category',
      width: 300,
      render: (record: Category) => (
        <Space>
          <Avatar
            size={48}
            shape="square"
            src={record.image}
            style={{ backgroundColor: '#f0f0f0' }}
          >
            {record.icon || record.name.charAt(0)}
          </Avatar>
          <div>
            <div className="font-medium">{record.name}</div>
            <Text type="secondary" className="text-sm">
              {record.nameEn}
            </Text>
            <br />
            <Text type="secondary" className="text-sm">
              Slug: {record.slug}
            </Text>
            {record.parentId && (
              <div>
                <Tag  color="blue">
                  子分類
                </Tag>
              </div>
            )}
          </div>
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (description: string) => (
        <div className="max-w-xs">
          <Text ellipsis title={description}>
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
      sorter: (a: Category, b: Category) => (a.productCount || 0) - (b.productCount || 0),
      render: (count: number) => (
        <div className="text-center">
          <Text strong className="text-blue-600">
            {count || 0}
          </Text>
        </div>
      )
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a: Category, b: Category) => a.sortOrder - b.sortOrder,
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
      onFilter: (value: any, record: Category) => record.isActive === value,
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
      sorter: (a: Category, b: Category) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
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
      render: (record: Category) => (
        <Space>
          {can(['category:write']) && (
            <Tooltip title="編輯">
              <Button
                type="text"
                
                icon={<EditOutlined />}
                onClick={() => handleCategoryAction('edit', record)}
              />
            </Tooltip>
          )}
          {can(['category:delete']) && (
            <Tooltip title="刪除">
              <Popconfirm
                title="確定要刪除此分類嗎？"
                description="刪除分類將影響相關商品的分類信息"
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
    getCheckboxProps: (record: Category) => ({
      disabled: !can(['category:write'])
    })
  }

  // 生成父分類選項
  const getParentOptions = () => {
    const rootCategories = categories?.filter(cat => !cat.parentId) || []
    return rootCategories.map(cat => ({ label: cat.name, value: cat.id }))
  }

  return (
    <div className="space-y-6">
      {/* 標題和操作區域 */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={2} className="mb-0">分類管理</Title>
          <Space>
            {can(['category:write']) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCategoryAction('create')}
              >
                新增分類
              </Button>
            )}
          </Space>
        </div>

        {/* 搜索區域 */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} lg={8}>
            <Input.Search
              placeholder="搜索分類名稱"
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
              {can(['category:write']) && (
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
              {can(['category:delete']) && (
                <Popconfirm
                  title="確定要刪除選中的分類嗎？"
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

      {/* 分類樹狀圖和表格 */}
      <Row gutter={[16, 16]}>
        {/* 分類樹 */}
        <Col xs={24} lg={8}>
          <Card title="分類層級結構" >
            <Tree
              showIcon
              defaultExpandAll
              treeData={buildTreeData(categories || [])}
            />
          </Card>
        </Col>

        {/* 分類列表 */}
        <Col xs={24} lg={16}>
          <Card>
            <Table
              columns={columns}
              dataSource={filteredCategories}
              loading={isLoading}
              rowKey="id"
              rowSelection={can(['category:write']) ? rowSelection : undefined}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 項`
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 分類表單彈窗 */}
      <Modal
        title={categoryModal.mode === 'create' ? '新增分類' : '編輯分類'}
        open={categoryModal.visible}
        onCancel={() => setCategoryModal({ visible: false, mode: 'create' })}
        width={700}
        footer={
          <Space>
            <Button onClick={() => setCategoryModal({ visible: false, mode: 'create' })}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {categoryModal.mode === 'create' ? '創建' : '更新'}
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
                label="分類名稱"
                rules={[{ required: true, message: '請輸入分類名稱' }]}
              >
                <Input placeholder="請輸入分類名稱" />
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
                <Input placeholder="例如: face-care" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="parentId" label="父分類">
                <Input.Group>
                  <Input
                    style={{ width: '80%' }}
                    placeholder="選擇父分類（可選）"
                    readOnly
                  />
                  <Button style={{ width: '20%' }}>選擇</Button>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="分類描述"
          >
            <TextArea rows={3} placeholder="請輸入分類描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="icon" label="圖標">
                <Input placeholder="例如: 🧴" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sortOrder"
                label="排序"
                initialValue={0}
              >
                <Input type="number" placeholder="數字越小排序越前" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isActive" label="是否啟用" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="imageFile" label="分類圖片">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                選擇圖片
              </Button>
            </Upload>
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

export default withPermission(AdminCategories, ['category:read'])