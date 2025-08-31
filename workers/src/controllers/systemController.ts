/**
 * 系統控制器
 * 處理系統相關的 API 端點
 */

import { Context } from 'hono'
import { sql } from 'drizzle-orm'
import { BaseController } from '@/shared/services/baseController'
import { createDatabase } from '@/core/database'

export class SystemController extends BaseController {
  /**
   * 系統健康檢查
   */
  async healthCheck(c: Context): Promise<Response> {
    try {
      const startTime = Date.now()
      
      // 檢查資料庫連接
      let dbStatus = 'unknown'
      let dbLatency = 0
      
      try {
        const db = createDatabase(c.env.DB)
        const dbStart = Date.now()
        
        // 執行簡單查詢來測試資料庫連接
        await db.run(sql`SELECT 1`)
        
        dbLatency = Date.now() - dbStart
        dbStatus = 'connected'
      } catch (error) {
        dbStatus = 'disconnected'
        console.error('Database health check failed:', error)
      }

      // 檢查 KV 快取
      let cacheStatus = 'unknown'
      let cacheLatency = 0
      
      try {
        if (c.env.CACHE) {
          const cacheStart = Date.now()
          await c.env.CACHE.put('health_check', Date.now().toString(), { expirationTtl: 60 })
          await c.env.CACHE.get('health_check')
          cacheLatency = Date.now() - cacheStart
          cacheStatus = 'connected'
        } else {
          cacheStatus = 'not_configured'
        }
      } catch (error) {
        cacheStatus = 'disconnected'
        console.error('Cache health check failed:', error)
      }

      // 檢查 R2 儲存
      let storageStatus = 'unknown'
      let storageLatency = 0
      
      try {
        if (c.env.STORAGE) {
          const storageStart = Date.now()
          const testKey = `health-check-${Date.now()}`
          await c.env.STORAGE.put(testKey, 'health check')
          await c.env.STORAGE.delete(testKey)
          storageLatency = Date.now() - storageStart
          storageStatus = 'connected'
        } else {
          storageStatus = 'not_configured'
        }
      } catch (error) {
        storageStatus = 'disconnected'
        console.error('Storage health check failed:', error)
      }

      const totalLatency = Date.now() - startTime

      // 判斷整體健康狀態
      const isHealthy = dbStatus === 'connected' && 
                       (cacheStatus === 'connected' || cacheStatus === 'not_configured') &&
                       (storageStatus === 'connected' || storageStatus === 'not_configured')

      const healthData = {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: c.env.NODE_ENV || 'development',
        version: c.env.API_VERSION || 'v1',
        services: {
          database: {
            status: dbStatus,
            latency: `${dbLatency}ms`
          },
          cache: {
            status: cacheStatus,
            latency: `${cacheLatency}ms`
          },
          storage: {
            status: storageStatus,
            latency: `${storageLatency}ms`
          }
        },
        performance: {
          totalLatency: `${totalLatency}ms`,
          memory: process.memoryUsage ? process.memoryUsage() : 'unavailable'
        }
      }

      const statusCode = isHealthy ? 200 : 503
      return this.success(c, healthData, undefined, statusCode)

    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * 系統信息
   */
  async getSystemInfo(c: Context): Promise<Response> {
    try {
      const systemInfo = {
        name: 'MickeyShop Beauty API',
        version: c.env.API_VERSION || 'v1',
        environment: c.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime ? `${process.uptime()}s` : 'unavailable',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        features: {
          authentication: true,
          authorization: true,
          rateLimit: true,
          logging: true,
          caching: !!c.env.CACHE,
          fileStorage: !!c.env.STORAGE,
          database: !!c.env.DB
        }
      }

      return this.success(c, systemInfo)
    } catch (error) {
      return this.handleError(c, error)
    }
  }

  /**
   * API 版本信息
   */
  async getVersionInfo(c: Context): Promise<Response> {
    try {
      const versionInfo = {
        api: {
          version: c.env.API_VERSION || 'v1',
          name: 'MickeyShop Beauty API',
          description: 'Beauty e-commerce platform API'
        },
        endpoints: {
          public: '/api/v1',
          admin: '/api/admin/v1',
          system: '/api/system/v1'
        },
        documentation: {
          swagger: '/docs',
          postman: '/docs/postman'
        },
        support: {
          contact: 'support@mickeyshop.com',
          documentation: 'https://docs.mickeyshop.com'
        }
      }

      return this.success(c, versionInfo)
    } catch (error) {
      return this.handleError(c, error)
    }
  }
}

// 創建控制器實例
export const systemController = new SystemController()