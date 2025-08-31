/**
 * 商品控制器
 * 處理商品相關的 HTTP 請求
 */

import { Context } from 'hono'
import { BaseController } from '@/shared/services/baseController'
import { createServiceContext } from '@/shared/services/baseService'
import { ProductService } from './productService'
import { CategoryService } from './categoryService'
import { BrandService } from './brandService'
import {
  CreateProductRequest,
  UpdateProductRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateBrandRequest,
  UpdateBrandRequest,
  StockAdjustmentRequest,
  ProductSearchParams,
  CategorySearchParams,
  BrandSearchParams
} from './types'

export class ProductController extends BaseController {

  // ============ 商品管理 ============

  /**
   * 獲取商品列表
   * GET /api/v1/products
   */
  async getProducts(c: Context) {
    try {
      const pagination = this.getPaginationParams(c)
      const searchParams: ProductSearchParams = {
        keyword: c.req.query('keyword'),
        sku: c.req.query('sku'),
        categoryId: c.req.query('categoryId'),
        brandId: c.req.query('brandId'),
        status: c.req.query('status'),
        visibility: c.req.query('visibility'),
        type: c.req.query('type'),
        featured: c.req.query('featured') === 'true' ? true : 
                 c.req.query('featured') === 'false' ? false : undefined,
        stockStatus: c.req.query('stockStatus'),
        priceMin: c.req.query('priceMin') ? parseFloat(c.req.query('priceMin')!) : undefined,
        priceMax: c.req.query('priceMax') ? parseFloat(c.req.query('priceMax')!) : undefined,
        tags: c.req.query('tags')?.split(',').filter(Boolean),
        dateFrom: c.req.query('dateFrom'),
        dateTo: c.req.query('dateTo'),
        inStock: c.req.query('inStock') === 'true' ? true : 
                c.req.query('inStock') === 'false' ? false : undefined,
        onSale: c.req.query('onSale') === 'true' ? true : 
               c.req.query('onSale') === 'false' ? false : undefined
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        requestId: this.getRequestId(c)
      })

      const productService = new ProductService(serviceContext)
      const response = await productService.getProducts({
        ...pagination,
        ...searchParams
      })

      return this.handleServicePaginationResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 獲取商品詳情
   * GET /api/v1/products/:productId
   */
  async getProductDetail(c: Context) {
    try {
      const productId = c.req.param('productId')
      if (!productId) {
        return this.error(c, '商品 ID 不能為空', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        requestId: this.getRequestId(c)
      })

      const productService = new ProductService(serviceContext)
      const response = await productService.getProductDetail(productId)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 創建商品
   * POST /api/v1/products
   */
  async createProduct(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const body = await c.req.json<CreateProductRequest>()
      
      // 驗證必填欄位
      const validation = this.validateRequired(c, body, [
        'sku', 'name', 'price'
      ])
      if (validation) return validation

      // 驗證價格
      if (body.price < 0) {
        return this.error(c, '價格不能小於 0', [], 422)
      }

      if (body.salePrice !== undefined && body.salePrice < 0) {
        return this.error(c, '促銷價格不能小於 0', [], 422)
      }

      // 驗證庫存
      if (body.stockQuantity !== undefined && body.stockQuantity < 0) {
        return this.error(c, '庫存數量不能小於 0', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        requestId: this.getRequestId(c)
      })

      const productService = new ProductService(serviceContext)
      const response = await productService.createProduct(body)

      return this.handleServiceResponse(c, response, 201)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 更新商品
   * PUT /api/v1/products/:productId
   */
  async updateProduct(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user) {
        return this.error(c, '未授權訪問', [], 401)
      }

      const productId = c.req.param('productId')
      if (!productId) {
        return this.error(c, '商品 ID 不能為空', [], 422)
      }

      const body = await c.req.json<UpdateProductRequest>()

      // 驗證價格（如果提供）
      if (body.price !== undefined && body.price < 0) {
        return this.error(c, '價格不能小於 0', [], 422)
      }

      if (body.salePrice !== undefined && body.salePrice < 0) {
        return this.error(c, '促銷價格不能小於 0', [], 422)
      }

      // 驗證庫存（如果提供）
      if (body.stockQuantity !== undefined && body.stockQuantity < 0) {
        return this.error(c, '庫存數量不能小於 0', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        requestId: this.getRequestId(c)
      })

      const productService = new ProductService(serviceContext)
      const response = await productService.updateProduct(productId, body)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  // ============ 分類管理 ============

  /**
   * 獲取分類列表
   * GET /api/v1/products/categories
   */
  async getCategories(c: Context) {
    try {
      const pagination = this.getPaginationParams(c)
      const searchParams: CategorySearchParams = {
        keyword: c.req.query('keyword'),
        parentId: c.req.query('parentId'),
        isActive: c.req.query('isActive') === 'true' ? true : 
                 c.req.query('isActive') === 'false' ? false : undefined,
        level: c.req.query('level') ? parseInt(c.req.query('level')!) : undefined
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        requestId: this.getRequestId(c)
      })

      const categoryService = new CategoryService(serviceContext)
      const response = await categoryService.getCategories({
        ...pagination,
        ...searchParams
      })

      return this.handleServicePaginationResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 獲取分類樹
   * GET /api/v1/products/categories/tree
   */
  async getCategoryTree(c: Context) {
    try {
      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        requestId: this.getRequestId(c)
      })

      const categoryService = new CategoryService(serviceContext)
      const response = await categoryService.getCategoryTree()

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 獲取分類詳情
   * GET /api/v1/products/categories/:categoryId
   */
  async getCategoryDetail(c: Context) {
    try {
      const categoryId = c.req.param('categoryId')
      if (!categoryId) {
        return this.error(c, '分類 ID 不能為空', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        requestId: this.getRequestId(c)
      })

      const categoryService = new CategoryService(serviceContext)
      const response = await categoryService.getCategoryDetail(categoryId)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 創建分類
   * POST /api/v1/products/categories
   */
  async createCategory(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user || user.type !== 'admin') {
        return this.error(c, '權限不足', [], 403)
      }

      const body = await c.req.json<CreateCategoryRequest>()
      
      // 驗證必填欄位
      const validation = this.validateRequired(c, body, ['name'])
      if (validation) return validation

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        requestId: this.getRequestId(c)
      })

      const categoryService = new CategoryService(serviceContext)
      const response = await categoryService.createCategory(body)

      return this.handleServiceResponse(c, response, 201)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 更新分類
   * PUT /api/v1/products/categories/:categoryId
   */
  async updateCategory(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user || user.type !== 'admin') {
        return this.error(c, '權限不足', [], 403)
      }

      const categoryId = c.req.param('categoryId')
      if (!categoryId) {
        return this.error(c, '分類 ID 不能為空', [], 422)
      }

      const body = await c.req.json<UpdateCategoryRequest>()

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        requestId: this.getRequestId(c)
      })

      const categoryService = new CategoryService(serviceContext)
      const response = await categoryService.updateCategory(categoryId, body)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 刪除分類
   * DELETE /api/v1/products/categories/:categoryId
   */
  async deleteCategory(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user || user.type !== 'admin') {
        return this.error(c, '權限不足', [], 403)
      }

      const categoryId = c.req.param('categoryId')
      if (!categoryId) {
        return this.error(c, '分類 ID 不能為空', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        requestId: this.getRequestId(c)
      })

      const categoryService = new CategoryService(serviceContext)
      const response = await categoryService.deleteCategory(categoryId)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  // ============ 品牌管理 ============

  /**
   * 獲取品牌列表
   * GET /api/v1/products/brands
   */
  async getBrands(c: Context) {
    try {
      const pagination = this.getPaginationParams(c)
      const searchParams: BrandSearchParams = {
        keyword: c.req.query('keyword'),
        country: c.req.query('country'),
        isActive: c.req.query('isActive') === 'true' ? true : 
                 c.req.query('isActive') === 'false' ? false : undefined,
        featured: c.req.query('featured') === 'true' ? true : 
                 c.req.query('featured') === 'false' ? false : undefined
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        requestId: this.getRequestId(c)
      })

      const brandService = new BrandService(serviceContext)
      const response = await brandService.getBrands({
        ...pagination,
        ...searchParams
      })

      return this.handleServicePaginationResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 獲取精選品牌
   * GET /api/v1/products/brands/featured
   */
  async getFeaturedBrands(c: Context) {
    try {
      const limit = parseInt(c.req.query('limit') || '10')

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        requestId: this.getRequestId(c)
      })

      const brandService = new BrandService(serviceContext)
      const response = await brandService.getFeaturedBrands(limit)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 獲取品牌詳情
   * GET /api/v1/products/brands/:brandId
   */
  async getBrandDetail(c: Context) {
    try {
      const brandId = c.req.param('brandId')
      if (!brandId) {
        return this.error(c, '品牌 ID 不能為空', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        requestId: this.getRequestId(c)
      })

      const brandService = new BrandService(serviceContext)
      const response = await brandService.getBrandDetail(brandId)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 創建品牌
   * POST /api/v1/products/brands
   */
  async createBrand(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user || user.type !== 'admin') {
        return this.error(c, '權限不足', [], 403)
      }

      const body = await c.req.json<CreateBrandRequest>()
      
      // 驗證必填欄位
      const validation = this.validateRequired(c, body, ['name'])
      if (validation) return validation

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        requestId: this.getRequestId(c)
      })

      const brandService = new BrandService(serviceContext)
      const response = await brandService.createBrand(body)

      return this.handleServiceResponse(c, response, 201)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 更新品牌
   * PUT /api/v1/products/brands/:brandId
   */
  async updateBrand(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user || user.type !== 'admin') {
        return this.error(c, '權限不足', [], 403)
      }

      const brandId = c.req.param('brandId')
      if (!brandId) {
        return this.error(c, '品牌 ID 不能為空', [], 422)
      }

      const body = await c.req.json<UpdateBrandRequest>()

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        requestId: this.getRequestId(c)
      })

      const brandService = new BrandService(serviceContext)
      const response = await brandService.updateBrand(brandId, body)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 刪除品牌
   * DELETE /api/v1/products/brands/:brandId
   */
  async deleteBrand(c: Context) {
    try {
      const user = this.getCurrentUser(c)
      if (!user || user.type !== 'admin') {
        return this.error(c, '權限不足', [], 403)
      }

      const brandId = c.req.param('brandId')
      if (!brandId) {
        return this.error(c, '品牌 ID 不能為空', [], 422)
      }

      const db = this.getDatabase(c)
      const serviceContext = createServiceContext(db, {
        userId: user.id,
        userType: user.type as 'admin' | 'customer',
        requestId: this.getRequestId(c)
      })

      const brandService = new BrandService(serviceContext)
      const response = await brandService.deleteBrand(brandId)

      return this.handleServiceResponse(c, response)
    } catch (error) {
      return this.handleError(c, error)
    }
  }
}