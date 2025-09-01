// 商品篩選組件
import React from 'react'
import { Card, Checkbox, Slider, InputNumber, Rate, Button, Divider, Space, Typography } from 'antd'
import { FilterOutlined, ClearOutlined } from '@ant-design/icons'
import type { Category, Brand, ProductSearchParams } from '../../api/types'
import { formatPrice } from '../../utils'
import './ProductFilters.scss'

const { Title, Text } = Typography
const { Group: CheckboxGroup } = Checkbox

interface ProductFiltersProps {
  categories: Category[]
  brands: Brand[]
  currentParams: ProductSearchParams
  onFilterChange: (filters: Partial<ProductSearchParams>) => void
  onClearFilters: () => void
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  brands,
  currentParams,
  onFilterChange,
  onClearFilters
}) => {
  // 價格範圍
  const [priceRange, setPriceRange] = React.useState<[number, number]>([
    currentParams.minPrice || 0,
    currentParams.maxPrice || 5000
  ])

  // 更新價格範圍
  const handlePriceChange = (value: number | [number, number] | null) => {
    if (value === null) return
    const range = Array.isArray(value) ? value : [0, value]
    setPriceRange(range as [number, number])
  }

  const handlePriceChangeComplete = () => {
    onFilterChange({
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined
    })
  }

  // 分類篩選
  const handleCategoryChange = (categoryId: string) => {
    onFilterChange({
      categoryId: categoryId === currentParams.categoryId ? undefined : categoryId
    })
  }

  // 品牌篩選
  const handleBrandChange = (brandId: string) => {
    onFilterChange({
      brandId: brandId === currentParams.brandId ? undefined : brandId
    })
  }

  // 特殊標籤篩選
  const handleSpecialFilterChange = (filterType: string, checked: boolean) => {
    onFilterChange({
      [filterType]: checked ? true : undefined
    })
  }

  // 評分篩選
  const handleRatingChange = (rating: number) => {
    onFilterChange({
      minRating: rating === currentParams.minRating ? undefined : rating
    })
  }

  return (
    <div className="product-filters">
      <div className="filters-header">
        <Title level={4} style={{ margin: 0 }}>
          <FilterOutlined style={{ marginRight: 8 }} />
          篩選條件
        </Title>
        <Button 
          type="text" 
          
          icon={<ClearOutlined />}
          onClick={onClearFilters}
          className="clear-button"
        >
          清除
        </Button>
      </div>

      <div className="filters-content">
        {/* 商品分類 */}
        {categories.length > 0 && (
          <Card  className="filter-card">
            <Title level={5}>商品分類</Title>
            <div className="category-filters">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  type={currentParams.categoryId === category.id ? 'primary' : 'default'}
                  
                  onClick={() => handleCategoryChange(category.id)}
                  className="category-button"
                >
                  {category.name}
                  {category.productCount && (
                    <span className="count">({category.productCount})</span>
                  )}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* 品牌篩選 */}
        {brands.length > 0 && (
          <Card  className="filter-card">
            <Title level={5}>品牌</Title>
            <div className="brand-filters">
              {brands.slice(0, 8).map((brand) => (
                <div key={brand.id} className="brand-item">
                  <Checkbox
                    checked={currentParams.brandId === brand.id}
                    onChange={(e) => handleBrandChange(brand.id)}
                    className="brand-checkbox"
                  >
                    {brand.name}
                    {brand.productCount && (
                      <span className="count">({brand.productCount})</span>
                    )}
                  </Checkbox>
                </div>
              ))}
              
              {brands.length > 8 && (
                <Button type="link"  className="show-more">
                  顯示更多品牌
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* 價格範圍 */}
        <Card  className="filter-card">
          <Title level={5}>價格範圍</Title>
          <div className="price-filter">
            <Slider
              range
              min={0}
              max={5000}
              step={50}
              value={priceRange}
              onChange={handlePriceChange}
              onChangeComplete={handlePriceChangeComplete}
              tooltip={{
                formatter: (value) => formatPrice(value || 0)
              }}
            />
            
            <div className="price-inputs">
              <Space>
                <InputNumber
                  min={0}
                  max={5000}
                  value={priceRange[0]}
                  onChange={(value) => {
                    const newValue = value || 0
                    const newRange: [number, number] = [newValue, priceRange[1]]
                    setPriceRange(newRange)
                  }}
                  onBlur={handlePriceChangeComplete}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  
                  style={{ width: 80 }}
                />
                <Text type="secondary">-</Text>
                <InputNumber
                  min={0}
                  max={5000}
                  value={priceRange[1]}
                  onChange={(value) => {
                    const newValue = value || 5000
                    const newRange: [number, number] = [priceRange[0], newValue]
                    setPriceRange(newRange)
                  }}
                  onBlur={handlePriceChangeComplete}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  
                  style={{ width: 80 }}
                />
              </Space>
            </div>
          </div>
        </Card>

        {/* 評分篩選 */}
        <Card  className="filter-card">
          <Title level={5}>評分</Title>
          <div className="rating-filters">
            {[5, 4, 3, 2, 1].map((rating) => (
              <Button
                key={rating}
                type={currentParams.minRating === rating ? 'primary' : 'default'}
                
                onClick={() => handleRatingChange(rating)}
                className="rating-button"
              >
                <Rate disabled defaultValue={rating} count={rating} />
                <span style={{ marginLeft: 8 }}>以上</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* 特殊篩選 */}
        <Card  className="filter-card">
          <Title level={5}>特殊篩選</Title>
          <div className="special-filters">
            <Checkbox
              checked={currentParams.isRecommended || false}
              onChange={(e) => handleSpecialFilterChange('isRecommended', e.target.checked)}
            >
              推薦商品
            </Checkbox>
            
            <Checkbox
              checked={currentParams.isFeatured || false}
              onChange={(e) => handleSpecialFilterChange('isFeatured', e.target.checked)}
            >
              精選商品
            </Checkbox>
            
            <Checkbox
              checked={currentParams.isNewArrival || false}
              onChange={(e) => handleSpecialFilterChange('isNewArrival', e.target.checked)}
            >
              新品上市
            </Checkbox>
            
            <Checkbox
              checked={currentParams.hasDiscount || false}
              onChange={(e) => handleSpecialFilterChange('hasDiscount', e.target.checked)}
            >
              特價商品
            </Checkbox>
            
            <Checkbox
              checked={currentParams.inStock || false}
              onChange={(e) => handleSpecialFilterChange('inStock', e.target.checked)}
            >
              有現貨
            </Checkbox>
          </div>
        </Card>

        {/* 標籤篩選 */}
        <Card  className="filter-card">
          <Title level={5}>熱門標籤</Title>
          <div className="tag-filters">
            {[
              '保濕', '美白', '抗老', '控油', '敏感肌', '天然', '有機', '防曬'
            ].map((tag) => (
              <Button
                key={tag}
                type={currentParams.tags?.includes(tag) ? 'primary' : 'default'}
                
                onClick={() => {
                  const currentTags = currentParams.tags || []
                  const newTags = currentTags.includes(tag)
                    ? currentTags.filter(t => t !== tag)
                    : [...currentTags, tag]
                  
                  onFilterChange({
                    tags: newTags.length > 0 ? newTags : undefined
                  })
                }}
                className="tag-button"
              >
                {tag}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}