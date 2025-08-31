/**
 * 商品服務層
 * 處理商品相關的業務邏輯
 */

import { eq, and, like, gte, lte, desc, asc, count, inArray, sql, isNull } from 'drizzle-orm'
import { BaseService, ServiceContext, ServiceResponse, PaginatedResponse, PaginationParams } from '@/shared/services/baseService'
import { 
  products, 
  productCategories,
  productBrands,
  productVariations,
  productInventoryHistory,
  NewProduct,
  NewProductCategory,
  NewProductBrand,
  NewProductVariation,
  NewProductInventoryHistory
} from '@/core/database/schema'
import {
  ProductInfo,
  CategoryInfo,
  BrandInfo,
  VariationInfo,
  CreateProductRequest,
  UpdateProductRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateBrandRequest,
  UpdateBrandRequest,
  CreateVariationRequest,
  UpdateVariationRequest,
  StockAdjustmentRequest,
  ProductSearchParams,
  CategorySearchParams,
  BrandSearchParams,
  VariationSearchParams,
  ProductDetailResponse,
  ProductStatsResponse,
  CategoryTreeResponse,
  StockMovement,
  ProductErrorCodes
} from './types'

export class ProductService extends BaseService {
  
  constructor(context: ServiceContext) {
    super(context)
  }

  // ============ 商品管理 ============
  
  /**
   * 獲取商品列表
   */
  async getProducts(
    params: ProductSearchParams & PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<ProductInfo>>> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = 'createdAt', 
        order = 'desc',
        keyword,
        sku,
        categoryId,
        brandId,
        status,
        visibility,
        type,
        featured,
        stockStatus,
        priceMin,
        priceMax,
        tags,
        dateFrom,
        dateTo,
        inStock,
        onSale
      } = params

      const offset = (page - 1) * limit

      // 建立查詢條件
      const conditions = []

      // 排除軟刪除的商品
      conditions.push(isNull(products.deletedAt))

      if (keyword) {
        conditions.push(
          sql`(${products.name} LIKE ${'%' + keyword + '%'} OR ${products.description} LIKE ${'%' + keyword + '%'} OR ${products.sku} LIKE ${'%' + keyword + '%'})`
        )
      }

      if (sku) conditions.push(like(products.sku, `%${sku}%`))
      if (categoryId) conditions.push(eq(products.categoryId, categoryId))
      if (brandId) conditions.push(eq(products.brandId, brandId))
      if (status) conditions.push(eq(products.status, status))
      if (visibility) conditions.push(eq(products.visibility, visibility))
      if (type) conditions.push(eq(products.type, type))
      if (featured !== undefined) conditions.push(eq(products.featured, featured))
      if (stockStatus) conditions.push(eq(products.stockStatus, stockStatus))
      if (priceMin !== undefined) conditions.push(gte(products.price, priceMin))
      if (priceMax !== undefined) conditions.push(lte(products.price, priceMax))
      if (dateFrom) conditions.push(gte(products.createdAt, dateFrom))
      if (dateTo) conditions.push(lte(products.createdAt, dateTo))
      if (inStock) conditions.push(eq(products.stockStatus, 'instock'))
      if (onSale) conditions.push(sql`${products.salePrice} IS NOT NULL AND ${products.salePrice} > 0`)

      if (tags && tags.length > 0) {
        // 使用 JSON 查詢來檢查標籤
        const tagConditions = tags.map(tag => 
          sql`json_extract(${products.tags}, '$') LIKE ${'%"' + tag + '"%'}`
        )
        conditions.push(sql`(${sql.join(tagConditions, sql` OR `)})`)
      }

      // 獲取總數
      const [totalCount] = await this.db.select({ count: count() })
        .from(products)
        .leftJoin(productCategories, eq(products.categoryId, productCategories.categoryId))
        .leftJoin(productBrands, eq(products.brandId, productBrands.brandId))
        .where(and(...conditions))

      // 獲取商品列表
      const productList = await this.db.select({
        product: products,
        category: productCategories,
        brand: productBrands
      })
        .from(products)
        .leftJoin(productCategories, eq(products.categoryId, productCategories.categoryId))
        .leftJoin(productBrands, eq(products.brandId, productBrands.brandId))
        .where(and(...conditions))
        .orderBy(order === 'asc' ? asc(products[sort as keyof typeof products]) : desc(products[sort as keyof typeof products]))
        .limit(limit)
        .offset(offset)

