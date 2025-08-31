/**
 * 系統相關表結構定義
 * 統一系統管理標準化實現
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'

// ============ 系統設定表 ============
export const systemSettings = sqliteTable('system_settings', {
  settingId: text('setting_id').primaryKey(),
  category: text('category').notNull(), // general, payment, shipping, email, etc.
  key: text('key').notNull(),
  value: text('value'),
  defaultValue: text('default_value'),
  type: text('type').notNull().default('string'), // string, number, boolean, json, text
  description: text('description'),
  isEditable: integer('is_editable', { mode: 'boolean' }).default(true),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false), // Can be accessed by frontend
  validationRules: text('validation_rules', { mode: 'json' }),
  options: text('options', { mode: 'json' }), // For select/radio options
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedBy: text('updated_by')
}, (table) => ({
  categoryIdx: index('idx_system_settings_category').on(table.category),
  keyIdx: index('idx_system_settings_key').on(table.key),
  publicIdx: index('idx_system_settings_public').on(table.isPublic),
  uniqueCategoryKey: index('idx_system_settings_category_key').on(table.category, table.key)
}))

// ============ 系統任務/作業表 ============
export const systemTasks = sqliteTable('system_tasks', {
  taskId: text('task_id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // cron, queue, immediate, scheduled
  status: text('status').notNull().default('pending'), // pending, running, completed, failed, cancelled
  priority: integer('priority').default(0), // 0=normal, 1=high, -1=low
  cronExpression: text('cron_expression'), // For cron tasks
  scheduledAt: text('scheduled_at'), // For scheduled tasks
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  failedAt: text('failed_at'),
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  timeout: integer('timeout').default(300), // seconds
  payload: text('payload', { mode: 'json' }),
  result: text('result', { mode: 'json' }),
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  progress: integer('progress').default(0), // 0-100 percentage
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  typeIdx: index('idx_system_tasks_type').on(table.type),
  statusIdx: index('idx_system_tasks_status').on(table.status),
  priorityIdx: index('idx_system_tasks_priority').on(table.priority),
  scheduledAtIdx: index('idx_system_tasks_scheduled_at').on(table.scheduledAt),
  createdAtIdx: index('idx_system_tasks_created_at').on(table.createdAt),
  cronIdx: index('idx_system_tasks_cron').on(table.cronExpression)
}))

// ============ 系統通知表 ============
export const systemNotifications = sqliteTable('system_notifications', {
  notificationId: text('notification_id').primaryKey(),
  type: text('type').notNull(), // email, sms, push, webhook, slack
  channel: text('channel'), // Specific channel/endpoint
  recipient: text('recipient').notNull(), // email address, phone number, user ID, etc.
  subject: text('subject'),
  message: text('message').notNull(),
  templateId: text('template_id'),
  templateData: text('template_data', { mode: 'json' }),
  status: text('status').notNull().default('pending'), // pending, sent, failed, cancelled
  priority: integer('priority').default(0),
  scheduledAt: text('scheduled_at'),
  sentAt: text('sent_at'),
  failedAt: text('failed_at'),
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  errorMessage: text('error_message'),
  response: text('response', { mode: 'json' }),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  typeIdx: index('idx_system_notifications_type').on(table.type),
  statusIdx: index('idx_system_notifications_status').on(table.status),
  recipientIdx: index('idx_system_notifications_recipient').on(table.recipient),
  scheduledAtIdx: index('idx_system_notifications_scheduled_at').on(table.scheduledAt),
  createdAtIdx: index('idx_system_notifications_created_at').on(table.createdAt),
  priorityIdx: index('idx_system_notifications_priority').on(table.priority)
}))

// ============ 系統日誌表 ============
export const systemLogs = sqliteTable('system_logs', {
  logId: text('log_id').primaryKey(),
  level: text('level').notNull(), // error, warn, info, debug
  category: text('category'), // api, auth, payment, email, etc.
  message: text('message').notNull(),
  context: text('context', { mode: 'json' }),
  userId: text('user_id'),
  userType: text('user_type'), // admin, customer
  sessionId: text('session_id'),
  requestId: text('request_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  method: text('method'), // HTTP method
  url: text('url'),
  statusCode: integer('status_code'),
  responseTime: integer('response_time'), // milliseconds
  errorStack: text('error_stack'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  levelIdx: index('idx_system_logs_level').on(table.level),
  categoryIdx: index('idx_system_logs_category').on(table.category),
  userIdx: index('idx_system_logs_user').on(table.userId),
  requestIdx: index('idx_system_logs_request').on(table.requestId),
  createdAtIdx: index('idx_system_logs_created_at').on(table.createdAt),
  statusCodeIdx: index('idx_system_logs_status_code').on(table.statusCode)
}))

// ============ 系統快取表 ============
export const systemCache = sqliteTable('system_cache', {
  cacheId: text('cache_id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  tags: text('tags', { mode: 'json' }), // Array of tags for cache invalidation
  expiresAt: text('expires_at'),
  isCompressed: integer('is_compressed', { mode: 'boolean' }).default(false),
  hitCount: integer('hit_count').default(0),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  lastAccessedAt: text('last_accessed_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  keyIdx: index('idx_system_cache_key').on(table.key),
  expiresAtIdx: index('idx_system_cache_expires_at').on(table.expiresAt),
  createdAtIdx: index('idx_system_cache_created_at').on(table.createdAt),
  lastAccessedIdx: index('idx_system_cache_last_accessed').on(table.lastAccessedAt)
}))

// ============ 系統統計表 ============
export const systemStats = sqliteTable('system_stats', {
  statId: text('stat_id').primaryKey(),
  metric: text('metric').notNull(), // orders, revenue, users, products, etc.
  period: text('period').notNull(), // hour, day, week, month, year
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  value: real('value').notNull(),
  count: integer('count').default(0),
  data: text('data', { mode: 'json' }), // Additional metric data
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  metricIdx: index('idx_system_stats_metric').on(table.metric),
  periodIdx: index('idx_system_stats_period').on(table.period),
  periodStartIdx: index('idx_system_stats_period_start').on(table.periodStart),
  metricPeriodIdx: index('idx_system_stats_metric_period').on(table.metric, table.period, table.periodStart)
}))

// ============ 關聯定義 ============
export const systemSettingsRelations = relations(systemSettings, ({ many }) => ({
  // System settings don't have direct relations, but could be linked to change logs
}))

export const systemTasksRelations = relations(systemTasks, ({ many }) => ({
  // Tasks don't have direct relations in this basic setup
}))

export const systemNotificationsRelations = relations(systemNotifications, ({ one }) => ({
  // Could link to users if needed
}))

export const systemLogsRelations = relations(systemLogs, ({ one }) => ({
  // Could link to users/sessions if needed
}))

// ============ 類型導出 ============
export type SystemSetting = typeof systemSettings.$inferSelect
export type NewSystemSetting = typeof systemSettings.$inferInsert

export type SystemTask = typeof systemTasks.$inferSelect
export type NewSystemTask = typeof systemTasks.$inferInsert

export type SystemNotification = typeof systemNotifications.$inferSelect
export type NewSystemNotification = typeof systemNotifications.$inferInsert

export type SystemLog = typeof systemLogs.$inferSelect
export type NewSystemLog = typeof systemLogs.$inferInsert

export type SystemCache = typeof systemCache.$inferSelect
export type NewSystemCache = typeof systemCache.$inferInsert

export type SystemStat = typeof systemStats.$inferSelect
export type NewSystemStat = typeof systemStats.$inferInsert