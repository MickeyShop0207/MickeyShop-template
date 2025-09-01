/**
 * 路由守衛和權限檢查工具函數
 */

import type { AdminRole, Permission, JWTPayload, PermissionCheck, AdminUser } from '@/types'

/**
 * 解析 JWT Token 獲取 payload (不驗證簽名，僅解析)
 */
export const parseJWTPayload = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    return payload as JWTPayload
  } catch (error) {
    console.error('JWT Token 解析失敗:', error)
    return null
  }
}

/**
 * 檢查 JWT Token 是否過期
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = parseJWTPayload(token)
  if (!payload) return true
  
  return Date.now() >= payload.exp * 1000
}

/**
 * 角色權限映射表
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    // 超級管理員：全系統權限
    'product:read', 'product:write', 'product:delete',
    'category:read', 'category:write', 'category:delete',
    'brand:read', 'brand:write', 'brand:delete',
    'inventory:read', 'inventory:write', 'inventory:adjust',
    'order:read', 'order:write', 'order:delete', 'order:process', 'order:ship', 'order:cancel', 'order:refund', 'order:return',
    'member:read', 'member:write', 'member:delete', 'member:suspend', 'member:activate',
    'content:read', 'content:write', 'content:delete',
    'banner:read', 'banner:write', 'banner:delete',
    'promotion:read', 'promotion:write', 'promotion:delete',
    'coupon:read', 'coupon:write', 'coupon:delete',
    'analytics:read', 'analytics:export',
    'report:read', 'report:export',
    'system:read', 'system:write',
    'user:read', 'user:write', 'user:delete',
    'role:read', 'role:write', 'role:assign',
    'audit:read', 'backup:create', 'backup:restore'
  ],
  
  admin: [
    // 管理員：業務管理權限
    'product:read', 'product:write', 'product:delete',
    'category:read', 'category:write', 'category:delete',
    'brand:read', 'brand:write', 'brand:delete',
    'inventory:read', 'inventory:write', 'inventory:adjust',
    'order:read', 'order:write', 'order:process', 'order:ship', 'order:cancel', 'order:refund', 'order:return',
    'member:read', 'member:write', 'member:suspend', 'member:activate',
    'content:read', 'content:write', 'content:delete',
    'banner:read', 'banner:write', 'banner:delete',
    'promotion:read', 'promotion:write', 'promotion:delete',
    'coupon:read', 'coupon:write', 'coupon:delete',
    'analytics:read', 'analytics:export',
    'report:read', 'report:export'
  ],
  
  customer_service: [
    // 客服人員：客戶服務權限
    'product:read',
    'category:read',
    'brand:read',
    'inventory:read',
    'order:read', 'order:write', 'order:process', 'order:cancel', 'order:refund', 'order:return',
    'member:read', 'member:write'
  ],
  
  warehouse_staff: [
    // 倉庫人員：庫存物流權限
    'product:read',
    'inventory:read', 'inventory:write', 'inventory:adjust',
    'order:read', 'order:process', 'order:ship'
  ],
  
  content_editor: [
    // 內容編輯：內容管理權限
    'product:read', 'product:write',
    'category:read', 'category:write',
    'brand:read', 'brand:write',
    'content:read', 'content:write', 'content:delete',
    'banner:read', 'banner:write', 'banner:delete',
    'promotion:read', 'promotion:write',
    'coupon:read', 'coupon:write'
  ]
}

/**
 * 根據角色獲取權限列表
 */
export const getPermissionsByRoles = (roles: AdminRole[]): Permission[] => {
  const permissions = new Set<Permission>()
  
  roles.forEach(role => {
    ROLE_PERMISSIONS[role]?.forEach(permission => {
      permissions.add(permission)
    })
  })
  
  return Array.from(permissions)
}

/**
 * 檢查用戶是否擁有指定權限
 */
