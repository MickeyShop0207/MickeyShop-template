/**
 * 商品分類服務
 * 處理商品分類相關的業務邏輯
 */

import { eq, and, like, desc, asc, count, isNull } from 'drizzle-orm'
import { BaseService, ServiceContext, ServiceResponse, PaginatedResponse, PaginationParams } from '@/shared/services/baseService'
import { 
  productCategories,
  products,
  NewProductCategory
} from '@/core/database/schema'
import {
  CategoryInfo,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategorySearchParams,
  CategoryTreeResponse,
  ProductErrorCodes
} from './types'

export class CategoryService extends BaseService {
  
  constructor(context: ServiceContext) {
    super(context)
  }

  /**
   * 獲取分類列表
   */
  async getCategories(
    params: CategorySearchParams & PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<CategoryInfo>>> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = 'sortOrder', 
        order = 'asc',
        keyword,
        parentId,
        isActive,
        level
      } = params

      const offset = (page - 1) * limit

      // 建立查詢條件
      const conditions = []

      if (keyword) {
        conditions.push(like(productCategories.name, `%${keyword}%`))
      }

      if (parentId !== undefined) {
        if (parentId === null || parentId === '') {
          conditions.push(isNull(productCategories.parentId))
        } else {
          conditions.push(eq(productCategories.parentId, parentId))
        }
      }

      if (isActive !== undefined) {
        conditions.push(eq(productCategories.isActive, isActive))
      }

      // 獲取總數
      const [totalCount] = await this.db.select({ count: count() })
        .from(productCategories)
        .where(and(...conditions))

      // 獲取分類列表，包含商品統計
      const categoryList = await this.db.select({
        category: productCategories,
        productCount: count(products.productId)
      })
        .from(productCategories)
        .leftJoin(products, and(
          eq(products.categoryId, productCategories.categoryId),
          eq(products.status, 'published'),
          isNull(products.deletedAt)
        ))
        .where(and(...conditions))
        .groupBy(productCategories.categoryId)
        .orderBy(
          order === 'asc' 
            ? asc(productCategories[sort as keyof typeof productCategories]) 
            : desc(productCategories[sort as keyof typeof productCategories])
        )
        .limit(limit)
        .offset(offset)

      const categoryInfos: CategoryInfo[] = []

      for (const { category, productCount } of categoryList) {
        // 獲取父級分類名稱
        let parentName: string | undefined
        if (category.parentId) {
          const [parent] = await this.db.select()
            .from(productCategories)
            .where(eq(productCategories.categoryId, category.parentId))
          
          parentName = parent?.name
        }

        // 獲取子分類數量
        const [childrenCount] = await this.db.select({ count: count() })
          .from(productCategories)
          .where(eq(productCategories.parentId, category.categoryId))

        categoryInfos.push({
          categoryId: category.categoryId,
          parentId: category.parentId || undefined,
          parentName,
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
          productCount,
          childrenCount: childrenCount.count,
          createdAt: category.createdAt!,
          updatedAt: category.updatedAt!
        })
      }

