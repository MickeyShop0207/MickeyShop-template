// 商品狀態管理 - Zustand Store
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { Product, Category, Brand, ProductSearchParams } from '../api/types'

export interface ProductState {
  // 商品數據
  products: Product[]
  currentProduct: Product | null
  categories: Category[]
  brands: Brand[]
  
  // 搜索和篩選
  searchParams: ProductSearchParams
  searchResults: Product[]
  
  // 推薦商品
  recommendedProducts: Product[]
  featuredProducts: Product[]
  newArrivals: Product[]
  
  // 加載狀態
  isLoading: boolean
  isSearching: boolean
  error: string | null
  
  // Actions - 商品管理
  setProducts: (products: Product[]) => void
  setCurrentProduct: (product: Product | null) => void
  updateProduct: (productId: string, updates: Partial<Product>) => void
  
  // Actions - 分類和品牌
  setCategories: (categories: Category[]) => void
  setBrands: (brands: Brand[]) => void
  
  // Actions - 搜索和篩選
  setSearchParams: (params: Partial<ProductSearchParams>) => void
  clearSearchParams: () => void
  setSearchResults: (results: Product[]) => void
  
  // Actions - 推薦商品
  setRecommendedProducts: (products: Product[]) => void
  setFeaturedProducts: (products: Product[]) => void
  setNewArrivals: (products: Product[]) => void
  
  // Actions - 狀態管理
  setLoading: (loading: boolean) => void
  setSearching: (searching: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Computed values
  getProductById: (id: string) => Product | undefined
  getProductsByCategory: (categoryId: string) => Product[]
  getProductsByBrand: (brandId: string) => Product[]
  getCategoryById: (id: string) => Category | undefined
  getBrandById: (id: string) => Brand | undefined
  
  // 價格範圍
  getPriceRange: () => { min: number; max: number }
  
  // 統計信息
  getProductStats: () => {
    total: number
    inStock: number
    outOfStock: number
    categories: number
    brands: number
  }
}

const initialSearchParams: ProductSearchParams = {
  page: 1,
  limit: 20,
  sort: 'created_desc'
}

export const useProductStore = create<ProductState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始狀態
      products: [],
      currentProduct: null,
      categories: [],
      brands: [],
      
      searchParams: initialSearchParams,
      searchResults: [],
      
      recommendedProducts: [],
      featuredProducts: [],
      newArrivals: [],
      
      isLoading: false,
      isSearching: false,
      error: null,
      
      // 商品管理
      setProducts: (products) => {
        set({ products, error: null })
      },
      
      setCurrentProduct: (product) => {
        set({ currentProduct: product })
      },
      
      updateProduct: (productId, updates) => {
        set((state) => ({
          products: state.products.map(product =>
            product.id === productId ? { ...product, ...updates } : product
          ),
          currentProduct: state.currentProduct?.id === productId
            ? { ...state.currentProduct, ...updates }
            : state.currentProduct
        }))
      },
      
      // 分類和品牌
      setCategories: (categories) => {
        set({ categories })
      },
      
      setBrands: (brands) => {
        set({ brands })
      },
      
      // 搜索和篩選
      setSearchParams: (params) => {
        set((state) => ({
          searchParams: { ...state.searchParams, ...params }
        }))
      },
      
      clearSearchParams: () => {
        set({ searchParams: initialSearchParams })
      },
      
      setSearchResults: (results) => {
        set({ searchResults: results, isSearching: false })
      },
      
      // 推薦商品
      setRecommendedProducts: (products) => {
        set({ recommendedProducts: products })
      },
      
      setFeaturedProducts: (products) => {
        set({ featuredProducts: products })
      },
      
      setNewArrivals: (products) => {
        set({ newArrivals: products })
      },
      
      // 狀態管理
      setLoading: (loading) => {
        set({ isLoading: loading })
      },
      
      setSearching: (searching) => {
        set({ isSearching: searching })
      },
      
