// 商品 API 服務
import { apiClient } from '../index'
import type { 
  Product, 
  ProductSearchParams,
  Category,
  Brand,
  ProductReview,
  PaginatedResponse 
} from '../types'

// 商品創建請求參數
export interface CreateProductRequest {
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  shortDescription?: string
  sku: string
  barcode?: string
  categoryId: string
  brandId: string
  price: number
  originalPrice?: number
  stock: number
  minStock: number
  maxStock: number
  status: 'active' | 'inactive' | 'draft'
  isRecommended?: boolean
  isFeatured?: boolean
  isNewArrival?: boolean
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  images: string[]
  tags?: string[]
  attributes?: Record<string, any>
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
}

// 分類創建請求參數
export interface CreateCategoryRequest {
  name: string
  nameEn: string
  slug: string
  description?: string
  parentId?: string
  image?: string
  icon?: string
  sortOrder: number
  seoTitle?: string
  seoDescription?: string
}

// 品牌創建請求參數
export interface CreateBrandRequest {
  name: string
  nameEn: string
  slug: string
  description?: string
  logo?: string
  website?: string
  sortOrder: number
  seoTitle?: string
  seoDescription?: string
}

// 商品評價創建請求參數
export interface CreateProductReviewRequest {
  productId: string
  rating: number
  title: string
  content: string
  images?: string[]
  isRecommended?: boolean
}

export class ProductService {
  private readonly baseUrl = '/api/v1/products'
  private readonly adminBaseUrl = '/api/admin/v1/products'

  // ===================
  // 前台商品 API
  // ===================

