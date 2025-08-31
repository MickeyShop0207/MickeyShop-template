/**
 * 資料庫連接和配置
 */

import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from './schema'

// 資料庫實例類型
export type Database = DrizzleD1Database<typeof schema>

/**
 * 創建資料庫連接
 */
export function createDatabase(d1: D1Database): Database {
  return drizzle(d1, { schema })
}

/**
 * 資料庫事務執行器
 */
export async function withTransaction<T>(
  db: Database,
  fn: (tx: Database) => Promise<T>
): Promise<T> {
  return await db.transaction(fn)
}

// 導出所有 schema
export * from './schema'
export { schema }