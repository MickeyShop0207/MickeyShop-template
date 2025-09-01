// 自定義輸入框組件
import React from 'react'
import { Input as AntdInput, type InputProps as AntdInputProps } from 'antd'
import { SearchOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import clsx from 'clsx'
import './style.scss'

export interface InputProps extends Omit<AntdInputProps, 'size' | 'variant'> {
  size?: 'small' | 'middle' | 'large'
  variant?: 'outlined' | 'filled' | 'borderless'
  label?: string
  error?: string
  success?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
  fullWidth?: boolean
}

export const Input: React.FC<InputProps> = ({
  size = 'medium',
  variant = 'default',
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  className,
  ...props
}) => {
  const inputClassName = clsx(
    'custom-input',
    {
      [`custom-input--${size}`]: size,
      [`custom-input--${variant}`]: variant,
      'custom-input--error': error,
      'custom-input--success': success,
      'custom-input--loading': loading,
      'custom-input--full-width': fullWidth,
      'custom-input--has-left-icon': leftIcon,
      'custom-input--has-right-icon': rightIcon
    },
    className
  )

  const inputProps = {
    ...props,
    className: inputClassName,
    status: error ? 'error' : success ? 'success' : undefined,
    prefix: leftIcon,
    suffix: rightIcon || (loading ? <div className="custom-input__spinner" /> : undefined)
  }

  return (
    <div className="custom-input-wrapper">
      {label && (
        <label className="custom-input__label">
          {label}
          {props.required && <span className="custom-input__required">*</span>}
        </label>
      )}
      <AntdInput {...inputProps} />
      {(error || success || helperText) && (
        <div className="custom-input__message">
          {error && <span className="custom-input__error">{error}</span>}
          {success && <span className="custom-input__success">{success}</span>}
          {!error && !success && helperText && (
            <span className="custom-input__helper">{helperText}</span>
          )}
        </div>
      )}
    </div>
  )
}

// 搜索框組件
export const SearchInput: React.FC<Omit<InputProps, 'leftIcon'> & {
  onSearch?: (value: string) => void
  enterButton?: boolean | React.ReactNode
}> = ({ onSearch, enterButton = false, ...props }) => {
  return (
    <Input
      {...props}
      leftIcon={<SearchOutlined />}
      onPressEnter={(e) => {
        if (onSearch) {
          onSearch(e.currentTarget.value)
        }
        props.onPressEnter?.(e)
      }}
    />
  )
}

// 密碼輸入框組件
export const PasswordInput: React.FC<InputProps> = ({ ...props }) => {
  const passwordProps = {
    ...props,
    className: clsx('custom-password-input', props.className)
  }

  return (
    <div className="custom-input-wrapper">
      {props.label && (
        <label className="custom-input__label">
          {props.label}
          {props.required && <span className="custom-input__required">*</span>}
        </label>
      )}
      <AntdInput.Password
        {...passwordProps}
        iconRender={(visible) => (
          visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
        )}
      />
      {(props.error || props.success || props.helperText) && (
        <div className="custom-input__message">
          {props.error && <span className="custom-input__error">{props.error}</span>}
          {props.success && <span className="custom-input__success">{props.success}</span>}
          {!props.error && !props.success && props.helperText && (
            <span className="custom-input__helper">{props.helperText}</span>
          )}
        </div>
      )}
    </div>
  )
}

// 文本域組件
export const TextArea: React.FC<Omit<InputProps, 'leftIcon' | 'rightIcon'> & {
  rows?: number
  autoSize?: boolean | { minRows?: number; maxRows?: number }
  showCount?: boolean
}> = ({ size = 'medium', variant = 'default', label, error, success, helperText, ...props }) => {
  const textareaClassName = clsx(
    'custom-textarea',
    {
      [`custom-textarea--${size}`]: size,
      [`custom-textarea--${variant}`]: variant,
      'custom-textarea--error': error,
      'custom-textarea--success': success
    },
    props.className
  )

  return (
    <div className="custom-input-wrapper">
      {label && (
        <label className="custom-input__label">
          {label}
          {props.required && <span className="custom-input__required">*</span>}
        </label>
      )}
      <AntdInput.TextArea
        {...props}
        className={textareaClassName}
        status={error ? 'error' : success ? 'success' : undefined}
      />
      {(error || success || helperText) && (
        <div className="custom-input__message">
          {error && <span className="custom-input__error">{error}</span>}
          {success && <span className="custom-input__success">{success}</span>}
          {!error && !success && helperText && (
            <span className="custom-input__helper">{helperText}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default Input