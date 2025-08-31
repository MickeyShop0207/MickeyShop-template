// Hooks 統一導出
export * from './useAuth'
export * from './useProducts'
export * from './useCart'
export * from './useOrders'
export * from './useMembers'
export * from './useLocalStorage'
export * from './useDebounce'

// 通用工具 Hooks
export { useLocalStorage, useSessionStorage } from './useLocalStorage'
export { 
  useDebounce, 
  useDebounceCallback, 
  useDebounceSearch,
  useDebounceState,
  useDebounceAsync,
  useDebounceInput,
  useDebounceEffect
} from './useDebounce'

// 認證相關 Hooks
export {
  useAuth,
  useLogin,
  useRegister,
  useForgotPassword,
  useResetPassword,
  useEmailVerification,
  useAdminAuth
} from './useAuth'

// 商品相關 Hooks
export {
  useProducts,
  useInfiniteProducts,
  useProduct,
  useProductBySku,
  useRecommendedProducts,
  useFeaturedProducts,
  useNewArrivals,
  useRelatedProducts,
  useProductSearch,
  useCategories,
  useCategory,
  useCategoryBySlug,
  useProductsByCategory,
  useBrands,
  useBrand,
  useBrandBySlug,
  useProductsByBrand,
  useProductReviews,
  useProductReviewStats,
  useCreateProductReview,
  useProductFilters,
  useProductPrefetch
} from './useProducts'

// 購物車相關 Hooks
export {
  useCart,
  useCartItem,
  useQuickAddToCart,
  useCartStats
} from './useCart'

// 訂單相關 Hooks
export {
  useOrders,
  useInfiniteOrders,
  useOrder,
  useOrderByNumber,
  useOrderTracking,
  useAvailableCoupons,
  useValidateCoupon,
  useApplyCoupon,
  useRemoveCoupon,
  useCalculateShipping,
  useCreateCheckout,
  useConfirmOrder,
  useCancelOrder,
  useConfirmDelivery,
  useRequestRefund,
  useReorder,
  useDownloadInvoice,
  useOrderStats,
  useOrderPrefetch
} from './useOrders'

// 會員相關 Hooks
export {
  useMemberProfile,
  useMemberStats,
  useMemberTierRules,
  useMemberAddresses,
  useMemberAddress,
  useDefaultAddress,
  useWishlist,
  useIsInWishlist,
  usePointsHistory,
  useRedeemableRewards,
  useRedeemPoints,
  useNotifications,
  useUnreadNotificationCount,
  useWishlistToggle
} from './useMembers'