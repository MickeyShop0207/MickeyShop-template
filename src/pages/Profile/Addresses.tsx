import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Empty,
  Spin,
  message,
  Popconfirm,
  Row,
  Col,
  Tag,
  Space
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  HomeOutlined,
  ShopOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { Address } from '../../types'
import { useAuth } from '../../hooks/useAuth'

const { Option } = Select

interface AddressFormData {
  type: 'billing' | 'shipping' | 'both'
  firstName: string
  lastName: string
  company?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
}

const AddressesPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [form] = Form.useForm<AddressFormData>()

  // Mock data - 實際使用時應從 API 獲取
  useEffect(() => {
    const mockAddresses: Address[] = [
      {
        id: '1',
        type: 'both',
        firstName: '小明',
        lastName: '王',
        addressLine1: '台北市中山區民生東路一段100號',
        addressLine2: '5樓之2',
        city: '台北市',
        state: '中山區',
        postalCode: '10491',
        country: 'TW',
        phone: '0912-345-678',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        type: 'shipping',
        firstName: '小華',
        lastName: '李',
        company: 'ABC 科技股份有限公司',
        addressLine1: '新北市板橋區中山路二段200號',
        city: '新北市',
        state: '板橋區',
        postalCode: '22041',
        country: 'TW',
        phone: '02-2123-4567',
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    setTimeout(() => {
      setAddresses(mockAddresses)
      setLoading(false)
    }, 1000)
  }, [])

  const handleAddAddress = () => {
    setEditingAddress(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    form.setFieldsValue({
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      isDefault: address.isDefault
    })
    setModalVisible(true)
  }

  const handleDeleteAddress = async (addressId: string) => {
    try {
      // 實際使用時調用 API
      setAddresses(prev => prev.filter(addr => addr.id !== addressId))
      message.success(t('addresses.deleteSuccess') || '地址刪除成功')
    } catch (error) {
      message.error(t('addresses.deleteError') || '刪除地址失敗')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      // 實際使用時調用 API
      setAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        }))
      )
      message.success(t('addresses.setDefaultSuccess') || '已設為預設地址')
    } catch (error) {
      message.error(t('addresses.setDefaultError') || '設置失敗')
    }
  }

  const handleSubmit = async (values: AddressFormData) => {
    try {
      const addressData = {
        ...values,
        id: editingAddress?.id || String(Date.now()),
        createdAt: editingAddress?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (editingAddress) {
        // 更新現有地址
        setAddresses(prev =>
          prev.map(addr => 
            addr.id === editingAddress.id ? addressData : addr
          )
        )
        message.success(t('addresses.updateSuccess') || '地址更新成功')
      } else {
        // 新增地址
        setAddresses(prev => [...prev, addressData])
        message.success(t('addresses.addSuccess') || '地址新增成功')
      }

      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error(t('addresses.saveError') || '儲存失敗')
    }
  }

  const getAddressTypeTag = (type: Address['type']) => {
    const typeConfig = {
      billing: { color: 'blue', icon: <ShopOutlined />, text: t('addresses.billing') || '帳單地址' },
      shipping: { color: 'green', icon: <HomeOutlined />, text: t('addresses.shipping') || '配送地址' },
      both: { color: 'purple', icon: <CheckCircleOutlined />, text: t('addresses.both') || '帳單/配送' }
    }
    
    const config = typeConfig[type]
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  const renderAddressCard = (address: Address) => (
    <Card
      key={address.id}
      className="mb-4 transition-shadow hover:shadow-md"
      bodyStyle={{ padding: '16px' }}
      actions={[
        <Button
          key="edit"
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEditAddress(address)}
        >
          {t('common.edit') || '編輯'}
        </Button>,
        <Popconfirm
          key="delete"
          title={t('addresses.deleteConfirm') || '確定要刪除這個地址嗎？'}
          onConfirm={() => handleDeleteAddress(address.id)}
          okText={t('common.confirm') || '確定'}
          cancelText={t('common.cancel') || '取消'}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={address.isDefault}
          >
            {t('common.delete') || '刪除'}
          </Button>
        </Popconfirm>,
        !address.isDefault && (
          <Button
            key="default"
            type="text"
            onClick={() => handleSetDefault(address.id)}
          >
            {t('addresses.setDefault') || '設為預設'}
          </Button>
        )
      ].filter(Boolean)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          {getAddressTypeTag(address.type)}
          {address.isDefault && (
            <Tag color="gold" icon={<CheckCircleOutlined />}>
              {t('addresses.default') || '預設'}
            </Tag>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="font-medium text-gray-900">
          {address.firstName} {address.lastName}
        </div>
        {address.company && (
          <div className="text-gray-600">{address.company}</div>
        )}
        <div className="text-gray-700">
          {address.addressLine1}
          {address.addressLine2 && `, ${address.addressLine2}`}
        </div>
        <div className="text-gray-700">
          {address.city} {address.state} {address.postalCode}
        </div>
        <div className="text-gray-700">{address.country}</div>
        {address.phone && (
          <div className="text-gray-600 text-sm">{address.phone}</div>
        )}
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('addresses.title') || '收件地址管理'}
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddAddress}
        >
          {t('addresses.addNew') || '新增地址'}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Empty
          description={t('addresses.empty') || '還沒有任何地址'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddAddress}
          >
            {t('addresses.addFirst') || '新增第一個地址'}
          </Button>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(renderAddressCard)}
        </div>
      )}

      <Modal
        title={editingAddress ? 
          (t('addresses.editAddress') || '編輯地址') : 
          (t('addresses.addAddress') || '新增地址')
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'both',
            country: 'TW',
            isDefault: false
          }}
        >
          <Form.Item
            label={t('addresses.type') || '地址類型'}
            name="type"
            rules={[{ required: true, message: t('addresses.typeRequired') || '請選擇地址類型' }]}
          >
            <Select placeholder={t('addresses.selectType') || '請選擇地址類型'}>
              <Option value="billing">{t('addresses.billing') || '帳單地址'}</Option>
              <Option value="shipping">{t('addresses.shipping') || '配送地址'}</Option>
              <Option value="both">{t('addresses.both') || '帳單與配送地址'}</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('addresses.firstName') || '名字'}
                name="firstName"
                rules={[{ required: true, message: t('addresses.firstNameRequired') || '請輸入名字' }]}
              >
                <Input placeholder={t('addresses.firstNamePlaceholder') || '請輸入名字'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('addresses.lastName') || '姓氏'}
                name="lastName"
                rules={[{ required: true, message: t('addresses.lastNameRequired') || '請輸入姓氏' }]}
              >
                <Input placeholder={t('addresses.lastNamePlaceholder') || '請輸入姓氏'} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={t('addresses.company') || '公司名稱（選填）'}
            name="company"
          >
            <Input placeholder={t('addresses.companyPlaceholder') || '請輸入公司名稱'} />
          </Form.Item>

          <Form.Item
            label={t('addresses.addressLine1') || '地址'}
            name="addressLine1"
            rules={[{ required: true, message: t('addresses.addressRequired') || '請輸入地址' }]}
          >
            <Input placeholder={t('addresses.addressPlaceholder') || '請輸入詳細地址'} />
          </Form.Item>

          <Form.Item
            label={t('addresses.addressLine2') || '地址（第二行，選填）'}
            name="addressLine2"
          >
            <Input placeholder={t('addresses.addressLine2Placeholder') || '樓層、門牌等詳細資訊'} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label={t('addresses.city') || '城市'}
                name="city"
                rules={[{ required: true, message: t('addresses.cityRequired') || '請輸入城市' }]}
              >
                <Input placeholder={t('addresses.cityPlaceholder') || '請輸入城市'} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={t('addresses.state') || '區域'}
                name="state"
                rules={[{ required: true, message: t('addresses.stateRequired') || '請輸入區域' }]}
              >
                <Input placeholder={t('addresses.statePlaceholder') || '請輸入區域'} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={t('addresses.postalCode') || '郵遞區號'}
                name="postalCode"
                rules={[{ required: true, message: t('addresses.postalCodeRequired') || '請輸入郵遞區號' }]}
              >
                <Input placeholder={t('addresses.postalCodePlaceholder') || '請輸入郵遞區號'} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('addresses.country') || '國家/地區'}
                name="country"
                rules={[{ required: true, message: t('addresses.countryRequired') || '請選擇國家/地區' }]}
              >
                <Select placeholder={t('addresses.selectCountry') || '請選擇國家/地區'}>
                  <Option value="TW">台灣</Option>
                  <Option value="CN">中國大陸</Option>
                  <Option value="HK">香港</Option>
                  <Option value="MO">澳門</Option>
                  <Option value="SG">新加坡</Option>
                  <Option value="MY">馬來西亞</Option>
                  <Option value="US">美國</Option>
                  <Option value="JP">日本</Option>
                  <Option value="KR">韓國</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('addresses.phone') || '聯絡電話（選填）'}
                name="phone"
              >
                <Input placeholder={t('addresses.phonePlaceholder') || '請輸入聯絡電話'} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isDefault"
            valuePropName="checked"
          >
            <Switch />
            <span className="ml-2">{t('addresses.setAsDefault') || '設為預設地址'}</span>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                {t('common.cancel') || '取消'}
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAddress ? 
                  (t('common.update') || '更新') : 
                  (t('common.add') || '新增')
                }
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AddressesPage