      setError: (error) => {
        set({ error, isLoading: false, isSearching: false })
      },
      
      clearError: () => {
        set({ error: null })
      },
      
      // Computed values
      getProductById: (id) => {
        const { products } = get()
        return products.find(product => product.id === id)
      },
      
      getProductsByCategory: (categoryId) => {
        const { products } = get()
        return products.filter(product => product.categoryId === categoryId)
      },
      
      getProductsByBrand: (brandId) => {
        const { products } = get()
        return products.filter(product => product.brandId === brandId)
      },
      
      getCategoryById: (id) => {
        const { categories } = get()
        return categories.find(category => category.id === id)
      },
      
      getBrandById: (id) => {
        const { brands } = get()
        return brands.find(brand => brand.id === id)
      },
      
      getPriceRange: () => {
        const { products } = get()
        if (products.length === 0) {
          return { min: 0, max: 0 }
        }
        
        const prices = products.map(product => product.price)
        return {
          min: Math.min(...prices),
          max: Math.max(...prices)
        }
      },
      
      getProductStats: () => {
        const { products, categories, brands } = get()
        
        const inStock = products.filter(product => product.stock > 0).length
        const outOfStock = products.length - inStock
        
        return {
          total: products.length,
          inStock,
          outOfStock,
          categories: categories.length,
          brands: brands.length
        }
      }
    })),
    { name: 'product-store' }
  )
)

// 選擇器函數
export const productSelectors = {
  // 獲取所有商品
  products: (state: ProductState) => state.products,
  
  // 獲取當前商品
  currentProduct: (state: ProductState) => state.currentProduct,
  
  // 獲取搜索結果
  searchResults: (state: ProductState) => state.searchResults,
  
  // 獲取推薦商品
  recommendedProducts: (state: ProductState) => state.recommendedProducts,
  featuredProducts: (state: ProductState) => state.featuredProducts,
  newArrivals: (state: ProductState) => state.newArrivals,
  
  // 獲取分類和品牌
  categories: (state: ProductState) => state.categories,
  brands: (state: ProductState) => state.brands,
  
  // 獲取加載狀態
  isLoading: (state: ProductState) => state.isLoading,
  isSearching: (state: ProductState) => state.isSearching,
  error: (state: ProductState) => state.error,
  
  // 獲取搜索參數
  searchParams: (state: ProductState) => state.searchParams,
  
  // 計算屬性
  hasProducts: (state: ProductState) => state.products.length > 0,
  hasSearchResults: (state: ProductState) => state.searchResults.length > 0,
  hasError: (state: ProductState) => !!state.error,
  
  // 根據狀態獲取商品
  getActiveProducts: (state: ProductState) => 
    state.products.filter(product => product.status === 'active'),
  
  getInStockProducts: (state: ProductState) => 
    state.products.filter(product => product.stock > 0),
  
  getDiscountedProducts: (state: ProductState) => 
    state.products.filter(product => 
      product.originalPrice && product.originalPrice > product.price
    )
}

// 自定義 Hook
export const useProductSelectors = () => {
  const store = useProductStore()
  
  return {
    // 基礎選擇器
    products: useProductStore(productSelectors.products),
    currentProduct: useProductStore(productSelectors.currentProduct),
    searchResults: useProductStore(productSelectors.searchResults),
    categories: useProductStore(productSelectors.categories),
    brands: useProductStore(productSelectors.brands),
    
    // 狀態選擇器
    isLoading: useProductStore(productSelectors.isLoading),
    isSearching: useProductStore(productSelectors.isSearching),
    error: useProductStore(productSelectors.error),
    
    // 計算屬性
    hasProducts: useProductStore(productSelectors.hasProducts),
    hasSearchResults: useProductStore(productSelectors.hasSearchResults),
    hasError: useProductStore(productSelectors.hasError),
    
    // 動作
    ...store
  }
}