/**
 * 管理員登錄頁面
 */
import React, { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  message,
  Card
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  ShieldCheckOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import type { LoginCredentials } from '@/types'

const { Title, Text } = Typography

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { adminLogin, isLoading, error, clearError, isAuthenticated, isAdmin } = useAuthStore()
  const [form] = Form.useForm()

  // 獲取重定向URL（從 state 或 query 參數）
  const from = (location.state as any)?.from?.pathname || '/admin/dashboard'

  // 已登錄的管理員用戶重定向
  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, isAdmin, navigate, from])

  // 清除錯誤信息當組件卸載時
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  // 處理管理員登錄提交
  const handleSubmit = async (values: LoginCredentials) => {
    try {
      await adminLogin(values)
      message.success('管理員登錄成功！')
      navigate(from, { replace: true })
    } catch (error) {
      // 錯誤已經在 store 中處理
      console.error('管理員登錄失敗:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 管理員登錄卡片 */}
        <Card className="shadow-lg border-0">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <ShieldCheckOutlined className="text-2xl text-indigo-600" />
            </div>
            <Title level={2} className="text-gray-800 mb-2">
              管理員登錄
            </Title>
            <Text className="text-gray-600">
              MickeyShop Beauty 管理後台
            </Text>
          </div>

          {/* 錯誤信息 */}
          {error && (
            <Alert
              message="登錄失敗"
              description={error}
              type="error"
              showIcon
              closable
              className="mb-6"
              onClose={clearError}
            />
          )}

          <Form
            form={form}
            name="admin-login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            className="space-y-4"
          >
            <Form.Item
              name="email"
              label="管理員帳號"
              rules={[
                { required: true, message: '請輸入管理員帳號' },
                { type: 'email', message: '請輸入正確的電子郵箱格式' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="請輸入管理員帳號"
                autoComplete="username"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密碼"
              rules={[
                { required: true, message: '請輸入密碼' },
                { min: 6, message: '密碼至少需要6個字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="請輸入密碼"
                autoComplete="current-password"
                className="rounded-lg"
                iconRender={(visible) => (
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                )}
              />
            </Form.Item>

            <Form.Item className="mb-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
                className="rounded-lg bg-indigo-600 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700"
                icon={<SettingOutlined />}
              >
                {isLoading ? '登錄中...' : '登錄管理後台'}
              </Button>
            </Form.Item>

            {/* 安全提示 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ShieldCheckOutlined className="text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">安全提醒</p>
                  <p>管理後台僅供授權人員使用，請妥善保管您的登錄信息。</p>
                </div>
              </div>
            </div>
          </Form>
        </Card>

        {/* 返回會員登錄 */}
        <div className="text-center mt-6">
          <Text className="text-gray-600">
            需要會員登錄？
            <Link 
              to="/auth/login" 
              className="text-indigo-600 hover:text-indigo-700 ml-1"
            >
              會員登錄頁面
            </Link>
          </Text>
        </div>

        {/* 返回首頁連結 */}
        <div className="text-center mt-4">
          <Link 
            to="/" 
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← 返回首頁
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage