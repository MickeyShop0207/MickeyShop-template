/**
 * 權限檢查 Hook
 * 提供便捷的權限檢查方法
 */

import { useAuthStore } from '@/stores/auth'
import type { Permission, AdminRole, PermissionCheck } from '@/types'

export const usePermission = () => {
  const { 
    hasPermission, 
    hasRole, 
    checkPermission,
    isAdmin,
    isSuperAdmin,
    getAccessibleMenus,
    user
  } = useAuthStore()

  /**
   * 檢查是否擁有指定權限
   */
  const can = (permissions: Permission | Permission[], requireAll = false): boolean => {
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
    return hasPermission(permissionArray, requireAll)
  }

  /**
   * 檢查是否擁有指定角色
   */
  const hasAnyRole = (roles: AdminRole | AdminRole[]): boolean => {
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return hasRole(roleArray)
  }

  /**
   * 檢查是否可以訪問指定菜單
   */
  const canAccessMenu = (menuName: string): boolean => {
    const accessibleMenus = getAccessibleMenus()
    return accessibleMenus.includes(menuName)
  }

  /**
   * 檢查複合權限條件
   */
  const canWithCheck = (check: PermissionCheck): boolean => {
    return checkPermission(check)
  }

  /**
   * 權限守衛 - 如果沒有權限則拋出錯誤
   */
  const guard = (permissions: Permission | Permission[], requireAll = false): void => {
    if (!can(permissions, requireAll)) {
      const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
      throw new Error(`權限不足，需要權限：${permissionArray.join(', ')}`)
    }
  }

  /**
   * 角色守衛 - 如果沒有角色則拋出錯誤
   */
  const guardRole = (roles: AdminRole | AdminRole[]): void => {
    if (!hasAnyRole(roles)) {
      const roleArray = Array.isArray(roles) ? roles : [roles]
      throw new Error(`角色權限不足，需要角色：${roleArray.join(', ')}`)
    }
  }

  /**
   * 管理員守衛 - 如果不是管理員則拋出錯誤
   */
  const guardAdmin = (): void => {
    if (!isAdmin()) {
      throw new Error('需要管理員權限')
    }
  }

  /**
   * 超級管理員守衛 - 如果不是超級管理員則拋出錯誤
   */
  const guardSuperAdmin = (): void => {
    if (!isSuperAdmin()) {
      throw new Error('需要超級管理員權限')
    }
  }

  return {
    // 基礎權限檢查
    can,
    hasAnyRole,
    canAccessMenu,
    canWithCheck,
    
    // 身份檢查
    isAdmin,
    isSuperAdmin,
    
    // 守衛方法
    guard,
    guardRole,
    guardAdmin,
    guardSuperAdmin,
    
    // 用戶信息
    user,
    
    // 可訪問的菜單列表
    accessibleMenus: getAccessibleMenus(),
  }
}

export default usePermission