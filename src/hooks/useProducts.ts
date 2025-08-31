// 商品相關 Hooks
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { message } from 'antd'
import { productService } from '../api/services'
import type { 
  Product, 
  ProductSearchParams, 
  Category, 
  Brand, 
  ProductReview,
  CreateProductReviewRequest 
} from '../api/types'

// 查詢鍵
export const productQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (params?: ProductSearchParams) => [...productQueryKeys.lists(), params] as const,
  details: () => [...productQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productQueryKeys.details(), id] as const,
  recommended: ['products', 'recommended'] as const,
  featured: ['products', 'featured'] as const,
  newArrivals: ['products', 'new-arrivals'] as const,
  related: (id: string) => ['products', 'related', id] as const,
  reviews: (id: string) => ['products', 'reviews', id] as const,
  reviewStats: (id: string) => ['products', 'review-stats', id] as const,
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  categoryBySlug: (slug: string) => ['categories', 'slug', slug] as const,
  brands: ['brands'] as const,
  brand: (id: string) => ['brands', id] as const,
  brandBySlug: (slug: string) => ['brands', 'slug', slug] as const
}

/**
 * 使用商品列表 (分頁)
 */
export const useProducts = (params?: ProductSearchParams) => {
  return useQuery({
    queryKey: productQueryKeys.list(params),
    queryFn: () => productService.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5分鐘
    placeholderData: (previousData) => previousData
  })
}

/**
 * 使用商品列表 (無限滾動)
 */
