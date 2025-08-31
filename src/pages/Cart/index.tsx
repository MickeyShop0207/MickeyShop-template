// 購物車頁面
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row,
  Col,
  Card,
  Button,
  InputNumber,
  Checkbox,
  Empty,
  Divider,
  Space,
  Image,
  Typography,
  Modal,
  message,
  Tooltip,
  Tag,
  Alert
} from 'antd'
import {
  DeleteOutlined,
  HeartOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
  SafetyOutlined,
  TruckOutlined,
  LeftOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useCart, useAuth, useRecommendedProducts, useWishlist } from '../../hooks'
import { ProductCard } from '../../components'
import { formatPrice } from '../../utils'
import { ROUTES } from '../../router'
import { CartItem } from '../../types'
import './style.scss'

const { Title, Text } = Typography
const { confirm } = Modal

interface CartItemCardProps {
  item: CartItem
  selected: boolean
  onSelect: (selected: boolean) => void
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  onMoveToWishlist: () => void
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  selected,
  onSelect,
  onQuantityChange,
  onRemove,
  onMoveToWishlist
}) => {
  const [localQuantity, setLocalQuantity] = useState(item.quantity)

  // 處理數量變更（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuantity !== item.quantity && localQuantity > 0) {
        onQuantityChange(localQuantity)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [localQuantity, item.quantity, onQuantityChange])

  const handleQuantityChange = (value: number | null) => {
    if (value && value > 0 && value <= item.product.stock) {
      setLocalQuantity(value)
    }
  }

  const handleRemove = () => {
    confirm({
      title: '確認移除',
      content: '確定要將此商品從購物車移除嗎？',
      icon: <ExclamationCircleOutlined />,
      onOk: onRemove,
      okText: '確定',
      cancelText: '取消'
    })
  }

  const itemTotal = item.price * item.quantity
  const isOutOfStock = item.product.stock === 0
  const isInsufficientStock = item.quantity > item.product.stock

  return (
    <Card className={`cart-item ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="cart-item-content">
        {/* 選擇框 */}
        <div className="item-select">
          <Checkbox 
            checked={selected} 
            onChange={(e) => onSelect(e.target.checked)}
            disabled={isOutOfStock || isInsufficientStock}
          />
        </div>

        {/* 商品圖片 */}
        <div className="item-image">
          <Image
            src={item.product.images[0]}
            alt={item.product.name}
            width={80}
            height={80}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={false}
          />
          {isOutOfStock && (
            <div className="stock-overlay">缺貨</div>
          )}
        </div>

        {/* 商品信息 */}
        <div className="item-info">
          <div className="item-name">
            <Text strong>{item.product.name}</Text>
          </div>
          
          {item.variants && Object.keys(item.variants).length > 0 && (
            <div className="item-variants">
              {Object.entries(item.variants).map(([key, value]) => (
                <Tag key={key} size="small">
                  {key}: {value}
                </Tag>
              ))}
            </div>
          )}

          {isInsufficientStock && (
            <Alert
              message={`庫存不足，僅剩 ${item.product.stock} 件`}
              type="warning"
              size="small"
              showIcon
              className="stock-warning"
            />
          )}
        </div>

        {/* 單價 */}
        <div className="item-price">
          <div className="current-price">
            {formatPrice(item.price)}
          </div>
          {item.originalPrice && item.originalPrice > item.price && (
            <div className="original-price">
              {formatPrice(item.originalPrice)}
            </div>
          )}
        </div>

        {/* 數量控制 */}
        <div className="item-quantity">
          <InputNumber
            min={1}
            max={item.product.stock}
            value={localQuantity}
            onChange={handleQuantityChange}
            size="small"
            disabled={isOutOfStock}
            style={{ width: 80 }}
          />
          <div className="stock-info">
            庫存 {item.product.stock}
          </div>
        </div>

        {/* 小計 */}
        <div className="item-total">
          <Text strong className="total-price">
            {formatPrice(itemTotal)}
          </Text>
        </div>

        {/* 操作按鈕 */}
        <div className="item-actions">
          <Space direction="vertical" size="small">
            <Tooltip title="移至收藏夾">
              <Button
                type="text"
                icon={<HeartOutlined />}
                size="small"
                onClick={onMoveToWishlist}
              />
            </Tooltip>
            
            <Tooltip title="刪除">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                onClick={handleRemove}
                className="delete-btn"
              />
            </Tooltip>
          </Space>
        </div>
      </div>
    </Card>
  )
}

const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { 
    items, 
    isLoading, 
    updateQuantity, 
    removeItem, 
    clearCart,
    getTotalPrice,
    getTotalItems 
  } = useCart()
  
  const { addToWishlist } = useWishlist()
  const { data: recommendedProducts = [] } = useRecommendedProducts(8)
  
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // 初始化選中狀態
  useEffect(() => {
    const availableItems = items.filter(item => 
      item.product.stock > 0 && item.quantity <= item.product.stock
    )
    setSelectedItems(availableItems.map(item => item.id))
  }, [items])

  // 更新全選狀態
  useEffect(() => {
    const availableItems = items.filter(item => 
      item.product.stock > 0 && item.quantity <= item.product.stock
    )
    setSelectAll(availableItems.length > 0 && selectedItems.length === availableItems.length)
  }, [selectedItems, items])

  // 未登錄狀態
  if (!user) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <Empty
              image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              description="請先登錄查看購物車"
            >
              <Button type="primary" onClick={() => navigate(ROUTES.LOGIN)}>
                立即登錄
              </Button>
            </Empty>
          </div>
        </div>
      </div>
    )
  }

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="loading-content">載入中...</div>
        </div>
      </div>
    )
  }

  // 空購物車狀態
  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          {/* 頁面標題 */}
          <div className="page-header">
            <Button 
              type="text" 
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
              className="back-button"
            >
              返回
            </Button>
            <Title level={2}>購物車</Title>
          </div>

          <div className="empty-cart">
            <Empty
              image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              description="購物車是空的"
            >
              <Button type="primary" onClick={() => navigate(ROUTES.PRODUCTS)}>
                開始購物
              </Button>
            </Empty>
          </div>

          {/* 推薦商品 */}
          {recommendedProducts.length > 0 && (
            <div className="recommended-products">
              <Title level={3}>為您推薦</Title>
              <Row gutter={[16, 16]}>
                {recommendedProducts.slice(0, 8).map((product) => (
                  <Col key={product.id} xs={12} sm={8} lg={6}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 處理單項選擇
  const handleItemSelect = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, itemId])
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    }
  }

  // 處理全選
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const availableItems = items.filter(item => 
        item.product.stock > 0 && item.quantity <= item.product.stock
      )
      setSelectedItems(availableItems.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  // 處理數量變更
  const handleQuantityChange = async (itemId: string, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity)
      message.success('數量已更新')
    } catch (error) {
      message.error('更新失敗')
    }
  }

  // 處理移除商品
  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId)
      setSelectedItems(prev => prev.filter(id => id !== itemId))
      message.success('商品已移除')
    } catch (error) {
      message.error('移除失敗')
    }
  }

  // 移至收藏夾
  const handleMoveToWishlist = async (item: CartItem) => {
    try {
      await addToWishlist(item.product.id)
      await removeItem(item.id)
      setSelectedItems(prev => prev.filter(id => id !== item.id))
      message.success('已移至收藏夾')
    } catch (error) {
      message.error('操作失敗')
    }
  }

  // 清空購物車
  const handleClearCart = () => {
    confirm({
      title: '清空購物車',
      content: '確定要清空整個購物車嗎？此操作不可撤銷。',
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          await clearCart()
          setSelectedItems([])
          message.success('購物車已清空')
        } catch (error) {
          message.error('操作失敗')
        }
      },
      okText: '確定',
      cancelText: '取消'
    })
  }

  // 去結帳
  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      message.warning('請選擇要結帳的商品')
      return
    }

    // 檢查選中商品是否都有庫存
    const selectedCartItems = items.filter(item => selectedItems.includes(item.id))
    const hasOutOfStock = selectedCartItems.some(item => 
      item.product.stock === 0 || item.quantity > item.product.stock
    )

    if (hasOutOfStock) {
      message.warning('選中商品中有庫存不足的商品，請調整後再結帳')
      return
    }

    navigate(ROUTES.CHECKOUT, {
      state: { selectedItems }
    })
  }

  // 計算選中商品的總價
  const getSelectedTotalPrice = () => {
    return items
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const selectedTotalPrice = getSelectedTotalPrice()
  const selectedCount = selectedItems.length
  const totalItems = getTotalItems()
  const availableItems = items.filter(item => 
    item.product.stock > 0 && item.quantity <= item.product.stock
  )

  return (
    <div className="cart-page">
      <div className="container">
        {/* 頁面標題 */}
        <div className="page-header">
          <Button 
            type="text" 
            icon={<LeftOutlined />}
            onClick={() => navigate(-1)}
            className="back-button"
          >
            返回
          </Button>
          <Title level={2}>
            購物車 ({totalItems} 件商品)
          </Title>
        </div>

        <Row gutter={24}>
          {/* 購物車商品列表 */}
          <Col xs={24} lg={16}>
            <div className="cart-content">
              {/* 操作欄 */}
              <Card className="cart-header">
                <div className="cart-controls">
                  <div className="select-controls">
                    <Checkbox
                      checked={selectAll}
                      indeterminate={selectedItems.length > 0 && !selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      disabled={availableItems.length === 0}
                    >
                      全選 ({availableItems.length})
                    </Checkbox>
                  </div>
                  
                  <div className="action-controls">
                    <Button 
                      type="text" 
                      danger 
                      onClick={handleClearCart}
                      disabled={items.length === 0}
                    >
                      清空購物車
                    </Button>
                  </div>
                </div>
              </Card>

              {/* 商品列表 */}
              <div className="cart-items">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    selected={selectedItems.includes(item.id)}
                    onSelect={(selected) => handleItemSelect(item.id, selected)}
                    onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
                    onRemove={() => handleRemoveItem(item.id)}
                    onMoveToWishlist={() => handleMoveToWishlist(item)}
                  />
                ))}
              </div>
            </div>
          </Col>

          {/* 結帳信息 */}
          <Col xs={24} lg={8}>
            <div className="checkout-summary">
              <Card title="訂單摘要" className="summary-card">
                <div className="summary-content">
                  <div className="summary-row">
                    <span>已選商品：</span>
                    <span>{selectedCount} 件</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>商品總價：</span>
                    <span>{formatPrice(selectedTotalPrice)}</span>
                  </div>
                  
                  <div className="summary-row discount-row">
                    <span>優惠折扣：</span>
                    <span className="discount-amount">-{formatPrice(0)}</span>
                  </div>
                  
                  <div className="summary-row shipping-row">
                    <span>運費：</span>
                    <span className="shipping-fee">
                      {selectedTotalPrice >= 1000 ? '免運費' : formatPrice(60)}
                    </span>
                  </div>
                  
                  <Divider style={{ margin: '16px 0' }} />
                  
                  <div className="summary-row total-row">
                    <span>應付金額：</span>
                    <span className="total-amount">
                      {formatPrice(selectedTotalPrice + (selectedTotalPrice >= 1000 ? 0 : 60))}
                    </span>
                  </div>
                </div>

                <div className="checkout-actions">
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleCheckout}
                    disabled={selectedItems.length === 0}
                    className="checkout-btn"
                  >
                    去結帳 ({selectedCount})
                  </Button>
                </div>

                {/* 優惠信息 */}
                <div className="promotion-info">
                  <div className="promotion-item">
                    <TruckOutlined className="promotion-icon" />
                    <span>滿 $1000 免運費</span>
                  </div>
                  <div className="promotion-item">
                    <GiftOutlined className="promotion-icon" />
                    <span>新會員首單享 9 折優惠</span>
                  </div>
                  <div className="promotion-item">
                    <SafetyOutlined className="promotion-icon" />
                    <span>30 天無理由退換貨</span>
                  </div>
                </div>
              </Card>
            </div>
          </Col>
        </Row>

        {/* 推薦商品 */}
        {recommendedProducts.length > 0 && (
          <div className="recommended-products">
            <Title level={3}>為您推薦</Title>
            <Row gutter={[16, 16]}>
              {recommendedProducts.slice(0, 8).map((product) => (
                <Col key={product.id} xs={12} sm={8} lg={6}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage