// 登錄頁面
import React, { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Checkbox,
  Divider,
  Typography,
  Alert,
  message,
  Space
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  GoogleOutlined,
  FacebookOutlined
} from '@ant-design/icons'
import { useAuth, useLogin } from '../../../hooks'
import { ROUTES } from '../../../router'
import type { LoginRequest } from '../../../types'
import './style.scss'

const { Title, Text, Link: AntdLink } = Typography

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { mutate: login, isLoading, error } = useLogin()
  const [form] = Form.useForm()

  // 獲取重定向URL
  const redirectUrl = searchParams.get('redirect') || ROUTES.HOME

  // 已登錄用戶重定向
  useEffect(() => {
    if (user) {
      navigate(redirectUrl, { replace: true })
    }
  }, [user, navigate, redirectUrl])

  // 處理登錄提交
  const handleSubmit = (values: LoginRequest) => {
    login(values, {
      onSuccess: () => {
        message.success('登錄成功')
        navigate(redirectUrl, { replace: true })
      },
      onError: (error: any) => {
        message.error(error?.message || '登錄失敗，請重試')
      }
    })
  }

  // 第三方登錄
  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    // TODO: 實現第三方登錄
    message.info(`${provider === 'google' ? 'Google' : 'Facebook'} 登錄功能開發中`)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          {/* 品牌標題 */}
          <div className="brand-header">
            <Title level={1} className="brand-title">
              MickeyShop Beauty
            </Title>
            <Text className="brand-subtitle">
              發現美，享受美，成為更美的自己
            </Text>
          </div>

          {/* 登錄表單 */}
          <div className="login-form-wrapper">
            <Title level={2} className="form-title">歡迎回來</Title>
            <Text className="form-subtitle">請登錄您的帳戶繼續購物</Text>

            {/* 錯誤信息 */}
            {error && (
              <Alert
                message="登錄失敗"
                description={error?.message || '用戶名或密碼錯誤，請重試'}
                type="error"
                showIcon
                closable
                className="error-alert"
              />
            )}

            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              className="login-form"
              initialValues={{
                remember: true
              }}
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
                  prefix={<UserOutlined />}
                  placeholder="請輸入電子郵箱"
                  autoComplete="email"
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
                  prefix={<LockOutlined />}
                  placeholder="請輸入密碼"
                  autoComplete="current-password"
                  iconRender={(visible) => (
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  )}
                />
              </Form.Item>

              <Form.Item>
                <div className="form-options">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>記住我</Checkbox>
                  </Form.Item>
                  
                  <Link 
                    to={ROUTES.FORGOT_PASSWORD} 
                    className="forgot-password-link"
                  >
                    忘記密碼？
                  </Link>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                  className="login-button"
                >
                  登錄
                </Button>
              </Form.Item>

              {/* 第三方登錄 */}
              <div className="social-login">
                <Divider plain>
                  <Text className="divider-text">或</Text>
                </Divider>
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    icon={<GoogleOutlined />}
                    block
                    onClick={() => handleSocialLogin('google')}
                    className="social-button google-button"
                  >
                    使用 Google 帳號登錄
                  </Button>
                  
                  <Button
                    icon={<FacebookOutlined />}
                    block
                    onClick={() => handleSocialLogin('facebook')}
                    className="social-button facebook-button"
                  >
                    使用 Facebook 帳號登錄
                  </Button>
                </Space>
              </div>

              {/* 註冊連結 */}
              <div className="register-link">
                <Text>
                  還沒有帳戶？
                  <Link to={ROUTES.REGISTER} className="register-text">
                    立即註冊
                  </Link>
                </Text>
              </div>
            </Form>
          </div>
        </div>

        {/* 裝飾背景 */}
        <div className="login-decoration">
          <div className="decoration-content">
            <div className="decoration-image">
              <img 
                src="/auth-illustration.png" 
                alt="Beauty Products" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
            <div className="decoration-text">
              <Title level={3} className="decoration-title">
                探索美妝新世界
              </Title>
              <Text className="decoration-subtitle">
                來自世界各地的頂級美妝品牌，為您提供最優質的產品和服務
              </Text>
              <div className="decoration-features">
                <div className="feature-item">
                  <span className="feature-icon">✨</span>
                  <span>正品保證</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🚚</span>
                  <span>免費配送</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💝</span>
                  <span>專業服務</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 返回首頁連結 */}
      <div className="back-home">
        <Link to={ROUTES.HOME} className="back-home-link">
          ← 返回首頁
        </Link>
      </div>
    </div>
  )
}

export default LoginPage