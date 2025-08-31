// API 服務統一導出
export { authService } from './authService'
export { productService } from './productService'
export { orderService } from './orderService'
export { memberService } from './memberService'
export { uploadService } from './uploadService'

// 導出類型
export type {
  // Auth Service
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AdminLoginRequest,
  VerifyPermissionRequest
} from './authService'

export type {
  // Product Service
  CreateProductRequest,
  CreateCategoryRequest,
  CreateBrandRequest,
  CreateProductReviewRequest
} from './productService'

export type {
  // Order Service
  AddToCartRequest,
  UpdateCartItemRequest,
  CartSummary,
  CheckoutRequest,
  CheckoutSession,
  ApplyCouponRequest,
  CouponValidation
} from './orderService'

export type {
  // Member Service
  CreateAddressRequest,
  UpdateAddressRequest,
  UpdateProfileRequest,
  AddToWishlistRequest,
  MemberStats
} from './memberService'

export type {
  // Upload Service
  UploadConfig,
  BatchUploadResponse,
  ImageProcessOptions
} from './uploadService'