// 商品卡片組件
import React from 'react'
import { Card } from '../../ui'
import { Button } from 'antd'
import { HeartOutlined, HeartFilled, ShoppingCartOutlined, EyeOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useCart, useWishlistToggle, useIsInWishlist } from '../../../hooks'
import type { Product } from '../../../api/types'
import clsx from 'clsx'
import './style.scss'

export interface ProductCardProps {
  product: Product
  layout?: 'vertical' | 'horizontal'
  size?: 'small' | 'medium' | 'large'
  showActions?: boolean
  showWishlist?: boolean
  showQuickView?: boolean
  hoverable?: boolean
  className?: string
  onQuickView?: (product: Product) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  layout = 'vertical',
  size = 'medium',
  showActions = true,
  showWishlist = true,
  showQuickView = false,
  hoverable = true,
  className,
  onQuickView
}) => {
  const { addToCart, isAddingToCart } = useCart()
  const { toggle: toggleWishlist, isToggling } = useWishlistToggle()
  const { data: wishlistData } = useIsInWishlist(product.id)

  const inWishlist = wishlistData?.inWishlist || false
  const isOutOfStock = product.stock <= 0
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercentage = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isOutOfStock) {
      addToCart({
        productId: product.id,
        quantity: 1
      })
    }
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    toggleWishlist({
      productId: product.id,
      inWishlist
    })
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onQuickView) {
      onQuickView(product)
    }
  }

  const cardClassName = clsx(
    'product-card',
    {
      [`product-card--${layout}`]: layout,
      [`product-card--${size}`]: size,
      'product-card--out-of-stock': isOutOfStock
    },
    className
  )

  const productImage = product.images?.[0] || '/placeholder-product.jpg'

  if (layout === 'horizontal') {
    return (
      <Card
        className={cardClassName}
        hoverable={hoverable && !isOutOfStock}
        padding="none"
      >
        <Link to={`/products/${product.id}`} className="product-card__link">
          <div className="product-card__horizontal-content">
            <div className="product-card__image-container">
              <img 
                src={productImage} 
                alt={product.name}
                className="product-card__image"
                loading="lazy"
              />
              {hasDiscount && (
                <div className="product-card__badge product-card__badge--discount">
                  -{discountPercentage}%
                </div>
              )}
              {product.isNewArrival && (
                <div className="product-card__badge product-card__badge--new">
                  新品
                </div>
              )}
            </div>
            
            <div className="product-card__info">
              <div className="product-card__header">
                <h3 className="product-card__title">{product.name}</h3>
                {product.brand && (
                  <span className="product-card__brand">{product.brand.name}</span>
                )}
              </div>
              
              <div className="product-card__description">
                {product.shortDescription || product.description}
              </div>
              
              <div className="product-card__rating">
                {product.avgRating && (
                  <div className="product-card__stars">
                    {'★'.repeat(Math.floor(product.avgRating))}
                    {'☆'.repeat(5 - Math.floor(product.avgRating))}
                    <span className="product-card__rating-count">
                      ({product.reviewCount || 0})
                    </span>
                  </div>
                )}
              </div>
              
              <div className="product-card__footer">
                <div className="product-card__price">
                  <span className="product-card__current-price">
                    NT${product.price.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="product-card__original-price">
                      NT${product.originalPrice!.toLocaleString()}
                    </span>
                  )}
                </div>
                
                {showActions && (
                  <div className="product-card__actions">
                    {showWishlist && (
                      <Button
                        type="text"
                        icon={inWishlist ? <HeartFilled /> : <HeartOutlined />}
                        className={clsx('product-card__wishlist-btn', {
                          'product-card__wishlist-btn--active': inWishlist
                        })}
                        loading={isToggling}
                        onClick={handleWishlistToggle}
                      />
                    )}
                    {showQuickView && (
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        className="product-card__quick-view-btn"
                        onClick={handleQuickView}
                      />
                    )}
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      loading={isAddingToCart}
                      disabled={isOutOfStock}
                      onClick={handleAddToCart}
                    >
                      {isOutOfStock ? '缺貨' : '加入購物車'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  return (
    <Card
      className={cardClassName}
      hoverable={hoverable && !isOutOfStock}
      padding="none"
    >
      <Link to={`/products/${product.id}`} className="product-card__link">
        <div className="product-card__image-container">
          <img 
            src={productImage} 
            alt={product.name}
            className="product-card__image"
            loading="lazy"
          />
          
          {/* 角標 */}
          <div className="product-card__badges">
            {hasDiscount && (
              <div className="product-card__badge product-card__badge--discount">
                -{discountPercentage}%
              </div>
            )}
            {product.isNewArrival && (
              <div className="product-card__badge product-card__badge--new">
                新品
              </div>
            )}
            {product.isFeatured && (
              <div className="product-card__badge product-card__badge--featured">
                精選
              </div>
            )}
          </div>
          
          {/* 快速操作 */}
          {showActions && (
            <div className="product-card__quick-actions">
              {showWishlist && (
                <Button
                  type="text"
                  shape="circle"
                  icon={inWishlist ? <HeartFilled /> : <HeartOutlined />}
                  className={clsx('product-card__wishlist-btn', {
                    'product-card__wishlist-btn--active': inWishlist
                  })}
                  loading={isToggling}
                  onClick={handleWishlistToggle}
                />
              )}
              {showQuickView && (
                <Button
                  type="text"
                  shape="circle"
                  icon={<EyeOutlined />}
                  className="product-card__quick-view-btn"
                  onClick={handleQuickView}
                />
              )}
            </div>
          )}
          
          {isOutOfStock && (
            <div className="product-card__out-of-stock-overlay">
              <span>售完</span>
            </div>
          )}
        </div>
        
        <div className="product-card__content">
          <div className="product-card__info">
            {product.brand && (
              <span className="product-card__brand">{product.brand.name}</span>
            )}
            <h3 className="product-card__title">{product.name}</h3>
            
            {product.avgRating && (
              <div className="product-card__rating">
                <div className="product-card__stars">
                  {'★'.repeat(Math.floor(product.avgRating))}
                  {'☆'.repeat(5 - Math.floor(product.avgRating))}
                  <span className="product-card__rating-count">
                    ({product.reviewCount || 0})
                  </span>
                </div>
              </div>
            )}
            
            <div className="product-card__price">
              <span className="product-card__current-price">
                NT${product.price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="product-card__original-price">
                  NT${product.originalPrice!.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="product-card__actions">
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                loading={isAddingToCart}
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                block
              >
                {isOutOfStock ? '缺貨' : '加入購物車'}
              </Button>
            </div>
          )}
        </div>
      </Link>
    </Card>
  )
}

export default ProductCard