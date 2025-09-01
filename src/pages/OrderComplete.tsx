import React, { useState, useEffect } from 'react'
import {
  Result,
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  List,
  Avatar,
  Tag,
  Timeline,
  Steps,
  Alert,
  Rate,
  Modal,
  Form,
  Input,
  message,
  Spin
} from 'antd'
import {
  CheckCircleOutlined,
  ShoppingOutlined,
  HeartOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  PrinterOutlined,
  TruckOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  StarOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { gsap } from 'gsap'
import { Order, Product } from '../types'
import { useAuth } from '../hooks/useAuth'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps
const { TextArea } = Input

interface OrderCompletePageProps {}

const OrderCompletePage: React.FC<OrderCompletePageProps> = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [form] = Form.useForm()

  // 動畫容器引用
  const containerRef = React.useRef<HTMLDivElement>(null)
  const celebrationRef = React.useRef<HTMLDivElement>(null)

  // Mock order data
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // 模擬 API 調用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockOrder: Order = {
          id: orderId || '1',
          orderNumber: 'ORD-2024-001',
          user: {
            id: user?.id || '1',
            email: user?.email || 'user@example.com',
            firstName: user?.firstName || '小明',
            lastName: user?.lastName || '王',
            emailVerified: true,
            phoneVerified: false,
            isActive: true,
            role: 'user',
            createdAt: '2024-01-01',
            updatedAt: '2024-08-31'
          },
          items: [
            {
              id: '1',
              quantity: 1,
              unitPrice: 1200,
              totalPrice: 1200,
              status: 'confirmed',
              product: {
                id: '1',
                sku: 'LIPSTICK-001',
                name: 'Dior 烈焰藍金唇膏 #999 傳奇紅',
                slug: 'dior-rouge-999',
                description: '經典傳奇紅色，持久顯色',
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
          ],
          billing: {
            id: '1',
            type: 'billing',
            firstName: '小明',
            lastName: '王',
            addressLine1: '台北市中山區民生東路一段100號',
            addressLine2: '5樓之2',
            city: '台北市',
            state: '中山區',
            postalCode: '10491',
            country: 'TW',
            isDefault: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-08-31'
          },
          shipping: {
            id: '1',
            type: 'shipping',
            firstName: '小明',
            lastName: '王',
            addressLine1: '台北市中山區民生東路一段100號',
            addressLine2: '5樓之2',
            city: '台北市',
            state: '中山區',
            postalCode: '10491',
            country: 'TW',
            isDefault: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-08-31'
          },
          payment: {
            id: '1',
            type: 'credit_card',
            provider: 'stripe',
            details: {
              last4: '4242',
              brand: 'visa'
            },
            isDefault: true,
            isActive: true,
            createdAt: '2024-01-01'
          },
          status: 'confirmed',
          timestamps: {
            createdAt: '2024-08-31T10:30:00Z',
            confirmedAt: '2024-08-31T10:31:00Z'
          },
          totals: {
            subtotal: 1200,
            discounts: [],
            taxes: [{
              id: '1',
              name: '營業稅',
              rate: 0.05,
              type: 'percentage',
              appliedAmount: 57
            }],
            shipping: 0,
            total: 1257,
            currency: 'TWD'
          }
        }
        
        setOrder(mockOrder)
      } catch (error) {
        message.error(t('orderComplete.loadError') || '載入訂單資料失敗')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, user, t])

  // 慶祝動畫效果
  useEffect(() => {
    if (!loading && order && containerRef.current) {
      const tl = gsap.timeline()
      
      // 主要內容淡入
      tl.fromTo(containerRef.current, 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      )
      
      // 慶祝圖標動畫
      tl.fromTo('.success-icon',
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)' },
        '-=0.4'
      )
      
      // 彩帶效果（如果有慶祝容器）
      if (celebrationRef.current) {
        tl.fromTo('.celebration-particle',
          { y: -100, opacity: 0 },
          { y: 100, opacity: 1, duration: 1.5, stagger: 0.1, ease: 'power2.out' },
          '-=0.6'
        )
      }
    }
  }, [loading, order])

  const handleContinueShopping = () => {
    navigate('/products')
  }

  const handleViewOrderHistory = () => {
    navigate('/orders')
  }

  const handleAddToWishlist = async (product: Product) => {
    try {
      // 實際調用 API
      message.success(t('orderComplete.addToWishlistSuccess') || '已加入心願清單')
    } catch (error) {
      message.error(t('orderComplete.addToWishlistError') || '加入心願清單失敗')
    }
  }

  const handleWriteReview = (product: Product) => {
    setSelectedProduct(product)
    form.setFieldsValue({
      rating: 5,
      productName: product.name
    })
    setReviewModalVisible(true)
  }

  const handleSubmitReview = async (values: any) => {
    try {
      // 實際調用評論 API
      message.success(t('orderComplete.reviewSubmitSuccess') || '評論提交成功')
      setReviewModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error(t('orderComplete.reviewSubmitError') || '評論提交失敗')
    }
  }

  const handleShareOrder = async () => {
    try {
      const shareText = t('orderComplete.shareText', { 
        orderNumber: order?.orderNumber,
        total: order?.totals.total 
      }) || `我剛完成了訂單 ${order?.orderNumber}，購物體驗很棒！`
      
      if (navigator.share) {
        await navigator.share({
          title: t('orderComplete.shareTitle') || '購物完成',
          text: shareText,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        message.success(t('orderComplete.shareCopySuccess') || '分享內容已複製到剪貼簿')
      }
    } catch (error) {
      message.error(t('orderComplete.shareError') || '分享失敗')
    }
  }

  const handleDownloadReceipt = () => {
    // 實際實現會生成並下載 PDF 收據
    message.success(t('orderComplete.downloadStarted') || '收據下載已開始')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  if (!order) {
    return (
      <Result
        status="404"
        title={t('orderComplete.orderNotFound') || '訂單不存在'}
        subTitle={t('orderComplete.orderNotFoundDesc') || '找不到指定的訂單，請檢查訂單號碼'}
        extra={
          <Button type="primary" onClick={() => navigate('/orders')}>
            {t('orderComplete.backToOrders') || '返回訂單列表'}
          </Button>
        }
      />
    )
  }

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto py-8">
      {/* 慶祝背景效果 */}
      <div ref={celebrationRef} className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="celebration-particle absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* 成功結果頁面 */}
      <Result
        icon={
          <CheckCircleOutlined 
            className="success-icon text-green-600" 
            style={{ fontSize: '120px' }} 
          />
        }
        status="success"
        title={
          <Title level={1} className="text-green-600 mb-4">
            🎉 {t('orderComplete.successTitle') || '訂單提交成功！'}
          </Title>
        }
        subTitle={
          <div className="space-y-2">
            <Text className="text-lg">
              {t('orderComplete.successMessage') || '感謝您的購買！您的訂單已成功提交並開始處理。'}
            </Text>
            <Text className="text-base text-gray-600">
              {t('orderComplete.orderNumber') || '訂單編號'}：<Text strong>{order.orderNumber}</Text>
            </Text>
            <Text className="text-base text-gray-600">
              {t('orderComplete.orderDate') || '下單時間'}：{new Date(order.timestamps.createdAt).toLocaleString()}
            </Text>
          </div>
        }
        extra={
          <Space size="large" wrap>
            <Button 
              type="primary" 
              size="large" 
              icon={<ShoppingOutlined />}
              onClick={handleContinueShopping}
            >
              {t('orderComplete.continueShopping') || '繼續購物'}
            </Button>
            <Button 
              size="large" 
              onClick={handleViewOrderHistory}
            >
              {t('orderComplete.viewOrders') || '查看訂單'}
            </Button>
            <Button 
              size="large" 
              icon={<ShareAltOutlined />}
              onClick={handleShareOrder}
            >
              {t('orderComplete.share') || '分享'}
            </Button>
          </Space>
        }
      />

      {/* 訂單摘要 */}
      <Card className="mb-6" title={t('orderComplete.orderSummary') || '訂單摘要'}>
        <Row gutter={24}>
          <Col span={12}>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text>{t('orderComplete.subtotal') || '商品金額'}：</Text>
                <Text>NT$ {order.totals.subtotal.toLocaleString()}</Text>
              </div>
              <div className="flex justify-between">
                <Text>{t('orderComplete.shipping') || '運費'}：</Text>
                <Text>{order.totals.shipping > 0 ? `NT$ ${order.totals.shipping.toLocaleString()}` : t('orderComplete.freeShipping') || '免運費'}</Text>
              </div>
              {order.totals.taxes.map(tax => (
                <div key={tax.id} className="flex justify-between">
                  <Text>{tax.name}：</Text>
                  <Text>NT$ {tax.appliedAmount.toLocaleString()}</Text>
                </div>
              ))}
              <Divider />
              <div className="flex justify-between">
                <Text strong className="text-lg">{t('orderComplete.total') || '總計'}：</Text>
                <Text strong className="text-lg text-red-600">NT$ {order.totals.total.toLocaleString()}</Text>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div className="space-y-3">
              <div>
                <Text strong>{t('orderComplete.paymentMethod') || '付款方式'}</Text>
                <div className="mt-1">
                  <Text>
                    {order.payment.details.brand?.toUpperCase()} **** {order.payment.details.last4}
                  </Text>
                </div>
              </div>
              <div>
                <Text strong>{t('orderComplete.shippingAddress') || '配送地址'}</Text>
                <div className="mt-1">
                  <Text>
                    {order.shipping?.firstName} {order.shipping?.lastName}
                  </Text>
                  <br />
                  <Text>
                    {order.shipping?.addressLine1}
                    {order.shipping?.addressLine2 && `, ${order.shipping.addressLine2}`}
                  </Text>
                  <br />
                  <Text>
                    {order.shipping?.city} {order.shipping?.state} {order.shipping?.postalCode}
                  </Text>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <Divider />

        <div className="flex justify-end space-x-2">
          <Button icon={<DownloadOutlined />} onClick={handleDownloadReceipt}>
            {t('orderComplete.downloadReceipt') || '下載收據'}
          </Button>
          <Button icon={<PrinterOutlined />}>
            {t('orderComplete.print') || '列印'}
          </Button>
        </div>
      </Card>

      {/* 商品清單 */}
      <Card className="mb-6" title={t('orderComplete.orderItems') || '訂購商品'}>
        <List
          itemLayout="horizontal"
          dataSource={order.items}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  key="wishlist"
                  type="text" 
                  icon={<HeartOutlined />}
                  onClick={() => handleAddToWishlist(item.product)}
                >
                  {t('orderComplete.addToWishlist') || '加入心願清單'}
                </Button>,
                <Button 
                  key="review"
                  type="text" 
                  icon={<StarOutlined />}
                  onClick={() => handleWriteReview(item.product)}
                >
                  {t('orderComplete.writeReview') || '撰寫評論'}
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    src={item.product.images[0]?.url} 
                    size={64}
                    shape="square"
                  />
                }
                title={
                  <div className="flex items-center space-x-2">
                    <Text strong>{item.product.name}</Text>
                    <Tag color="blue">{item.product.brand.name}</Tag>
                  </div>
                }
                description={
                  <div className="space-y-1">
                    <Text type="secondary">
                      {t('orderComplete.quantity') || '數量'}：{item.quantity} x NT$ {item.unitPrice.toLocaleString()}
                    </Text>
                    <Text strong>
                      {t('orderComplete.itemTotal') || '小計'}：NT$ {item.totalPrice.toLocaleString()}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 訂單狀態時間軸 */}
      <Card className="mb-6" title={t('orderComplete.orderStatus') || '訂單狀態'}>
        <Steps current={1} className="mb-4">
          <Step 
            status="finish"
            title={t('orderComplete.orderPlaced') || '訂單已提交'} 
            description={new Date(order.timestamps.createdAt).toLocaleString()}
            icon={<CheckCircleOutlined />}
          />
          <Step 
            status="process"
            title={t('orderComplete.orderConfirmed') || '訂單已確認'} 
            description={order.timestamps.confirmedAt ? new Date(order.timestamps.confirmedAt).toLocaleString() : t('orderComplete.processing') || '處理中...'}
            icon={<ClockCircleOutlined />}
          />
          <Step 
            status="wait"
            title={t('orderComplete.orderShipped') || '商品已出貨'} 
            description={t('orderComplete.waitingShipment') || '準備出貨'}
            icon={<TruckOutlined />}
          />
          <Step 
            status="wait"
            title={t('orderComplete.orderDelivered') || '已送達'} 
            description={t('orderComplete.waitingDelivery') || '配送中'}
            icon={<GiftOutlined />}
          />
        </Steps>

        <Alert
          message={t('orderComplete.statusMessage') || '訂單狀態更新'}
          description={t('orderComplete.statusDescription') || '我們會通過電子郵件和簡訊通知您訂單狀態的變更。您也可以隨時在「我的訂單」中查看最新進度。'}
          type="info"
          showIcon
        />
      </Card>

      {/* 相關推薦 */}
      <Card title={t('orderComplete.recommendations') || '您可能還喜歡'}>
        <Text type="secondary">
          {t('orderComplete.recommendationsDesc') || '基於您的購買記錄，為您推薦以下商品...'}
        </Text>
        {/* 這裡可以添加推薦商品組件 */}
        <div className="mt-4 text-center">
          <Button type="primary" onClick={handleContinueShopping}>
            {t('orderComplete.exploreProducts') || '探索更多商品'}
          </Button>
        </div>
      </Card>

      {/* 評論 Modal */}
      <Modal
        title={t('orderComplete.writeReviewTitle') || '撰寫商品評論'}
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        {selectedProduct && (
          <>
            <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded">
              <Avatar src={selectedProduct.images[0]?.url} size={48} shape="square" />
              <div>
                <Text strong>{selectedProduct.name}</Text>
                <div className="text-sm text-gray-500">{selectedProduct.brand.name}</div>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmitReview}
            >
              <Form.Item
                label={t('orderComplete.rating') || '評分'}
                name="rating"
                rules={[{ required: true, message: t('orderComplete.ratingRequired') || '請給出評分' }]}
              >
                <Rate allowClear={false} />
              </Form.Item>

              <Form.Item
                label={t('orderComplete.reviewTitle') || '評論標題（選填）'}
                name="title"
              >
                <Input placeholder={t('orderComplete.reviewTitlePlaceholder') || '簡短描述您的體驗'} />
              </Form.Item>

              <Form.Item
                label={t('orderComplete.reviewContent') || '評論內容'}
                name="content"
                rules={[
                  { required: true, message: t('orderComplete.reviewContentRequired') || '請輸入評論內容' },
                  { min: 10, message: t('orderComplete.reviewContentMinLength') || '評論內容至少10個字符' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={t('orderComplete.reviewContentPlaceholder') || '分享您的使用體驗...'}
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item className="text-right mb-0">
                <Space>
                  <Button onClick={() => setReviewModalVisible(false)}>
                    {t('common.cancel') || '取消'}
                  </Button>
                  <Button type="primary" htmlType="submit">
                    {t('common.submit') || '提交'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  )
}

export default OrderCompletePage