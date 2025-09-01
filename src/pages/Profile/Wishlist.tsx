import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Empty,
  Spin,
  message,
  Row,
  Col,
  Image,
  Rate,
  Tag,
  Dropdown,
  Space,
  Typography,
  Tooltip,
  Checkbox,
  Select,
  Input
} from 'antd'
import {
  HeartFilled,
  HeartOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
  EyeOutlined,
  ShareAltOutlined,
  FilterOutlined,
  SearchOutlined,
  MoreOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Product } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'

const { Text, Title } = Typography
const { Option } = Select
const { Search } = Input

interface WishlistItem {
  id: string
  product: Product
  addedAt: string
  priceWhenAdded: number
  notifyPriceDrop: boolean
  notes?: string
}

const WishlistPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()
  
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_low' | 'price_high' | 'name'>('newest')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [priceDropOnly, setPriceDropOnly] = useState(false)

  // Mock data - 實際使用時應從 API 獲取
  useEffect(() => {
    const mockWishlistItems: WishlistItem[] = [
      {
        id: '1',
        addedAt: '2024-08-15T10:30:00Z',
        priceWhenAdded: 1200,
        notifyPriceDrop: true,
        notes: '想要粉色的',
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
              url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300',
              alt: 'Dior 烈焰藍金唇膏',
              sortOrder: 1,
              isPrimary: true,
              type: 'main'
            }
          ],
          variants: [],
          pricing: {
            basePrice: 1080,
            salePrice: 1080,
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
          tags: ['熱銷', '經典'],
          isActive: true,
          isFeature: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-08-30'
        }
      },
      {
        id: '2',
        addedAt: '2024-08-10T15:20:00Z',
        priceWhenAdded: 2800,
        notifyPriceDrop: false,
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
              url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300',
              alt: 'YSL 超模光感粉底液',
              sortOrder: 1,
              isPrimary: true,
              type: 'main'
            }
          ],
          variants: [],
          pricing: {
            basePrice: 2680,
            salePrice: 2280,
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
          tags: ['新品', '降價'],
          isActive: true,
          isFeature: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-08-30'
        }
      }
    ]

    setTimeout(() => {
      setWishlistItems(mockWishlistItems)
      setLoading(false)
    }, 1000)
  }, [])

  const handleRemoveFromWishlist = async (itemId: string) => {
    try {
      setWishlistItems(prev => prev.filter(item => item.id !== itemId))
      setSelectedItems(prev => prev.filter(id => id !== itemId))
      message.success(t('wishlist.removeSuccess') || '已從心願清單移除')
    } catch (error) {
      message.error(t('wishlist.removeError') || '移除失敗')
    }
  }

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      await addToCart({
        productId: item.product.id,
        quantity: 1
      })
      message.success(t('wishlist.addToCartSuccess') || '已加入購物車')
    } catch (error) {
      message.error(t('wishlist.addToCartError') || '加入購物車失敗')
    }
  }

  const handleAddAllToCart = async () => {
    try {
      const itemsToAdd = selectedItems.length > 0 
        ? wishlistItems.filter(item => selectedItems.includes(item.id))
        : wishlistItems

      for (const item of itemsToAdd) {
        await addToCart({
          productId: item.product.id,
          quantity: 1
        })
      }

      message.success(t('wishlist.addAllToCartSuccess') || `已將 ${itemsToAdd.length} 個商品加入購物車`)
      setSelectedItems([])
    } catch (error) {
      message.error(t('wishlist.addAllToCartError') || '批量加入購物車失敗')
    }
  }

  const handleRemoveSelected = async () => {
    try {
      setWishlistItems(prev => prev.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      message.success(t('wishlist.removeSelectedSuccess') || '已移除選中的商品')
    } catch (error) {
      message.error(t('wishlist.removeSelectedError') || '批量移除失敗')
    }
  }

  const handleViewProduct = (product: Product) => {
    navigate(`/products/${product.slug}`)
  }

  const handleShare = async (item: WishlistItem) => {
    try {
      const url = `${window.location.origin}/products/${item.product.slug}`
      await navigator.share({
        title: item.product.name,
        text: item.product.description,
        url
      })
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url)
      message.success(t('wishlist.shareSuccess') || '商品連結已複製到剪貼簿')
    }
  }

  const getPriceChangeStatus = (item: WishlistItem) => {
    const currentPrice = item.product.pricing.salePrice || item.product.pricing.basePrice
    const originalPrice = item.priceWhenAdded
    
    if (currentPrice < originalPrice) {
      return { status: 'decreased', percentage: Math.round((originalPrice - currentPrice) / originalPrice * 100) }
    } else if (currentPrice > originalPrice) {
      return { status: 'increased', percentage: Math.round((currentPrice - originalPrice) / originalPrice * 100) }
    }
    return { status: 'unchanged', percentage: 0 }
  }

  const filteredAndSortedItems = wishlistItems
    .filter(item => {
      if (searchQuery && !item.product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filterCategory && item.product.category.slug !== filterCategory) {
        return false
      }
      if (priceDropOnly) {
        const priceChange = getPriceChangeStatus(item)
        return priceChange.status === 'decreased'
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        case 'oldest':
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
        case 'price_low':
          return (a.product.pricing.salePrice || a.product.pricing.basePrice) - 
                 (b.product.pricing.salePrice || b.product.pricing.basePrice)
        case 'price_high':
          return (b.product.pricing.salePrice || b.product.pricing.basePrice) - 
                 (a.product.pricing.salePrice || a.product.pricing.basePrice)
        case 'name':
          return a.product.name.localeCompare(b.product.name)
        default:
          return 0
      }
    })

  const renderWishlistItem = (item: WishlistItem) => {
    const priceChange = getPriceChangeStatus(item)
    const currentPrice = item.product.pricing.salePrice || item.product.pricing.basePrice
    const isSelected = selectedItems.includes(item.id)

    return (
      <Card
        key={item.id}
        className="wishlist-item hover:shadow-md transition-shadow"
        bodyStyle={{ padding: '16px' }}
        actions={[
          <Tooltip title={t('wishlist.viewProduct') || '查看商品'} key="view">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewProduct(item.product)}
            />
          </Tooltip>,
          <Tooltip title={t('wishlist.addToCart') || '加入購物車'} key="cart">
            <Button
              type="text"
              icon={<ShoppingCartOutlined />}
              onClick={() => handleAddToCart(item)}
              disabled={!item.product.inventory.isInStock}
            />
          </Tooltip>,
          <Tooltip title={t('wishlist.share') || '分享'} key="share">
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              onClick={() => handleShare(item)}
            />
          </Tooltip>,
          <Dropdown
            key="more"
            menu={{
              items: [
                {
                  key: 'remove',
                  label: t('wishlist.remove') || '移除',
                  icon: <DeleteOutlined />,
                  onClick: () => handleRemoveFromWishlist(item.id)
                }
              ]
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ]}
      >
        <div className="flex items-start space-x-4">
          <Checkbox
            checked={isSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedItems(prev => [...prev, item.id])
              } else {
                setSelectedItems(prev => prev.filter(id => id !== item.id))
              }
            }}
          />

          <div className="flex-shrink-0">
            <Image
              src={item.product.images[0]?.url}
              alt={item.product.images[0]?.alt}
              width={80}
              height={80}
              className="object-cover rounded-lg"
              placeholder
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Text strong className="text-gray-900 truncate">
                {item.product.name}
              </Text>
              {item.product.tags?.map(tag => (
                <Tag key={tag}  color="blue">
                  {tag}
                </Tag>
              ))}
            </div>

            <div className="text-gray-600 text-sm mb-2">
              {item.product.brand.name} · {item.product.category.name}
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <Rate
                disabled
                allowHalf
                
                value={item.product.reviews.averageRating}
              />
              <Text type="secondary" className="text-sm">
                ({item.product.reviews.totalReviews})
              </Text>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Text strong className="text-lg text-red-600">
                  NT$ {currentPrice.toLocaleString()}
                </Text>
                {item.product.pricing.salePrice && (
                  <Text delete type="secondary">
                    NT$ {item.product.pricing.basePrice.toLocaleString()}
                  </Text>
                )}
                {priceChange.status === 'decreased' && (
                  <Tag color="green" >
                    ↓ {priceChange.percentage}%
                  </Tag>
                )}
                {priceChange.status === 'increased' && (
                  <Tag color="red" >
                    ↑ {priceChange.percentage}%
                  </Tag>
                )}
              </div>

              {!item.product.inventory.isInStock && (
                <Tag color="red">{t('product.outOfStock') || '缺貨'}</Tag>
              )}
            </div>

            {item.notes && (
              <div className="mt-2 text-sm text-gray-500">
                <Text type="secondary">備註：{item.notes}</Text>
              </div>
            )}

            <div className="mt-2 text-xs text-gray-400">
              {t('wishlist.addedAt') || '加入時間'}：
              {new Date(item.addedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const categories = [...new Set(wishlistItems.map(item => item.product.category.name))]

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
          {t('wishlist.title') || '我的心願清單'} ({filteredAndSortedItems.length})
        </Title>
        
        {wishlistItems.length > 0 && (
          <Space>
            {selectedItems.length > 0 && (
              <>
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleAddAllToCart}
                >
                  {t('wishlist.addSelectedToCart') || `加入購物車 (${selectedItems.length})`}
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleRemoveSelected}
                >
                  {t('wishlist.removeSelected') || '移除選中'}
                </Button>
              </>
            )}
          </Space>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <Empty
          description={t('wishlist.empty') || '心願清單是空的'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/products')}>
            {t('wishlist.startShopping') || '開始購物'}
          </Button>
        </Empty>
      ) : (
        <>
          {/* 篩選和排序工具列 */}
          <Card className="mb-4" bodyStyle={{ padding: '16px' }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Search
                  placeholder={t('wishlist.searchPlaceholder') || '搜尋商品名稱'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
              <Col>
                <Select
                  value={filterCategory}
                  onChange={setFilterCategory}
                  placeholder={t('wishlist.filterByCategory') || '按分類篩選'}
                  style={{ width: 150 }}
                  allowClear
                >
                  {categories.map(category => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 120 }}
                >
                  <Option value="newest">{t('wishlist.sortNewest') || '最新加入'}</Option>
                  <Option value="oldest">{t('wishlist.sortOldest') || '最早加入'}</Option>
                  <Option value="price_low">{t('wishlist.sortPriceLow') || '價格低到高'}</Option>
                  <Option value="price_high">{t('wishlist.sortPriceHigh') || '價格高到低'}</Option>
                  <Option value="name">{t('wishlist.sortName') || '商品名稱'}</Option>
                </Select>
              </Col>
              <Col>
                <Checkbox
                  checked={priceDropOnly}
                  onChange={(e) => setPriceDropOnly(e.target.checked)}
                >
                  {t('wishlist.priceDropOnly') || '只顯示降價商品'}
                </Checkbox>
              </Col>
            </Row>
          </Card>

          {/* 全選操作 */}
          {filteredAndSortedItems.length > 0 && (
            <Card className="mb-4" bodyStyle={{ padding: '12px 16px' }}>
              <div className="flex items-center justify-between">
                <Checkbox
                  checked={selectedItems.length === filteredAndSortedItems.length}
                  indeterminate={selectedItems.length > 0 && selectedItems.length < filteredAndSortedItems.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems(filteredAndSortedItems.map(item => item.id))
                    } else {
                      setSelectedItems([])
                    }
                  }}
                >
                  {t('wishlist.selectAll') || '全選'}
                  {selectedItems.length > 0 && ` (${selectedItems.length})`}
                </Checkbox>

                {selectedItems.length > 0 && (
                  <Space>
                    <Button
                      
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={handleAddAllToCart}
                    >
                      {t('wishlist.addToCart') || '加入購物車'}
                    </Button>
                    <Button
                      
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveSelected}
                    >
                      {t('wishlist.remove') || '移除'}
                    </Button>
                  </Space>
                )}
              </div>
            </Card>
          )}

          {/* 商品列表 */}
          <div className="grid gap-4">
            {filteredAndSortedItems.map(renderWishlistItem)}
          </div>

          {filteredAndSortedItems.length === 0 && (
            <Empty
              description={t('wishlist.noResults') || '沒有符合條件的商品'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </>
      )}
    </div>
  )
}

export default WishlistPage