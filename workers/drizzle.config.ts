/**
 * Drizzle ORM 配置文件
 */

import type { Config } from 'drizzle-kit'

export default {
  schema: './src/core/database/schema/index.ts',
  out: './migrations',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: './wrangler.toml',
    dbName: 'mickeyshop-beauty-dev'
  },
  verbose: true,
  strict: true
} satisfies Config