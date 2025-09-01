// 自定義按鈕組件
import React from 'react'
import { Button as AntdButton, type ButtonProps as AntdButtonProps } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import clsx from 'clsx'
import './style.scss'

export interface ButtonProps extends Omit<AntdButtonProps, 'loading' | 'size' | 'variant'> {
  variant?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  size?: 'small' | 'middle' | 'large'
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  gradient?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'middle',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  gradient = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const buttonClassName = clsx(
    'custom-button',
    {
      [`custom-button--${variant}`]: variant,
      [`custom-button--${size}`]: size,
      'custom-button--full-width': fullWidth,
      'custom-button--loading': loading,
      'custom-button--gradient': gradient && variant === 'primary',
      'custom-button--disabled': disabled || loading
    },
    className
  )

  const iconProps = loading ? { icon: <LoadingOutlined /> } : {}

  return (
    <AntdButton
      {...props}
      className={buttonClassName}
      disabled={disabled || loading}
      {...iconProps}
    >
      {!loading && leftIcon && (
        <span className="custom-button__left-icon">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && (
        <span className="custom-button__right-icon">{rightIcon}</span>
      )}
    </AntdButton>
  )
}

export default Button