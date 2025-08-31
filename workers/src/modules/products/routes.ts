/**
 * 商品模組路由定義
 * 定義商品相關的 API 路由
 */

import { Hono } from 'hono'
import { ProductController } from './productController'
import { authMiddleware } from '@/middlewares/auth'
import { rateLimitMiddleware } from '@/middlewares/rateLimit'

const productRoutes = new Hono()
const productController = new ProductController()

// 應用中間件
productRoutes.use('*', rateLimitMiddleware) // 應用速率限制

// ============ 商品管理路由 ============

/**
 * 獲取商品列表
 * GET /api/v1/products
 * Query params: keyword, sku, categoryId, brandId, status, visibility, type, featured, 
 *               stockStatus, priceMin, priceMax, tags, dateFrom, dateTo, inStock, onSale,
 *               page, limit, sort, order
 */
productRoutes.get('/', (c) => productController.getProducts(c))

/**
 * 獲取商品詳情
 * GET /api/v1/products/:productId
 */
productRoutes.get('/:productId', (c) => productController.getProductDetail(c))

/**
 * 創建商品 (需要管理員權限)
 * POST /api/v1/products
 */
productRoutes.post('/', authMiddleware, (c) => productController.createProduct(c))

/**
 * 更新商品 (需要管理員權限)
 * PUT /api/v1/products/:productId
 */
productRoutes.put('/:productId', authMiddleware, (c) => productController.updateProduct(c))

// ============ 分類管理路由 ============

/**
 * 獲取分類列表
 * GET /api/v1/products/categories
 * Query params: keyword, parentId, isActive, level, page, limit, sort, order
 */
productRoutes.get('/categories', (c) => productController.getCategories(c))

/**
 * 獲取分類樹狀結構
 * GET /api/v1/products/categories/tree
 */
productRoutes.get('/categories/tree', (c) => productController.getCategoryTree(c))

/**
 * 獲取分類詳情
 * GET /api/v1/products/categories/:categoryId
 */
productRoutes.get('/categories/:categoryId', (c) => productController.getCategoryDetail(c))

/**
 * 創建分類 (需要管理員權限)
 * POST /api/v1/products/categories
 */
productRoutes.post('/categories', authMiddleware, (c) => productController.createCategory(c))

/**
 * 更新分類 (需要管理員權限)
 * PUT /api/v1/products/categories/:categoryId
 */
productRoutes.put('/categories/:categoryId', authMiddleware, (c) => productController.updateCategory(c))

/**
 * 刪除分類 (需要管理員權限)
 * DELETE /api/v1/products/categories/:categoryId
 */
productRoutes.delete('/categories/:categoryId', authMiddleware, (c) => productController.deleteCategory(c))

// ============ 品牌管理路由 ============

/**
 * 獲取品牌列表
 * GET /api/v1/products/brands
 * Query params: keyword, country, isActive, featured, page, limit, sort, order
 */
productRoutes.get('/brands', (c) => productController.getBrands(c))

/**
 * 獲取精選品牌
 * GET /api/v1/products/brands/featured
 * Query params: limit
 */
productRoutes.get('/brands/featured', (c) => productController.getFeaturedBrands(c))

/**
 * 獲取品牌詳情
 * GET /api/v1/products/brands/:brandId
 */
productRoutes.get('/brands/:brandId', (c) => productController.getBrandDetail(c))

/**
 * 創建品牌 (需要管理員權限)
 * POST /api/v1/products/brands
 */
productRoutes.post('/brands', authMiddleware, (c) => productController.createBrand(c))

/**
 * 更新品牌 (需要管理員權限)
 * PUT /api/v1/products/brands/:brandId
 */
productRoutes.put('/brands/:brandId', authMiddleware, (c) => productController.updateBrand(c))

/**
 * 刪除品牌 (需要管理員權限)
 * DELETE /api/v1/products/brands/:brandId
 */
productRoutes.delete('/brands/:brandId', authMiddleware, (c) => productController.deleteBrand(c))

export { productRoutes }