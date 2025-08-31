// 商品排序組件
import React from 'react'
import { Select } from 'antd'
import { SortAscendingOutlined } from '@ant-design/icons'

const { Option } = Select

interface ProductSortProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export const ProductSort: React.FC<ProductSortProps> = ({
  value,
  onChange,
  className
}) => {
  const sortOptions = [
    { value: 'created_desc', label: '最新上架' },
    { value: 'price_asc', label: '價格由低到高' },
    { value: 'price_desc', label: '價格由高到低' },
    { value: 'sales_desc', label: '銷量最高' },
    { value: 'rating_desc', label: '評分最高' },
    { value: 'name_asc', label: '商品名稱 A-Z' },
    { value: 'name_desc', label: '商品名稱 Z-A' }
  ]

  return (
    <Select
      value={value}
      onChange={onChange}
      className={className}
      suffixIcon={<SortAscendingOutlined />}
      placeholder="排序方式"
      style={{ minWidth: 140 }}
    >
      {sortOptions.map(option => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
  )
}