      return this.success(this.paginated(categoryInfos, totalCount.count, page, limit))

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 獲取分類樹狀結構
   */
  async getCategoryTree(): Promise<ServiceResponse<CategoryTreeResponse[]>> {
    try {
      // 獲取所有啟用的分類
      const allCategories = await this.db.select({
        category: productCategories,
        productCount: count(products.productId)
      })
        .from(productCategories)
        .leftJoin(products, and(
          eq(products.categoryId, productCategories.categoryId),
          eq(products.status, 'published'),
          isNull(products.deletedAt)
        ))
        .where(eq(productCategories.isActive, true))
        .groupBy(productCategories.categoryId)
        .orderBy(asc(productCategories.sortOrder))

      // 建立樹狀結構
      const categoryMap = new Map<string, CategoryTreeResponse & { parentId?: string }>()
      
      // 先創建所有節點
      for (const { category, productCount } of allCategories) {
        categoryMap.set(category.categoryId, {
          categoryId: category.categoryId,
          parentId: category.parentId || undefined,
          name: category.name,
          slug: category.slug,
          productCount,
          children: []
        })
      }

      // 建立父子關係
      const rootCategories: CategoryTreeResponse[] = []
      
      for (const categoryData of categoryMap.values()) {
        if (categoryData.parentId) {
          const parent = categoryMap.get(categoryData.parentId)
          if (parent) {
            parent.children.push({
              categoryId: categoryData.categoryId,
              name: categoryData.name,
              slug: categoryData.slug,
              productCount: categoryData.productCount,
              children: categoryData.children
            })
          }
        } else {
          rootCategories.push({
            categoryId: categoryData.categoryId,
            name: categoryData.name,
            slug: categoryData.slug,
            productCount: categoryData.productCount,
            children: categoryData.children
          })
        }
      }

      this.logAction('GET_CATEGORY_TREE')
      return this.success(rootCategories)

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 獲取分類詳情
   */
  async getCategoryDetail(categoryId: string): Promise<ServiceResponse<CategoryInfo>> {
    try {
      const [categoryResult] = await this.db.select({
        category: productCategories,
        productCount: count(products.productId)
      })
        .from(productCategories)
        .leftJoin(products, and(
          eq(products.categoryId, productCategories.categoryId),
          eq(products.status, 'published'),
          isNull(products.deletedAt)
        ))
        .where(eq(productCategories.categoryId, categoryId))
        .groupBy(productCategories.categoryId)

      if (!categoryResult) {
        return this.error('分類不存在', [{ 
          code: ProductErrorCodes.CATEGORY_NOT_FOUND,
          message: '找不到指定的分類'
        }])
      }

      const { category, productCount } = categoryResult

      // 獲取父級分類名稱
      let parentName: string | undefined
      if (category.parentId) {
        const [parent] = await this.db.select()
          .from(productCategories)
          .where(eq(productCategories.categoryId, category.parentId))
        
        parentName = parent?.name
      }

      // 獲取子分類數量
      const [childrenCount] = await this.db.select({ count: count() })
        .from(productCategories)
        .where(eq(productCategories.parentId, categoryId))

      const categoryInfo: CategoryInfo = {
        categoryId: category.categoryId,
        parentId: category.parentId || undefined,
        parentName,
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
        productCount,
        childrenCount: childrenCount.count,
        createdAt: category.createdAt!,
        updatedAt: category.updatedAt!
      }

      this.logAction('GET_CATEGORY_DETAIL', categoryId)
      return this.success(categoryInfo)

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 創建分類
   */
  async createCategory(data: CreateCategoryRequest): Promise<ServiceResponse<CategoryInfo>> {
    try {
      // 驗證父級分類存在（如果提供）
      if (data.parentId) {
        const [parent] = await this.db.select()
          .from(productCategories)
          .where(eq(productCategories.categoryId, data.parentId))

        if (!parent) {
          return this.error('父級分類不存在', [{ 
            code: ProductErrorCodes.CATEGORY_NOT_FOUND,
            message: '找不到指定的父級分類'
          }])
        }
      }

      // 驗證 slug 唯一性
      const slug = this.generateSlug(data.name)
      const [existingCategory] = await this.db.select()
        .from(productCategories)
        .where(eq(productCategories.slug, slug))

      if (existingCategory) {
        return this.error('分類名稱已存在', [{ 
          code: ProductErrorCodes.SLUG_ALREADY_EXISTS,
          message: '請使用不同的分類名稱'
        }])
      }

      // 創建分類
      const categoryId = this.generateId('cat')
      const newCategory: NewProductCategory = {
        categoryId,
        parentId: data.parentId,
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        icon: data.icon,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords,
        metadata: data.metadata || {}
      }

      await this.db.insert(productCategories).values(newCategory)

      // 獲取創建的分類資料
      const response = await this.getCategoryDetail(categoryId)
      if (response.success && response.data) {
        this.logAction('CREATE_CATEGORY', categoryId, null, newCategory)
        return this.success(response.data, '分類創建成功')
      }

      return this.error('分類創建失敗')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 更新分類
   */
  async updateCategory(categoryId: string, data: UpdateCategoryRequest): Promise<ServiceResponse<CategoryInfo>> {
    try {
      // 驗證分類存在
      const [existingCategory] = await this.db.select()
        .from(productCategories)
        .where(eq(productCategories.categoryId, categoryId))

      if (!existingCategory) {
        return this.error('分類不存在', [{ 
          code: ProductErrorCodes.CATEGORY_NOT_FOUND,
          message: '找不到指定的分類'
        }])
      }

      // 驗證父級分類存在（如果提供）
      if (data.parentId) {
        // 檢查是否會造成循環引用
        if (data.parentId === categoryId) {
          return this.error('不能將自己設為父級分類', [{ 
            code: ProductErrorCodes.CIRCULAR_CATEGORY_REFERENCE,
            message: '分類不能以自己作為父級分類'
          }])
        }

        // 檢查是否會造成深層循環引用
        const isCircular = await this.checkCircularReference(categoryId, data.parentId)
        if (isCircular) {
          return this.error('不能設定循環引用的父級分類', [{ 
            code: ProductErrorCodes.CIRCULAR_CATEGORY_REFERENCE,
            message: '這會造成分類的循環引用'
          }])
        }

        const [parent] = await this.db.select()
          .from(productCategories)
          .where(eq(productCategories.categoryId, data.parentId))

        if (!parent) {
          return this.error('父級分類不存在', [{ 
            code: ProductErrorCodes.CATEGORY_NOT_FOUND,
            message: '找不到指定的父級分類'
          }])
        }
      }

      // 準備更新資料
      const updateData: Partial<NewProductCategory> = {
        updatedAt: new Date().toISOString()
      }

      if (data.parentId !== undefined) updateData.parentId = data.parentId
      if (data.name !== undefined) {
        updateData.name = data.name
        updateData.slug = this.generateSlug(data.name)
      }
      if (data.description !== undefined) updateData.description = data.description
      if (data.image !== undefined) updateData.image = data.image
      if (data.icon !== undefined) updateData.icon = data.icon
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle
      if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription
      if (data.seoKeywords !== undefined) updateData.seoKeywords = data.seoKeywords
      if (data.metadata !== undefined) updateData.metadata = data.metadata

      // 執行更新
      await this.db.update(productCategories)
        .set(updateData)
        .where(eq(productCategories.categoryId, categoryId))

      // 獲取更新後的分類資料
      const response = await this.getCategoryDetail(categoryId)
      if (response.success && response.data) {
        this.logAction('UPDATE_CATEGORY', categoryId, existingCategory, updateData)
        return this.success(response.data, '分類更新成功')
      }

      return this.error('分類更新失敗')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  /**
   * 刪除分類
   */
  async deleteCategory(categoryId: string): Promise<ServiceResponse<void>> {
    try {
      // 驗證分類存在
      const [existingCategory] = await this.db.select()
        .from(productCategories)
        .where(eq(productCategories.categoryId, categoryId))

      if (!existingCategory) {
        return this.error('分類不存在', [{ 
          code: ProductErrorCodes.CATEGORY_NOT_FOUND,
          message: '找不到指定的分類'
        }])
      }

      // 檢查是否有商品使用此分類
      const [productCount] = await this.db.select({ count: count() })
        .from(products)
        .where(and(
          eq(products.categoryId, categoryId),
          isNull(products.deletedAt)
        ))

      if (productCount.count > 0) {
        return this.error('無法刪除包含商品的分類', [{ 
          code: ProductErrorCodes.CATEGORY_HAS_PRODUCTS,
          message: `此分類包含 ${productCount.count} 個商品，請先移除或重新分類這些商品`
        }])
      }

      // 檢查是否有子分類
      const [childrenCount] = await this.db.select({ count: count() })
        .from(productCategories)
        .where(eq(productCategories.parentId, categoryId))

      if (childrenCount.count > 0) {
        return this.error('無法刪除包含子分類的分類', [{ 
          message: `此分類包含 ${childrenCount.count} 個子分類，請先處理子分類`
        }])
      }

      // 刪除分類
      await this.db.delete(productCategories)
        .where(eq(productCategories.categoryId, categoryId))

      this.logAction('DELETE_CATEGORY', categoryId, existingCategory, null)
      return this.success(undefined, '分類刪除成功')

    } catch (error) {
      return this.handleDbError(error)
    }
  }

  // ============ 私有輔助方法 ============
  
  /**
   * 生成分類 slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)
  }

  /**
   * 檢查循環引用
   */
  private async checkCircularReference(categoryId: string, parentId: string): Promise<boolean> {
    let currentParentId: string | null = parentId
    const visited = new Set<string>()

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        return true // 檢測到循環
      }

      if (currentParentId === categoryId) {
        return true // 直接循環引用
      }

      visited.add(currentParentId)

      const [parent] = await this.db.select()
        .from(productCategories)
        .where(eq(productCategories.categoryId, currentParentId))

      if (!parent) {
        break
      }

      currentParentId = parent.parentId
    }

    return false
  }
}