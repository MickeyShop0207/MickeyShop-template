import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Empty,
  Spin,
  message,
  Modal,
  Form,
  Rate,
  Input,
  Upload,
  Image,
  Tag,
  Space,
  Typography,
  Tabs,
  Select,
  Row,
  Col,
  Progress,
  Popconfirm,
  Badge
} from 'antd'
import {
  StarFilled,
  StarOutlined,
  EditOutlined,
  DeleteOutlined,
  CameraOutlined,
  EyeOutlined,
  PlusOutlined,
  LikeOutlined,
  DislikeOutlined,
  MessageOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Product, Order } from '../../types'
import { useAuth } from '../../hooks/useAuth'

const { Text, Title, Paragraph } = Typography
const { TextArea } = Input
const { TabPane } = Tabs
const { Option } = Select

interface Review {
  id: string
  productId: string
  product: Product
  orderId: string
  userId: string
  rating: number
  title: string
  content: string
  images?: string[]
  helpfulVotes: number
  unhelpfulVotes: number
  isVerifiedPurchase: boolean
  isRecommended: boolean
  status: 'published' | 'pending' | 'rejected'
  reply?: AdminReply
  createdAt: string
  updatedAt: string
}

interface AdminReply {
  content: string
  author: string
  createdAt: string
}

interface PendingReview {
  id: string
  orderId: string
  product: Product
  orderDate: string
  canReview: boolean
  reminderSent: boolean
}

const ReviewsPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [selectedPendingReview, setSelectedPendingReview] = useState<PendingReview | null>(null)
  const [activeTab, setActiveTab] = useState<'published' | 'pending' | 'drafts'>('published')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_high' | 'rating_low'>('newest')
  const [form] = Form.useForm()

  // Mock data
  useEffect(() => {
    const mockReviews: Review[] = [
      {
        id: '1',
        productId: '1',
        orderId: 'ORD-2024-001',
        userId: user?.id || '1',
        rating: 5,
        title: '超級滿意的口紅！',
        content: '顏色非常美，質地也很好，不會乾燥。持久度很棒，一整天都不用補妝。包裝也很精美，收到的時候很驚喜。會再回購的！',
        images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200'],
        helpfulVotes: 12,
        unhelpfulVotes: 0,
        isVerifiedPurchase: true,
        isRecommended: true,
        status: 'published',
        reply: {
          content: '感謝您的評價！我們很高興您喜歡這款產品。',
          author: '品牌客服',
          createdAt: '2024-08-20T10:00:00Z'
        },
        createdAt: '2024-08-15T14:30:00Z',
        updatedAt: '2024-08-15T14:30:00Z',
        product: {
          id: '1',
          sku: 'LIPSTICK-001',
          name: 'Dior 烈焰藍金唇膏 #999 傳奇紅',
          slug: 'dior-rouge-999',
          description: '經典傳奇紅色，持久顯色，滋潤質地',
          brand: {
            id: '1',
            name: 'Dior',
            slug: 'dior',
            isActive: true,
            createdAt: '2024-01-01'
          },
          category: {
            id: '1',
            name: '唇部彩妝',
            slug: 'lip-makeup',
            isActive: true,
            sortOrder: 1,
            createdAt: '2024-01-01'
          },
          images: [
            {
              id: '1',
              url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=100',
              alt: 'Dior 烈焰藍金唇膏',
              sortOrder: 1,
              isPrimary: true,
              type: 'main'
            }
          ],
          variants: [],
          pricing: {
            basePrice: 1200,
            currency: 'TWD'
          },
          inventory: {
            quantity: 50,
            reserved: 0,
            available: 50,
            threshold: 5,
            isInStock: true,
            trackQuantity: true,
            allowBackorders: false,
            stockStatus: 'in-stock'
          },
          specifications: [],
          reviews: {
            averageRating: 4.8,
            totalReviews: 1250,
            ratingDistribution: { 1: 10, 2: 20, 3: 80, 4: 240, 5: 900 }
          },
          tags: [],
          isActive: true,
          isFeature: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-08-30'
        }
      }
    ]

    const mockPendingReviews: PendingReview[] = [
      {
        id: '1',
        orderId: 'ORD-2024-002',
        orderDate: '2024-08-25T10:00:00Z',
        canReview: true,
        reminderSent: false,
        product: {
          id: '2',
          sku: 'FOUNDATION-001',
          name: 'YSL 超模光感粉底液 B10',
          slug: 'ysl-foundation-b10',
          description: '24小時持久，自然光澤，完美遮瑕',
          brand: {
            id: '2',
            name: 'YSL',
            slug: 'ysl',
            isActive: true,
            createdAt: '2024-01-01'
          },
          category: {
            id: '2',
            name: '底妝',
            slug: 'base-makeup',
            isActive: true,
            sortOrder: 2,
            createdAt: '2024-01-01'
          },
          images: [
            {
              id: '2',
              url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100',
              alt: 'YSL 超模光感粉底液',
              sortOrder: 1,
              isPrimary: true,
              type: 'main'
            }
          ],
          variants: [],
          pricing: {
            basePrice: 2800,
            currency: 'TWD'
          },
          inventory: {
            quantity: 30,
            reserved: 0,
            available: 30,
            threshold: 5,
            isInStock: true,
            trackQuantity: true,
            allowBackorders: false,
            stockStatus: 'in-stock'
          },
          specifications: [],
          reviews: {
            averageRating: 4.6,
            totalReviews: 890,
            ratingDistribution: { 1: 15, 2: 25, 3: 70, 4: 280, 5: 500 }
          },
          tags: [],
          isActive: true,
          isFeature: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-08-30'
        }
      }
    ]

    setTimeout(() => {
      setReviews(mockReviews)
      setPendingReviews(mockPendingReviews)
      setLoading(false)
    }, 1000)
  }, [user?.id])

  const handleWriteReview = (pendingReview?: PendingReview) => {
    setSelectedPendingReview(pendingReview || null)
    setEditingReview(null)
    form.resetFields()
    if (pendingReview) {
      form.setFieldsValue({
        productId: pendingReview.product.id,
        rating: 5
      })
    }
    setReviewModalVisible(true)
  }

  const handleEditReview = (review: Review) => {
    setEditingReview(review)
    setSelectedPendingReview(null)
    form.setFieldsValue({
      rating: review.rating,
      title: review.title,
      content: review.content,
      isRecommended: review.isRecommended
    })
    setReviewModalVisible(true)
  }

  const handleDeleteReview = async (reviewId: string) => {
    try {
      setReviews(prev => prev.filter(review => review.id !== reviewId))
      message.success(t('reviews.deleteSuccess') || '評論已刪除')
    } catch (error) {
      message.error(t('reviews.deleteError') || '刪除失敗')
    }
  }

  const handleSubmitReview = async (values: any) => {
    try {
      const reviewData = {
        ...values,
        id: editingReview?.id || String(Date.now()),
        productId: selectedPendingReview?.product.id || editingReview?.productId,
        product: selectedPendingReview?.product || editingReview?.product,
        orderId: selectedPendingReview?.orderId || editingReview?.orderId || 'ORD-NEW',
        userId: user?.id || '1',
        helpfulVotes: editingReview?.helpfulVotes || 0,
        unhelpfulVotes: editingReview?.unhelpfulVotes || 0,
        isVerifiedPurchase: Boolean(selectedPendingReview || editingReview?.isVerifiedPurchase),
        status: 'published' as const,
        createdAt: editingReview?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (editingReview) {
        setReviews(prev =>
          prev.map(review =>
            review.id === editingReview.id ? { ...reviewData, product: editingReview.product } : review
          )
        )
        message.success(t('reviews.updateSuccess') || '評論更新成功')
      } else {
        setReviews(prev => [reviewData, ...prev])
        if (selectedPendingReview) {
          setPendingReviews(prev => prev.filter(p => p.id !== selectedPendingReview.id))
        }
        message.success(t('reviews.submitSuccess') || '評論提交成功')
      }

      setReviewModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error(t('reviews.submitError') || '提交失敗')
    }
  }

  const handleViewProduct = (product: Product) => {
    navigate(`/products/${product.slug}`)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredReviews = reviews
    .filter(review => filterRating === null || review.rating === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'rating_high':
          return b.rating - a.rating
        case 'rating_low':
          return a.rating - b.rating
        default:
          return 0
      }
    })

  const reviewStats = {
    total: reviews.length,
    average: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
    distribution: [1, 2, 3, 4, 5].reduce((acc, star) => {
      acc[star] = reviews.filter(r => r.rating === star).length
      return acc
    }, {} as Record<number, number>)
  }

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
        <Title level={2} className="mb-0">
          {t('reviews.title') || '我的評論'}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleWriteReview()}>
          {t('reviews.writeNew') || '撰寫評論'}
        </Button>
      </div>

      {/* 評論統計 */}
      {reviews.length > 0 && (
        <Card className="mb-6">
          <Row gutter={24}>
            <Col span={8}>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {reviewStats.average.toFixed(1)}
                </div>
                <Rate disabled allowHalf value={reviewStats.average} className="mb-2" />
                <div className="text-gray-600">
                  {t('reviews.totalReviews', { count: reviewStats.total }) || `共 ${reviewStats.total} 則評論`}
                </div>
              </div>
            </Col>
            <Col span={16}>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} className="flex items-center space-x-3">
                    <div className="w-4 text-sm">{star}</div>
                    <StarFilled className="text-yellow-500" />
                    <Progress
                      percent={reviewStats.total > 0 ? (reviewStats.distribution[star] / reviewStats.total) * 100 : 0}
                      showInfo={false}
                      strokeColor="#fbbf24"
                      className="flex-1"
                    />
                    <div className="w-8 text-sm text-gray-600">
                      {reviewStats.distribution[star] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Card>
      )}

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as any)}
        items={[
          {
            key: 'published',
            label: (
              <span>
                {t('reviews.published') || '已發布'}
                <Badge count={reviews.length} className="ml-2" />
              </span>
            ),
            children: (
              <>
                {/* 篩選和排序 */}
                {reviews.length > 0 && (
                  <Card className="mb-4" bodyStyle={{ padding: '16px' }}>
                    <Row gutter={16} align="middle">
                      <Col>
                        <Space align="center">
                          <Text>{t('reviews.filterByRating') || '篩選評分'}：</Text>
                          <Select
                            value={filterRating}
                            onChange={setFilterRating}
                            style={{ width: 120 }}
                            allowClear
                            placeholder={t('reviews.allRatings') || '全部評分'}
                          >
                            {[5, 4, 3, 2, 1].map(rating => (
                              <Option key={rating} value={rating}>
                                <Space>
                                  {rating}
                                  <StarFilled className="text-yellow-500" />
                                </Space>
                              </Option>
                            ))}
                          </Select>
                        </Space>
                      </Col>
                      <Col>
                        <Space align="center">
                          <Text>{t('reviews.sortBy') || '排序'}：</Text>
                          <Select value={sortBy} onChange={setSortBy} style={{ width: 120 }}>
                            <Option value="newest">{t('reviews.sortNewest') || '最新'}</Option>
                            <Option value="oldest">{t('reviews.sortOldest') || '最舊'}</Option>
                            <Option value="rating_high">{t('reviews.sortRatingHigh') || '評分高到低'}</Option>
                            <Option value="rating_low">{t('reviews.sortRatingLow') || '評分低到高'}</Option>
                          </Select>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                )}

                {/* 已發布的評論列表 */}
                {filteredReviews.length === 0 ? (
                  <Empty
                    description={t('reviews.noPublished') || '還沒有發布的評論'}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map(review => (
                      <Card key={review.id} className="hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <Image
                            src={review.product.images[0]?.url}
                            alt={review.product.name}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <Text
                                  strong
                                  className="text-blue-600 cursor-pointer hover:underline"
                                  onClick={() => handleViewProduct(review.product)}
                                >
                                  {review.product.name}
                                </Text>
                                <div className="text-sm text-gray-500">
                                  {review.product.brand.name} · {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <Space>
                                <Button
                                  type="text"
                                  icon={<EditOutlined />}
                                  
                                  onClick={() => handleEditReview(review)}
                                >
                                  {t('common.edit') || '編輯'}
                                </Button>
                                <Popconfirm
                                  title={t('reviews.deleteConfirm') || '確定要刪除這則評論嗎？'}
                                  onConfirm={() => handleDeleteReview(review.id)}
                                  okText={t('common.confirm') || '確定'}
                                  cancelText={t('common.cancel') || '取消'}
                                >
                                  <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    
                                    danger
                                  >
                                    {t('common.delete') || '刪除'}
                                  </Button>
                                </Popconfirm>
                              </Space>
                            </div>

                            <div className="flex items-center space-x-2 mb-3">
                              <Rate disabled value={review.rating} />
                              <Text className={getRatingColor(review.rating)}>
                                {review.rating}/5
                              </Text>
                              {review.isVerifiedPurchase && (
                                <Tag color="green" >
                                  {t('reviews.verifiedPurchase') || '已驗證購買'}
                                </Tag>
                              )}
                              {review.isRecommended && (
                                <Tag color="blue" >
                                  {t('reviews.recommended') || '推薦'}
                                </Tag>
                              )}
                            </div>

                            {review.title && (
                              <Title level={5} className="mb-2">
                                {review.title}
                              </Title>
                            )}

                            <Paragraph className="mb-3">
                              {review.content}
                            </Paragraph>

                            {review.images && review.images.length > 0 && (
                              <div className="flex space-x-2 mb-3">
                                {review.images.map((image, index) => (
                                  <Image
                                    key={index}
                                    src={image}
                                    alt={`評論圖片 ${index + 1}`}
                                    width={60}
                                    height={60}
                                    className="rounded object-cover"
                                  />
                                ))}
                              </div>
                            )}

                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <Space>
                                <LikeOutlined />
                                {review.helpfulVotes}
                              </Space>
                              <Space>
                                <DislikeOutlined />
                                {review.unhelpfulVotes}
                              </Space>
                              {review.reply && (
                                <Space>
                                  <MessageOutlined />
                                  {t('reviews.hasReply') || '商家已回覆'}
                                </Space>
                              )}
                            </div>

                            {review.reply && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Text strong>{review.reply.author}</Text>
                                  <Text type="secondary" className="text-sm">
                                    {new Date(review.reply.createdAt).toLocaleDateString()}
                                  </Text>
                                </div>
                                <Paragraph className="mb-0">
                                  {review.reply.content}
                                </Paragraph>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )
          },
          {
            key: 'pending',
            label: (
              <span>
                {t('reviews.pendingReviews') || '待評論'}
                <Badge count={pendingReviews.length} className="ml-2" />
              </span>
            ),
            children: (
              <>
                {pendingReviews.length === 0 ? (
                  <Empty
                    description={t('reviews.noPending') || '沒有待評論的商品'}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <div className="space-y-4">
                    {pendingReviews.map(pending => (
                      <Card key={pending.id} className="hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <Image
                            src={pending.product.images[0]?.url}
                            alt={pending.product.name}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <Text strong className="text-gray-900">
                              {pending.product.name}
                            </Text>
                            <div className="text-sm text-gray-500 mb-2">
                              {pending.product.brand.name} · 
                              {t('reviews.purchaseDate') || '購買日期'}：{new Date(pending.orderDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {t('reviews.orderNumber') || '訂單號'}：{pending.orderId}
                            </div>
                          </div>
                          <Space>
                            <Button
                              type="primary"
                              onClick={() => handleWriteReview(pending)}
                              disabled={!pending.canReview}
                            >
                              {t('reviews.writeReview') || '撰寫評論'}
                            </Button>
                            <Button
                              type="text"
                              icon={<EyeOutlined />}
                              onClick={() => handleViewProduct(pending.product)}
                            >
                              {t('reviews.viewProduct') || '查看商品'}
                            </Button>
                          </Space>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )
          }
        ]}
      />

      {/* 評論表單 Modal */}
      <Modal
        title={editingReview ? 
          (t('reviews.editReview') || '編輯評論') : 
          (t('reviews.writeReview') || '撰寫評論')
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        {(selectedPendingReview || editingReview) && (
          <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 rounded-lg">
            <Image
              src={selectedPendingReview?.product.images[0]?.url || editingReview?.product.images[0]?.url}
              alt={selectedPendingReview?.product.name || editingReview?.product.name}
              width={60}
              height={60}
              className="rounded-lg object-cover"
            />
            <div>
              <Text strong>
                {selectedPendingReview?.product.name || editingReview?.product.name}
              </Text>
              <div className="text-sm text-gray-500">
                {selectedPendingReview?.product.brand.name || editingReview?.product.brand.name}
              </div>
            </div>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitReview}
          initialValues={{
            rating: 5,
            isRecommended: true
          }}
        >
          <Form.Item
            label={t('reviews.rating') || '評分'}
            name="rating"
            rules={[{ required: true, message: t('reviews.ratingRequired') || '請給出評分' }]}
          >
            <Rate allowClear={false} />
          </Form.Item>

          <Form.Item
            label={t('reviews.title') || '評論標題（選填）'}
            name="title"
          >
            <Input placeholder={t('reviews.titlePlaceholder') || '簡短描述您的體驗'} />
          </Form.Item>

          <Form.Item
            label={t('reviews.content') || '評論內容'}
            name="content"
            rules={[
              { required: true, message: t('reviews.contentRequired') || '請輸入評論內容' },
              { min: 10, message: t('reviews.contentMinLength') || '評論內容至少10個字符' }
            ]}
          >
            <TextArea
              rows={6}
              placeholder={t('reviews.contentPlaceholder') || '分享您的使用體驗，幫助其他買家了解這個商品...'}
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            label={t('reviews.photos') || '上傳照片（選填）'}
            name="images"
            valuePropName="fileList"
          >
            <Upload
              listType="picture-card"
              multiple
              maxCount={5}
              beforeUpload={() => false}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>
                  {t('reviews.uploadPhoto') || '上傳照片'}
                </div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="isRecommended"
            valuePropName="checked"
          >
            <Space>
              <Text>{t('reviews.wouldRecommend') || '我會推薦這個商品給朋友'}</Text>
            </Space>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setReviewModalVisible(false)}>
                {t('common.cancel') || '取消'}
              </Button>
              <Button type="primary" htmlType="submit">
                {editingReview ? 
                  (t('common.update') || '更新') : 
                  (t('common.submit') || '提交')
                }
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ReviewsPage