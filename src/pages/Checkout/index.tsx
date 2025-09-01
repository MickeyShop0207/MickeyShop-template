// 結帳頁面
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Select,
  Button,
  Radio,
  Divider,
  Space,
  Typography,
  Alert,
  Modal,
  message,
  Steps,
  Image,
  Tag,
  Tooltip,
  Spin
} from 'antd'
import {
  LeftOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  GiftOutlined
} from '@ant-design/icons'
import { 
  useAuth, 
  useCart, 
  useMemberAddresses,
  useCreateOrder,
  useCoupons
} from '../../hooks'
import { formatPrice } from '../../utils'
import { ROUTES } from '../../router'
import { CreateOrderRequest, Address, PaymentMethod, Coupon } from '../../types'
import './style.scss'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input
const { confirm } = Modal

interface CheckoutStep {
  title: string
  key: string
  icon?: React.ReactNode
}

const checkoutSteps: CheckoutStep[] = [
  { title: '確認商品', key: 'products', icon: <CheckCircleOutlined /> },
  { title: '填寫資訊', key: 'info', icon: <UserOutlined /> },
  { title: '選擇付款', key: 'payment', icon: <CreditCardOutlined /> },
  { title: '確認訂單', key: 'confirm', icon: <SafetyOutlined /> }
]

interface AddressFormProps {
  address?: Address
  onSave: (address: Omit<Address, 'id' | 'isDefault'>) => void
  onCancel: () => void
}

