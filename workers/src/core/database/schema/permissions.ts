/**
 * 權限管理相關表結構定義
 * 統一權限管理體系標準化實現
 */

import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'

// ============ 權限表 ============
export const permissions = sqliteTable('permissions', {
  permissionId: text('permission_id').primaryKey(),
  permissionName: text('permission_name').notNull().unique(),
  module: text('module').notNull(),
  operation: text('operation').notNull(),
  resource: text('resource'),
  description: text('description'),
  isSystemPermission: integer('is_system_permission', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  moduleIdx: index('idx_permissions_module').on(table.module),
  operationIdx: index('idx_permissions_operation').on(table.operation),
  systemPermissionIdx: index('idx_permissions_system').on(table.isSystemPermission)
}))

// ============ 角色表 ============
export const roles = sqliteTable('roles', {
  roleId: text('role_id').primaryKey(),
  roleName: text('role_name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  roleType: text('role_type').notNull().default('custom'), // super_admin, admin, manager, operator, viewer, custom
  isSystemRole: integer('is_system_role', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  roleNameIdx: index('idx_roles_role_name').on(table.roleName),
  roleTypeIdx: index('idx_roles_role_type').on(table.roleType),
  systemRoleIdx: index('idx_roles_system').on(table.isSystemRole),
  activeIdx: index('idx_roles_active').on(table.isActive)
}))

// ============ 角色權限關聯表 ============
export const rolePermissions = sqliteTable('role_permissions', {
  roleId: text('role_id').notNull(),
  permissionId: text('permission_id').notNull(),
  grantedBy: text('granted_by'),
  grantedAt: text('granted_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  roleIdx: index('idx_role_permissions_role').on(table.roleId),
  permissionIdx: index('idx_role_permissions_permission').on(table.permissionId)
}))

// ============ 用戶角色關聯表 ============
export const userRoles = sqliteTable('user_roles', {
  userRoleId: text('user_role_id').primaryKey(),
  userId: text('user_id').notNull(),
  roleId: text('role_id').notNull(),
  grantedBy: text('granted_by'),
  grantedAt: text('granted_at').default(sql`(CURRENT_TIMESTAMP)`),
  expiresAt: text('expires_at'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  revokedBy: text('revoked_by'),
  revokedAt: text('revoked_at'),
  metadata: text('metadata', { mode: 'json' })
}, (table) => ({
  userIdx: index('idx_user_roles_user').on(table.userId),
  roleIdx: index('idx_user_roles_role').on(table.roleId),
  activeIdx: index('idx_user_roles_active').on(table.isActive),
  expiresIdx: index('idx_user_roles_expires').on(table.expiresAt)
}))

// ============ 用戶直接權限表 ============
export const userPermissions = sqliteTable('user_permissions', {
  userPermissionId: text('user_permission_id').primaryKey(),
  userId: text('user_id').notNull(),
  permissionId: text('permission_id').notNull(),
  grantedBy: text('granted_by'),
  grantedAt: text('granted_at').default(sql`(CURRENT_TIMESTAMP)`),
  expiresAt: text('expires_at'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  isDenied: integer('is_denied', { mode: 'boolean' }).default(false),
  source: text('source').notNull().default('direct'), // role, direct, temporary
  revokedBy: text('revoked_by'),
  revokedAt: text('revoked_at')
}, (table) => ({
  userIdx: index('idx_user_permissions_user').on(table.userId),
  permissionIdx: index('idx_user_permissions_permission').on(table.permissionId),
  activeIdx: index('idx_user_permissions_active').on(table.isActive),
  deniedIdx: index('idx_user_permissions_denied').on(table.isDenied),
  expiresIdx: index('idx_user_permissions_expires').on(table.expiresAt)
}))

// ============ 權限變更日誌表 ============
export const permissionChangeLogs = sqliteTable('permission_change_logs', {
  logId: text('log_id').primaryKey(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(), // ROLE_GRANTED, ROLE_REVOKED, PERMISSION_GRANTED, PERMISSION_REVOKED
  roleId: text('role_id'),
  permissionId: text('permission_id'),
  oldValue: text('old_value', { mode: 'json' }),
  newValue: text('new_value', { mode: 'json' }),
  changedBy: text('changed_by'),
  changedAt: text('changed_at').default(sql`(CURRENT_TIMESTAMP)`),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  reason: text('reason')
}, (table) => ({
  userIdx: index('idx_permission_logs_user').on(table.userId),
  actionIdx: index('idx_permission_logs_action').on(table.action),
  changedAtIdx: index('idx_permission_logs_changed_at').on(table.changedAt)
}))

// ============ 關聯定義 ============
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userPermissions: many(userPermissions),
  changeLogs: many(permissionChangeLogs)
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
  changeLogs: many(permissionChangeLogs)
}))

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.roleId]
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.permissionId]
  })
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.roleId]
  })
}))

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  permission: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.permissionId]
  })
}))

// ============ 類型導出 ============
export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert

export type RolePermission = typeof rolePermissions.$inferSelect
export type NewRolePermission = typeof rolePermissions.$inferInsert

export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert

export type UserPermission = typeof userPermissions.$inferSelect
export type NewUserPermission = typeof userPermissions.$inferInsert

export type PermissionChangeLog = typeof permissionChangeLogs.$inferSelect
export type NewPermissionChangeLog = typeof permissionChangeLogs.$inferInsert