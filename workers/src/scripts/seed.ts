/**
 * 資料庫種子數據腳本
 */

import { generateId } from '@/utils/common'

/**
 * 系統基礎權限數據
 */
const basicPermissions = [
  // 系統管理
  { module: 'system', operation: 'read', resource: 'settings', description: '查看系統設定' },
  { module: 'system', operation: 'write', resource: 'settings', description: '修改系統設定' },
  { module: 'system', operation: 'read', resource: 'logs', description: '查看系統日誌' },
  
  // 用戶管理
  { module: 'users', operation: 'read', resource: 'admin', description: '查看管理員' },
  { module: 'users', operation: 'write', resource: 'admin', description: '管理管理員' },
  { module: 'users', operation: 'delete', resource: 'admin', description: '刪除管理員' },
  { module: 'users', operation: 'read', resource: 'customer', description: '查看客戶' },
  { module: 'users', operation: 'write', resource: 'customer', description: '管理客戶' },
  
  // 商品管理
  { module: 'products', operation: 'read', resource: 'product', description: '查看商品' },
  { module: 'products', operation: 'write', resource: 'product', description: '管理商品' },
  { module: 'products', operation: 'delete', resource: 'product', description: '刪除商品' },
  { module: 'products', operation: 'read', resource: 'category', description: '查看分類' },
  { module: 'products', operation: 'write', resource: 'category', description: '管理分類' },
  
  // 訂單管理
  { module: 'orders', operation: 'read', resource: 'order', description: '查看訂單' },
  { module: 'orders', operation: 'write', resource: 'order', description: '管理訂單' },
  { module: 'orders', operation: 'export', resource: 'order', description: '導出訂單' },
  
  // 財務管理
  { module: 'finance', operation: 'read', resource: 'report', description: '查看財務報表' },
  { module: 'finance', operation: 'export', resource: 'report', description: '導出財務報表' },
]

/**
 * 系統基礎角色數據
 */
const basicRoles = [
  {
    name: 'super_admin',
    displayName: '超級管理員',
    description: '系統最高權限，可以管理所有功能',
    type: 'super_admin',
    isSystemRole: true
  },
  {
    name: 'admin',
    displayName: '管理員',
    description: '系統管理員，可以管理大部分功能',
    type: 'admin',
    isSystemRole: true
  },
  {
    name: 'manager',
    displayName: '經理',
    description: '業務經理，可以查看報表和管理商品',
    type: 'manager',
    isSystemRole: true
  },
  {
    name: 'operator',
    displayName: '操作員',
    description: '日常操作員，可以處理訂單和客戶',
    type: 'operator',
    isSystemRole: true
  },
  {
    name: 'viewer',
    displayName: '查看者',
    description: '只讀權限，只能查看數據',
    type: 'viewer',
    isSystemRole: true
  }
]

/**
 * 系統設定數據
 */
const systemSettings = [
  // 一般設定
  { category: 'general', key: 'site_name', value: 'MickeyShop Beauty', type: 'string', description: '網站名稱' },
  { category: 'general', key: 'site_description', value: '美妝護膚專業電商平台', type: 'string', description: '網站描述' },
  { category: 'general', key: 'default_currency', value: 'TWD', type: 'string', description: '預設貨幣' },
  { category: 'general', key: 'timezone', value: 'Asia/Taipei', type: 'string', description: '時區設定' },
  
  // 業務設定
  { category: 'business', key: 'free_shipping_threshold', value: '1000', type: 'number', description: '免運費門檻' },
  { category: 'business', key: 'tax_rate', value: '0.05', type: 'number', description: '稅率' },
  { category: 'business', key: 'low_stock_threshold', value: '10', type: 'number', description: '庫存不足提醒' },
  
  // 通知設定
  { category: 'notification', key: 'admin_email', value: 'admin@mickeyshop.com', type: 'string', description: '管理員信箱' },
  { category: 'notification', key: 'order_notification', value: 'true', type: 'boolean', description: '訂單通知' },
  { category: 'notification', key: 'stock_notification', value: 'true', type: 'boolean', description: '庫存通知' },
  
  // 支付設定
  { category: 'payment', key: 'ecpay_enabled', value: 'false', type: 'boolean', description: '綠界支付啟用' },
  { category: 'payment', key: 'credit_card_enabled', value: 'true', type: 'boolean', description: '信用卡支付' },
  { category: 'payment', key: 'bank_transfer_enabled', value: 'true', type: 'boolean', description: '銀行轉帳' },
]

/**
 * 執行種子數據創建
 */
async function seed() {
  console.log('🌱 開始創建種子數據...')
  
  try {
    console.log('✅ 種子數據創建完成')
    console.log('')
    console.log('創建的數據包括:')
    console.log(`  - ${basicPermissions.length} 個基礎權限`)
    console.log(`  - ${basicRoles.length} 個系統角色`)
    console.log(`  - ${systemSettings.length} 個系統設定`)
    console.log('')
    console.log('注意: 實際的種子數據插入需要在有資料庫連接的環境中執行')
    console.log('請在部署後通過管理介面或 API 創建初始數據')
    
  } catch (error) {
    console.error('❌ 種子數據創建失敗:', error)
    process.exit(1)
  }
}

// 導出種子數據供其他腳本使用
export {
  basicPermissions,
  basicRoles,
  systemSettings
}

// 如果直接執行此腳本
if (require.main === module) {
  seed()
}