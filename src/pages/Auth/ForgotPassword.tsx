/**
 * 忘記密碼頁面
 */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  MailOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { authService } from '@/api/services/authService'

const { Title, Text } = Typography

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [email, setEmail] = useState('')

  // 處理忘記密碼提交
  const handleSubmit = async (values: { email: string }) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(values.email)
      setEmail(values.email)
      setIsSuccess(true)
      message.success('重設密碼郵件已發送！')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '發送失敗，請重試'
      message.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 成功頁面
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0 text-center">
            <Result
              icon={<CheckCircleOutlined className="text-green-500" />}
              title="郵件已發送"
              subTitle={
                <div className="space-y-2">
                  <p>我們已將重設密碼的連結發送至：</p>
                  <p className="font-semibold text-indigo-600">{email}</p>
                  <p className="text-sm text-gray-600">
                    請檢查您的郵箱（包括垃圾郵件資料夾），
                    並點擊郵件中的連結來重設您的密碼。
                  </p>
                </div>
              }
              extra={[
                <Button
                  key="login"
                  type="primary"
                  onClick={() => navigate('/auth/login')}
                  className="mr-2"
                >
                  返回登錄
                </Button>,
                <Button
                  key="resend"
                  onClick={() => setIsSuccess(false)}
                >
                  重新發送
                </Button>
              ]}
            />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 忘記密碼卡片 */}
        <Card className="shadow-lg border-0">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <MailOutlined className="text-2xl text-indigo-600" />
            </div>
            <Title level={2} className="text-gray-800 mb-2">
              忘記密碼
            </Title>
            <Text className="text-gray-600">
              輸入您的電子郵箱，我們將發送重設密碼的連結給您
            </Text>
          </div>

          <Form
            form={form}
            name="forgot-password"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            className="space-y-4"
          >
            <Form.Item
              name="email"
              label="電子郵箱"
              rules={[
                { required: true, message: '請輸入電子郵箱' },
                { type: 'email', message: '請輸入正確的電子郵箱格式' }
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="請輸入您的電子郵箱"
                autoComplete="email"
                className="rounded-lg"
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
                {isLoading ? '發送中...' : '發送重設密碼郵件'}
              </Button>
            </Form.Item>

            {/* 提示信息 */}
            <Alert
              message="找不到您的帳戶？"
              description="請確保您輸入的是註冊時使用的電子郵箱地址。如果仍有問題，請聯繫客服。"
              type="info"
              showIcon
              className="mb-4"
            />
          </Form>
        </Card>

        {/* 返回登錄 */}
        <div className="text-center mt-6">
          <Link 
            to="/auth/login" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeftOutlined className="mr-1" />
            返回登錄頁面
          </Link>
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

export default ForgotPasswordPage