const AddressForm: React.FC<AddressFormProps> = ({ address, onSave, onCancel }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (address) {
      form.setFieldsValue(address)
    }
  }, [address, form])

  const handleSubmit = () => {
    form.validateFields().then(values => {
      onSave(values)
    }).catch(error => {
      console.error('表單驗證失敗:', error)
    })
  }

  return (
    <Form
      form={form}
      layout="vertical"
      className="address-form"
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="recipientName"
            label="收件人姓名"
            rules={[{ required: true, message: '請輸入收件人姓名' }]}
          >
            <Input placeholder="請輸入收件人姓名" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="recipientPhone"
            label="收件人電話"
            rules={[
              { required: true, message: '請輸入收件人電話' },
              { pattern: /^09\d{8}$/, message: '請輸入正確的手機號碼格式' }
            ]}
          >
            <Input placeholder="0912345678" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="city"
            label="城市"
            rules={[{ required: true, message: '請選擇城市' }]}
          >
            <Select placeholder="請選擇城市">
              <Option value="台北市">台北市</Option>
              <Option value="新北市">新北市</Option>
              <Option value="桃園市">桃園市</Option>
              <Option value="台中市">台中市</Option>
              <Option value="台南市">台南市</Option>
              <Option value="高雄市">高雄市</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="district"
            label="區域"
            rules={[{ required: true, message: '請輸入區域' }]}
          >
            <Input placeholder="請輸入區域" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="postalCode"
            label="郵遞區號"
            rules={[
              { required: true, message: '請輸入郵遞區號' },
              { pattern: /^\d{3,5}$/, message: '請輸入正確的郵遞區號' }
            ]}
          >
            <Input placeholder="100" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="address"
        label="詳細地址"
        rules={[{ required: true, message: '請輸入詳細地址' }]}
      >
        <Input placeholder="請輸入詳細地址" />
      </Form.Item>

      <div className="form-actions">
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>
            保存地址
          </Button>
        </Space>
      </div>
    </Form>
  )
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { items, getTotalPrice } = useCart()
  const { data: addresses = [], createAddress } = useMemberAddresses()
  const { data: coupons = [] } = useCoupons()
  const { mutate: createOrder, isLoading: isCreatingOrder } = useCreateOrder()

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card')
  const [selectedCoupon, setSelectedCoupon] = useState<string>('')
  const [orderNote, setOrderNote] = useState('')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | undefined>()

  // 從購物車頁面傳來的選中商品
  useEffect(() => {
    const state = location.state as { selectedItems?: string[] }
    if (state?.selectedItems) {
      setSelectedItems(state.selectedItems)
    } else {
      // 如果沒有指定商品，則選擇所有商品
      setSelectedItems(items.map(item => item.id))
    }
  }, [location.state, items])

  // 自動選擇默認地址
  useEffect(() => {
    const defaultAddress = addresses.find(addr => addr.isDefault)
    if (defaultAddress && !selectedAddress) {
      setSelectedAddress(defaultAddress)
    }
  }, [addresses, selectedAddress])

  // 未登錄重定向
  if (!user) {
    navigate(ROUTES.LOGIN)
    return null
  }

  // 獲取選中的購物車商品
  const checkoutItems = items.filter(item => selectedItems.includes(item.id))

  if (checkoutItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-checkout">
            <Alert
              message="沒有要結帳的商品"
              description="請返回購物車選擇要結帳的商品"
              type="warning"
              showIcon
              action={
                <Button onClick={() => navigate(ROUTES.CART)}>
                  返回購物車
                </Button>
              }
            />
          </div>
        </div>
      </div>
    )
  }

  // 計算金額
  const subtotal = checkoutItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  const shippingFee = subtotal >= 1000 ? 0 : 60
  const couponDiscount = calculateCouponDiscount()
  const totalAmount = subtotal + shippingFee - couponDiscount

  function calculateCouponDiscount(): number {
    if (!selectedCoupon) return 0
    
    const coupon = coupons.find(c => c.id === selectedCoupon)
    if (!coupon) return 0

    if (coupon.type === 'percentage') {
      return Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount || Infinity)
    } else if (coupon.type === 'fixed') {
      return Math.min(coupon.value, subtotal)
    }
    
    return 0
  }

  // 保存新地址
  const handleSaveAddress = async (addressData: Omit<Address, 'id' | 'isDefault'>) => {
    try {
      const newAddress = await createAddress({
        ...addressData,
        isDefault: addresses.length === 0 // 第一個地址設為默認
      })
      setSelectedAddress(newAddress)
      setShowAddressForm(false)
      setEditingAddress(undefined)
      message.success('地址保存成功')
    } catch (error) {
      message.error('地址保存失敗')
    }
  }

  // 提交訂單
  const handleSubmitOrder = () => {
    if (!selectedAddress) {
      message.error('請選擇收貨地址')
      return
    }

    if (!paymentMethod) {
      message.error('請選擇付款方式')
      return
    }

    const orderData: CreateOrderRequest = {
      items: checkoutItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.price,
        variants: item.variants
      })),
      shippingAddress: selectedAddress,
      paymentMethod,
      couponId: selectedCoupon || undefined,
      note: orderNote,
      subtotal,
      shippingFee,
      discount: couponDiscount,
      totalAmount
    }

    confirm({
      title: '確認提交訂單',
      content: `總金額：${formatPrice(totalAmount)}`,
      icon: <ExclamationCircleOutlined />,
      onOk: () => {
        createOrder(orderData, {
          onSuccess: (order) => {
            message.success('訂單提交成功')
            navigate(ROUTES.ORDER_COMPLETE(order.id))
          },
          onError: () => {
            message.error('訂單提交失敗，請重試')
          }
        })
      },
      okText: '確認提交',
      cancelText: '取消'
    })
  }

  const handleStepChange = (step: number) => {
    // 驗證當前步驟
    if (step > currentStep) {
      switch (currentStep) {
        case 0: // 商品確認
          if (checkoutItems.length === 0) {
            message.error('請選擇要結帳的商品')
            return
          }
          break
        case 1: // 收貨信息
          if (!selectedAddress) {
            message.error('請選擇收貨地址')
            return
          }
          break
        case 2: // 付款方式
          if (!paymentMethod) {
            message.error('請選擇付款方式')
            return
          }
          break
      }
    }
    setCurrentStep(step)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderProductStep()
      case 1:
        return renderAddressStep()
      case 2:
        return renderPaymentStep()
      case 3:
        return renderConfirmStep()
      default:
        return null
    }
  }

  const renderProductStep = () => (
    <Card title="確認商品" className="step-card">
      <div className="checkout-items">
        {checkoutItems.map((item) => (
          <div key={item.id} className="checkout-item">
            <Image
              src={item.product.images[0]}
              alt={item.product.name}
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={false}
            />
            
            <div className="item-info">
              <div className="item-name">{item.product.name}</div>
              
              {item.variants && Object.keys(item.variants).length > 0 && (
                <div className="item-variants">
                  {Object.entries(item.variants).map(([key, value]) => (
                    <Tag key={key} >{key}: {value}</Tag>
                  ))}
                </div>
              )}
              
              <div className="item-price">
                {formatPrice(item.price)} × {item.quantity}
              </div>
            </div>
            
            <div className="item-total">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="step-summary">
        <div className="summary-row">
          <span>商品總計：</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </div>
    </Card>
  )

  const renderAddressStep = () => (
    <Card title="收貨信息" className="step-card">
      {addresses.length > 0 && !showAddressForm && (
        <div className="address-list">
          <Radio.Group
            value={selectedAddress?.id}
            onChange={(e) => {
              const address = addresses.find(addr => addr.id === e.target.value)
              setSelectedAddress(address || null)
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {addresses.map((address) => (
                <Radio key={address.id} value={address.id} className="address-radio">
                  <div className="address-info">
                    <div className="address-header">
                      <span className="recipient-name">{address.recipientName}</span>
                      <span className="recipient-phone">{address.recipientPhone}</span>
                      {address.isDefault && (
                        <Tag color="blue" >默認</Tag>
                      )}
                    </div>
                    <div className="address-detail">
                      {address.city} {address.district} {address.address}
                    </div>
                  </div>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>
      )}

      {showAddressForm && (
        <AddressForm
          address={editingAddress}
          onSave={handleSaveAddress}
          onCancel={() => {
            setShowAddressForm(false)
            setEditingAddress(undefined)
          }}
        />
      )}

      {!showAddressForm && (
        <div className="address-actions">
          <Button
            type="dashed"
            block
            onClick={() => setShowAddressForm(true)}
            icon={<EnvironmentOutlined />}
          >
            新增收貨地址
          </Button>
        </div>
      )}
    </Card>
  )

  const renderPaymentStep = () => (
    <Card title="付款方式" className="step-card">
      <Radio.Group
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="payment-methods"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Radio value="credit_card" className="payment-radio">
            <div className="payment-info">
              <CreditCardOutlined className="payment-icon" />
              <div className="payment-content">
                <div className="payment-name">信用卡付款</div>
                <div className="payment-desc">支援 VISA、MasterCard、JCB</div>
              </div>
            </div>
          </Radio>
          
          <Radio value="bank_transfer" className="payment-radio">
            <div className="payment-info">
              <SafetyOutlined className="payment-icon" />
              <div className="payment-content">
                <div className="payment-name">ATM 轉帳</div>
                <div className="payment-desc">提供轉帳帳號，3 天內完成付款</div>
              </div>
            </div>
          </Radio>
          
          <Radio value="cash_on_delivery" className="payment-radio">
            <div className="payment-info">
              <GiftOutlined className="payment-icon" />
              <div className="payment-content">
                <div className="payment-name">貨到付款</div>
                <div className="payment-desc">收到商品時付款給宅配人員</div>
              </div>
            </div>
          </Radio>
        </Space>
      </Radio.Group>

      {/* 優惠券選擇 */}
      {coupons.length > 0 && (
        <div className="coupon-section">
          <Divider orientation="left">優惠券</Divider>
          <Select
            placeholder="選擇優惠券"
            value={selectedCoupon}
            onChange={setSelectedCoupon}
            style={{ width: '100%' }}
            allowClear
          >
            {coupons.map((coupon) => (
              <Option key={coupon.id} value={coupon.id}>
                <div className="coupon-option">
                  <span className="coupon-name">{coupon.name}</span>
                  <span className="coupon-desc">
                    {coupon.type === 'percentage' 
                      ? `${coupon.value}% 折扣` 
                      : `折抵 ${formatPrice(coupon.value)}`}
                  </span>
                </div>
              </Option>
            ))}
          </Select>
        </div>
      )}

      {/* 訂單備註 */}
      <div className="order-note">
        <Divider orientation="left">訂單備註</Divider>
        <TextArea
          placeholder="請輸入訂單備註（選填）"
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          rows={3}
          maxLength={200}
          showCount
        />
      </div>
    </Card>
  )

  const renderConfirmStep = () => (
    <Card title="確認訂單" className="step-card">
      <div className="order-summary">
        {/* 收貨信息 */}
        <div className="summary-section">
          <h4>收貨信息</h4>
          {selectedAddress && (
            <div className="address-summary">
              <div className="recipient">
                <UserOutlined /> {selectedAddress.recipientName}
                <PhoneOutlined style={{ marginLeft: 16 }} /> {selectedAddress.recipientPhone}
              </div>
              <div className="address">
                <EnvironmentOutlined /> {selectedAddress.city} {selectedAddress.district} {selectedAddress.address}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* 付款信息 */}
        <div className="summary-section">
          <h4>付款方式</h4>
          <div className="payment-summary">
            <CreditCardOutlined />
            <span style={{ marginLeft: 8 }}>
              {paymentMethod === 'credit_card' && '信用卡付款'}
              {paymentMethod === 'bank_transfer' && 'ATM 轉帳'}
              {paymentMethod === 'cash_on_delivery' && '貨到付款'}
            </span>
          </div>
        </div>

        <Divider />

        {/* 商品信息 */}
        <div className="summary-section">
          <h4>商品信息</h4>
          <div className="items-summary">
            {checkoutItems.map((item) => (
              <div key={item.id} className="item-summary">
                <Image
                  src={item.product.images[0]}
                  alt={item.product.name}
                  width={40}
                  height={40}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                  preview={false}
                />
                <div className="item-details">
                  <div className="item-name">{item.product.name}</div>
                  <div className="item-spec">
                    {formatPrice(item.price)} × {item.quantity}
                  </div>
                </div>
                <div className="item-amount">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* 金額明細 */}
        <div className="summary-section">
          <h4>金額明細</h4>
          <div className="amount-details">
            <div className="amount-row">
              <span>商品總計：</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="amount-row">
              <span>運費：</span>
              <span>{shippingFee === 0 ? '免運費' : formatPrice(shippingFee)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="amount-row discount">
                <span>優惠折扣：</span>
                <span>-{formatPrice(couponDiscount)}</span>
              </div>
            )}
            <div className="amount-row total">
              <span>應付金額：</span>
              <span className="total-amount">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="checkout-page">
      <div className="container">
        {/* 頁面標題 */}
        <div className="page-header">
          <Button 
            type="text" 
            icon={<LeftOutlined />}
            onClick={() => navigate(ROUTES.CART)}
            className="back-button"
          >
            返回購物車
          </Button>
          <Title level={2}>結帳</Title>
        </div>

        {/* 進度條 */}
        <div className="checkout-steps">
          <Steps
            current={currentStep}
            onChange={handleStepChange}
            items={checkoutSteps}
          />
        </div>

        <Row gutter={24}>
          {/* 主要內容 */}
          <Col xs={24} lg={16}>
            <div className="checkout-content">
              {renderStepContent()}
              
              {/* 步驟控制按鈕 */}
              <div className="step-actions">
                <Space>
                  {currentStep > 0 && (
                    <Button onClick={() => handleStepChange(currentStep - 1)}>
                      上一步
                    </Button>
                  )}
                  
                  {currentStep < checkoutSteps.length - 1 ? (
                    <Button 
                      type="primary" 
                      onClick={() => handleStepChange(currentStep + 1)}
                    >
                      下一步
                    </Button>
                  ) : (
                    <Button 
                      type="primary" 
                      loading={isCreatingOrder}
                      onClick={handleSubmitOrder}
                    >
                      提交訂單
                    </Button>
                  )}
                </Space>
              </div>
            </div>
          </Col>

          {/* 訂單摘要 */}
          <Col xs={24} lg={8}>
            <Card title="訂單摘要" className="order-summary-card" sticky>
              <div className="summary-content">
                <div className="summary-row">
                  <span>商品總計：</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <div className="summary-row">
                  <span>運費：</span>
                  <span>{shippingFee === 0 ? '免運費' : formatPrice(shippingFee)}</span>
                </div>
                
                {couponDiscount > 0 && (
                  <div className="summary-row discount-row">
                    <span>優惠折扣：</span>
                    <span className="discount-amount">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                
                <Divider style={{ margin: '16px 0' }} />
                
                <div className="summary-row total-row">
                  <span>應付金額：</span>
                  <span className="total-amount">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className="checkout-guarantee">
                <div className="guarantee-item">
                  <SafetyOutlined className="guarantee-icon" />
                  <span>安全付款保證</span>
                </div>
                <div className="guarantee-item">
                  <CheckCircleOutlined className="guarantee-icon" />
                  <span>30 天退換保證</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default CheckoutPage