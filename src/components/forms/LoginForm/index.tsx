// 登入表單組件
import React from 'react'
import { Form, Button, Checkbox, Divider } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { Input, PasswordInput } from '../../ui'
import { useLogin } from '../../../hooks'
import type { LoginRequest } from '../../../api/services'
import './style.scss'

export interface LoginFormProps {
  onSuccess?: () => void
  showRegisterLink?: boolean
  showForgotPassword?: boolean
  className?: string
}

interface LoginFormData extends Omit<LoginRequest, 'deviceInfo'> {
  remember: boolean
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  showRegisterLink = true,
  showForgotPassword = true,
  className
}) => {
  const [form] = Form.useForm<LoginFormData>()
  const { mutate: login, isPending: isLoading } = useLogin()

  const handleSubmit = async (values: LoginFormData) => {
    try {
      await login({
        email: values.email,
        password: values.password,
        deviceInfo: {
          deviceId: 'web_' + Date.now(),
          deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Web' : 'Desktop Web'
        }
      })
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      // 錯誤已在 hook 中處理
    }
  }

  return (
    <div className={`login-form ${className || ''}`}>
      <div className="login-form__header">
        <h1 className="login-form__title">歡迎回來</h1>
        <p className="login-form__subtitle">請登入您的帳戶</p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        requiredMark={false}
        className="login-form__form"
      >
        <Form.Item
          name="email"
          label="電子郵箱"
          rules={[
            { required: true, message: '請輸入電子郵箱' },
            { type: 'email', message: '請輸入有效的電子郵箱' }
          ]}
        >
          <Input
            size="large"
            leftIcon={<MailOutlined />}
            placeholder="請輸入您的電子郵箱"
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
          <PasswordInput
            size="large"
            leftIcon={<LockOutlined />}
            placeholder="請輸入您的密碼"
            autoComplete="current-password"
          />
        </Form.Item>

        <div className="login-form__options">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>記住我</Checkbox>
          </Form.Item>

          {showForgotPassword && (
            <Link to="/forgot-password" className="login-form__forgot-link">
              忘記密碼？
            </Link>
          )}
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={isLoading}
            block
            className="login-form__submit-btn"
          >
            登入
          </Button>
        </Form.Item>
      </Form>

      {showRegisterLink && (
        <>
          <Divider plain>還沒有帳戶？</Divider>
          
          <div className="login-form__register">
            <span>還沒有帳戶？</span>
            <Link to="/register" className="login-form__register-link">
              立即註冊
            </Link>
          </div>
        </>
      )}

      {/* 社交登入 */}
      <div className="login-form__social">
        <Divider plain>或</Divider>
        
        <div className="login-form__social-buttons">
          <Button
            size="large"
            block
            className="login-form__social-btn login-form__social-btn--google"
          >
            使用 Google 登入
          </Button>
          
          <Button
            size="large"
            block
            className="login-form__social-btn login-form__social-btn--facebook"
          >
            使用 Facebook 登入
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LoginForm