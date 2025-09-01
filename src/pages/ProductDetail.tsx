// 商品詳情頁面
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Row,
  Col,
  Button,
  InputNumber,
  Select,
  Rate,
  Tabs,
  Tag,
  Breadcrumb,
  Space,
  Typography,
  Badge,
  Spin,
  Alert,
  Divider,
  Modal,
  message,
  Card
} from 'antd'
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StarFilled,
  EyeOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useCart, useWishlistToggle, useIsInWishlist } from '../hooks'
import { productService } from '../api/services/productService'
import { ProductCard, ProductReviews } from '../components'
import { formatPrice } from '../utils'
import type { Product, ProductVariant } from '../api/types'
import './ProductDetail.scss'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Option } = Select

// 商品圖片畫廊組件
const ProductImageGallery: React.FC<{ images: string[]; productName: string }> = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState(0)
  const [zoomVisible, setZoomVisible] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className="product-image-gallery">
        <div className="main-image-container">
          <img src="/placeholder-product.jpg" alt={productName} className="main-image" />
        </div>
      </div>
    )
  }

  return (
    <div className="product-image-gallery">
      <div className="main-image-container">
        <img 
          src={images[selectedImage]} 
          alt={productName}
          className="main-image"
          onClick={() => setZoomVisible(true)}
        />
        <Button 
          className="zoom-button"
          icon={<EyeOutlined />}
          onClick={() => setZoomVisible(true)}
        >
          放大檢視
        </Button>
      </div>
      
      {images.length > 1 && (
        <div className="thumbnail-list">
          {images.map((image, index) => (
            <div
              key={index}
              className={`thumbnail ${index === selectedImage ? 'active' : ''}`}
              onClick={() => setSelectedImage(index)}
            >
              <img src={image} alt={`${productName} ${index + 1}`} />
            </div>
          ))}
        </div>
      )}

      <Modal
        open={zoomVisible}
        onCancel={() => setZoomVisible(false)}
        footer={null}
        width="80%"
        centered
        className="image-zoom-modal"
      >
        <img src={images[selectedImage]} alt={productName} style={{ width: '100%' }} />
      </Modal>
    </div>
  )
}

