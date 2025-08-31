/**
 * 中間件統一導出
 */

// 核心中間件
export { errorHandler } from './errorHandler'
export { requestIdMiddleware } from './requestId'
export { rateLimitMiddleware } from './rateLimit'
export { corsMiddleware } from './cors'

// 驗證中間件
export {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
  commonSchemas,
  ValidationError
} from './validation'

// 認證授權中間件
export {
  authenticateToken,
  requirePermissions,
  requireRoles,
  requireAdmin,
  requireSuperAdmin,
  optionalAuth,
  UnauthorizedError,
  ForbiddenError
} from './auth'

// 日誌中間件
export {
  Logger,
  LogLevel,
  logger,
  requestLogging,
  errorLogging,
  performanceLogging
} from './logging'

// 中間件類型
export type { LogEntry } from './logging'
export type { AuthUser } from './auth'
export type { CorsOptions } from './cors'