      const productInfos: ProductInfo[] = productList.map(({ product, category, brand }) => ({
        productId: product.productId,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription || undefined,
        description: product.description || undefined,
        brandId: product.brandId || undefined,
        brandName: brand?.name,
        categoryId: product.categoryId || undefined,
        categoryName: category?.name,
        type: product.type as 'simple' | 'variable' | 'grouped' | 'external',
        status: product.status as 'draft' | 'published' | 'archived' | 'deleted',
        visibility: product.visibility as 'visible' | 'hidden' | 'catalog' | 'search',
        featured: product.featured,
        virtual: product.virtual,
        downloadable: product.downloadable,
        price: product.price,
        salePrice: product.salePrice || undefined,
        saleStart: product.saleStart || undefined,
        saleEnd: product.saleEnd || undefined,
        costPrice: product.costPrice,
        weight: product.weight || undefined,
        dimensions: product.dimensions as any || undefined,
        shippingClass: product.shippingClass || undefined,
        taxStatus: product.taxStatus as 'taxable' | 'none',
        taxClass: product.taxClass || undefined,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus as 'instock' | 'outofstock' | 'onbackorder',
        backorders: product.backorders as 'no' | 'notify' | 'yes',
        lowStockThreshold: product.lowStockThreshold,
        manageStock: product.manageStock,
        soldIndividually: product.soldIndividually,
        purchaseNote: product.purchaseNote || undefined,
        menuOrder: product.menuOrder,
        reviewsAllowed: product.reviewsAllowed,
        averageRating: product.averageRating,
        ratingCount: product.ratingCount,
        totalSales: product.totalSales,
        imageGallery: (product.imageGallery as any) || [],
        attributes: product.attributes as any || {},
        tags: (product.tags as any) || [],
        relatedProductIds: (product.relatedProductIds as any) || [],
        crossSellIds: (product.crossSellIds as any) || [],
        upsellIds: (product.upsellIds as any) || [],
        seoTitle: product.seoTitle || undefined,
        seoDescription: product.seoDescription || undefined,
        seoKeywords: product.seoKeywords || undefined,
        metadata: product.metadata as any || {},
        createdAt: product.createdAt!,
        updatedAt: product.updatedAt!
      }))

