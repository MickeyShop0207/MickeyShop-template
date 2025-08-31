// 首頁組件
import React from 'react'
import { Row, Col, Button, Carousel } from 'antd'
import { ArrowRightOutlined, ShoppingOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { Card, ProductCard } from '../../components'
import { useRecommendedProducts, useFeaturedProducts, useNewArrivals } from '../../hooks'
import { ROUTES } from '../../router'
import './style.scss'

const HomePage: React.FC = () => {
  const { data: recommendedProducts = [] } = useRecommendedProducts(8)
  const { data: featuredProducts = [] } = useFeaturedProducts(8)
  const { data: newArrivals = [] } = useNewArrivals(6)

  // 輪播圖數據
  const carouselData = [
    {
      id: 1,
      title: '全新美妝系列',
      subtitle: '發現你的完美妝容',
      image: '/hero-1.jpg',
      link: ROUTES.PRODUCTS
    },
    {
      id: 2,
      title: '護膚專家',
      subtitle: '呵護每一寸肌膚',
      image: '/hero-2.jpg',
      link: ROUTES.CATEGORY('skincare')
    },
    {
      id: 3,
      title: '彩妝藝術',
      subtitle: '展現獨特魅力',
      image: '/hero-3.jpg',
      link: ROUTES.CATEGORY('makeup')
    }
  ]

  return (
    <div className="home-page">
      {/* 輪播圖 */}
      <section className="hero-section">
        <Carousel 
          autoplay 
          dots={{ className: 'custom-dots' }}
          effect="fade"
          className="hero-carousel"
        >
          {carouselData.map((slide) => (
            <div key={slide.id} className="hero-slide">
              <div 
                className="hero-slide__background"
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className="hero-slide__content">
                  <div className="container">
                    <div className="hero-slide__text">
                      <h1 className="hero-slide__title">{slide.title}</h1>
                      <p className="hero-slide__subtitle">{slide.subtitle}</p>
                      <Link to={slide.link}>
                        <Button 
                          type="primary" 
                          size="large"
                          icon={<ShoppingOutlined />}
                          className="hero-slide__cta"
                        >
                          立即購買
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </section>

      <div className="container">
        {/* 分類導航 */}
        <section className="category-section">
          <Row gutter={[24, 24]} className="category-grid">
            <Col xs={12} sm={6} lg={3}>
              <Link to={ROUTES.CATEGORY('skincare')}>
                <Card hoverable className="category-card">
                  <div className="category-card__icon">🧴</div>
                  <h3>護膚保養</h3>
                  <p>專業護膚方案</p>
                </Card>
              </Link>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <Link to={ROUTES.CATEGORY('makeup')}>
                <Card hoverable className="category-card">
                  <div className="category-card__icon">💄</div>
                  <h3>彩妝化妝</h3>
                  <p>完美妝容必備</p>
                </Card>
              </Link>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <Link to={ROUTES.CATEGORY('fragrance')}>
                <Card hoverable className="category-card">
                  <div className="category-card__icon">🌸</div>
                  <h3>香水香氛</h3>
                  <p>迷人香氣體驗</p>
                </Card>
              </Link>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <Link to={ROUTES.CATEGORY('haircare')}>
                <Card hoverable className="category-card">
                  <div className="category-card__icon">💇</div>
                  <h3>美髮護理</h3>
                  <p>健康秀髮呵護</p>
                </Card>
              </Link>
            </Col>
          </Row>
        </section>

        {/* 新品推薦 */}
        {newArrivals.length > 0 && (
          <section className="products-section">
            <div className="section-header">
              <h2 className="section-title">新品上市</h2>
              <Link to={`${ROUTES.PRODUCTS}?isNewArrival=true`}>
                <Button type="text" icon={<ArrowRightOutlined />}>
                  查看更多
                </Button>
              </Link>
            </div>
            <Row gutter={[16, 16]}>
              {newArrivals.map((product) => (
                <Col key={product.id} xs={12} sm={8} lg={4}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          </section>
        )}

        {/* 精選商品 */}
        {featuredProducts.length > 0 && (
          <section className="products-section">
            <div className="section-header">
              <h2 className="section-title">編輯精選</h2>
              <Link to={`${ROUTES.PRODUCTS}?isFeatured=true`}>
                <Button type="text" icon={<ArrowRightOutlined />}>
                  查看更多
                </Button>
              </Link>
            </div>
            <Row gutter={[16, 16]}>
              {featuredProducts.map((product) => (
                <Col key={product.id} xs={12} sm={8} lg={4}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          </section>
        )}

        {/* 推薦商品 */}
        {recommendedProducts.length > 0 && (
          <section className="products-section">
            <div className="section-header">
              <h2 className="section-title">為您推薦</h2>
              <Link to={`${ROUTES.PRODUCTS}?isRecommended=true`}>
                <Button type="text" icon={<ArrowRightOutlined />}>
                  查看更多
                </Button>
              </Link>
            </div>
            <Row gutter={[16, 16]}>
              {recommendedProducts.map((product) => (
                <Col key={product.id} xs={12} sm={8} lg={4}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          </section>
        )}

        {/* 品牌故事 */}
        <section className="brand-section">
          <Row gutter={48} align="middle">
            <Col xs={24} lg={12}>
              <div className="brand-content">
                <h2>MickeyShop Beauty</h2>
                <p>
                  我們致力於為每一位愛美的你，提供最優質的美妝護膚產品。
                  從世界各地精選品牌，讓美麗觸手可及。
                </p>
                <ul>
                  <li>✨ 嚴選國際知名品牌</li>
                  <li>🌿 天然安全成分保證</li>
                  <li>🚚 快速便捷配送服務</li>
                  <li>💝 專業美容顧問諮詢</li>
                </ul>
                <Link to={ROUTES.ABOUT}>
                  <Button type="primary" size="large">
                    了解更多
                  </Button>
                </Link>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className="brand-image">
                <img src="/brand-story.jpg" alt="品牌故事" />
              </div>
            </Col>
          </Row>
        </section>
      </div>
    </div>
  )
}

export default HomePage