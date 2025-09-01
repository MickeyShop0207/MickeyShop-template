// 註冊頁面
import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Alert,
  message,
  Progress,
  Tooltip
} from 'antd'
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useAuth, useRegister } from '../../../hooks'
import { ROUTES } from '../../../router'
import type { RegisterRequest } from '../../../types'
import './style.scss'

const { Title, Text } = Typography

interface PasswordStrength {
  score: number
  label: string
  color: string
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutate: register, isLoading, error } = useRegister()
  const [form] = Form.useForm()
  const [passwordStrength, setPasswordStrength] = React.useState<PasswordStrength>({
    score: 0,
    label: '',
    color: 'red'
  })

  // 已登錄用戶重定向
  useEffect(() => {
    if (user) {
      navigate(ROUTES.HOME, { replace: true })
    }
  }, [user, navigate])

  // 密碼強度檢測
  const checkPasswordStrength = (password: string): PasswordStrength => {
    if (!password) {
      return { score: 0, label: '', color: 'red' }
    }

    let score = 0
    const checks = [
      password.length >= 8, // 長度
      /[a-z]/.test(password), // 小寫字母
      /[A-Z]/.test(password), // 大寫字母
      /\d/.test(password), // 數字
      /[^a-zA-Z\d]/.test(password) // 特殊字符
    ]

    score = checks.filter(check => check).length

    const levels = [
      { score: 0, label: '', color: 'red' },
      { score: 1, label: '很弱', color: 'red' },
      { score: 2, label: '弱', color: 'orange' },
      { score: 3, label: '中等', color: 'yellow' },
      { score: 4, label: '強', color: 'lime' },
      { score: 5, label: '很強', color: 'green' }
    ]

    return levels[score]
  }

  // 處理密碼變化
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value
    const strength = checkPasswordStrength(password)
    setPasswordStrength(strength)
  }

  // 處理註冊提交
  const handleSubmit = (values: RegisterRequest) => {
    register(values, {
      onSuccess: () => {
        message.success('註冊成功！歡迎加入 MickeyShop Beauty')
        navigate(ROUTES.HOME, { replace: true })
      },
      onError: (error: any) => {
        message.error(error?.message || '註冊失敗，請重試')
      }
    })
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-content">
          {/* 品牌標題 */}
          <div className="brand-header">
            <Title level={1} className="brand-title">
              MickeyShop Beauty
            </Title>
            <Text className="brand-subtitle">
              發現美，享受美，成為更美的自己
            </Text>
          </div>

          {/* 註冊表單 */}
          <div className="register-form-wrapper">
            <Title level={2} className="form-title">創建新帳戶</Title>
            <Text className="form-subtitle">
              加入我們，開啟專屬的美妝購物體驗
            </Text>

            {/* 錯誤信息 */}
            {error && (
              <Alert
                message="註冊失敗"
                description={error?.message || '註冊過程中出現錯誤，請重試'}
                type="error"
                showIcon
                closable
                className="error-alert"
              />
            )}

            <Form
              form={form}
              name="register"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              className="register-form"
              scrollToFirstError
            >
              <Form.Item
                name="name"
                label="姓名"
                rules={[
                  { required: true, message: '請輸入您的姓名' },
                  { min: 2, message: '姓名至少需要2個字符' },
                  { max: 20, message: '姓名不能超過20個字符' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="請輸入您的姓名"
                  autoComplete="name"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="電子郵箱"
                rules={[
                  { required: true, message: '請輸入電子郵箱' },
                  { type: 'email', message: '請輸入正確的電子郵箱格式' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="請輸入電子郵箱"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={
                  <span>
                    密碼
                    <Tooltip title="密碼應包含至少8個字符，建議包含大小寫字母、數字和特殊字符">
                      <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-secondary)' }} />
                    </Tooltip>
                  </span>
                }
                rules={[
                  { required: true, message: '請輸入密碼' },
                  { min: 8, message: '密碼至少需要8個字符' },
                  { max: 50, message: '密碼不能超過50個字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="請輸入密碼"
                  autoComplete="new-password"
                  onChange={handlePasswordChange}
                  iconRender={(visible) => (
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  )}
                />
              </Form.Item>

              {/* 密碼強度指示器 */}
              {passwordStrength.score > 0 && (
                <div className="password-strength">
                  <div className="strength-info">
                    <Text className="strength-label">密碼強度：</Text>
                    <Text className={`strength-value strength-${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </Text>
                  </div>
                  <Progress
                    percent={(passwordStrength.score / 5) * 100}
                    showInfo={false}
                    strokeColor={passwordStrength.color}
                    
                  />
                </div>
              )}

              <Form.Item
                name="confirmPassword"
                label="確認密碼"
                dependencies={['password']}
                rules={[
                  { required: true, message: '請確認您的密碼' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('兩次輸入的密碼不一致'))
                    }
                  })
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="請再次輸入密碼"
                  autoComplete="new-password"
                  iconRender={(visible) => (
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  )}
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="手機號碼（選填）"
                rules={[
                  { pattern: /^09\d{8}$/, message: '請輸入正確的手機號碼格式' }
                ]}
              >
                <Input
                  placeholder="09XXXXXXXX"
                  autoComplete="tel"
                />
              </Form.Item>

              <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(new Error('請閱讀並同意服務條款'))
                  }
                ]}
              >
                <Checkbox>
                  我已閱讀並同意
                  <Link to="/terms" target="_blank" className="terms-link">
                    服務條款
                  </Link>
                  和
                  <Link to="/privacy" target="_blank" className="privacy-link">
                    隱私政策
                  </Link>
                </Checkbox>
              </Form.Item>

              <Form.Item
                name="newsletter"
                valuePropName="checked"
                initialValue={true}
              >
                <Checkbox>
                  訂閱電子報，獲取最新優惠和美妝資訊
                </Checkbox>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                  className="register-button"
                >
                  創建帳戶
                </Button>
              </Form.Item>

              {/* 登錄連結 */}
              <div className="login-link">
                <Text>
                  已經有帳戶了？
                  <Link to={ROUTES.LOGIN} className="login-text">
                    立即登錄
                  </Link>
                </Text>
              </div>
            </Form>
          </div>
        </div>

        {/* 裝飾背景 */}
        <div className="register-decoration">
          <div className="decoration-content">
            <div className="decoration-image">
              <img 
                src="/register-illustration.png" 
                alt="Beauty Collection" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
            <div className="decoration-text">
              <Title level={3} className="decoration-title">
                開始您的美麗之旅
              </Title>
              <Text className="decoration-subtitle">
                加入超過10萬名會員的美妝社群，享受專屬優惠和個人化推薦
              </Text>
              <div className="decoration-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">🎁</span>
                  <div className="benefit-content">
                    <div className="benefit-title">新會員禮</div>
                    <div className="benefit-desc">註冊即享首單9折優惠</div>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">💎</span>
                  <div className="benefit-content">
                    <div className="benefit-title">會員專享</div>
                    <div className="benefit-desc">專屬折扣和早鳥搶購</div>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">👩‍💼</span>
                  <div className="benefit-content">
                    <div className="benefit-title">美妝顧問</div>
                    <div className="benefit-desc">專業美妝建議和諮詢</div>
                  </div>
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

export default RegisterPage