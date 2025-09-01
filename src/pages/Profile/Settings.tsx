import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Avatar,
  Upload,
  message,
  Modal,
  Divider,
  Space,
  Typography,
  Row,
  Col,
  DatePicker,
  Radio,
  Popconfirm,
  Alert,
  Badge,
  Tag
} from 'antd'
import {
  UserOutlined,
  CameraOutlined,
  EditOutlined,
  SafetyOutlined,
  BellOutlined,
  EyeOutlined,
  GlobalOutlined,
  MobileOutlined,
  MailOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { User, UserPreferences } from '../../types'
import { useAuth } from '../../hooks/useAuth'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input
const { confirm } = Modal

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const SettingsPage: React.FC = () => {
  const { t } = useTranslation()
  const { user, updateProfile, logout } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [profileForm] = Form.useForm()
  const [preferencesForm] = Form.useForm()
  const [passwordForm] = Form.useForm<PasswordChangeData>()
  const [activeSection, setActiveSection] = useState('profile')

  // 設定初始值
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
        gender: user.gender
      })

      preferencesForm.setFieldsValue({
        language: user.preferences?.language || 'zh-TW',
        currency: user.preferences?.currency || 'TWD',
        theme: user.preferences?.theme || 'light',
        notifications: user.preferences?.notifications || {
          email: true,
          push: true,
          sms: false,
          marketing: false,
          orderUpdates: true,
          promotions: false
        },
        privacy: user.preferences?.privacy || {
          showProfile: false,
          showOrders: false,
          allowAnalytics: true,
          allowCookies: true
        }
      })
    }
  }, [user, profileForm, preferencesForm])

  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true)
      const profileData = {
        ...values,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD')
      }
      
      // 實際使用時調用 API
      await updateProfile(profileData)
      message.success(t('settings.profileUpdateSuccess') || '個人資料更新成功')
    } catch (error) {
      message.error(t('settings.profileUpdateError') || '更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePreferences = async (values: any) => {
    try {
      setLoading(true)
      
      // 實際使用時調用 API
      await updateProfile({ preferences: values })
      message.success(t('settings.preferencesUpdateSuccess') || '偏好設定更新成功')
    } catch (error) {
      message.error(t('settings.preferencesUpdateError') || '更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (values: PasswordChangeData) => {
    try {
      setLoading(true)
      
      // 實際使用時調用 API
      // await changePassword(values)
      
      message.success(t('settings.passwordChangeSuccess') || '密碼修改成功')
      setPasswordModalVisible(false)
      passwordForm.resetFields()
    } catch (error) {
      message.error(t('settings.passwordChangeError') || '密碼修改失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      // 實際使用時上傳到服務器
      const reader = new FileReader()
      reader.onload = () => {
        // 更新用戶頭像
        updateProfile({ avatar: reader.result as string })
        message.success(t('settings.avatarUpdateSuccess') || '頭像更新成功')
      }
      reader.readAsDataURL(file)
      return false // 阻止默認上傳行為
    } catch (error) {
      message.error(t('settings.avatarUpdateError') || '頭像更新失敗')
      return false
    }
  }

  const handleDeleteAccount = () => {
    confirm({
      title: t('settings.deleteAccountTitle') || '確定要刪除帳戶嗎？',
      content: (
        <div>
          <Paragraph>
            {t('settings.deleteAccountWarning') || '這個操作無法復原，您將失去：'}
          </Paragraph>
          <ul className="ml-4 list-disc">
            <li>{t('settings.deleteAccountWarning1') || '所有個人資料和設定'}</li>
            <li>{t('settings.deleteAccountWarning2') || '訂單歷史記錄'}</li>
            <li>{t('settings.deleteAccountWarning3') || '心願清單和評論'}</li>
            <li>{t('settings.deleteAccountWarning4') || '會員積分和優惠券'}</li>
          </ul>
          <Alert
            type="error"
            message={t('settings.deleteAccountConfirm') || '請輸入您的密碼以確認刪除'}
            className="mt-4"
          />
        </div>
      ),
      icon: <ExclamationCircleOutlined className="text-red-500" />,
      okText: t('settings.confirmDelete') || '確認刪除',
      okType: 'danger',
      cancelText: t('common.cancel') || '取消',
      onOk: async () => {
        try {
          // 實際使用時調用刪除 API
          message.success(t('settings.accountDeleted') || '帳戶已刪除')
          logout()
        } catch (error) {
          message.error(t('settings.deleteAccountError') || '刪除失敗')
        }
      }
    })
  }

  const renderProfileSection = () => (
    <Card title={t('settings.profileInfo') || '個人資料'}>
      <Form
        form={profileForm}
        layout="vertical"
        onFinish={handleUpdateProfile}
      >
        {/* 頭像上傳 */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar
              size={100}
              src={user?.avatar}
              icon={<UserOutlined />}
              className="border-4 border-gray-200"
            />
            <Upload
              showUploadList={false}
              beforeUpload={handleAvatarUpload}
              accept="image/*"
            >
              <Button
                type="primary"
                shape="circle"
                icon={<CameraOutlined />}
                className="absolute bottom-0 right-0 shadow-lg"
                
              />
            </Upload>
          </div>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('settings.firstName') || '名字'}
              name="firstName"
              rules={[{ required: true, message: t('settings.firstNameRequired') || '請輸入名字' }]}
            >
              <Input placeholder={t('settings.firstNamePlaceholder') || '請輸入名字'} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('settings.lastName') || '姓氏'}
              name="lastName"
              rules={[{ required: true, message: t('settings.lastNameRequired') || '請輸入姓氏' }]}
            >
              <Input placeholder={t('settings.lastNamePlaceholder') || '請輸入姓氏'} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('settings.email') || '電子郵件'}
          name="email"
          rules={[
            { required: true, message: t('settings.emailRequired') || '請輸入電子郵件' },
            { type: 'email', message: t('settings.emailInvalid') || '電子郵件格式不正確' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder={t('settings.emailPlaceholder') || '請輸入電子郵件'}
            suffix={
              user?.emailVerified ? (
                <Badge dot color="green">
                  <Tag color="green" >{t('settings.verified') || '已驗證'}</Tag>
                </Badge>
              ) : (
                <Tag color="orange" >{t('settings.unverified') || '未驗證'}</Tag>
              )
            }
          />
        </Form.Item>

        <Form.Item
          label={t('settings.phone') || '手機號碼'}
          name="phone"
        >
          <Input
            prefix={<MobileOutlined />}
            placeholder={t('settings.phonePlaceholder') || '請輸入手機號碼'}
            suffix={
              user?.phoneVerified ? (
                <Tag color="green" >{t('settings.verified') || '已驗證'}</Tag>
              ) : (
                <Tag color="orange" >{t('settings.unverified') || '未驗證'}</Tag>
              )
            }
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('settings.dateOfBirth') || '生日'}
              name="dateOfBirth"
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder={t('settings.dateOfBirthPlaceholder') || '選擇生日'}
                disabledDate={(current) => current && current > dayjs().subtract(13, 'years')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('settings.gender') || '性別'}
              name="gender"
            >
              <Radio.Group>
                <Radio value="male">{t('settings.male') || '男'}</Radio>
                <Radio value="female">{t('settings.female') || '女'}</Radio>
                <Radio value="other">{t('settings.other') || '其他'}</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item className="text-right mb-0">
          <Button type="primary" htmlType="submit" loading={loading}>
            {t('settings.saveProfile') || '保存個人資料'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )

  const renderPreferencesSection = () => (
    <Card title={t('settings.preferences') || '偏好設定'}>
      <Form
        form={preferencesForm}
        layout="vertical"
        onFinish={handleUpdatePreferences}
      >
        <Title level={4}>
          <GlobalOutlined /> {t('settings.languageAndRegion') || '語言和地區'}
        </Title>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('settings.language') || '語言'}
              name="language"
            >
              <Select>
                <Option value="zh-TW">繁體中文</Option>
                <Option value="zh-CN">简体中文</Option>
                <Option value="zh-HK">廣東話</Option>
                <Option value="en-US">English</Option>
                <Option value="ja-JP">日本語</Option>
                <Option value="ko-KR">한국어</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('settings.currency') || '貨幣'}
              name="currency"
            >
              <Select>
                <Option value="TWD">TWD (台幣)</Option>
                <Option value="CNY">CNY (人民幣)</Option>
                <Option value="HKD">HKD (港幣)</Option>
                <Option value="USD">USD (美元)</Option>
                <Option value="JPY">JPY (日圓)</Option>
                <Option value="KRW">KRW (韓圓)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('settings.theme') || '主題'}
          name="theme"
        >
          <Radio.Group>
            <Radio value="light">{t('settings.lightTheme') || '淺色主題'}</Radio>
            <Radio value="dark">{t('settings.darkTheme') || '深色主題'}</Radio>
          </Radio.Group>
        </Form.Item>

        <Divider />

        <Title level={4}>
          <BellOutlined /> {t('settings.notifications') || '通知設定'}
        </Title>

        <Form.Item
          label={t('settings.emailNotifications') || '電子郵件通知'}
          name={['notifications', 'email']}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={t('settings.pushNotifications') || '推播通知'}
          name={['notifications', 'push']}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={t('settings.smsNotifications') || '簡訊通知'}
          name={['notifications', 'sms']}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={t('settings.orderUpdates') || '訂單更新通知'}
          name={['notifications', 'orderUpdates']}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={t('settings.marketingNotifications') || '行銷資訊通知'}
          name={['notifications', 'marketing']}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={t('settings.promotionNotifications') || '促銷活動通知'}
          name={['notifications', 'promotions']}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider />

        <Title level={4}>
          <EyeOutlined /> {t('settings.privacy') || '隱私設定'}
        </Title>

        <Form.Item
          label={t('settings.showProfile') || '公開個人資料'}
          name={['privacy', 'showProfile']}
          valuePropName="checked"
          extra={t('settings.showProfileExtra') || '其他用戶可以看到您的基本資料'}
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={t('settings.showOrders') || '公開訂單資訊'}
          name={['privacy', 'showOrders']}
          valuePropName="checked"
          extra={t('settings.showOrdersExtra') || '其他用戶可以看到您的購買紀錄'}
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={t('settings.allowAnalytics') || '允許數據分析'}
          name={['privacy', 'allowAnalytics']}
          valuePropName="checked"
          extra={t('settings.allowAnalyticsExtra') || '幫助我們改善服務品質'}
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={t('settings.allowCookies') || '允許 Cookies'}
          name={['privacy', 'allowCookies']}
          valuePropName="checked"
          extra={t('settings.allowCookiesExtra') || '儲存您的偏好設定'}
        >
          <Switch />
        </Form.Item>

        <Form.Item className="text-right mb-0">
          <Button type="primary" htmlType="submit" loading={loading}>
            {t('settings.savePreferences') || '保存偏好設定'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )

  const renderSecuritySection = () => (
    <Card title={t('settings.security') || '安全設定'}>
      <div className="space-y-6">
        <div className="flex justify-between items-center p-4 border rounded-lg">
          <div>
            <Title level={5} className="mb-1">
              {t('settings.password') || '密碼'}
            </Title>
            <Text type="secondary">
              {t('settings.passwordDescription') || '定期更改密碼以保護帳戶安全'}
            </Text>
          </div>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setPasswordModalVisible(true)}
          >
            {t('settings.changePassword') || '修改密碼'}
          </Button>
        </div>

        <div className="flex justify-between items-center p-4 border rounded-lg">
          <div>
            <Title level={5} className="mb-1">
              {t('settings.twoFactorAuth') || '兩步驟驗證'}
            </Title>
            <Text type="secondary">
              {t('settings.twoFactorAuthDescription') || '為您的帳戶增加額外的安全保護'}
            </Text>
          </div>
          <Button type="default">
            {t('settings.enable') || '啟用'}
          </Button>
        </div>

        <div className="flex justify-between items-center p-4 border rounded-lg">
          <div>
            <Title level={5} className="mb-1">
              {t('settings.loginDevices') || '登入裝置'}
            </Title>
            <Text type="secondary">
              {t('settings.loginDevicesDescription') || '管理已登入的裝置'}
            </Text>
          </div>
          <Button type="default">
            {t('settings.manageDevices') || '管理裝置'}
          </Button>
        </div>

        <div className="flex justify-between items-center p-4 border border-red-200 rounded-lg bg-red-50">
          <div>
            <Title level={5} className="mb-1 text-red-600">
              {t('settings.deleteAccount') || '刪除帳戶'}
            </Title>
            <Text type="secondary">
              {t('settings.deleteAccountDescription') || '永久刪除您的帳戶和所有相關資料'}
            </Text>
          </div>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteAccount}
          >
            {t('settings.deleteAccount') || '刪除帳戶'}
          </Button>
        </div>
      </div>
    </Card>
  )

  const menuItems = [
    { key: 'profile', label: t('settings.profile') || '個人資料', icon: <UserOutlined /> },
    { key: 'preferences', label: t('settings.preferences') || '偏好設定', icon: <GlobalOutlined /> },
    { key: 'security', label: t('settings.security') || '安全設定', icon: <SafetyOutlined /> }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <Title level={2} className="mb-6">
        {t('settings.title') || '帳戶設定'}
      </Title>

      <Row gutter={24}>
        <Col span={6}>
          <Card className="settings-menu">
            <div className="space-y-1">
              {menuItems.map(item => (
                <Button
                  key={item.key}
                  type={activeSection === item.key ? 'primary' : 'text'}
                  icon={item.icon}
                  className="w-full justify-start"
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </Card>
        </Col>

        <Col span={18}>
          {activeSection === 'profile' && renderProfileSection()}
          {activeSection === 'preferences' && renderPreferencesSection()}
          {activeSection === 'security' && renderSecuritySection()}
        </Col>
      </Row>

      {/* 密碼修改 Modal */}
      <Modal
        title={t('settings.changePassword') || '修改密碼'}
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label={t('settings.currentPassword') || '目前密碼'}
            name="currentPassword"
            rules={[{ required: true, message: t('settings.currentPasswordRequired') || '請輸入目前密碼' }]}
          >
            <Input.Password placeholder={t('settings.currentPasswordPlaceholder') || '請輸入目前密碼'} />
          </Form.Item>

          <Form.Item
            label={t('settings.newPassword') || '新密碼'}
            name="newPassword"
            rules={[
              { required: true, message: t('settings.newPasswordRequired') || '請輸入新密碼' },
              { min: 6, message: t('settings.passwordMinLength') || '密碼至少6個字符' }
            ]}
          >
            <Input.Password placeholder={t('settings.newPasswordPlaceholder') || '請輸入新密碼'} />
          </Form.Item>

          <Form.Item
            label={t('settings.confirmPassword') || '確認新密碼'}
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('settings.confirmPasswordRequired') || '請確認新密碼' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error(t('settings.passwordMismatch') || '兩次輸入的密碼不一致'))
                }
              })
            ]}
          >
            <Input.Password placeholder={t('settings.confirmPasswordPlaceholder') || '請再次輸入新密碼'} />
          </Form.Item>

          <Form.Item className="text-right mb-0">
            <Space>
              <Button onClick={() => setPasswordModalVisible(false)}>
                {t('common.cancel') || '取消'}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {t('settings.updatePassword') || '更新密碼'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SettingsPage