/**
 * 首頁組件
 */

import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Button, Card } from 'antd'

const HomePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>首頁 - MickeyShop Beauty</title>
        <meta name="description" content="MickeyShop Beauty 提供最優質的美妝產品" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* 英雄區域 */}
        <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="container mx-auto px-4 py-16 lg:py-24">
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                專業美妝
                <br />
                <span className="text-primary-200">盡在 MickeyShop</span>
              </h1>
              <p className="text-xl mb-8 text-primary-100">
                探索最新的美妝產品，找到最適合您的完美妝容
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  type="primary" 
                  size="large"
                  className="bg-white text-primary-600 border-white hover:bg-primary-50"
                >
                  瀏覽商品
                </Button>
                <Button 
                  size="large"
                  className="border-white text-white hover:bg-white hover:text-primary-600"
                >
                  了解更多
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* 特色區域 */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                為什麼選擇我們
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                我們致力於提供最優質的美妝產品和服務，讓每位顧客都能找到最適合的產品
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center border-none shadow-lg">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-2">優質產品</h3>
                <p className="text-gray-600">
                  嚴選來自全球知名品牌的優質美妝產品
                </p>
              </Card>
              
              <Card className="text-center border-none shadow-lg">
                <div className="text-4xl mb-4">🚚</div>
                <h3 className="text-xl font-semibold mb-2">快速配送</h3>
                <p className="text-gray-600">
                  全台快速配送，讓您盡快收到心愛的產品
                </p>
              </Card>
              
              <Card className="text-center border-none shadow-lg">
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="text-xl font-semibold mb-2">品質保證</h3>
                <p className="text-gray-600">
                  提供完整的售後服務和品質保證
                </p>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA 區域 */}
        <section className="bg-primary-500 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              準備開始您的美妝之旅了嗎？
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              立即註冊成為會員，享受專屬優惠
            </p>
            <Button 
              type="primary"
              size="large"
              className="bg-white text-primary-600 border-white hover:bg-primary-50"
            >
              立即註冊
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}

export default HomePage