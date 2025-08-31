/**
 * 商品模組類型定義
 */

import { Product, ProductCategory, ProductBrand, ProductVariation } from '@/core/database/schema'

// ============ 基本類型 ============
export interface ProductInfo {
  productId: string
  sku: string
  name: string
  slug: string
  shortDescription?: string
  description?: string
  brandId?: string
  brandName?: string
  categoryId?: string
  categoryName?: string
  type: 'simple' | 'variable' | 'grouped' | 'external'
  status: 'draft' | 'published' | 'archived' | 'deleted'
  visibility: 'visible' | 'hidden' | 'catalog' | 'search'
  featured: boolean
  virtual: boolean
  downloadable: boolean
  price: number
  salePrice?: number
  saleStart?: string
  saleEnd?: string
  costPrice: number
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  shippingClass?: string
  taxStatus: 'taxable' | 'none'
  taxClass?: string
  stockQuantity: number
  stockStatus: 'instock' | 'outofstock' | 'onbackorder'
  backorders: 'no' | 'notify' | 'yes'
  lowStockThreshold: number
  manageStock: boolean
  soldIndividually: boolean
  purchaseNote?: string
  menuOrder: number
  reviewsAllowed: boolean
  averageRating: number
  ratingCount: number
  totalSales: number
  imageGallery: string[]
  attributes?: Record<string, any>
  tags: string[]
  relatedProductIds: string[]
  crossSellIds: string[]
  upsellIds: string[]
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CategoryInfo {
  categoryId: string
  parentId?: string
  parentName?: string
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  sortOrder: number
  isActive: boolean
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  productCount?: number
  childrenCount?: number
  createdAt: string
  updatedAt: string
}

export interface BrandInfo {
  brandId: string
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  country?: string
  isActive: boolean
  featured: boolean
  sortOrder: number
  seoTitle?: string
  seoDescription?: string
  productCount?: number
  createdAt: string
  updatedAt: string
}

export interface VariationInfo {
  variationId: string
  parentId: string
  sku: string
  price: number
  salePrice?: number
  saleStart?: string
  saleEnd?: string
  stockQuantity: number
  stockStatus: 'instock' | 'outofstock' | 'onbackorder'
  backorders: 'no' | 'notify' | 'yes'
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  image?: string
  attributes: Record<string, any>
  status: 'published' | 'private' | 'deleted'
  menuOrder: number
  createdAt: string
  updatedAt: string
}

// ============ API 請求/響應類型 ============
export interface CreateProductRequest {
  sku: string
  name: string
  shortDescription?: string
  description?: string
  brandId?: string
  categoryId?: string
  type?: 'simple' | 'variable' | 'grouped' | 'external'
  status?: 'draft' | 'published' | 'archived'
  visibility?: 'visible' | 'hidden' | 'catalog' | 'search'
  featured?: boolean
  virtual?: boolean
  downloadable?: boolean
  price: number
  salePrice?: number
  saleStart?: string
  saleEnd?: string
  costPrice?: number
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  shippingClass?: string
  taxStatus?: 'taxable' | 'none'
  taxClass?: string
  stockQuantity?: number
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder'
  backorders?: 'no' | 'notify' | 'yes'
  lowStockThreshold?: number
  manageStock?: boolean
  soldIndividually?: boolean
  purchaseNote?: string
  menuOrder?: number
  reviewsAllowed?: boolean
  imageGallery?: string[]
  attributes?: Record<string, any>
  tags?: string[]
  relatedProductIds?: string[]
  crossSellIds?: string[]
  upsellIds?: string[]
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  metadata?: Record<string, any>
}

export interface UpdateProductRequest {
  name?: string
  shortDescription?: string
  description?: string
  brandId?: string
  categoryId?: string
  status?: 'draft' | 'published' | 'archived'
  visibility?: 'visible' | 'hidden' | 'catalog' | 'search'
  featured?: boolean
  virtual?: boolean
  downloadable?: boolean
  price?: number
  salePrice?: number
  saleStart?: string
  saleEnd?: string
  costPrice?: number
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  shippingClass?: string
  taxStatus?: 'taxable' | 'none'
  taxClass?: string
  stockQuantity?: number
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder'
  backorders?: 'no' | 'notify' | 'yes'
  lowStockThreshold?: number
  manageStock?: boolean
  soldIndividually?: boolean
  purchaseNote?: string
  menuOrder?: number
  reviewsAllowed?: boolean
  imageGallery?: string[]
  attributes?: Record<string, any>
  tags?: string[]
  relatedProductIds?: string[]
  crossSellIds?: string[]
  upsellIds?: string[]
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  metadata?: Record<string, any>
}

export interface CreateCategoryRequest {
  parentId?: string
  name: string
  description?: string
  image?: string
  icon?: string
  sortOrder?: number
  isActive?: boolean
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  metadata?: Record<string, any>
}

export interface UpdateCategoryRequest {
  parentId?: string
  name?: string
  description?: string
  image?: string
  icon?: string
  sortOrder?: number
  isActive?: boolean
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  metadata?: Record<string, any>
}

export interface CreateBrandRequest {
  name: string
  description?: string
  logo?: string
  website?: string
  country?: string
  isActive?: boolean
  featured?: boolean
  sortOrder?: number
  seoTitle?: string
  seoDescription?: string
  metadata?: Record<string, any>
}

export interface UpdateBrandRequest {
  name?: string
  description?: string
  logo?: string
  website?: string
  country?: string
  isActive?: boolean
  featured?: boolean
  sortOrder?: number
  seoTitle?: string
  seoDescription?: string
  metadata?: Record<string, any>
}

export interface CreateVariationRequest {
  sku: string
  price: number
  salePrice?: number
  saleStart?: string
  saleEnd?: string
  stockQuantity?: number
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder'
  backorders?: 'no' | 'notify' | 'yes'
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  image?: string
  attributes: Record<string, any>
  status?: 'published' | 'private'
  menuOrder?: number
}

export interface UpdateVariationRequest {
  price?: number
  salePrice?: number
  saleStart?: string
  saleEnd?: string
  stockQuantity?: number
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder'
  backorders?: 'no' | 'notify' | 'yes'
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  image?: string
  attributes?: Record<string, any>
  status?: 'published' | 'private'
  menuOrder?: number
}

export interface StockAdjustmentRequest {
  quantity: number
  reason?: string
  notes?: string
}

// ============ 搜尋和篩選類型 ============
export interface ProductSearchParams {
  keyword?: string
  sku?: string
  categoryId?: string
  brandId?: string
  status?: string
  visibility?: string
  type?: string
  featured?: boolean
  stockStatus?: string
  priceMin?: number
  priceMax?: number
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  inStock?: boolean
  onSale?: boolean
}

export interface CategorySearchParams {
  keyword?: string
  parentId?: string
  isActive?: boolean
  level?: number
}

export interface BrandSearchParams {
  keyword?: string
  country?: string
  isActive?: boolean
  featured?: boolean
}

export interface VariationSearchParams {
  parentId?: string
  status?: string
  stockStatus?: string
  priceMin?: number
  priceMax?: number
}

// ============ 響應類型 ============
export interface ProductDetailResponse {
  product: ProductInfo
  variations?: VariationInfo[]
  category?: CategoryInfo
  brand?: BrandInfo
  relatedProducts?: ProductInfo[]
}

export interface ProductStatsResponse {
  totalProducts: number
  publishedProducts: number
  outOfStockProducts: number
  lowStockProducts: number
  featuredProducts: number
  averagePrice: number
  totalValue: number
  topSellingProducts: Array<{
    productId: string
    name: string
    totalSales: number
    revenue: number
  }>
}

export interface CategoryTreeResponse {
  categoryId: string
  name: string
  slug: string
  productCount: number
  children: CategoryTreeResponse[]
}

// ============ 庫存管理類型 ============
export interface StockMovement {
  movementId: string
  productId: string
  variationId?: string
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'sale' | 'return'
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason?: string
  referenceType?: string
  referenceId?: string
  notes?: string
  createdBy?: string
  createdAt: string
}

// ============ 錯誤類型 ============
export interface ProductError {
  code: string
  message: string
  field?: string
}

export const ProductErrorCodes = {
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  SKU_ALREADY_EXISTS: 'SKU_ALREADY_EXISTS',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  BRAND_NOT_FOUND: 'BRAND_NOT_FOUND',
  VARIATION_NOT_FOUND: 'VARIATION_NOT_FOUND',
  INVALID_PRICE: 'INVALID_PRICE',
  INVALID_STOCK_QUANTITY: 'INVALID_STOCK_QUANTITY',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SLUG_ALREADY_EXISTS: 'SLUG_ALREADY_EXISTS',
  CIRCULAR_CATEGORY_REFERENCE: 'CIRCULAR_CATEGORY_REFERENCE',
  CATEGORY_HAS_PRODUCTS: 'CATEGORY_HAS_PRODUCTS',
  BRAND_HAS_PRODUCTS: 'BRAND_HAS_PRODUCTS'
} as const

export type ProductErrorCode = typeof ProductErrorCodes[keyof typeof ProductErrorCodes]