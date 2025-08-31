// 商品詳情頁面
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Row, 
  Col, 
  Button, 
  InputNumber, 
  Divider, 
  Tabs, 
  Rate, 
  Tag, 
  Space, 
  Badge, 
  Card,
  Carousel,
  Avatar,
  Pagination,
  Empty,
  message,
  Image
} from 'antd'
import { 
  HeartOutlined, 
  HeartFilled,
  ShareAltOutlined,
  ShoppingCartOutlined,
  LeftOutlined,
  StarFilled,
  CheckCircleOutlined,
  TruckOutlined,
  SafetyOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons'
import { ProductCard } from '../../components'
import { 
  useProduct, 
  useProductReviews, 
  useRecommendedProducts,
  useRelatedProducts,
  useCart,
  useWishlist,
  useAuth
} from '../../hooks'
import { formatPrice } from '../../utils'
import { ROUTES } from '../../router'
import './style.scss'

const { TabPane } = Tabs

interface ProductVariantSelectorProps {
  variants: Array<{
    id: string
    name: string
    options: Array<{
      id: string
      name: string
      value: string
      stock: number
      priceAdjustment?: number
    }>
  }>
  selectedVariants: Record<string, string>
  onVariantChange: (variantId: string, optionId: string) => void
}

const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
  variants,
  selectedVariants,
  onVariantChange
}) => {
  return (
    <div className="product-variants">
      {variants.map((variant) => (
        <div key={variant.id} className="variant-group">
          <div className="variant-label">{variant.name}：</div>
          <Space wrap>
            {variant.options.map((option) => (
              <Button
                key={option.id}
                type={selectedVariants[variant.id] === option.id ? 'primary' : 'default'}
                size="small"
                disabled={option.stock === 0}
                onClick={() => onVariantChange(variant.id, option.id)}
                className="variant-option"
              >
                {option.name}
                {option.stock === 0 && <span className="stock-out"> (缺貨)</span>}
              </Button>
            ))}
          </Space>
        </div>
      ))}
    </div>
  )
}

interface ProductReviewsProps {
  productId: string
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const { data: reviewsData, isLoading } = useProductReviews(productId, {
    page: currentPage,
    limit: 10
  })

  const reviews = reviewsData?.items || []
  const pagination = reviewsData?.pagination

  if (isLoading) {
    return <div className="reviews-loading">載入評價中...</div>
  }

  if (reviews.length === 0) {
    return (
      <Empty 
        description="暫無評價"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }

  return (
    <div className="product-reviews">
      {reviews.map((review) => (
        <Card key={review.id} className="review-card" size="small">
          <div className="review-header">
            <div className="reviewer-info">
              <Avatar src={review.user.avatar} size="small">
                {review.user.name.charAt(0)}
              </Avatar>
              <span className="reviewer-name">{review.user.name}</span>
              <span className="review-date">{review.createdAt}</span>
            </div>
            <Rate disabled defaultValue={review.rating} size="small" />
          </div>
          
          {review.variant && (
            <div className="review-variant">
              購買規格：{review.variant}
            </div>
          )}
          
          <div className="review-content">
            {review.content}
          </div>
          
          {review.images && review.images.length > 0 && (
            <div className="review-images">
              <Space>
                {review.images.map((image, index) => (
                  <Image
                    key={index}
                    src={image}
                    width={60}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                  />
                ))}
              </Space>
            </div>
          )}

          {review.reply && (
            <div className="review-reply">
              <div className="reply-header">
                <strong>商家回覆：</strong>
              </div>
              <div className="reply-content">
                {review.reply.content}
              </div>
              <div className="reply-date">
                {review.reply.createdAt}
              </div>
            </div>
          )}
        </Card>
      ))}
      
      {pagination && pagination.totalPages > 1 && (
        <div className="reviews-pagination">
          <Pagination
            current={currentPage}
            total={pagination.total}
            pageSize={pagination.limit}
            onChange={setCurrentPage}
            showSizeChanger={false}
            showQuickJumper
          />
        </div>
      )}
    </div>
  )
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const { data: product, isLoading, error } = useProduct(id!)
  const { data: relatedProducts = [] } = useRelatedProducts(id!)
  const { data: recommendedProducts = [] } = useRecommendedProducts(8)
  
  const { addToCart, isLoading: cartLoading } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('details')

  // 商品載入失敗或不存在
  if (error) {
    return (
      <div className="product-not-found">
        <Empty
          description="商品不存在或已下架"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate(ROUTES.PRODUCTS)}>
            返回商品列表
          </Button>
        </Empty>
      </div>
    )
  }

  // 載入中狀態
  if (isLoading || !product) {
    return (
      <div className="product-detail-loading">
        <div className="container">
          <div className="loading-content">載入中...</div>
        </div>
      </div>
    )
  }

