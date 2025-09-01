// 商品快速預覽模態框
import React, { useState, useEffect } from 'react'
import {
  Modal,
  Row,
  Col,
  Button,
  InputNumber,
  Rate,
  Tag,
  Space,
  Typography,
  Badge,
  Spin,
  Alert,
  Image,
  Select
} from 'antd'
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  CloseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useCart, useWishlistToggle, useIsInWishlist } from '../../../hooks'
import { productService } from '../../../api/services/productService'
import { formatPrice } from '../../../utils'
import type { Product, ProductVariant } from '../../../api/types'
import './style.scss'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

interface ProductQuickViewProps {
  productId: string | null
  open: boolean
  onClose: () => void
  onViewDetails?: (productId: string) => void
}

// 商品變體選擇器（簡化版）
const QuickVariantSelector: React.FC<{
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
    <div className="quick-variant-selector">
      {Object.entries(attributeGroups).map(([attributeKey, values]) => (
        <div key={attributeKey} className="attribute-group">
          <Text strong className="attribute-label">{attributeKey}：</Text>
          <Select
            value={selectedVariant?.attributes[attributeKey]}
            onChange={(value) => handleAttributeChange(attributeKey, value)}
            style={{ width: 120 }}
            
          >
            {values.map(value => (
              <Option key={value} value={value}>
                {value}
              </Option>
            ))}
          </Select>
        </div>
      ))}
    </div>
  )
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  productId,
  open,
  onClose,
  onViewDetails
}) => {
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const { addToCart, isAddingToCart } = useCart()
  const { toggle: toggleWishlist, isToggling } = useWishlistToggle()
  const { data: wishlistData } = useIsInWishlist(productId || '')

  // 獲取商品詳情
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productId ? productService.getProduct(productId) : Promise.reject('No product ID'),
    enabled: !!productId && open
  })

  // 初始化預設變體
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0]
      setSelectedVariant(defaultVariant)
    }
    setQuantity(1)
    setSelectedImageIndex(0)
  }, [product])

  if (!productId || !open) {
    return null
  }

  const handleClose = () => {
    setQuantity(1)
    setSelectedVariant(null)
    setSelectedImageIndex(0)
    onClose()
  }

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return

    addToCart({
      productId: product.id,
      variantId: selectedVariant?.id,
      quantity
    })
  }

  const handleWishlistToggle = () => {
    if (!product) return
    
    toggleWishlist({
      productId: product.id,
      inWishlist: inWishlist
    })
  }

  const handleViewDetails = () => {
    if (product && onViewDetails) {
      onViewDetails(product.id)
    }
    handleClose()
  }

  if (isLoading) {
    return (
      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        width={800}
        centered
        className="product-quick-view-modal"
      >
        <div className="loading-container">
          <Spin size="large" />
          <Text style={{ marginTop: 16, display: 'block', textAlign: 'center' }}>
            載入商品資訊中...
          </Text>
        </div>
      </Modal>
    )
  }

  if (error || !product) {
    return (
      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        width={800}
        centered
        className="product-quick-view-modal"
      >
        <Alert 
          message="商品載入失敗" 
          description="無法載入商品信息，請稍後再試"
          type="error"
          showIcon
        />
      </Modal>
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
  const productImages = product.images || []

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={900}
      centered
      className="product-quick-view-modal"
      closeIcon={<CloseOutlined />}
    >
      <div className="product-quick-view">
        <Row gutter={32}>
          {/* 左側圖片 */}
          <Col xs={24} md={12}>
            <div className="product-image-section">
              <div className="main-image">
                {productImages.length > 0 ? (
                  <Image
                    src={productImages[selectedImageIndex]}
                    alt={product.name}
                    style={{ width: '100%', height: 400, objectFit: 'cover' }}
                    preview={false}
                  />
                ) : (
                  <div className="placeholder-image">
                    <img 
                      src="/placeholder-product.jpg" 
                      alt={product.name}
                      style={{ width: '100%', height: 400, objectFit: 'cover' }}
                    />
                  </div>
                )}
                
                {/* 角標 */}
                <div className="product-badges">
                  {hasDiscount && (
                    <Badge className="discount-badge">
                      -{discountPercentage}%
                    </Badge>
                  )}
                  {product.isNewArrival && (
                    <Badge className="new-badge">
                      新品
                    </Badge>
                  )}
                  {product.isFeatured && (
                    <Badge className="featured-badge">
                      精選
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* 縮圖列表 */}
              {productImages.length > 1 && (
                <div className="thumbnail-list">
                  {productImages.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} />
                    </div>
                  ))}
                  {productImages.length > 4 && (
                    <div className="more-images">
                      +{productImages.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Col>

          {/* 右側資訊 */}
          <Col xs={24} md={12}>
            <div className="product-info-section">
              {/* 品牌 */}
              {product.brand && (
                <div className="product-brand">
                  {product.brand.name}
                </div>
              )}

              {/* 商品標題 */}
              <Title level={3} className="product-title">
                {product.name}
              </Title>

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
                  <Text className="original-price" delete>
                    {formatPrice(product.originalPrice!)}
                  </Text>
                )}
              </div>

              {/* 短描述 */}
              {product.shortDescription && (
                <Paragraph className="product-description" ellipsis={{ rows: 2 }}>
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
                <QuickVariantSelector
                  variants={product.variants}
                  selectedVariant={selectedVariant}
                  onVariantChange={setSelectedVariant}
                />
              )}

              {/* 數量選擇 */}
              <div className="quantity-section">
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
              <div className="action-buttons">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    loading={isAddingToCart}
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    block
                  >
                    {isOutOfStock ? '暫時缺貨' : '加入購物車'}
                  </Button>
                  
                  <Space style={{ width: '100%' }}>
                    <Button
                      icon={inWishlist ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                      loading={isToggling}
                      onClick={handleWishlistToggle}
                      style={{ flex: 1 }}
                    >
                      {inWishlist ? '取消收藏' : '加入收藏'}
                    </Button>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={handleViewDetails}
                      style={{ flex: 1 }}
                    >
                      查看詳情
                    </Button>
                  </Space>
                </Space>
              </div>

              {/* 商品標籤 */}
              {product.tags && product.tags.length > 0 && (
                <div className="product-tags">
                  <Space wrap >
                    {product.tags.slice(0, 5).map(tag => (
                      <Tag key={tag}>
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </Modal>
  )
}

export default ProductQuickView