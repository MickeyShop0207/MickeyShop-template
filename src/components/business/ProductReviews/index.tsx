// 商品評價組件
import React, { useState } from 'react'
import {
  Card,
  Rate,
  Button,
  Avatar,
  Space,
  Tag,
  Progress,
  Row,
  Col,
  Typography,
  Image,
  Pagination,
  Select,
  Empty,
  Spin,
  Modal,
  Form,
  Input,
  Upload,
  message
} from 'antd'
import {
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  PlusOutlined,
  UserOutlined,
  CheckCircleOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '../../../api/services/productService'
import { useAuth } from '../../../hooks'
import type { ProductReview, CreateProductReviewRequest } from '../../../api/types'
import { formatDate } from '../../../utils'
import './style.scss'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface ProductReviewsProps {
  productId: string
  productName?: string
  className?: string
}

// 評價統計組件
const ReviewStats: React.FC<{ productId: string }> = ({ productId }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['productReviewStats', productId],
    queryFn: () => productService.getProductReviewStats(productId)
  })

  if (isLoading) {
    return <Spin  />
  }

  if (!stats) return null

  const { avgRating, reviewCount, ratingDistribution } = stats

  return (
    <Card className="review-stats">
      <Row gutter={24}>
        <Col xs={24} md={8}>
          <div className="overall-rating">
            <div className="rating-number">{avgRating.toFixed(1)}</div>
            <Rate disabled value={avgRating} allowHalf className="rating-stars" />
            <Text className="review-count">{reviewCount} 則評價</Text>
          </div>
        </Col>
        <Col xs={24} md={16}>
          <div className="rating-breakdown">
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratingDistribution[star] || 0
              const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0
              
              return (
                <div key={star} className="rating-row">
                  <span className="star-label">{star} 星</span>
                  <Progress
                    percent={percentage}
                    strokeColor="#faad14"
                    trailColor="#f5f5f5"
                    showInfo={false}
                    className="rating-progress"
                  />
                  <span className="count">({count})</span>
                </div>
              )
            })}
          </div>
        </Col>
      </Row>
    </Card>
  )
}

// 評價項目組件
const ReviewItem: React.FC<{ 
  review: ProductReview
  onLike?: (reviewId: string) => void
  onDislike?: (reviewId: string) => void
  isLiking?: boolean
  isDisliking?: boolean
}> = ({ review, onLike, onDislike, isLiking, isDisliking }) => {
  const [imagePreview, setImagePreview] = useState<string>('')

  const handleImagePreview = (url: string) => {
    setImagePreview(url)
  }

  const closeImagePreview = () => {
    setImagePreview('')
  }

  return (
    <>
      <Card className="review-item" >
        <div className="review-header">
          <div className="user-info">
            <Avatar
              src={review.user?.avatar}
              icon={<UserOutlined />}
              size="large"
            />
            <div className="user-details">
              <div className="user-name">
                {review.user ? 
                  `${review.user.firstName} ${review.user.lastName}` : 
                  '匿名用戶'
                }
                {review.isVerified && (
                  <Tag color="green" icon={<CheckCircleOutlined />} className="verified-tag">
                    已驗證購買
                  </Tag>
                )}
              </div>
              <div className="review-meta">
                <Rate disabled value={review.rating} />
                <Text type="secondary" className="review-date">
                  {formatDate(review.createdAt)}
                </Text>
              </div>
            </div>
          </div>
          
          {review.isRecommended && (
            <Tag color="orange" className="recommend-tag">
              推薦商品
            </Tag>
          )}
        </div>

        <div className="review-content">
          {review.title && (
            <Title level={5} className="review-title">{review.title}</Title>
          )}
          <Paragraph className="review-text">{review.content}</Paragraph>
          
          {review.images && review.images.length > 0 && (
            <div className="review-images">
              <Space wrap>
                {review.images.map((image, index) => (
                  <Image
                    key={index}
                    src={image}
                    alt={`評價圖片 ${index + 1}`}
                    width={80}
                    height={80}
                    style={{ 
                      objectFit: 'cover',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    preview={false}
                    onClick={() => handleImagePreview(image)}
                  />
                ))}
              </Space>
            </div>
          )}
        </div>

        <div className="review-actions">
          <Space>
            <Button
              type="text"
              
              icon={review.likes > 0 ? <LikeFilled /> : <LikeOutlined />}
              loading={isLiking}
              onClick={() => onLike?.(review.id)}
              className={review.likes > 0 ? 'liked' : ''}
            >
              有用 ({review.likes})
            </Button>
            <Button
              type="text"
              
              icon={review.dislikes > 0 ? <DislikeFilled /> : <DislikeOutlined />}
              loading={isDisliking}
              onClick={() => onDislike?.(review.id)}
              className={review.dislikes > 0 ? 'disliked' : ''}
            >
              ({review.dislikes})
            </Button>
          </Space>
        </div>
      </Card>

      {/* 圖片預覽模態框 */}
      <Modal
        open={!!imagePreview}
        onCancel={closeImagePreview}
        footer={null}
        width="80%"
        centered
      >
        {imagePreview && (
          <img 
            src={imagePreview} 
            alt="評價圖片" 
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </Modal>
    </>
  )
}

// 寫評價組件
const WriteReviewModal: React.FC<{
  open: boolean
  onCancel: () => void
  productId: string
  productName?: string
  onSuccess: () => void
}> = ({ open, onCancel, productId, productName, onSuccess }) => {
  const [form] = Form.useForm()
  const [imageList, setImageList] = useState<any[]>([])
  const queryClient = useQueryClient()

  const createReviewMutation = useMutation({
    mutationFn: (data: CreateProductReviewRequest) => 
      productService.createProductReview(data),
    onSuccess: () => {
      message.success('評價發表成功')
      form.resetFields()
      setImageList([])
      onSuccess()
      onCancel()
      // 重新獲取評價數據
      queryClient.invalidateQueries({ queryKey: ['productReviews', productId] })
      queryClient.invalidateQueries({ queryKey: ['productReviewStats', productId] })
    },
    onError: (error: any) => {
      message.error(error.message || '發表評價失敗')
    }
  })

  const handleSubmit = async (values: any) => {
    try {
      const reviewData: CreateProductReviewRequest = {
        productId,
        rating: values.rating,
        title: values.title,
        content: values.content,
        images: imageList.map(item => item.url || item.response?.url).filter(Boolean),
        isRecommended: values.isRecommended
      }

      await createReviewMutation.mutateAsync(reviewData)
    } catch (error) {
      console.error('Submit review error:', error)
    }
  }

  const handleImageChange = ({ fileList }: any) => {
    setImageList(fileList)
  }

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上傳圖片</div>
    </div>
  )

  return (
    <Modal
      title={`評價商品${productName ? ` - ${productName}` : ''}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ rating: 5 }}
      >
        <Form.Item
          name="rating"
          label="評分"
          rules={[{ required: true, message: '請給出評分' }]}
        >
          <Rate allowHalf />
        </Form.Item>

        <Form.Item
          name="title"
          label="評價標題"
          rules={[{ required: true, message: '請輸入評價標題' }]}
        >
          <Input placeholder="請簡要描述您的使用感受" />
        </Form.Item>

        <Form.Item
          name="content"
          label="評價內容"
          rules={[
            { required: true, message: '請輸入評價內容' },
            { min: 10, message: '評價內容至少需要10個字' }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="請詳細描述您的使用體驗，幫助其他顧客做出選擇"
          />
        </Form.Item>

        <Form.Item
          name="images"
          label="上傳圖片（可選）"
          extra="最多可上傳5張圖片"
        >
          <Upload
            listType="picture-card"
            fileList={imageList}
            onChange={handleImageChange}
            beforeUpload={() => false} // 阻止自動上傳
            maxCount={5}
          >
            {imageList.length >= 5 ? null : uploadButton}
          </Upload>
        </Form.Item>

        <Form.Item
          name="isRecommended"
          valuePropName="checked"
        >
          <Button type="dashed" icon={<EditOutlined />}>
            我推薦這個商品
          </Button>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={createReviewMutation.isPending}
            >
              發表評價
            </Button>
            <Button onClick={onCancel}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}

// 主要評價組件
export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  productName,
  className
}) => {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('created_desc')
  const [writeReviewVisible, setWriteReviewVisible] = useState(false)
  
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  // 獲取評價列表
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['productReviews', productId, page, sortBy],
    queryFn: () => productService.getProductReviews(productId, {
      page,
      limit: 10,
      sort: sortBy
    })
  })

  // 點讚/點踩功能（需要後端實現）
  const handleLike = (reviewId: string) => {
    // TODO: 實現點讚功能
    message.info('點讚功能開發中')
  }

  const handleDislike = (reviewId: string) => {
    // TODO: 實現點踩功能  
    message.info('點踩功能開發中')
  }

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      message.warning('請先登入後再發表評價')
      return
    }
    setWriteReviewVisible(true)
  }

  const reviews = reviewsData?.data || []
  const pagination = reviewsData?.pagination

  return (
    <div className={`product-reviews ${className || ''}`}>
      {/* 評價統計 */}
      <ReviewStats productId={productId} />

      {/* 操作區域 */}
      <Card className="reviews-toolbar">
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>評價列表</Text>
              {pagination && (
                <Text type="secondary">({pagination.total} 則評價)</Text>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 150 }}
              >
                <Select.Option value="created_desc">最新評價</Select.Option>
                <Select.Option value="created_asc">最早評價</Select.Option>
                <Select.Option value="rating_desc">評分最高</Select.Option>
                <Select.Option value="rating_asc">評分最低</Select.Option>
                <Select.Option value="helpful_desc">最有用</Select.Option>
              </Select>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleWriteReview}
              >
                寫評價
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 評價列表 */}
      <div className="reviews-list">
        {isLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : reviews.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {reviews.map(review => (
              <ReviewItem
                key={review.id}
                review={review}
                onLike={handleLike}
                onDislike={handleDislike}
              />
            ))}
          </Space>
        ) : (
          <Empty
            description="暫時沒有評價"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handleWriteReview}>
              成為第一個評價的人
            </Button>
          </Empty>
        )}

        {/* 分頁 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="reviews-pagination">
            <Pagination
              current={pagination.page}
              total={pagination.total}
              pageSize={pagination.limit}
              onChange={setPage}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) =>
                `第 ${range[0]}-${range[1]} 項，共 ${total} 項評價`
              }
            />
          </div>
        )}
      </div>

      {/* 寫評價模態框 */}
      <WriteReviewModal
        open={writeReviewVisible}
        onCancel={() => setWriteReviewVisible(false)}
        productId={productId}
        productName={productName}
        onSuccess={() => {
          // 刷新評價數據
          queryClient.invalidateQueries({ queryKey: ['productReviews', productId] })
        }}
      />
    </div>
  )
}

export default ProductReviews