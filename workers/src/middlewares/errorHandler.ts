/**
 * 全局錯誤處理中間件
 */

import { ErrorHandler } from 'hono'

export const errorHandler: ErrorHandler = (err, c) => {
  console.error('錯誤發生:', {
    message: err.message,
    stack: err.stack,
    requestId: c.get('requestId'),
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString()
  })

  // 根據錯誤類型返回相應的狀態碼
  let status = 500
  let code = 'INTERNAL_SERVER_ERROR'
  let message = '伺服器內部錯誤'

  if (err.name === 'ValidationError') {
    status = 400
    code = 'VALIDATION_ERROR'
    message = '請求參數錯誤'
  } else if (err.name === 'UnauthorizedError') {
    status = 401
    code = 'UNAUTHORIZED'
    message = '未授權訪問'
  } else if (err.name === 'ForbiddenError') {
    status = 403
    code = 'FORBIDDEN'
    message = '權限不足'
  } else if (err.name === 'NotFoundError') {
    status = 404
    code = 'NOT_FOUND'
    message = '資源未找到'
  }

  return c.json({
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
      path: c.req.path,
      method: c.req.method
    }
  }, status)
}