      return this.success(this.paginated(productInfos, totalCount.count, page, limit))

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 獲取商品詳情
   */
  async getProductDetail(productId: string): Promise<ServiceResponse<ProductDetailResponse>> {
    try {
      // 獲取商品基本資料
      const [productResult] = await this.db.select({
        product: products,
        category: productCategories,
        brand: productBrands
      })
        .from(products)
        .leftJoin(productCategories, eq(products.categoryId, productCategories.categoryId))
        .leftJoin(productBrands, eq(products.brandId, productBrands.brandId))
        .where(and(
          eq(products.productId, productId),
          isNull(products.deletedAt)
        ))

      if (!productResult) {
        return this.error('商品不存在', [{ 
          code: ProductErrorCodes.PRODUCT_NOT_FOUND,
          message: '找不到指定的商品'
        }])
      }

      const { product, category, brand } = productResult

      // 轉換商品資料
      const productInfo: ProductInfo = {
        productId: product.productId,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription || undefined,
        description: product.description || undefined,
        brandId: product.brandId || undefined,
        brandName: brand?.name,
        categoryId: product.categoryId || undefined,
        categoryName: category?.name,
        type: product.type as 'simple' | 'variable' | 'grouped' | 'external',
        status: product.status as 'draft' | 'published' | 'archived' | 'deleted',
        visibility: product.visibility as 'visible' | 'hidden' | 'catalog' | 'search',
        featured: product.featured,
        virtual: product.virtual,
        downloadable: product.downloadable,
        price: product.price,
        salePrice: product.salePrice || undefined,
        saleStart: product.saleStart || undefined,
        saleEnd: product.saleEnd || undefined,
        costPrice: product.costPrice,
        weight: product.weight || undefined,
        dimensions: product.dimensions as any || undefined,
        shippingClass: product.shippingClass || undefined,
        taxStatus: product.taxStatus as 'taxable' | 'none',
        taxClass: product.taxClass || undefined,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus as 'instock' | 'outofstock' | 'onbackorder',
        backorders: product.backorders as 'no' | 'notify' | 'yes',
        lowStockThreshold: product.lowStockThreshold,
        manageStock: product.manageStock,
        soldIndividually: product.soldIndividually,
        purchaseNote: product.purchaseNote || undefined,
        menuOrder: product.menuOrder,
        reviewsAllowed: product.reviewsAllowed,
        averageRating: product.averageRating,
        ratingCount: product.ratingCount,
        totalSales: product.totalSales,
        imageGallery: (product.imageGallery as any) || [],
        attributes: product.attributes as any || {},
        tags: (product.tags as any) || [],
        relatedProductIds: (product.relatedProductIds as any) || [],
        crossSellIds: (product.crossSellIds as any) || [],
        upsellIds: (product.upsellIds as any) || [],
        seoTitle: product.seoTitle || undefined,
        seoDescription: product.seoDescription || undefined,
        seoKeywords: product.seoKeywords || undefined,
        metadata: product.metadata as any || {},
        createdAt: product.createdAt!,
        updatedAt: product.updatedAt!
      }

      const response: ProductDetailResponse = {
        product: productInfo
      }

      // 如果是變體商品，獲取變體資料
      if (product.type === 'variable') {
        const variations = await this.db.select()
          .from(productVariations)
          .where(and(
            eq(productVariations.parentId, productId),
            eq(productVariations.status, 'published')
          ))
          .orderBy(asc(productVariations.menuOrder))

        response.variations = variations.map(variation => ({
          variationId: variation.variationId,
          parentId: variation.parentId,
          sku: variation.sku,
          price: variation.price,
          salePrice: variation.salePrice || undefined,
          saleStart: variation.saleStart || undefined,
          saleEnd: variation.saleEnd || undefined,
          stockQuantity: variation.stockQuantity,
          stockStatus: variation.stockStatus as 'instock' | 'outofstock' | 'onbackorder',
          backorders: variation.backorders as 'no' | 'notify' | 'yes',
          weight: variation.weight || undefined,
          dimensions: variation.dimensions as any || undefined,
          image: variation.image || undefined,
          attributes: variation.attributes as any || {},
          status: variation.status as 'published' | 'private' | 'deleted',
          menuOrder: variation.menuOrder,
          createdAt: variation.createdAt!,
          updatedAt: variation.updatedAt!
        }))
      }

      // 獲取分類資料
      if (category) {
        response.category = {
          categoryId: category.categoryId,
          parentId: category.parentId || undefined,
          name: category.name,
          slug: category.slug,
          description: category.description || undefined,
          image: category.image || undefined,
          icon: category.icon || undefined,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          seoTitle: category.seoTitle || undefined,
          seoDescription: category.seoDescription || undefined,
          seoKeywords: category.seoKeywords || undefined,
          createdAt: category.createdAt!,
          updatedAt: category.updatedAt!
        }
      }

      // 獲取品牌資料
      if (brand) {
        response.brand = {
          brandId: brand.brandId,
          name: brand.name,
          slug: brand.slug,
          description: brand.description || undefined,
          logo: brand.logo || undefined,
          website: brand.website || undefined,
          country: brand.country || undefined,
          isActive: brand.isActive,
          featured: brand.featured,
          sortOrder: brand.sortOrder,
          seoTitle: brand.seoTitle || undefined,
          seoDescription: brand.seoDescription || undefined,
          createdAt: brand.createdAt!,
          updatedAt: brand.updatedAt!
        }
      }

      // 獲取相關商品（如果有）
      if (productInfo.relatedProductIds.length > 0) {
        const relatedProducts = await this.db.select({
          product: products,
          category: productCategories,
          brand: productBrands
        })
          .from(products)
          .leftJoin(productCategories, eq(products.categoryId, productCategories.categoryId))
          .leftJoin(productBrands, eq(products.brandId, productBrands.brandId))
          .where(and(
            inArray(products.productId, productInfo.relatedProductIds),
            eq(products.status, 'published'),
            isNull(products.deletedAt)
          ))
          .limit(10)

        response.relatedProducts = relatedProducts.map(({ product, category, brand }) => ({
          productId: product.productId,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription || undefined,
          description: product.description || undefined,
          brandId: product.brandId || undefined,
          brandName: brand?.name,
          categoryId: product.categoryId || undefined,
          categoryName: category?.name,
          type: product.type as 'simple' | 'variable' | 'grouped' | 'external',
          status: product.status as 'draft' | 'published' | 'archived' | 'deleted',
          visibility: product.visibility as 'visible' | 'hidden' | 'catalog' | 'search',
          featured: product.featured,
          virtual: product.virtual,
          downloadable: product.downloadable,
          price: product.price,
          salePrice: product.salePrice || undefined,
          saleStart: product.saleStart || undefined,
          saleEnd: product.saleEnd || undefined,
          costPrice: product.costPrice,
          weight: product.weight || undefined,
          dimensions: product.dimensions as any || undefined,
          shippingClass: product.shippingClass || undefined,
          taxStatus: product.taxStatus as 'taxable' | 'none',
          taxClass: product.taxClass || undefined,
          stockQuantity: product.stockQuantity,
          stockStatus: product.stockStatus as 'instock' | 'outofstock' | 'onbackorder',
          backorders: product.backorders as 'no' | 'notify' | 'yes',
          lowStockThreshold: product.lowStockThreshold,
          manageStock: product.manageStock,
          soldIndividually: product.soldIndividually,
          purchaseNote: product.purchaseNote || undefined,
          menuOrder: product.menuOrder,
          reviewsAllowed: product.reviewsAllowed,
          averageRating: product.averageRating,
          ratingCount: product.ratingCount,
          totalSales: product.totalSales,
          imageGallery: (product.imageGallery as any) || [],
          attributes: product.attributes as any || {},
          tags: (product.tags as any) || [],
          relatedProductIds: (product.relatedProductIds as any) || [],
          crossSellIds: (product.crossSellIds as any) || [],
          upsellIds: (product.upsellIds as any) || [],
          seoTitle: product.seoTitle || undefined,
          seoDescription: product.seoDescription || undefined,
          seoKeywords: product.seoKeywords || undefined,
          metadata: product.metadata as any || {},
          createdAt: product.createdAt!,
          updatedAt: product.updatedAt!
        }))
      }

      this.logAction('GET_PRODUCT_DETAIL', productId)
      return this.success(response)

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 創建商品
   */
  async createProduct(data: CreateProductRequest): Promise<ServiceResponse<ProductInfo>> {
    try {
      // 驗證 SKU 唯一性
      const [existingProduct] = await this.db.select()
        .from(products)
        .where(eq(products.sku, data.sku))

      if (existingProduct) {
        return this.error('SKU 已存在', [{ 
          code: ProductErrorCodes.SKU_ALREADY_EXISTS,
          message: 'SKU 必須是唯一的'
        }])
      }

      // 驗證分類存在（如果提供）
      if (data.categoryId) {
        const [category] = await this.db.select()
          .from(productCategories)
          .where(eq(productCategories.categoryId, data.categoryId))

        if (!category) {
          return this.error('商品分類不存在', [{ 
            code: ProductErrorCodes.CATEGORY_NOT_FOUND,
            message: '找不到指定的商品分類'
          }])
        }
      }

      // 驗證品牌存在（如果提供）
      if (data.brandId) {
        const [brand] = await this.db.select()
          .from(productBrands)
          .where(eq(productBrands.brandId, data.brandId))

        if (!brand) {
          return this.error('商品品牌不存在', [{ 
            code: ProductErrorCodes.BRAND_NOT_FOUND,
            message: '找不到指定的商品品牌'
          }])
        }
      }

      // 生成產品 ID 和 slug
      const productId = this.generateId('prod')
      const slug = this.generateSlug(data.name)

      // 準備商品資料
      const newProduct: NewProduct = {
        productId,
        sku: data.sku,
        name: data.name,
        slug,
        shortDescription: data.shortDescription,
        description: data.description,
        brandId: data.brandId,
        categoryId: data.categoryId,
        type: data.type || 'simple',
        status: data.status || 'draft',
        visibility: data.visibility || 'visible',
        featured: data.featured || false,
        virtual: data.virtual || false,
        downloadable: data.downloadable || false,
        price: data.price,
        salePrice: data.salePrice,
        saleStart: data.saleStart,
        saleEnd: data.saleEnd,
        costPrice: data.costPrice || 0,
        weight: data.weight,
        dimensions: data.dimensions,
        shippingClass: data.shippingClass,
        taxStatus: data.taxStatus || 'taxable',
        taxClass: data.taxClass,
        stockQuantity: data.stockQuantity || 0,
        stockStatus: data.stockStatus || 'instock',
        backorders: data.backorders || 'no',
        lowStockThreshold: data.lowStockThreshold || 5,
        manageStock: data.manageStock !== undefined ? data.manageStock : true,
        soldIndividually: data.soldIndividually || false,
        purchaseNote: data.purchaseNote,
        menuOrder: data.menuOrder || 0,
        reviewsAllowed: data.reviewsAllowed !== undefined ? data.reviewsAllowed : true,
        imageGallery: data.imageGallery || [],
        attributes: data.attributes || {},
        tags: data.tags || [],
        relatedProductIds: data.relatedProductIds || [],
        crossSellIds: data.crossSellIds || [],
        upsellIds: data.upsellIds || [],
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords,
        metadata: data.metadata || {},
        createdBy: this.context?.userId,
        updatedBy: this.context?.userId
      }

      // 插入商品
      await this.db.insert(products).values(newProduct)

      // 如果管理庫存且有初始庫存，記錄庫存歷史
      if (newProduct.manageStock && newProduct.stockQuantity > 0) {
        await this.recordInventoryHistory(
          productId,
          null,
          'stock_in',
          newProduct.stockQuantity,
          0,
          newProduct.stockQuantity,
          'Initial stock',
          'product',
          productId
        )
      }

      // 獲取創建的商品資料（包含關聯資料）
      const response = await this.getProductDetail(productId)
      if (response.success && response.data) {
        this.logAction('CREATE_PRODUCT', productId, null, newProduct)
        return this.success(response.data.product, '商品創建成功')
      }

      return this.error('商品創建失敗')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 更新商品
   */
  async updateProduct(productId: string, data: UpdateProductRequest): Promise<ServiceResponse<ProductInfo>> {
    try {
      // 驗證商品存在
      const [existingProduct] = await this.db.select()
        .from(products)
        .where(and(
          eq(products.productId, productId),
          isNull(products.deletedAt)
        ))

      if (!existingProduct) {
        return this.error('商品不存在', [{ 
          code: ProductErrorCodes.PRODUCT_NOT_FOUND,
          message: '找不到指定的商品'
        }])
      }

      // 驗證分類存在（如果提供）
      if (data.categoryId) {
        const [category] = await this.db.select()
          .from(productCategories)
          .where(eq(productCategories.categoryId, data.categoryId))

        if (!category) {
          return this.error('商品分類不存在', [{ 
            code: ProductErrorCodes.CATEGORY_NOT_FOUND,
            message: '找不到指定的商品分類'
          }])
        }
      }

      // 驗證品牌存在（如果提供）
      if (data.brandId) {
        const [brand] = await this.db.select()
          .from(productBrands)
          .where(eq(productBrands.brandId, data.brandId))

        if (!brand) {
          return this.error('商品品牌不存在', [{ 
            code: ProductErrorCodes.BRAND_NOT_FOUND,
            message: '找不到指定的商品品牌'
          }])
        }
      }

      // 準備更新資料
      const updateData: Partial<NewProduct> = {
        updatedAt: new Date().toISOString(),
        updatedBy: this.context?.userId
      }

      if (data.name !== undefined) {
        updateData.name = data.name
        updateData.slug = this.generateSlug(data.name)
      }
      if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription
      if (data.description !== undefined) updateData.description = data.description
      if (data.brandId !== undefined) updateData.brandId = data.brandId
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
      if (data.status !== undefined) updateData.status = data.status
      if (data.visibility !== undefined) updateData.visibility = data.visibility
      if (data.featured !== undefined) updateData.featured = data.featured
      if (data.virtual !== undefined) updateData.virtual = data.virtual
      if (data.downloadable !== undefined) updateData.downloadable = data.downloadable
      if (data.price !== undefined) updateData.price = data.price
      if (data.salePrice !== undefined) updateData.salePrice = data.salePrice
      if (data.saleStart !== undefined) updateData.saleStart = data.saleStart
      if (data.saleEnd !== undefined) updateData.saleEnd = data.saleEnd
      if (data.costPrice !== undefined) updateData.costPrice = data.costPrice
      if (data.weight !== undefined) updateData.weight = data.weight
      if (data.dimensions !== undefined) updateData.dimensions = data.dimensions
      if (data.shippingClass !== undefined) updateData.shippingClass = data.shippingClass
      if (data.taxStatus !== undefined) updateData.taxStatus = data.taxStatus
      if (data.taxClass !== undefined) updateData.taxClass = data.taxClass
      if (data.backorders !== undefined) updateData.backorders = data.backorders
      if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold
      if (data.manageStock !== undefined) updateData.manageStock = data.manageStock
      if (data.soldIndividually !== undefined) updateData.soldIndividually = data.soldIndividually
      if (data.purchaseNote !== undefined) updateData.purchaseNote = data.purchaseNote
      if (data.menuOrder !== undefined) updateData.menuOrder = data.menuOrder
      if (data.reviewsAllowed !== undefined) updateData.reviewsAllowed = data.reviewsAllowed
      if (data.imageGallery !== undefined) updateData.imageGallery = data.imageGallery
      if (data.attributes !== undefined) updateData.attributes = data.attributes
      if (data.tags !== undefined) updateData.tags = data.tags
      if (data.relatedProductIds !== undefined) updateData.relatedProductIds = data.relatedProductIds
      if (data.crossSellIds !== undefined) updateData.crossSellIds = data.crossSellIds
      if (data.upsellIds !== undefined) updateData.upsellIds = data.upsellIds
      if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle
      if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription
      if (data.seoKeywords !== undefined) updateData.seoKeywords = data.seoKeywords
      if (data.metadata !== undefined) updateData.metadata = data.metadata

      // 處理庫存變更
      if (data.stockQuantity !== undefined && existingProduct.manageStock) {
        const oldQuantity = existingProduct.stockQuantity
        const newQuantity = data.stockQuantity
        const quantityDiff = newQuantity - oldQuantity

        if (quantityDiff !== 0) {
          await this.recordInventoryHistory(
            productId,
            null,
            quantityDiff > 0 ? 'adjustment' : 'adjustment',
            Math.abs(quantityDiff),
            oldQuantity,
            newQuantity,
            'Stock adjustment via product update',
            'product',
            productId
          )
        }

        updateData.stockQuantity = newQuantity
        
        // 更新庫存狀態
        if (data.stockStatus === undefined) {
          updateData.stockStatus = newQuantity > 0 ? 'instock' : 'outofstock'
        }
      }

      if (data.stockStatus !== undefined) updateData.stockStatus = data.stockStatus

      // 執行更新
      await this.db.update(products)
        .set(updateData)
        .where(eq(products.productId, productId))

      // 獲取更新後的商品資料
      const response = await this.getProductDetail(productId)
      if (response.success && response.data) {
        this.logAction('UPDATE_PRODUCT', productId, existingProduct, updateData)
        return this.success(response.data.product, '商品更新成功')
      }

      return this.error('商品更新失敗')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  // ============ 私有輔助方法 ============
  
  /**
   * 生成商品 slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)
  }

  /**
   * 記錄庫存歷史
   */
  private async recordInventoryHistory(
    productId: string,
    variationId: string | null,
    type: 'stock_in' | 'stock_out' | 'adjustment' | 'sale' | 'return',
    quantity: number,
    previousQuantity: number,
    newQuantity: number,
    reason?: string,
    referenceType?: string,
    referenceId?: string,
    notes?: string
  ): Promise<void> {
    try {
      const historyRecord: NewProductInventoryHistory = {
        historyId: this.generateId('inv'),
        productId,
        variationId,
        type,
        quantity,
        previousQuantity,
        newQuantity,
        reason,
        referenceType,
        referenceId,
        notes,
        createdBy: this.context?.userId
      }

      await this.db.insert(productInventoryHistory).values(historyRecord)
    } catch (error) {
      // 庫存歷史記錄失敗不應影響主要業務流程
      this.logger.error('Failed to record inventory history', { 
        error: error.message, 
        productId, 
        variationId, 
        type, 
        quantity 
      })
    }
  }
}