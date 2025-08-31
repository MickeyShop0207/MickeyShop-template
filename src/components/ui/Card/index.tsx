// 自定義卡片組件
import React from 'react'
import { Card as AntdCard, type CardProps as AntdCardProps } from 'antd'
import clsx from 'clsx'
import './style.scss'

export interface CardProps extends Omit<AntdCardProps, 'size'> {
  variant?: 'default' | 'outlined' | 'elevated' | 'minimal'
  size?: 'small' | 'medium' | 'large'
  rounded?: boolean
  shadow?: 'none' | 'small' | 'medium' | 'large'
  padding?: 'none' | 'small' | 'medium' | 'large'
  header?: React.ReactNode
  footer?: React.ReactNode
  loading?: boolean
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'medium',
  rounded = true,
  shadow = 'small',
  padding = 'medium',
  header,
  footer,
  loading = false,
  hoverable = false,
  className,
  children,
  title,
  ...props
}) => {
  const cardClassName = clsx(
    'custom-card',
    {
      [`custom-card--${variant}`]: variant,
      [`custom-card--${size}`]: size,
      [`custom-card--shadow-${shadow}`]: shadow,
      [`custom-card--padding-${padding}`]: padding,
      'custom-card--rounded': rounded,
      'custom-card--loading': loading,
      'custom-card--hoverable': hoverable
    },
    className
  )

  return (
    <AntdCard
      {...props}
      className={cardClassName}
      title={header || title}
      loading={loading}
      hoverable={hoverable}
    >
      <div className="custom-card__content">
        {children}
      </div>
      {footer && (
        <div className="custom-card__footer">
          {footer}
        </div>
      )}
    </AntdCard>
  )
}

// 卡片標題組件
export const CardHeader: React.FC<{
  title?: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
}> = ({ title, subtitle, action, className }) => {
  return (
    <div className={clsx('custom-card__header', className)}>
      <div className="custom-card__header-content">
        {title && <h3 className="custom-card__title">{title}</h3>}
        {subtitle && <p className="custom-card__subtitle">{subtitle}</p>}
      </div>
      {action && (
        <div className="custom-card__header-action">
          {action}
        </div>
      )}
    </div>
  )
}

// 卡片內容組件
export const CardContent: React.FC<{
  children: React.ReactNode
  padding?: 'none' | 'small' | 'medium' | 'large'
  className?: string
}> = ({ children, padding = 'medium', className }) => {
  return (
    <div className={clsx(
      'custom-card__body',
      `custom-card__body--padding-${padding}`,
      className
    )}>
      {children}
    </div>
  )
}

// 卡片操作組件
export const CardActions: React.FC<{
  children: React.ReactNode
  align?: 'left' | 'center' | 'right' | 'space-between'
  className?: string
}> = ({ children, align = 'right', className }) => {
  return (
    <div className={clsx(
      'custom-card__actions',
      `custom-card__actions--${align}`,
      className
    )}>
      {children}
    </div>
  )
}

export default Card