  // 處理規格選擇
  const handleVariantChange = (variantId: string, optionId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantId]: optionId
    }))
  }

  // 計算當前價格（包含規格加價）
  const getCurrentPrice = () => {
    let price = product.price
    
    if (product.variants) {
      Object.entries(selectedVariants).forEach(([variantId, optionId]) => {
        const variant = product.variants?.find(v => v.id === variantId)
        const option = variant?.options.find(o => o.id === optionId)
        if (option?.priceAdjustment) {
          price += option.priceAdjustment
        }
      })
    }
    
    return price
  }

  // 檢查是否可以加入購物車
  const canAddToCart = () => {
    // 檢查是否選擇了所有必需的規格
    if (product.variants) {
      return product.variants.every(variant => 
        selectedVariants[variant.id] !== undefined
      )
    }
    return true
  }

  // 獲取當前庫存
  const getCurrentStock = () => {
    if (!product.variants || Object.keys(selectedVariants).length === 0) {
      return product.stock
    }

    // 計算選中規格組合的庫存
    let stock = product.stock
    Object.entries(selectedVariants).forEach(([variantId, optionId]) => {
      const variant = product.variants?.find(v => v.id === variantId)
      const option = variant?.options.find(o => o.id === optionId)
      if (option) {
        stock = Math.min(stock, option.stock)
      }
    })
    
    return stock
  }

  // 加入購物車
  const handleAddToCart = async () => {
    if (!canAddToCart()) {
      message.warning('請選擇商品規格')
      return
    }

    try {
      await addToCart({
        productId: product.id,
        quantity,
        variants: selectedVariants
      })
      message.success('已加入購物車')
    } catch (error) {
      message.error('加入購物車失敗')
    }
  }

  // 立即購買
  const handleBuyNow = async () => {
    if (!canAddToCart()) {
      message.warning('請選擇商品規格')
      return
    }

    if (!user) {
      navigate(ROUTES.LOGIN)
      return
    }

    // 加入購物車後跳轉到結帳頁面
    try {
      await addToCart({
        productId: product.id,
        quantity,
        variants: selectedVariants
      })
      navigate(ROUTES.CHECKOUT)
    } catch (error) {
      message.error('操作失敗')
    }
  }

  // 收藏/取消收藏
  const handleToggleWishlist = async () => {
    if (!user) {
      navigate(ROUTES.LOGIN)
      return
    }

    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id)
        message.success('已從收藏移除')
      } else {
        await addToWishlist(product.id)
        message.success('已加入收藏')
      }
    } catch (error) {
      message.error('操作失敗')
    }
  }

  const currentPrice = getCurrentPrice()
  const currentStock = getCurrentStock()
  const inWishlist = isInWishlist(product.id)

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* 返回按鈕 */}
        <div className="page-header">
          <Button 
            type="text" 
            icon={<LeftOutlined />}
            onClick={() => navigate(-1)}
            className="back-button"
          >
            返回
          </Button>
        </div>

        {/* 商品主要信息 */}
        <div className="product-main">
          <Row gutter={48}>
            {/* 商品圖片 */}
            <Col xs={24} lg={12}>
              <div className="product-gallery">
                <div className="main-image">
                  <Image
                    src={product.images[activeImageIndex]}
                    alt={product.name}
                    width="100%"
                    style={{ maxHeight: 500, objectFit: 'cover' }}
                  />
                  {product.discount && (
                    <Badge.Ribbon text={`-${product.discount}%`} color="red">
                      <div></div>
                    </Badge.Ribbon>
                  )}
                </div>
                
                {product.images.length > 1 && (
                  <div className="thumbnail-list">
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                        onClick={() => setActiveImageIndex(index)}
                      >
                        <img src={image} alt={`${product.name} ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Col>

            {/* 商品信息 */}
            <Col xs={24} lg={12}>
              <div className="product-info">
                <div className="product-header">
                  <h1 className="product-title">{product.name}</h1>
                  <div className="product-subtitle">{product.subtitle}</div>
                  
                  <div className="product-meta">
                    <div className="rating-section">
                      <Rate disabled defaultValue={product.rating} size="small" />
                      <span className="rating-text">
                        {product.rating} ({product.reviewCount} 評價)
                      </span>
                    </div>
                    
                    <div className="product-tags">
                      {product.tags?.map((tag) => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                      ))}
                      {product.isRecommended && (
                        <Tag color="gold" icon={<StarFilled />}>推薦</Tag>
                      )}
                      {product.isFeatured && (
                        <Tag color="red">精選</Tag>
                      )}
                      {product.isNewArrival && (
                        <Tag color="green">新品</Tag>
                      )}
                    </div>
                  </div>
                </div>

                <Divider />

                {/* 價格信息 */}
                <div className="price-section">
                  <div className="current-price">
                    {formatPrice(currentPrice)}
                  </div>
                  {product.originalPrice && product.originalPrice > currentPrice && (
                    <div className="original-price">
                      原價：{formatPrice(product.originalPrice)}
                    </div>
                  )}
                  {product.discount && (
                    <div className="discount-text">
                      限時優惠 -{product.discount}%
                    </div>
                  )}
                </div>

                <Divider />

                {/* 商品規格選擇 */}
                {product.variants && product.variants.length > 0 && (
                  <>
                    <ProductVariantSelector
                      variants={product.variants}
                      selectedVariants={selectedVariants}
                      onVariantChange={handleVariantChange}
                    />
                    <Divider />
                  </>
                )}

                {/* 數量選擇 */}
                <div className="quantity-section">
                  <span className="quantity-label">數量：</span>
                  <InputNumber
                    min={1}
                    max={currentStock}
                    value={quantity}
                    onChange={(value) => setQuantity(value || 1)}
                    disabled={currentStock === 0}
                  />
                  <span className="stock-info">
                    庫存：{currentStock} 件
                  </span>
                </div>

                <Divider />

                {/* 操作按鈕 */}
                <div className="action-buttons">
                  <Space size="middle">
                    <Button
                      type="primary"
                      size="large"
                      icon={<ShoppingCartOutlined />}
                      loading={cartLoading}
                      disabled={currentStock === 0 || !canAddToCart()}
                      onClick={handleAddToCart}
                      className="add-to-cart-btn"
                    >
                      加入購物車
                    </Button>
                    
                    <Button
                      type="primary"
                      size="large"
                      disabled={currentStock === 0 || !canAddToCart()}
                      onClick={handleBuyNow}
                      className="buy-now-btn"
                      style={{ background: '#ff4d4f', borderColor: '#ff4d4f' }}
                    >
                      立即購買
                    </Button>
                    
                    <Button
                      type="text"
                      size="large"
                      icon={inWishlist ? <HeartFilled /> : <HeartOutlined />}
                      onClick={handleToggleWishlist}
                      className={`wishlist-btn ${inWishlist ? 'active' : ''}`}
                    >
                      收藏
                    </Button>
                    
                    <Button
                      type="text"
                      size="large"
                      icon={<ShareAltOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href)
                        message.success('連結已複製')
                      }}
                    >
                      分享
                    </Button>
                  </Space>
                </div>

                {/* 服務保障 */}
                <div className="service-guarantees">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div className="guarantee-item">
                        <TruckOutlined className="guarantee-icon" />
                        <span>免費配送</span>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="guarantee-item">
                        <SafetyOutlined className="guarantee-icon" />
                        <span>正品保證</span>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="guarantee-item">
                        <CustomerServiceOutlined className="guarantee-icon" />
                        <span>售後服務</span>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* 商品詳細信息 */}
        <div className="product-details">
          <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
            <TabPane tab="商品詳情" key="details">
              <div className="product-description">
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            </TabPane>
            
            <TabPane tab={`用戶評價 (${product.reviewCount})`} key="reviews">
              <ProductReviews productId={product.id} />
            </TabPane>
            
            <TabPane tab="商品參數" key="specifications">
              <div className="product-specifications">
                {product.specifications ? (
                  <Row gutter={[24, 16]}>
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <Col span={12} key={key}>
                        <div className="spec-item">
                          <span className="spec-label">{key}：</span>
                          <span className="spec-value">{value}</span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty description="暫無規格信息" />
                )}
              </div>
            </TabPane>
            
            <TabPane tab="售後服務" key="service">
              <div className="service-info">
                <div className="service-item">
                  <CheckCircleOutlined className="service-icon" />
                  <div className="service-content">
                    <h4>品質保證</h4>
                    <p>所有商品均為正品，提供品質保證</p>
                  </div>
                </div>
                
                <div className="service-item">
                  <TruckOutlined className="service-icon" />
                  <div className="service-content">
                    <h4>配送服務</h4>
                    <p>全台免費配送，24小時內出貨</p>
                  </div>
                </div>
                
                <div className="service-item">
                  <CustomerServiceOutlined className="service-icon" />
                  <div className="service-content">
                    <h4>退換貨服務</h4>
                    <p>30天無理由退換貨，讓您購物無憂</p>
                  </div>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </div>

        {/* 相關商品推薦 */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <h2 className="section-title">相關商品</h2>
            <Row gutter={[16, 16]}>
              {relatedProducts.slice(0, 8).map((relatedProduct) => (
                <Col key={relatedProduct.id} xs={12} sm={8} lg={6}>
                  <ProductCard product={relatedProduct} />
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* 推薦商品 */}
        {recommendedProducts.length > 0 && (
          <div className="recommended-products">
            <h2 className="section-title">為您推薦</h2>
            <Row gutter={[16, 16]}>
              {recommendedProducts.slice(0, 8).map((recommendedProduct) => (
                <Col key={recommendedProduct.id} xs={12} sm={8} lg={6}>
                  <ProductCard product={recommendedProduct} />
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetailPage