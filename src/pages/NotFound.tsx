import React from 'react'
import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您訪問的頁面不存在。"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            回到首頁
          </Button>
        }
      />
    </div>
  )
}

export default NotFoundPage