export const useInfiniteProducts = (params?: Omit<ProductSearchParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: productQueryKeys.list(params),
    queryFn: ({ pageParam = 1 }) => 
      productService.getProducts({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage
      return pagination.hasNext ? pagination.page + 1 : undefined
    },
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 使用商品詳情
 */
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: productQueryKeys.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 根據 SKU 使用商品
 */
export const useProductBySku = (sku: string) => {
  return useQuery({
    queryKey: [...productQueryKeys.all, 'sku', sku],
    queryFn: () => productService.getProductBySku(sku),
    enabled: !!sku,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 使用推薦商品
 */
export const useRecommendedProducts = (limit = 8) => {
  return useQuery({
    queryKey: [...productQueryKeys.recommended, limit],
    queryFn: () => productService.getRecommendedProducts(limit),
    staleTime: 10 * 60 * 1000 // 10分鐘
  })
}

/**
 * 使用精選商品
 */
export const useFeaturedProducts = (limit = 8) => {
  return useQuery({
    queryKey: [...productQueryKeys.featured, limit],
    queryFn: () => productService.getFeaturedProducts(limit),
    staleTime: 10 * 60 * 1000
  })
}

/**
 * 使用新品
 */
export const useNewArrivals = (limit = 8) => {
  return useQuery({
    queryKey: [...productQueryKeys.newArrivals, limit],
    queryFn: () => productService.getNewArrivals(limit),
    staleTime: 10 * 60 * 1000
  })
}

/**
 * 使用相關商品
 */
export const useRelatedProducts = (productId: string, limit = 4) => {
  return useQuery({
    queryKey: [...productQueryKeys.related(productId), limit],
    queryFn: () => productService.getRelatedProducts(productId, limit),
    enabled: !!productId,
    staleTime: 10 * 60 * 1000
  })
}

/**
 * 使用商品搜索
 */
export const useProductSearch = (query: string, params?: Omit<ProductSearchParams, 'q'>) => {
  return useQuery({
    queryKey: [...productQueryKeys.lists(), 'search', query, params],
    queryFn: () => productService.searchProducts(query, params),
    enabled: !!query && query.length >= 2, // 至少2個字符才搜索
    staleTime: 2 * 60 * 1000, // 2分鐘
    placeholderData: (previousData) => previousData
  })
}

/**
 * 使用分類列表
 */
export const useCategories = () => {
  return useQuery({
    queryKey: productQueryKeys.categories,
    queryFn: productService.getCategories,
    staleTime: 30 * 60 * 1000 // 30分鐘
  })
}

/**
 * 使用分類詳情
 */
export const useCategory = (id: string) => {
  return useQuery({
    queryKey: productQueryKeys.category(id),
    queryFn: () => productService.getCategory(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000
  })
}

/**
 * 根據 slug 使用分類
 */
export const useCategoryBySlug = (slug: string) => {
  return useQuery({
    queryKey: productQueryKeys.categoryBySlug(slug),
    queryFn: () => productService.getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000
  })
}

/**
 * 使用分類下的商品
 */
export const useProductsByCategory = (
  categoryId: string, 
  params?: Omit<ProductSearchParams, 'categoryId'>
) => {
  return useQuery({
    queryKey: [...productQueryKeys.lists(), 'category', categoryId, params],
    queryFn: () => productService.getProductsByCategory(categoryId, params),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData
  })
}

/**
 * 使用品牌列表
 */
export const useBrands = () => {
  return useQuery({
    queryKey: productQueryKeys.brands,
    queryFn: productService.getBrands,
    staleTime: 30 * 60 * 1000
  })
}

/**
 * 使用品牌詳情
 */
export const useBrand = (id: string) => {
  return useQuery({
    queryKey: productQueryKeys.brand(id),
    queryFn: () => productService.getBrand(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000
  })
}

/**
 * 根據 slug 使用品牌
 */
export const useBrandBySlug = (slug: string) => {
  return useQuery({
    queryKey: productQueryKeys.brandBySlug(slug),
    queryFn: () => productService.getBrandBySlug(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000
  })
}

/**
 * 使用品牌下的商品
 */
export const useProductsByBrand = (
  brandId: string, 
  params?: Omit<ProductSearchParams, 'brandId'>
) => {
  return useQuery({
    queryKey: [...productQueryKeys.lists(), 'brand', brandId, params],
    queryFn: () => productService.getProductsByBrand(brandId, params),
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData
  })
}

/**
 * 使用商品評價
 */
export const useProductReviews = (
  productId: string,
  params?: { page?: number; limit?: number; sort?: string }
) => {
  return useQuery({
    queryKey: [...productQueryKeys.reviews(productId), params],
    queryFn: () => productService.getProductReviews(productId, params),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000
  })
}

/**
 * 使用商品評價統計
 */
export const useProductReviewStats = (productId: string) => {
  return useQuery({
    queryKey: productQueryKeys.reviewStats(productId),
    queryFn: () => productService.getProductReviewStats(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 使用創建商品評價
 */
export const useCreateProductReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductReviewRequest) => 
      productService.createProductReview(data),
    onSuccess: (newReview) => {
      message.success('評價提交成功，感謝您的分享！')
      
      // 更新評價列表
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.reviews(newReview.productId)
      })
      
      // 更新評價統計
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.reviewStats(newReview.productId)
      })
      
      // 更新商品詳情 (包含平均評分)
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.detail(newReview.productId)
      })
    },
    onError: (error: any) => {
      message.error(error.message || '評價提交失敗')
    }
  })
}

/**
 * 使用商品篩選選項 (從商品列表中提取)
 */
export const useProductFilters = (products?: Product[]) => {
  if (!products) return null

  // 價格範圍
  const priceRange = products.reduce((acc, product) => {
    return {
      min: Math.min(acc.min, product.price),
      max: Math.max(acc.max, product.price)
    }
  }, { min: Infinity, max: 0 })

  // 品牌選項
  const brands = Array.from(
    new Set(products.filter(p => p.brand).map(p => p.brand!))
  )

  // 分類選項
  const categories = Array.from(
    new Set(products.filter(p => p.category).map(p => p.category!))
  )

  // 標籤選項
  const tags = Array.from(
    new Set(products.flatMap(p => p.tags || []))
  )

  return {
    priceRange,
    brands,
    categories,
    tags
  }
}

/**
 * 商品數據預加載工具
 */
export const useProductPrefetch = () => {
  const queryClient = useQueryClient()

  const prefetchProduct = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: productQueryKeys.detail(id),
      queryFn: () => productService.getProduct(id),
      staleTime: 5 * 60 * 1000
    })
  }

  const prefetchCategory = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: productQueryKeys.category(id),
      queryFn: () => productService.getCategory(id),
      staleTime: 30 * 60 * 1000
    })
  }

  const prefetchBrand = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: productQueryKeys.brand(id),
      queryFn: () => productService.getBrand(id),
      staleTime: 30 * 60 * 1000
    })
  }

  return {
    prefetchProduct,
    prefetchCategory,
    prefetchBrand
  }
}