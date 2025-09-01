/**
 * 郵箱驗證頁面
 */
import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Button,
  Typography,
  message,
  Card,
  Result,
  Spin
} from 'antd'
import {
  MailOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { authService } from '@/api/services/authService'
import { useAuthStore } from '@/stores/auth'

const { Title, Text } = Typography

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, updateUser } = useAuthStore()
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading')
  const [isResending, setIsResending] = useState(false)
  
  const token = searchParams.get('token')
  const email = user?.email || ''

  // 驗證郵箱
  useEffect(() => {
    if (token) {
      verifyEmailWithToken(token)
    } else {
      // 沒有 token，顯示重新發送頁面
      setVerificationStatus('resend')
    }
  }, [token])

  const verifyEmailWithToken = async (token: string) => {
    try {
      await authService.verifyEmail(token)
      
      // 更新用戶狀態
      if (user) {
        updateUser({ emailVerified: true })
      }
      
      setVerificationStatus('success')
      message.success('郵箱驗證成功！')
    } catch (error) {
      setVerificationStatus('error')
      const errorMessage = error instanceof Error ? error.message : '驗證失敗'
      message.error(errorMessage)
    }
  }

  // 重新發送驗證郵件
  const handleResendEmail = async () => {
    if (!email) {
      message.error('請先登錄')
      navigate('/auth/login')
      return
    }

    setIsResending(true)
    try {
      await authService.sendEmailVerification()
      message.success('驗證郵件已重新發送！')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '發送失敗，請重試'
      message.error(errorMessage)
    } finally {
      setIsResending(false)
    }
  }

  // 驗證中
  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <Text className="block mt-4 text-gray-600">正在驗證郵箱...</Text>
        </div>
      </div>
    )
  }

  // 驗證成功
  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0 text-center">
            <Result
              icon={<CheckCircleOutlined className="text-green-500" />}
              title="郵箱驗證成功"
              subTitle="恭喜！您的郵箱已成功驗證，現在可以享受完整的購物體驗。"
              extra={
                <Button
                  type="primary"
                  onClick={() => navigate('/')}
                  size="large"
                  className="bg-indigo-600 border-indigo-600"
                >
                  開始購物
                </Button>
              }
            />
          </Card>
        </div>
      </div>
    )
  }

  // 驗證失敗
  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0 text-center">
            <Result
              icon={<CloseCircleOutlined className="text-red-500" />}
              title="驗證失敗"
              subTitle="驗證連結無效或已過期，請重新發送驗證郵件。"
              extra={[
                <Button
                  key="resend"
                  type="primary"
                  onClick={handleResendEmail}
                  loading={isResending}
                  className="mr-2"
                >
                  重新發送
                </Button>,
                <Button
                  key="login"
                  onClick={() => navigate('/auth/login')}
                >
                  返回登錄
                </Button>
              ]}
            />
          </Card>
        </div>
      </div>
    )
  }

  // 重新發送驗證郵件
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <MailOutlined className="text-2xl text-indigo-600" />
            </div>
            <Title level={2} className="text-gray-800 mb-2">
              驗證您的郵箱
            </Title>
            {email ? (
              <div className="space-y-2">
                <Text className="text-gray-600">
                  我們已將驗證連結發送至：
                </Text>
                <Text className="block font-semibold text-indigo-600">
                  {email}
                </Text>
                <Text className="text-sm text-gray-500">
                  請檢查您的郵箱（包括垃圾郵件資料夾），
                  並點擊郵件中的連結來驗證您的郵箱。
                </Text>
              </div>
            ) : (
              <Text className="text-gray-600">
                請先登錄後進行郵箱驗證
              </Text>
            )}
          </div>

          <div className="space-y-4">
            {email && (
              <Button
                type="primary"
                onClick={handleResendEmail}
                loading={isResending}
                block
                size="large"
                className="rounded-lg bg-indigo-600 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700"
              >
                {isResending ? '發送中...' : '重新發送驗證郵件'}
              </Button>
            )}

            <Button
              onClick={() => navigate(email ? '/' : '/auth/login')}
              block
              size="large"
              className="rounded-lg"
            >
              {email ? '稍後驗證' : '前往登錄'}
            </Button>

            {/* 提示信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <div className="flex items-start">
                <ExclamationCircleOutlined className="text-blue-600 mt-0.5 mr-2" />
                <div className="text-blue-800">
                  <p className="font-medium mb-1">收不到郵件？</p>
                  <ul className="space-y-1">
                    <li>• 請檢查垃圾郵件資料夾</li>
                    <li>• 確認郵箱地址正確</li>
                    <li>• 等待 5-10 分鐘後再重試</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 返回首頁 */}
        <div className="text-center mt-6">
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

export default VerifyEmailPage