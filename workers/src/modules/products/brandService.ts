/**
 * 商品品牌服務
 * 處理商品品牌相關的業務邏輯
 */

import { eq, and, like, desc, asc, count, isNull } from 'drizzle-orm'
import { BaseService, ServiceContext, ServiceResponse, PaginatedResponse, PaginationParams } from '@/shared/services/baseService'
import { 
  productBrands,
  products,
  NewProductBrand
} from '@/core/database/schema'
import {
  BrandInfo,
  CreateBrandRequest,
  UpdateBrandRequest,
  BrandSearchParams,
  ProductErrorCodes
} from './types'

export class BrandService extends BaseService {
  
  constructor(context: ServiceContext) {
    super(context)
  }

  /**
   * 獲取品牌列表
   */
  async getBrands(
    params: BrandSearchParams & PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<BrandInfo>>> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = 'sortOrder', 
        order = 'asc',
        keyword,
        country,
        isActive,
        featured
      } = params

      const offset = (page - 1) * limit

      // 建立查詢條件
      const conditions = []

      if (keyword) {
        conditions.push(like(productBrands.name, `%${keyword}%`))
      }

      if (country) {
        conditions.push(eq(productBrands.country, country))
      }

      if (isActive !== undefined) {
        conditions.push(eq(productBrands.isActive, isActive))
      }

      if (featured !== undefined) {
        conditions.push(eq(productBrands.featured, featured))
      }

      // 獲取總數
      const [totalCount] = await this.db.select({ count: count() })
        .from(productBrands)
        .where(and(...conditions))

      // 獲取品牌列表，包含商品統計
      const brandList = await this.db.select({
        brand: productBrands,
        productCount: count(products.productId)
      })
        .from(productBrands)
        .leftJoin(products, and(
          eq(products.brandId, productBrands.brandId),
          eq(products.status, 'published'),
          isNull(products.deletedAt)
        ))
        .where(and(...conditions))
        .groupBy(productBrands.brandId)
        .orderBy(
          order === 'asc' 
            ? asc(productBrands[sort as keyof typeof productBrands]) 
            : desc(productBrands[sort as keyof typeof productBrands])
        )
        .limit(limit)
        .offset(offset)

      const brandInfos: BrandInfo[] = brandList.map(({ brand, productCount }) => ({
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
        productCount,
        createdAt: brand.createdAt!,
        updatedAt: brand.updatedAt!
      }))

      return this.success(this.paginated(brandInfos, totalCount.count, page, limit))

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 獲取品牌詳情
   */
  async getBrandDetail(brandId: string): Promise<ServiceResponse<BrandInfo>> {
    try {
      const [brandResult] = await this.db.select({
        brand: productBrands,
        productCount: count(products.productId)
      })
        .from(productBrands)
        .leftJoin(products, and(
          eq(products.brandId, productBrands.brandId),
          eq(products.status, 'published'),
          isNull(products.deletedAt)
        ))
        .where(eq(productBrands.brandId, brandId))
        .groupBy(productBrands.brandId)

      if (!brandResult) {
        return this.error('品牌不存在', [{ 
          code: ProductErrorCodes.BRAND_NOT_FOUND,
          message: '找不到指定的品牌'
        }])
      }

      const { brand, productCount } = brandResult

      const brandInfo: BrandInfo = {
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
        productCount,
        createdAt: brand.createdAt!,
        updatedAt: brand.updatedAt!
      }

      this.logAction('GET_BRAND_DETAIL', brandId)
      return this.success(brandInfo)

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 創建品牌
   */
  async createBrand(data: CreateBrandRequest): Promise<ServiceResponse<BrandInfo>> {
    try {
      // 驗證品牌名稱唯一性
      const [existingBrand] = await this.db.select()
        .from(productBrands)
        .where(eq(productBrands.name, data.name))

      if (existingBrand) {
        return this.error('品牌名稱已存在', [{ 
          message: '請使用不同的品牌名稱'
        }])
      }

      // 驗證 slug 唯一性
      const slug = this.generateSlug(data.name)
      const [existingSlug] = await this.db.select()
        .from(productBrands)
        .where(eq(productBrands.slug, slug))

      if (existingSlug) {
        return this.error('品牌標識已存在', [{ 
          code: ProductErrorCodes.SLUG_ALREADY_EXISTS,
          message: '請使用不同的品牌名稱'
        }])
      }

      // 創建品牌
      const brandId = this.generateId('brand')
      const newBrand: NewProductBrand = {
        brandId,
        name: data.name,
        slug,
        description: data.description,
        logo: data.logo,
        website: data.website,
        country: data.country,
        isActive: data.isActive !== undefined ? data.isActive : true,
        featured: data.featured || false,
        sortOrder: data.sortOrder || 0,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        metadata: data.metadata || {}
      }

      await this.db.insert(productBrands).values(newBrand)

      // 獲取創建的品牌資料
      const response = await this.getBrandDetail(brandId)
      if (response.success && response.data) {
        this.logAction('CREATE_BRAND', brandId, null, newBrand)
        return this.success(response.data, '品牌創建成功')
      }

      return this.error('品牌創建失敗')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 更新品牌
   */
  async updateBrand(brandId: string, data: UpdateBrandRequest): Promise<ServiceResponse<BrandInfo>> {
    try {
      // 驗證品牌存在
      const [existingBrand] = await this.db.select()
        .from(productBrands)
        .where(eq(productBrands.brandId, brandId))

      if (!existingBrand) {
        return this.error('品牌不存在', [{ 
          code: ProductErrorCodes.BRAND_NOT_FOUND,
          message: '找不到指定的品牌'
        }])
      }

      // 驗證品牌名稱唯一性（如果要更新名稱）
      if (data.name && data.name !== existingBrand.name) {
        const [duplicateBrand] = await this.db.select()
          .from(productBrands)
          .where(and(
            eq(productBrands.name, data.name),
            eq(productBrands.brandId, brandId) // 排除自己
          ))

        if (duplicateBrand) {
          return this.error('品牌名稱已存在', [{ 
            message: '請使用不同的品牌名稱'
          }])
        }
      }

      // 準備更新資料
      const updateData: Partial<NewProductBrand> = {
        updatedAt: new Date().toISOString()
      }

      if (data.name !== undefined) {
        updateData.name = data.name
        updateData.slug = this.generateSlug(data.name)
      }
      if (data.description !== undefined) updateData.description = data.description
      if (data.logo !== undefined) updateData.logo = data.logo
      if (data.website !== undefined) updateData.website = data.website
      if (data.country !== undefined) updateData.country = data.country
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.featured !== undefined) updateData.featured = data.featured
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
      if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle
      if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription
      if (data.metadata !== undefined) updateData.metadata = data.metadata

      // 執行更新
      await this.db.update(productBrands)
        .set(updateData)
        .where(eq(productBrands.brandId, brandId))

      // 獲取更新後的品牌資料
      const response = await this.getBrandDetail(brandId)
      if (response.success && response.data) {
        this.logAction('UPDATE_BRAND', brandId, existingBrand, updateData)
        return this.success(response.data, '品牌更新成功')
      }

      return this.error('品牌更新失敗')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 刪除品牌
   */
  async deleteBrand(brandId: string): Promise<ServiceResponse<void>> {
    try {
      // 驗證品牌存在
      const [existingBrand] = await this.db.select()
        .from(productBrands)
        .where(eq(productBrands.brandId, brandId))

      if (!existingBrand) {
        return this.error('品牌不存在', [{ 
          code: ProductErrorCodes.BRAND_NOT_FOUND,
          message: '找不到指定的品牌'
        }])
      }

      // 檢查是否有商品使用此品牌
      const [productCount] = await this.db.select({ count: count() })
        .from(products)
        .where(and(
          eq(products.brandId, brandId),
          isNull(products.deletedAt)
        ))

      if (productCount.count > 0) {
        return this.error('無法刪除包含商品的品牌', [{ 
          code: ProductErrorCodes.BRAND_HAS_PRODUCTS,
          message: `此品牌包含 ${productCount.count} 個商品，請先移除或重新設定這些商品的品牌`
        }])
      }

      // 刪除品牌
      await this.db.delete(productBrands)
        .where(eq(productBrands.brandId, brandId))

      this.logAction('DELETE_BRAND', brandId, existingBrand, null)
      return this.success(undefined, '品牌刪除成功')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 獲取精選品牌
   */
  async getFeaturedBrands(limit: number = 10): Promise<ServiceResponse<BrandInfo[]>> {
    try {
      const brandList = await this.db.select({
        brand: productBrands,
        productCount: count(products.productId)
      })
        .from(productBrands)
        .leftJoin(products, and(
          eq(products.brandId, productBrands.brandId),
          eq(products.status, 'published'),
          isNull(products.deletedAt)
        ))
        .where(and(
          eq(productBrands.isActive, true),
          eq(productBrands.featured, true)
        ))
        .groupBy(productBrands.brandId)
        .orderBy(asc(productBrands.sortOrder))
        .limit(limit)

      const brandInfos: BrandInfo[] = brandList.map(({ brand, productCount }) => ({
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
        productCount,
        createdAt: brand.createdAt!,
        updatedAt: brand.updatedAt!
      }))

      return this.success(brandInfos)

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  // ============ 私有輔助方法 ============
  
  /**
   * 生成品牌 slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)
  }
}