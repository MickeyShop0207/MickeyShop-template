// 智能商品搜尋組件
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  AutoComplete,
  Input,
  Card,
  Space,
  Tag,
  Typography,
  Avatar,
  Spin,
  Empty,
  Button
} from 'antd'
import {
  SearchOutlined,
  CloseOutlined,
  FireOutlined,
  HistoryOutlined,
  TagOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { productService } from '../../../api/services/productService'
import { formatPrice } from '../../../utils'
import type { Product } from '../../../api/types'
import { useDebounce as useDebouncedValue, useLocalStorage } from '../../../hooks'
import './style.scss'

const { Text } = Typography

interface ProductSearchProps {
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  className?: string
  onSearch?: (query: string) => void
  showSuggestions?: boolean
  showHistory?: boolean
  maxResults?: number
}

interface SearchSuggestion {
  id: string
  type: 'product' | 'category' | 'brand' | 'tag'
  value: string
  label: string
  extra?: any
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  placeholder = '搜尋商品、品牌或分類...',
  size = 'middle',
  className,
  onSearch,
  showSuggestions = true,
  showHistory = true,
  maxResults = 10
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const navigate = useNavigate()
  const inputRef = useRef<any>(null)
  
  // 防抖搜尋值
  const debouncedSearchValue = useDebouncedValue(searchValue, 300)
  
  // 搜尋歷史記錄
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('product_search_history', [])
  
  // 熱門搜尋標籤
  const popularTags = [
    '保濕', '美白', '防曬', '抗老', '控油', '敏感肌', '天然', '有機'
  ]

  // 搜尋商品建議
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['productSearch', debouncedSearchValue],
    queryFn: () => {
      if (!debouncedSearchValue.trim() || debouncedSearchValue.length < 2) {
        return Promise.resolve([])
      }
      return productService.searchProducts(debouncedSearchValue.trim(), { limit: maxResults })
    },
    enabled: showSuggestions && debouncedSearchValue.length >= 2
  })

  // 獲取分類和品牌建議
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
    staleTime: 5 * 60 * 1000 // 5分鐘緩存
  })

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => productService.getBrands(),
    staleTime: 5 * 60 * 1000 // 5分鐘緩存
  })

  // 生成建議列表
  const generateSuggestions = useCallback((): SearchSuggestion[] => {
    if (!debouncedSearchValue.trim()) {
      return []
    }

    const suggestions: SearchSuggestion[] = []
    const query = debouncedSearchValue.toLowerCase()

    // 商品建議
    if (searchResults.data) {
      searchResults.data.forEach((product: Product) => {
        suggestions.push({
          id: `product-${product.id}`,
          type: 'product',
          value: product.name,
          label: product.name,
          extra: product
        })
      })
    }

    // 分類建議
    categories
      .filter(category => 
        category.name.toLowerCase().includes(query) ||
        category.nameEn?.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .forEach(category => {
        suggestions.push({
          id: `category-${category.id}`,
          type: 'category',
          value: category.name,
          label: category.name,
          extra: category
        })
      })

    // 品牌建議
    brands
      .filter(brand => 
        brand.name.toLowerCase().includes(query) ||
        brand.nameEn?.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .forEach(brand => {
        suggestions.push({
          id: `brand-${brand.id}`,
          type: 'brand',
          value: brand.name,
          label: brand.name,
          extra: brand
        })
      })

    // 標籤建議
    popularTags
      .filter(tag => tag.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach(tag => {
        suggestions.push({
          id: `tag-${tag}`,
          type: 'tag',
          value: tag,
          label: tag
        })
      })

    return suggestions.slice(0, maxResults)
  }, [debouncedSearchValue, searchResults, categories, brands, maxResults])

  const suggestions = generateSuggestions()

  // 處理搜尋
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return

    // 添加到搜尋歷史
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10)
    setSearchHistory(newHistory)

    // 執行搜尋
    if (onSearch) {
      onSearch(query)
    } else {
      navigate(`/products?q=${encodeURIComponent(query)}`)
    }

    setIsOpen(false)
    inputRef.current?.blur()
  }, [searchHistory, setSearchHistory, onSearch, navigate])

  // 處理選擇建議
  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'product':
        navigate(`/products/${suggestion.extra.id}`)
        break
      case 'category':
        navigate(`/products?categoryId=${suggestion.extra.id}`)
        break
      case 'brand':
        navigate(`/products?brandId=${suggestion.extra.id}`)
        break
      case 'tag':
        navigate(`/products?tags=${encodeURIComponent(suggestion.value)}`)
        break
      default:
        handleSearch(suggestion.value)
    }
    setSearchValue('')
    setIsOpen(false)
  }

  // 處理鍵盤事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex])
        } else {
          handleSearch(searchValue)
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  // 清除搜尋歷史
  const clearHistory = () => {
    setSearchHistory([])
  }

  // 渲染建議項目
  const renderSuggestionItem = (suggestion: SearchSuggestion, index: number) => {
    const isSelected = index === selectedIndex
    
    const getIcon = () => {
      switch (suggestion.type) {
        case 'product':
          return <Avatar src={suggestion.extra?.images?.[0]} size={32} />
        case 'category':
          return <TagOutlined style={{ color: '#1890ff' }} />
        case 'brand':
          return <Avatar src={suggestion.extra?.logo} size={24}>
            {suggestion.label.charAt(0)}
          </Avatar>
        case 'tag':
          return <TagOutlined style={{ color: '#52c41a' }} />
      }
    }

    const getExtra = () => {
      if (suggestion.type === 'product' && suggestion.extra) {
        return (
          <Text type="secondary" className="suggestion-price">
            {formatPrice(suggestion.extra.price)}
          </Text>
        )
      }
      return (
        <Tag color={
          suggestion.type === 'category' ? 'blue' :
          suggestion.type === 'brand' ? 'purple' :
          suggestion.type === 'tag' ? 'green' : 'default'
        }>
          {suggestion.type === 'category' ? '分類' :
           suggestion.type === 'brand' ? '品牌' :
           suggestion.type === 'tag' ? '標籤' : '商品'}
        </Tag>
      )
    }

    return (
      <div
        key={suggestion.id}
        className={`suggestion-item ${isSelected ? 'selected' : ''}`}
        onClick={() => handleSelectSuggestion(suggestion)}
      >
        <div className="suggestion-content">
          <div className="suggestion-icon">
            {getIcon()}
          </div>
          <div className="suggestion-text">
            <Text className="suggestion-label">{suggestion.label}</Text>
          </div>
          <div className="suggestion-extra">
            {getExtra()}
          </div>
        </div>
      </div>
    )
  }

  // 渲染下拉內容
  const renderDropdownContent = () => {
    if (isSearching) {
      return (
        <div className="search-loading">
          <Spin  />
          <Text type="secondary">搜尋中...</Text>
        </div>
      )
    }

    const hasQuery = debouncedSearchValue.trim().length > 0
    const hasSuggestions = suggestions.length > 0

    return (
      <div className="search-dropdown">
        {hasQuery && hasSuggestions && (
          <div className="suggestions-section">
            <div className="section-header">
              <Text strong>搜尋建議</Text>
            </div>
            {suggestions.map((suggestion, index) => 
              renderSuggestionItem(suggestion, index)
            )}
          </div>
        )}

        {hasQuery && !hasSuggestions && !isSearching && (
          <div className="no-results">
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="沒有找到相關結果"
            />
          </div>
        )}

        {!hasQuery && showHistory && searchHistory.length > 0 && (
          <div className="history-section">
            <div className="section-header">
              <Text strong>
                <HistoryOutlined /> 搜尋歷史
              </Text>
              <Button 
                type="text" 
                
                onClick={clearHistory}
                className="clear-history"
              >
                清除
              </Button>
            </div>
            {searchHistory.map((item, index) => (
              <div
                key={index}
                className="history-item"
                onClick={() => handleSearch(item)}
              >
                <HistoryOutlined className="history-icon" />
                <Text>{item}</Text>
              </div>
            ))}
          </div>
        )}

        {!hasQuery && (
          <div className="popular-tags-section">
            <div className="section-header">
              <Text strong>
                <FireOutlined /> 熱門搜尋
              </Text>
            </div>
            <div className="popular-tags">
              <Space wrap>
                {popularTags.map(tag => (
                  <Tag
                    key={tag}
                    className="popular-tag"
                    onClick={() => handleSearch(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`product-search ${className || ''}`}>
      <AutoComplete
        value={searchValue}
        onChange={setSearchValue}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // 延遲關閉以允許點擊建議項目
          setTimeout(() => setIsOpen(false), 200)
        }}
        onKeyDown={handleKeyDown}
        open={isOpen}
        dropdownRender={() => renderDropdownContent()}
        dropdownClassName="product-search-dropdown"
      >
        <Input.Search
          ref={inputRef}
          placeholder={placeholder}
          size={size}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
          allowClear
          suffix={
            searchValue && (
              <Button
                type="text"
                
                icon={<CloseOutlined />}
                onClick={() => setSearchValue('')}
                className="clear-button"
              />
            )
          }
        />
      </AutoComplete>
    </div>
  )
}

export default ProductSearch