  /**
   * 獲取商品列表 (支援搜索和篩選)
   */
  async getProducts(params?: ProductSearchParams): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => searchParams.append(key, String(item)))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
    }

    const url = searchParams.toString() 
      ? `${this.baseUrl}?${searchParams.toString()}`
      : this.baseUrl

    return apiClient.get<PaginatedResponse<Product>>(url)
  }

  /**
   * 獲取商品詳情
   */
  async getProduct(id: string): Promise<Product> {
    return apiClient.get<Product>(`${this.baseUrl}/${id}`)
  }

  /**
   * 根據 SKU 獲取商品
   */
  async getProductBySku(sku: string): Promise<Product> {
    return apiClient.get<Product>(`${this.baseUrl}/sku/${sku}`)
  }

  /**
   * 獲取推薦商品
   */
  async getRecommendedProducts(limit = 8): Promise<Product[]> {
    return apiClient.get<Product[]>(`${this.baseUrl}/recommended`, {
      params: { limit }
    })
  }

  /**
   * 獲取精選商品
   */
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return apiClient.get<Product[]>(`${this.baseUrl}/featured`, {
      params: { limit }
    })
  }

  /**
   * 獲取新品
   */
  async getNewArrivals(limit = 8): Promise<Product[]> {
    return apiClient.get<Product[]>(`${this.baseUrl}/new-arrivals`, {
      params: { limit }
    })
  }

  /**
   * 獲取相關商品
   */
  async getRelatedProducts(id: string, limit = 4): Promise<Product[]> {
    return apiClient.get<Product[]>(`${this.baseUrl}/${id}/related`, {
      params: { limit }
    })
  }

  /**
   * 搜索商品
   */
  async searchProducts(query: string, params?: Omit<ProductSearchParams, 'q'>): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams({ q: query })
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => searchParams.append(key, String(item)))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
    }

    return apiClient.get<PaginatedResponse<Product>>(`${this.baseUrl}/search?${searchParams.toString()}`)
  }

  // ===================
  // 商品分類 API
  // ===================

  /**
   * 獲取分類列表 (樹狀結構)
   */
  async getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/api/v1/categories')
  }

  /**
   * 獲取分類詳情
   */
  async getCategory(id: string): Promise<Category> {
    return apiClient.get<Category>(`/api/v1/categories/${id}`)
  }

  /**
   * 根據 slug 獲取分類
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    return apiClient.get<Category>(`/api/v1/categories/slug/${slug}`)
  }

  /**
   * 獲取分類下的商品
   */
  async getProductsByCategory(
    categoryId: string, 
    params?: Omit<ProductSearchParams, 'categoryId'>
  ): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => searchParams.append(key, String(item)))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
    }

    const url = searchParams.toString()
      ? `/api/v1/categories/${categoryId}/products?${searchParams.toString()}`
      : `/api/v1/categories/${categoryId}/products`

    return apiClient.get<PaginatedResponse<Product>>(url)
  }

  // ===================
  // 品牌 API
  // ===================

  /**
   * 獲取品牌列表
   */
  async getBrands(): Promise<Brand[]> {
    return apiClient.get<Brand[]>('/api/v1/brands')
  }

  /**
   * 獲取品牌詳情
   */
  async getBrand(id: string): Promise<Brand> {
    return apiClient.get<Brand>(`/api/v1/brands/${id}`)
  }

  /**
   * 根據 slug 獲取品牌
   */
  async getBrandBySlug(slug: string): Promise<Brand> {
    return apiClient.get<Brand>(`/api/v1/brands/slug/${slug}`)
  }

  /**
   * 獲取品牌下的商品
   */
  async getProductsByBrand(
    brandId: string, 
    params?: Omit<ProductSearchParams, 'brandId'>
  ): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => searchParams.append(key, String(item)))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
    }

    const url = searchParams.toString()
      ? `/api/v1/brands/${brandId}/products?${searchParams.toString()}`
      : `/api/v1/brands/${brandId}/products`

    return apiClient.get<PaginatedResponse<Product>>(url)
  }

  // ===================
  // 商品評價 API
  // ===================

  /**
   * 獲取商品評價
   */
  async getProductReviews(
    productId: string,
    params?: { page?: number; limit?: number; sort?: string }
  ): Promise<PaginatedResponse<ProductReview>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const url = searchParams.toString()
      ? `/api/v1/products/${productId}/reviews?${searchParams.toString()}`
      : `/api/v1/products/${productId}/reviews`

    return apiClient.get<PaginatedResponse<ProductReview>>(url)
  }

  /**
   * 創建商品評價 (需要登錄)
   */
  async createProductReview(data: CreateProductReviewRequest): Promise<ProductReview> {
    return apiClient.post<ProductReview>(`/api/v1/products/${data.productId}/reviews`, data)
  }

  /**
   * 獲取商品評價統計
   */
  async getProductReviewStats(productId: string): Promise<{
    avgRating: number
    reviewCount: number
    ratingDistribution: Record<string, number>
  }> {
    return apiClient.get<{
      avgRating: number
      reviewCount: number
      ratingDistribution: Record<string, number>
    }>(`/api/v1/products/${productId}/reviews/stats`)
  }

  // ===================
  // 管理後台 API (需要管理員權限)
  // ===================

  /**
   * 創建商品 (管理員)
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>(this.adminBaseUrl, data)
  }

  /**
   * 更新商品 (管理員)
   */
  async updateProduct(id: string, data: Partial<CreateProductRequest>): Promise<Product> {
    return apiClient.put<Product>(`${this.adminBaseUrl}/${id}`, data)
  }

  /**
   * 刪除商品 (管理員)
   */
  async deleteProduct(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.adminBaseUrl}/${id}`)
  }

  /**
   * 批量更新商品狀態 (管理員)
   */
  async batchUpdateProductStatus(
    ids: string[],
    status: 'active' | 'inactive' | 'draft'
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.adminBaseUrl}/batch-status`, {
      ids,
      status
    })
  }

  /**
   * 創建分類 (管理員)
   */
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    return apiClient.post<Category>('/api/admin/v1/categories', data)
  }

  /**
   * 更新分類 (管理員)
   */
  async updateCategory(id: string, data: Partial<CreateCategoryRequest>): Promise<Category> {
    return apiClient.put<Category>(`/api/admin/v1/categories/${id}`, data)
  }

  /**
   * 刪除分類 (管理員)
   */
  async deleteCategory(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/admin/v1/categories/${id}`)
  }

  /**
   * 創建品牌 (管理員)
   */
  async createBrand(data: CreateBrandRequest): Promise<Brand> {
    return apiClient.post<Brand>('/api/admin/v1/brands', data)
  }

  /**
   * 更新品牌 (管理員)
   */
  async updateBrand(id: string, data: Partial<CreateBrandRequest>): Promise<Brand> {
    return apiClient.put<Brand>(`/api/admin/v1/brands/${id}`, data)
  }

  /**
   * 刪除品牌 (管理員)
   */
  async deleteBrand(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/admin/v1/brands/${id}`)
  }
}

// 導出服務實例
export const productService = new ProductService()