/**
 * 重設密碼頁面
 */
import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  message,
  Card,
  Result
} from 'antd'
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { authService } from '@/api/services/authService'

const { Title, Text } = Typography

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  
  const token = searchParams.get('token')

  // 驗證 Token
  useEffect(() => {
    if (!token) {
      setIsValidToken(false)
      return
    }

    // 這裡應該調用 API 驗證 token 有效性
    // 暫時假設 token 存在就有效
    setIsValidToken(true)
  }, [token])

  // 處理重設密碼提交
  const handleSubmit = async (values: { newPassword: string; confirmPassword: string }) => {
    if (!token) return

    setIsLoading(true)
    try {
      await authService.resetPassword({
        token,
        newPassword: values.newPassword
      })
      setIsSuccess(true)
      message.success('密碼重設成功！')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重設失敗，請重試'
      message.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Token 無效或不存在
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0 text-center">
            <Result
              icon={<ExclamationCircleOutlined className="text-red-500" />}
              title="連結無效或已過期"
              subTitle="此重設密碼連結無效或已過期，請重新申請重設密碼。"
              extra={[
                <Button
                  key="forgot"
                  type="primary"
                  onClick={() => navigate('/auth/forgot-password')}
                  className="mr-2"
                >
                  重新申請
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

  // 重設成功
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0 text-center">
            <Result
              icon={<CheckCircleOutlined className="text-green-500" />}
              title="密碼重設成功"
              subTitle="您的密碼已成功重設，現在可以使用新密碼登錄。"
              extra={
                <Button
                  type="primary"
                  onClick={() => navigate('/auth/login')}
                  size="large"
                  className="bg-indigo-600 border-indigo-600"
                >
                  前往登錄
                </Button>
              }
            />
          </Card>
        </div>
      </div>
    )
  }

  // 載入中
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <Text className="mt-4 text-gray-600">驗證中...</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 重設密碼卡片 */}
        <Card className="shadow-lg border-0">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <LockOutlined className="text-2xl text-indigo-600" />
            </div>
            <Title level={2} className="text-gray-800 mb-2">
              重設密碼
            </Title>
            <Text className="text-gray-600">
              請設定您的新密碼
            </Text>
          </div>

          <Form
            form={form}
            name="reset-password"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            className="space-y-4"
          >
            <Form.Item
              name="newPassword"
              label="新密碼"
              rules={[
                { required: true, message: '請輸入新密碼' },
                { min: 8, message: '密碼至少需要8個字符' },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: '密碼需包含大小寫字母和數字'
                }
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="請輸入新密碼"
                className="rounded-lg"
                iconRender={(visible) => (
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                )}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="確認新密碼"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '請確認新密碼' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('兩次輸入的密碼不一致'))
                  },
                })
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="請再次輸入新密碼"
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
              >
                {isLoading ? '重設中...' : '確認重設密碼'}
              </Button>
            </Form.Item>

            {/* 密碼要求提示 */}
            <Alert
              message="密碼要求"
              description={
                <ul className="text-sm mt-2 space-y-1">
                  <li>• 至少 8 個字符</li>
                  <li>• 包含大寫字母</li>
                  <li>• 包含小寫字母</li>
                  <li>• 包含數字</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Form>
        </Card>

        {/* 返回登錄 */}
        <div className="text-center mt-6">
          <Link 
            to="/auth/login" 
            className="text-indigo-600 hover:text-indigo-700"
          >
            返回登錄頁面
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage