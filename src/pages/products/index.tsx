// 商品列表頁面
import React, { useState, useEffect } from 'react'
import { Row, Col, Pagination, Select, Button, Drawer, Space, Empty } from 'antd'
import { FilterOutlined, AppstoreOutlined, BarsOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { ProductCard, ProductQuickView } from '../../components'
import { 
  useProducts, 
  useCategories, 
  useBrands, 
  usePageSettings 
} from '../../hooks'
import { ProductFilters } from './ProductFilters'
import { ProductSort } from './ProductSort'
import type { ProductSearchParams } from '../../api/types'
import './style.scss'

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterVisible, setFilterVisible] = useState(false)
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null)
  
  const { pageSettings, setProductsView, setProductsPerPage } = usePageSettings()
  
  // 從 URL 解析搜索參數
  const parseSearchParams = (): ProductSearchParams => {
    const params: ProductSearchParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: pageSettings.productsPerPage,
      sort: searchParams.get('sort') || pageSettings.sortBy
    }

    const query = searchParams.get('q')
    if (query) params.q = query

    const categoryId = searchParams.get('categoryId')
    if (categoryId) params.categoryId = categoryId

    const brandId = searchParams.get('brandId')
    if (brandId) params.brandId = brandId

    const minPrice = searchParams.get('minPrice')
    if (minPrice) params.minPrice = parseFloat(minPrice)

    const maxPrice = searchParams.get('maxPrice')
    if (maxPrice) params.maxPrice = parseFloat(maxPrice)

    const isRecommended = searchParams.get('isRecommended')
    if (isRecommended === 'true') params.isRecommended = true

    const isFeatured = searchParams.get('isFeatured')
    if (isFeatured === 'true') params.isFeatured = true

    const isNewArrival = searchParams.get('isNewArrival')
    if (isNewArrival === 'true') params.isNewArrival = true

    const tags = searchParams.get('tags')
    if (tags) params.tags = tags.split(',')

    return params
  }

  const currentParams = parseSearchParams()
  const { data: productsData, isLoading } = useProducts(currentParams)
  const { data: categories = [] } = useCategories()
  const { data: brands = [] } = useBrands()

  // 更新搜索參數
  const updateSearchParams = (newParams: Partial<ProductSearchParams>) => {
    const updatedParams = new URLSearchParams(searchParams)
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        updatedParams.delete(key)
      } else if (Array.isArray(value)) {
        updatedParams.set(key, value.join(','))
      } else {
        updatedParams.set(key, String(value))
      }
    })

    // 切換篩選條件時重置到第一頁
    if (!newParams.page) {
      updatedParams.set('page', '1')
    }

    setSearchParams(updatedParams)
  }

  // 處理分頁變化
  const handlePageChange = (page: number) => {
    updateSearchParams({ page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 處理排序變化
  const handleSortChange = (sort: string) => {
    updateSearchParams({ sort, page: 1 })
  }

  // 處理篩選變化
  const handleFilterChange = (filters: Partial<ProductSearchParams>) => {
    updateSearchParams({ ...filters, page: 1 })
  }

  // 清除所有篩選
  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  // 處理快速預覽
  const handleQuickView = (productId: string) => {
    setQuickViewProductId(productId)
  }

  const handleCloseQuickView = () => {
    setQuickViewProductId(null)
  }

  // 顯示載入狀態或空狀態
  if (isLoading) {
    return (
      <div className="products-page">
        <div className="container">
          <div className="products-loading">載入中...</div>
        </div>
      </div>
    )
  }

  const products = productsData?.items || []
  const pagination = productsData?.pagination

  return (
    <div className="products-page">
      <div className="container">
        {/* 頁面標題 */}
        <div className="products-header">
          <h1 className="page-title">
            {currentParams.q && `搜索 "${currentParams.q}"`}
            {!currentParams.q && '所有商品'}
          </h1>
          
          {pagination && (
            <div className="products-count">
              共 {pagination.total} 件商品
            </div>
          )}
        </div>

        <Row gutter={24}>
          {/* 左側篩選區域 - 桌面版 */}
          <Col xs={0} lg={6}>
            <div className="filters-sidebar">
              <ProductFilters
                categories={categories}
                brands={brands}
                currentParams={currentParams}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </Col>

          {/* 右側商品區域 */}
          <Col xs={24} lg={18}>
            {/* 工具列 */}
            <div className="products-toolbar">
              <div className="toolbar-left">
                {/* 移動端篩選按鈕 */}
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFilterVisible(true)}
                  className="filter-btn filter-btn--mobile"
                >
                  篩選
                </Button>
              </div>

              <div className="toolbar-right">
                {/* 視圖切換 */}
                <div className="view-toggle">
                  <Button.Group>
                    <Button
                      icon={<AppstoreOutlined />}
                      type={pageSettings.productsView === 'grid' ? 'primary' : 'default'}
                      onClick={() => setProductsView('grid')}
                    />
                    <Button
                      icon={<BarsOutlined />}
                      type={pageSettings.productsView === 'list' ? 'primary' : 'default'}
                      onClick={() => setProductsView('list')}
                    />
                  </Button.Group>
                </div>

                {/* 每頁數量 */}
                <Select
                  value={pageSettings.productsPerPage}
                  onChange={setProductsPerPage}
                  className="per-page-select"
                >
                  <Select.Option value={12}>12 / 頁</Select.Option>
                  <Select.Option value={24}>24 / 頁</Select.Option>
                  <Select.Option value={48}>48 / 頁</Select.Option>
                </Select>

                {/* 排序 */}
                <ProductSort
                  value={currentParams.sort || 'created_desc'}
                  onChange={handleSortChange}
                />
              </div>
            </div>

            {/* 商品列表 */}
            <div className="products-content">
              {products.length > 0 ? (
                <>
                  <Row gutter={[16, 16]} className="products-grid">
                    {products.map((product) => (
                      <Col 
                        key={product.id}
                        xs={12}
                        sm={pageSettings.productsView === 'list' ? 24 : 8}
                        lg={pageSettings.productsView === 'list' ? 24 : 6}
                      >
                        <ProductCard
                          product={product}
                          layout={pageSettings.productsView}
                          size={pageSettings.productsView === 'list' ? 'large' : 'medium'}
                          showQuickView={true}
                          onQuickView={handleQuickView}
                        />
                      </Col>
                    ))}
                  </Row>

                  {/* 分頁 */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="products-pagination">
                      <Pagination
                        current={pagination.page}
                        total={pagination.total}
                        pageSize={pagination.limit}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                        showQuickJumper
                        showTotal={(total, range) =>
                          `第 ${range[0]}-${range[1]} 項，共 ${total} 項`
                        }
                      />
                    </div>
                  )}
                </>
              ) : (
                <Empty
                  description="沒有找到符合條件的商品"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" onClick={handleClearFilters}>
                    清除篩選條件
                  </Button>
                </Empty>
              )}
            </div>
          </Col>
        </Row>

        {/* 移動端篩選抽屜 */}
        <Drawer
          title="篩選商品"
          placement="left"
          open={filterVisible}
          onClose={() => setFilterVisible(false)}
          className="filters-drawer"
          width={320}
        >
          <ProductFilters
            categories={categories}
            brands={brands}
            currentParams={currentParams}
            onFilterChange={(filters) => {
              handleFilterChange(filters)
              setFilterVisible(false)
            }}
            onClearFilters={() => {
              handleClearFilters()
              setFilterVisible(false)
            }}
          />
        </Drawer>

        {/* 商品快速預覽 */}
        <ProductQuickView
          productId={quickViewProductId}
          open={!!quickViewProductId}
          onClose={handleCloseQuickView}
        />
      </div>
    </div>
  )
}

export default ProductsPage