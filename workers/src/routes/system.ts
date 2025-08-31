/**
 * 系統 API 路由
 * 路徑前綴: /api/system/v1
 */

import { Hono } from 'hono'
import type { Env } from '../index'
import { systemController } from '@/controllers/systemController'

export const systemRoutes = new Hono<{ Bindings: Env }>()

// ============ 健康檢查 ============
systemRoutes.get('/health', systemController.healthCheck.bind(systemController))

// ============ 系統狀態 ============
systemRoutes.get('/status', systemController.healthCheck.bind(systemController)) // 使用同一個健康檢查方法

// ============ 系統信息 ============
systemRoutes.get('/info', systemController.getSystemInfo.bind(systemController))

// ============ 版本資訊 ============
systemRoutes.get('/version', systemController.getVersionInfo.bind(systemController))