// 商品規格選擇器組件
const ProductVariantSelector: React.FC<{
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onVariantChange: (variant: ProductVariant) => void
}> = ({ variants, selectedVariant, onVariantChange }) => {
  if (!variants || variants.length === 0) return null

  // 整理變體屬性
  const attributeGroups: Record<string, string[]> = {}
  variants.forEach(variant => {
    Object.entries(variant.attributes).forEach(([key, value]) => {
      if (!attributeGroups[key]) {
        attributeGroups[key] = []
      }
      if (!attributeGroups[key].includes(value)) {
        attributeGroups[key].push(value)
      }
    })
  })

  const getAvailableValues = (attributeKey: string, currentSelection: Record<string, string>) => {
    return variants
      .filter(variant => {
        return Object.entries(currentSelection).every(([key, value]) => {
          if (key === attributeKey) return true
          return variant.attributes[key] === value
        })
      })
      .map(variant => variant.attributes[attributeKey])
      .filter((value, index, array) => array.indexOf(value) === index)
  }

  const handleAttributeChange = (attributeKey: string, value: string) => {
    const newSelection = {
      ...selectedVariant?.attributes,
      [attributeKey]: value
    }

    const matchingVariant = variants.find(variant =>
      Object.entries(newSelection).every(([key, val]) => variant.attributes[key] === val)
    )

    if (matchingVariant) {
      onVariantChange(matchingVariant)
    }
  }

  return (
    <div className="variant-selector">
      {Object.entries(attributeGroups).map(([attributeKey, values]) => (
        <div key={attributeKey} className="attribute-group">
          <Text strong className="attribute-label">{attributeKey}：</Text>
          <div className="attribute-options">
            {attributeKey.toLowerCase().includes('color') || attributeKey.toLowerCase().includes('顏色') ? (
              // 顏色選擇器
              values.map(value => (
                <Button
                  key={value}
                  className={`color-option ${selectedVariant?.attributes[attributeKey] === value ? 'selected' : ''}`}
                  onClick={() => handleAttributeChange(attributeKey, value)}
                  style={{ 
                    backgroundColor: value.toLowerCase(),
                    border: selectedVariant?.attributes[attributeKey] === value ? '2px solid #1890ff' : '1px solid #d9d9d9'
                  }}
                  title={value}
                />
              ))
            ) : (
              // 一般選擇器
              values.map(value => (
                <Button
                  key={value}
                  type={selectedVariant?.attributes[attributeKey] === value ? 'primary' : 'default'}
                  onClick={() => handleAttributeChange(attributeKey, value)}
                  className="variant-option"
                >
                  {value}
                </Button>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [activeTab, setActiveTab] = useState('description')

  const { addToCart, isAddingToCart } = useCart()
  const { toggle: toggleWishlist, isToggling } = useWishlistToggle()
  const { data: wishlistData } = useIsInWishlist(id || '')

  // 獲取商品詳情
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => id ? productService.getProduct(id) : Promise.reject('No product ID'),
    enabled: !!id
  })

  // 獲取相關商品
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['relatedProducts', id],
    queryFn: () => id ? productService.getRelatedProducts(id, 8) : Promise.reject('No product ID'),
    enabled: !!id && !!product
  })

  // 初始化預設變體
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0]
      setSelectedVariant(defaultVariant)
    }
  }, [product])

  if (!id) {
    return (
      <div className="container">
        <Alert message="缺少商品 ID" type="error" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container">
        <Alert 
          message="商品載入失敗" 
          description="找不到指定的商品，請檢查商品連結是否正確。" 
          type="error"
          action={
            <Button onClick={() => navigate('/products')}>返回商品列表</Button>
          }
        />
      </div>
    )
  }

  const inWishlist = wishlistData?.inWishlist || false
  const isOutOfStock = (selectedVariant?.stock || product.stock) <= 0
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercentage = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0
  const currentPrice = selectedVariant?.price || product.price
  const currentStock = selectedVariant?.stock || product.stock

  const handleAddToCart = () => {
    if (isOutOfStock) return

    addToCart({
      productId: product.id,
      variantId: selectedVariant?.id,
      quantity
    })
  }

  const handleWishlistToggle = () => {
    toggleWishlist({
      productId: product.id,
      inWishlist
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription || product.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      message.success('商品連結已複製到剪貼板')
    }
  }

  const handleBuyNow = () => {
    handleAddToCart()
    navigate('/cart')
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* 麵包屑導航 */}
        <Breadcrumb className="product-breadcrumb">
          <Breadcrumb.Item>
            <Link to="/">首頁</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/products">商品</Link>
          </Breadcrumb.Item>
          {product.category && (
            <Breadcrumb.Item>
              <Link to={`/products?categoryId=${product.category.id}`}>
                {product.category.name}
              </Link>
            </Breadcrumb.Item>
          )}
          <Breadcrumb.Item>{product.name}</Breadcrumb.Item>
        </Breadcrumb>

        {/* 返回按鈕 */}
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="back-button"
        >
          返回
        </Button>

        {/* 主要產品信息 */}
        <Row gutter={[32, 32]} className="product-main">
          {/* 左側圖片 */}
          <Col xs={24} md={12}>
            <ProductImageGallery 
              images={product.images} 
              productName={product.name} 
            />
          </Col>

          {/* 右側信息 */}
          <Col xs={24} md={12}>
            <div className="product-info">
              {/* 品牌 */}
              {product.brand && (
                <div className="product-brand">
                  <Link to={`/products?brandId=${product.brand.id}`}>
                    {product.brand.name}
                  </Link>
                </div>
              )}

              {/* 商品標題 */}
              <Title level={1} className="product-title">{product.name}</Title>

              {/* 評分 */}
              {product.avgRating && (
                <div className="product-rating">
                  <Rate disabled value={product.avgRating} allowHalf />
                  <Text className="rating-text">
                    {product.avgRating.toFixed(1)} ({product.reviewCount || 0} 評價)
                  </Text>
                </div>
              )}

              {/* 價格 */}
              <div className="product-price">
                <Text className="current-price">
                  {formatPrice(currentPrice)}
                </Text>
                {hasDiscount && (
                  <>
                    <Text className="original-price" delete>
                      {formatPrice(product.originalPrice!)}
                    </Text>
                    <Badge 
                      count={`-${discountPercentage}%`} 
                      style={{ backgroundColor: '#ff4d4f' }}
                    />
                  </>
                )}
              </div>

              {/* 短描述 */}
              {product.shortDescription && (
                <Paragraph className="product-short-desc">
                  {product.shortDescription}
                </Paragraph>
              )}

              {/* 庫存狀態 */}
              <div className="stock-status">
                {isOutOfStock ? (
                  <Text type="danger">
                    <ExclamationCircleOutlined /> 暫時缺貨
                  </Text>
                ) : currentStock < 10 ? (
                  <Text type="warning">
                    <ExclamationCircleOutlined /> 剩餘 {currentStock} 件
                  </Text>
                ) : (
                  <Text type="success">
                    <CheckCircleOutlined /> 現貨供應
                  </Text>
                )}
              </div>

              {/* 變體選擇 */}
              {product.variants && product.variants.length > 0 && (
                <ProductVariantSelector
                  variants={product.variants}
                  selectedVariant={selectedVariant}
                  onVariantChange={setSelectedVariant}
                />
              )}

              {/* 數量選擇 */}
              <div className="quantity-selector">
                <Text strong>數量：</Text>
                <InputNumber
                  min={1}
                  max={currentStock}
                  value={quantity}
                  onChange={(value) => setQuantity(value || 1)}
                  disabled={isOutOfStock}
                />
              </div>

              {/* 操作按鈕 */}
              <div className="product-actions">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<ShoppingCartOutlined />}
                      loading={isAddingToCart}
                      disabled={isOutOfStock}
                      onClick={handleAddToCart}
                      style={{ flex: 1 }}
                    >
                      {isOutOfStock ? '暫時缺貨' : '加入購物車'}
                    </Button>
                    <Button
                      size="large"
                      disabled={isOutOfStock}
                      onClick={handleBuyNow}
                      style={{ flex: 1 }}
                    >
                      立即購買
                    </Button>
                  </Space.Compact>
                  
                  <Space style={{ width: '100%', justifyContent: 'center' }}>
                    <Button
                      type="text"
                      icon={inWishlist ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                      loading={isToggling}
                      onClick={handleWishlistToggle}
                    >
                      {inWishlist ? '取消收藏' : '加入收藏'}
                    </Button>
                    <Button
                      type="text"
                      icon={<ShareAltOutlined />}
                      onClick={handleShare}
                    >
                      分享商品
                    </Button>
                  </Space>
                </Space>
              </div>

              {/* 商品標籤 */}
              {product.tags && product.tags.length > 0 && (
                <div className="product-tags">
                  <Text strong>標籤：</Text>
                  <Space wrap>
                    {product.tags.map(tag => (
                      <Tag key={tag} color="blue">{tag}</Tag>
                    ))}
                  </Space>
                </div>
              )}

              {/* 特殊標識 */}
              <div className="product-badges">
                {product.isNewArrival && <Badge status="success" text="新品上市" />}
                {product.isFeatured && <Badge status="warning" text="精選商品" />}
                {product.isRecommended && <Badge status="processing" text="推薦商品" />}
              </div>
            </div>
          </Col>
        </Row>

        {/* 詳細信息標籤頁 */}
        <div className="product-details">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="product-tabs"
          >
            <TabPane tab="商品描述" key="description">
              <div className="tab-content">
                <div 
                  className="product-description"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            </TabPane>
            
            <TabPane tab="規格參數" key="specifications">
              <div className="tab-content">
                <div className="specifications">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text strong>商品編號：</Text>
                      <Text>{product.sku}</Text>
                    </Col>
                    {product.barcode && (
                      <Col span={12}>
                        <Text strong>條碼：</Text>
                        <Text>{product.barcode}</Text>
                      </Col>
                    )}
                    {product.weight && (
                      <Col span={12}>
                        <Text strong>重量：</Text>
                        <Text>{product.weight}g</Text>
                      </Col>
                    )}
                    {product.dimensions && (
                      <Col span={12}>
                        <Text strong>尺寸：</Text>
                        <Text>
                          {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                        </Text>
                      </Col>
                    )}
                    {product.category && (
                      <Col span={12}>
                        <Text strong>分類：</Text>
                        <Text>{product.category.name}</Text>
                      </Col>
                    )}
                    {product.brand && (
                      <Col span={12}>
                        <Text strong>品牌：</Text>
                        <Text>{product.brand.name}</Text>
                      </Col>
                    )}
                  </Row>
                </div>
              </div>
            </TabPane>
            
            <TabPane tab={`評價 (${product.reviewCount || 0})`} key="reviews">
              <div className="tab-content">
                <ProductReviews 
                  productId={product.id}
                  productName={product.name}
                />
              </div>
            </TabPane>
            
            <TabPane tab="運送說明" key="shipping">
              <div className="tab-content">
                <div className="shipping-info">
                  <Card>
                    <Title level={4}>運送方式</Title>
                    <ul>
                      <li>7-11 取貨付款：運費 60 元</li>
                      <li>全家取貨付款：運費 60 元</li>
                      <li>宅配到府：運費 80 元</li>
                      <li>滿 1000 元免運費</li>
                    </ul>
                    
                    <Title level={4}>配送時間</Title>
                    <ul>
                      <li>超商取貨：1-2 個工作天</li>
                      <li>宅配到府：1-3 個工作天</li>
                      <li>偏遠地區：3-5 個工作天</li>
                    </ul>
                    
                    <Title level={4}>退換貨政策</Title>
                    <ul>
                      <li>商品到貨 7 天內可退換貨</li>
                      <li>商品需保持全新狀態</li>
                      <li>個人衛生用品不接受退換貨</li>
                    </ul>
                  </Card>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </div>

        {/* 相關商品推薦 */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <Divider />
            <Title level={3}>相關商品推薦</Title>
            <Row gutter={[16, 16]}>
              {relatedProducts.map(relatedProduct => (
                <Col key={relatedProduct.id} xs={12} sm={8} md={6} lg={6}>
                  <ProductCard 
                    product={relatedProduct} 
                    size="medium"
                  />
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