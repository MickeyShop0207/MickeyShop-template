/**
 * 管理員相關表結構定義
 * 統一管理員管理系統標準化實現
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'

// ============ 管理員用戶表 ============
export const adminUsers = sqliteTable('admin_users', {
  userId: text('user_id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  avatar: text('avatar'),
  phone: text('phone'),
  department: text('department'),
  position: text('position'),
  status: text('status').notNull().default('active'), // active, inactive, suspended, deleted
  loginCount: integer('login_count').default(0),
  lastLoginAt: text('last_login_at'),
  lastLoginIp: text('last_login_ip'),
  passwordChangedAt: text('password_changed_at').default(sql`(CURRENT_TIMESTAMP)`),
  emailVerifiedAt: text('email_verified_at'),
  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).default(false),
  twoFactorSecret: text('two_factor_secret'),
  preferences: text('preferences', { mode: 'json' }),
  metadata: text('metadata', { mode: 'json' }),
  createdBy: text('created_by'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedBy: text('updated_by'),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  deletedBy: text('deleted_by'),
  deletedAt: text('deleted_at')
}, (table) => ({
  usernameIdx: index('idx_admin_users_username').on(table.username),
  emailIdx: index('idx_admin_users_email').on(table.email),
  statusIdx: index('idx_admin_users_status').on(table.status),
  departmentIdx: index('idx_admin_users_department').on(table.department),
  createdAtIdx: index('idx_admin_users_created_at').on(table.createdAt),
  deletedAtIdx: index('idx_admin_users_deleted_at').on(table.deletedAt)
}))

// ============ 管理員會話表 ============
export const adminSessions = sqliteTable('admin_sessions', {
  sessionId: text('session_id').primaryKey(),
  userId: text('user_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  deviceId: text('device_id'),
  deviceName: text('device_name'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  location: text('location', { mode: 'json' }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastActivityAt: text('last_activity_at').default(sql`(CURRENT_TIMESTAMP)`),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  revokedAt: text('revoked_at'),
  revokedBy: text('revoked_by'),
  revokedReason: text('revoked_reason')
}, (table) => ({
  userIdx: index('idx_admin_sessions_user').on(table.userId),
  tokenIdx: index('idx_admin_sessions_token').on(table.tokenHash),
  activeIdx: index('idx_admin_sessions_active').on(table.isActive),
  expiresIdx: index('idx_admin_sessions_expires').on(table.expiresAt),
  activityIdx: index('idx_admin_sessions_activity').on(table.lastActivityAt)
}))

// ============ 管理員操作日誌表 ============
export const adminActivityLogs = sqliteTable('admin_activity_logs', {
  logId: text('log_id').primaryKey(),
  userId: text('user_id').notNull(),
  sessionId: text('session_id'),
  action: text('action').notNull(), // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW, EXPORT, etc.
  module: text('module').notNull(), // products, orders, users, settings, etc.
  resource: text('resource'), // specific resource ID
  description: text('description'),
  oldValue: text('old_value', { mode: 'json' }),
  newValue: text('new_value', { mode: 'json' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  success: integer('success', { mode: 'boolean' }).default(true),
  errorMessage: text('error_message'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  userIdx: index('idx_admin_activity_user').on(table.userId),
  sessionIdx: index('idx_admin_activity_session').on(table.sessionId),
  actionIdx: index('idx_admin_activity_action').on(table.action),
  moduleIdx: index('idx_admin_activity_module').on(table.module),
  createdAtIdx: index('idx_admin_activity_created_at').on(table.createdAt),
  successIdx: index('idx_admin_activity_success').on(table.success)
}))

// ============ 管理員安全事件表 ============
export const adminSecurityEvents = sqliteTable('admin_security_events', {
  eventId: text('event_id').primaryKey(),
  userId: text('user_id'),
  eventType: text('event_type').notNull(), // FAILED_LOGIN, SUSPICIOUS_ACTIVITY, PASSWORD_CHANGE, etc.
  severity: text('severity').notNull().default('low'), // low, medium, high, critical
  description: text('description').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  location: text('location', { mode: 'json' }),
  metadata: text('metadata', { mode: 'json' }),
  resolved: integer('resolved', { mode: 'boolean' }).default(false),
  resolvedBy: text('resolved_by'),
  resolvedAt: text('resolved_at'),
  resolution: text('resolution'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  userIdx: index('idx_admin_security_user').on(table.userId),
  eventTypeIdx: index('idx_admin_security_event_type').on(table.eventType),
  severityIdx: index('idx_admin_security_severity').on(table.severity),
  resolvedIdx: index('idx_admin_security_resolved').on(table.resolved),
  createdAtIdx: index('idx_admin_security_created_at').on(table.createdAt)
}))

// ============ 關聯定義 ============
export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
  activityLogs: many(adminActivityLogs),
  securityEvents: many(adminSecurityEvents)
}))

export const adminSessionsRelations = relations(adminSessions, ({ one, many }) => ({
  user: one(adminUsers, {
    fields: [adminSessions.userId],
    references: [adminUsers.userId]
  }),
  activityLogs: many(adminActivityLogs)
}))

export const adminActivityLogsRelations = relations(adminActivityLogs, ({ one }) => ({
  user: one(adminUsers, {
    fields: [adminActivityLogs.userId],
    references: [adminUsers.userId]
  }),
  session: one(adminSessions, {
    fields: [adminActivityLogs.sessionId],
    references: [adminSessions.sessionId]
  })
}))

export const adminSecurityEventsRelations = relations(adminSecurityEvents, ({ one }) => ({
  user: one(adminUsers, {
    fields: [adminSecurityEvents.userId],
    references: [adminUsers.userId]
  })
}))

// ============ 類型導出 ============
export type AdminUser = typeof adminUsers.$inferSelect
export type NewAdminUser = typeof adminUsers.$inferInsert

export type AdminSession = typeof adminSessions.$inferSelect
export type NewAdminSession = typeof adminSessions.$inferInsert

export type AdminActivityLog = typeof adminActivityLogs.$inferSelect
export type NewAdminActivityLog = typeof adminActivityLogs.$inferInsert

export type AdminSecurityEvent = typeof adminSecurityEvents.$inferSelect
export type NewAdminSecurityEvent = typeof adminSecurityEvents.$inferInsert