export const hasPermission = (
  userPermissions: Permission[], 
  requiredPermissions: Permission[], 
  requireAll: boolean = false
): boolean => {
  if (requiredPermissions.length === 0) return true
  
  const hasPermissions = requiredPermissions.map(permission => 
    userPermissions.includes(permission)
  )
  
  return requireAll 
    ? hasPermissions.every(Boolean)  // 所有權限都要有 (AND)
    : hasPermissions.some(Boolean)   // 只要有一個權限 (OR)
}

/**
 * 檢查用戶是否擁有指定角色
 */
export const hasRole = (userRoles: AdminRole[], requiredRoles: AdminRole[]): boolean => {
  if (requiredRoles.length === 0) return true
  
  return requiredRoles.some(role => userRoles.includes(role))
}

/**
 * 綜合權限檢查
 */
export const checkPermission = (
  user: AdminUser | null, 
  check: PermissionCheck
): boolean => {
  if (!user || !user.isActive) return false
  
  // 檢查角色 (如果指定)
  if (check.roles && check.roles.length > 0) {
    if (!hasRole(user.roles, check.roles)) return false
  }
  
  // 檢查權限
  const userPermissions = user.permissions || getPermissionsByRoles(user.roles)
  return hasPermission(userPermissions, check.permissions, check.requireAll)
}

/**
 * 檢查用戶是否為超級管理員
 */
export const isSuperAdmin = (user: AdminUser | null): boolean => {
  return user?.roles.includes('super_admin') ?? false
}

/**
 * 檢查用戶是否為管理員 (包含超級管理員)
 */
export const isAdmin = (user: AdminUser | null): boolean => {
  return user?.roles.some(role => ['super_admin', 'admin'].includes(role)) ?? false
}

/**
 * 獲取用戶可訪問的菜單權限
 */
export const getAccessibleMenus = (user: AdminUser | null): string[] => {
  if (!user || !user.isActive) return []
  
  const permissions = user.permissions || getPermissionsByRoles(user.roles)
  const menus: string[] = []
  
  // 商品管理
  if (permissions.some(p => p.startsWith('product:') || p.startsWith('category:') || p.startsWith('brand:'))) {
    menus.push('products')
  }
  
  // 庫存管理
  if (permissions.some(p => p.startsWith('inventory:'))) {
    menus.push('inventory')
  }
  
  // 訂單管理
  if (permissions.some(p => p.startsWith('order:'))) {
    menus.push('orders')
  }
  
  // 會員管理
  if (permissions.some(p => p.startsWith('member:'))) {
    menus.push('members')
  }
  
  // 內容管理
  if (permissions.some(p => p.startsWith('content:') || p.startsWith('banner:'))) {
    menus.push('content')
  }
  
  // 促銷活動
  if (permissions.some(p => p.startsWith('promotion:') || p.startsWith('coupon:'))) {
    menus.push('promotions')
  }
  
  // 報表分析
  if (permissions.some(p => p.startsWith('analytics:') || p.startsWith('report:'))) {
    menus.push('analytics')
  }
  
  // 系統管理
  if (permissions.some(p => p.startsWith('system:') || p.startsWith('user:') || p.startsWith('role:'))) {
    menus.push('system')
  }
  
  return menus
}

/**
 * 權限錯誤類型
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public requiredPermissions: Permission[],
    public userPermissions: Permission[]
  ) {
    super(message)
    this.name = 'PermissionError'
  }
}

/**
 * 權限裝飾器 (用於 Hook 或組件)
 */
export const requirePermissions = (
  permissions: Permission[],
  requireAll: boolean = false
) => {
  return (user: AdminUser | null): boolean => {
    return checkPermission(user, { permissions, requireAll })
  }
}

/**
 * 角色裝飾器
 */
export const requireRoles = (roles: AdminRole[]) => {
  return (user: AdminUser | null): boolean => {
    return hasRole(user?.roles || [], roles)
  }
}