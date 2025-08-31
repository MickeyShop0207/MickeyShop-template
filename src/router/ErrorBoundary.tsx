// 錯誤邊界組件
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Result, Button } from 'antd'
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // 調用外部錯誤處理函數
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 在開發環境下記錄詳細錯誤信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Details')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  public render() {
    if (this.state.hasError) {
      // 如果有自定義的錯誤回退 UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isDevelopment = process.env.NODE_ENV === 'development'
      const { error, errorInfo } = this.state

      return (
        <div className="error-boundary">
          <Result
            status="error"
            title="糟糕，頁面出現了錯誤"
            subTitle="我們遇到了一些技術問題，請嘗試刷新頁面或返回首頁。"
            extra={[
              <Button 
                key="retry" 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
              >
                重試
              </Button>,
              <Button 
                key="reload"
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
              >
                刷新頁面
              </Button>,
              <Button 
                key="home"
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
              >
                返回首頁
              </Button>
            ]}
          >
            {isDevelopment && error && (
              <div className="error-details" style={{ 
                marginTop: 24, 
                textAlign: 'left',
                background: '#f5f5f5',
                padding: 16,
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'monospace'
              }}>
                <h4>開發環境錯誤詳情：</h4>
                <div style={{ color: '#d32f2f', marginBottom: 8 }}>
                  <strong>錯誤：</strong> {error.message}
                </div>
                <div style={{ color: '#666', marginBottom: 8 }}>
                  <strong>堆棧：</strong>
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontSize: 11,
                    maxHeight: 200,
                    overflow: 'auto'
                  }}>
                    {error.stack}
                  </pre>
                </div>
                {errorInfo && (
                  <div style={{ color: '#666' }}>
                    <strong>組件堆棧：</strong>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontSize: 11,
                      maxHeight: 200,
                      overflow: 'auto'
                    }}>
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </Result>
        </div>
      )
    }

    return this.props.children
  }
}

// 函數式組件版本的錯誤邊界 HOC
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const ErrorBoundaryWrapper: React.FC<P> = (props) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }

  ErrorBoundaryWrapper.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`

  return ErrorBoundaryWrapper
}

export default ErrorBoundary