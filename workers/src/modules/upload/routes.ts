/**
 * 檔案上傳模組路由定義
 * 處理檔案上傳和管理相關的路由
 */

import { Hono } from 'hono'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { UploadController } from './uploadController'
import { authMiddleware } from '@/middlewares/auth'

export function createUploadRoutes(db: DrizzleD1Database, r2Bucket: R2Bucket) {
  const app = new Hono()
  const uploadController = new UploadController(db, r2Bucket)

  // ============ 檔案上傳路由 ============

  /**
   * 單檔上傳
   * POST /upload
   * 需要認證（客戶或管理員）
   */
  app.post('/upload', authMiddleware(), async (c) => {
    return await uploadController.uploadFile(c)
  })

  /**
   * 批量上傳
   * POST /upload/batch
   * 需要認證（客戶或管理員）
   */
  app.post('/upload/batch', authMiddleware(), async (c) => {
    return await uploadController.uploadFiles(c)
  })

  // ============ 檔案管理路由 ============

  /**
   * 獲取檔案列表
   * GET /files
   * 需要認證（一般用戶只能看到自己的檔案）
   */
  app.get('/files', authMiddleware(), async (c) => {
    return await uploadController.getFiles(c)
  })

  /**
   * 獲取檔案統計
   * GET /files/stats
   * 需要管理員權限
   */
  app.get('/files/stats', authMiddleware(), async (c) => {
    return await uploadController.getUploadStats(c)
  })

  /**
   * 檔案清理
   * POST /files/cleanup
   * 需要管理員權限
   */
  app.post('/files/cleanup', authMiddleware(), async (c) => {
    return await uploadController.cleanupFiles(c)
  })

  /**
   * 獲取單一檔案詳情
   * GET /files/:fileId
   * 需要認證（公開檔案可匿名訪問，私有檔案需權限驗證）
   */
  app.get('/files/:fileId', authMiddleware({ required: false }), async (c) => {
    return await uploadController.getFile(c)
  })

  /**
   * 更新檔案資訊
   * PATCH /files/:fileId
   * 需要認證（只有上傳者或管理員可以修改）
   */
  app.patch('/files/:fileId', authMiddleware(), async (c) => {
    return await uploadController.updateFile(c)
  })

  /**
   * 刪除單一檔案
   * DELETE /files/:fileId
   * 需要認證（只有上傳者或管理員可以刪除）
   */
  app.delete('/files/:fileId', authMiddleware(), async (c) => {
    return await uploadController.deleteFile(c)
  })

  /**
   * 批量刪除檔案
   * DELETE /files
   * 需要認證（只有上傳者或管理員可以刪除）
   */
  app.delete('/files', authMiddleware(), async (c) => {
    return await uploadController.deleteFiles(c)
  })

  // ============ 公開檔案存取路由 ============

  /**
   * 直接存取公開檔案（用於圖片顯示等）
   * GET /public/:category/*
   * 不需要認證
   */
  app.get('/public/:category/*', async (c) => {
    try {
      const category = c.req.param('category')
      const path = c.req.path.replace(`/public/${category}/`, '')
      
      // 構建 R2 存取路徑
      const key = `uploads/${category}/${path}`
      
      // 從 R2 獲取檔案
      const r2Bucket = c.env.R2_BUCKET as R2Bucket
      const object = await r2Bucket.get(key)
      
      if (!object) {
        return c.json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: '檔案不存在'
          }
        }, 404)
      }

      // 設置適當的快取標頭
      const headers = new Headers()
      headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      headers.set('ETag', object.etag)
      
      if (object.httpMetadata?.contentEncoding) {
        headers.set('Content-Encoding', object.httpMetadata.contentEncoding)
      }

      return new Response(object.body, {
        status: 200,
        headers
      })
    } catch (error) {
      console.error('Error serving public file:', error)
      return c.json({
        success: false,
        error: {
          code: 'FILE_ACCESS_ERROR',
          message: '檔案存取失敗'
        }
      }, 500)
    }
  })

  // ============ 特殊檔案處理路由 ============

  /**
   * 圖片縮圖處理
   * GET /images/:fileId/thumbnail/:size
   * 支援動態縮圖生成
   */
  app.get('/images/:fileId/thumbnail/:size', authMiddleware({ required: false }), async (c) => {
    try {
      const requestId = c.get('requestId')
      const fileId = c.req.param('fileId')
      const size = c.req.param('size') // 例如: "300x300", "thumbnail", "small", "medium", "large"

      if (!fileId) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '檔案 ID 不能為空'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 這裡可以實現動態縮圖生成
      // 暫時返回原圖或預設縮圖
      return c.json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: '動態縮圖功能尚未實現'
        },
        timestamp: new Date().toISOString(),
        requestId
      }, 501)
    } catch (error) {
      const requestId = c.get('requestId')
      return c.json({
        success: false,
        error: {
          code: 'THUMBNAIL_ERROR',
          message: '縮圖生成失敗'
        },
        timestamp: new Date().toISOString(),
        requestId
      }, 500)
    }
  })

  /**
   * 檔案預覽（用於文檔預覽等）
   * GET /preview/:fileId
   * 需要認證
   */
  app.get('/preview/:fileId', authMiddleware(), async (c) => {
    try {
      const requestId = c.get('requestId')
      const fileId = c.req.param('fileId')

      if (!fileId) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '檔案 ID 不能為空'
          },
          timestamp: new Date().toISOString(),
          requestId
        }, 400)
      }

      // 這裡可以實現檔案預覽功能
      return c.json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: '檔案預覽功能尚未實現'
        },
        timestamp: new Date().toISOString(),
        requestId
      }, 501)
    } catch (error) {
      const requestId = c.get('requestId')
      return c.json({
        success: false,
        error: {
          code: 'PREVIEW_ERROR',
          message: '檔案預覽失敗'
        },
        timestamp: new Date().toISOString(),
        requestId
      }, 500)
    }
  })

  return app
}

// 導出路由實例（供 public routes 使用）
export const uploadRoutes = new Hono()

// 在路由初始化時需要資料庫實例，這裡提供一個工廠函數
uploadRoutes.use('*', async (c, next) => {
  const db = c.get('db') as DrizzleD1Database
  const r2Bucket = c.env.R2_BUCKET as R2Bucket
  const routes = createUploadRoutes(db, r2Bucket)
  return routes.fetch(c.req.raw, c.env, c.executionCtx)
})