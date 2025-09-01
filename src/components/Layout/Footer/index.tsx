/**
 * 頁面底部組件
 */

import React from 'react'
import { Layout, Row, Col, Space, Typography, Divider } from 'antd'
import {
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  YoutubeOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../router'
import './style.scss'

const { Footer: AntFooter } = Layout
const { Title, Text, Link: AntLink } = Typography

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <AntFooter className="main-footer">
      <div className="footer-content">
        <Row gutter={[32, 32]}>
          {/* 品牌信息 */}
          <Col xs={24} sm={12} lg={6}>
            <div className="footer-section">
              <div className="footer-brand">
                <img 
                  src="/logo.png" 
                  alt="MickeyShop Beauty" 
                  className="footer-logo"
                />
                <Title level={4} className="brand-name">MickeyShop Beauty</Title>
              </div>
              <Text className="brand-description">
                專業美妝保養品購物平台，提供最優質的產品與服務，讓美麗成為生活的日常。
              </Text>
              <div className="social-links">
                <Space size="middle">
                  <AntLink href="#" target="_blank">
                    <FacebookOutlined className="social-icon" />
                  </AntLink>
                  <AntLink href="#" target="_blank">
                    <InstagramOutlined className="social-icon" />
                  </AntLink>
                  <AntLink href="#" target="_blank">
                    <TwitterOutlined className="social-icon" />
                  </AntLink>
                  <AntLink href="#" target="_blank">
                    <YoutubeOutlined className="social-icon" />
                  </AntLink>
                </Space>
              </div>
            </div>
          </Col>

          {/* 商品分類 */}
          <Col xs={12} sm={12} lg={4}>
            <div className="footer-section">
              <Title level={5} className="section-title">商品分類</Title>
              <ul className="footer-links">
                <li><Link to="/categories/skincare">護膚保養</Link></li>
                <li><Link to="/categories/makeup">彩妝美容</Link></li>
                <li><Link to="/categories/fragrance">香水香氛</Link></li>
                <li><Link to="/categories/body-care">身體護理</Link></li>
                <li><Link to="/categories/hair-care">髮品護理</Link></li>
              </ul>
            </div>
          </Col>

          {/* 品牌專區 */}
          <Col xs={12} sm={12} lg={4}>
            <div className="footer-section">
              <Title level={5} className="section-title">熱門品牌</Title>
              <ul className="footer-links">
                <li><Link to="/brands/lancome">蘭蔻</Link></li>
                <li><Link to="/brands/estee-lauder">雅詩蘭黛</Link></li>
                <li><Link to="/brands/shiseido">資生堂</Link></li>
                <li><Link to="/brands/sk-ii">SK-II</Link></li>
                <li><Link to="/brands/loreal">萊雅</Link></li>
              </ul>
            </div>
          </Col>

          {/* 客戶服務 */}
          <Col xs={12} sm={12} lg={4}>
            <div className="footer-section">
              <Title level={5} className="section-title">客戶服務</Title>
              <ul className="footer-links">
                <li><Link to={ROUTES.CONTACT}>聯絡我們</Link></li>
                <li><Link to="/help/shipping">配送說明</Link></li>
                <li><Link to="/help/returns">退換貨政策</Link></li>
                <li><Link to="/help/payment">付款方式</Link></li>
                <li><Link to="/help/faq">常見問題</Link></li>
              </ul>
            </div>
          </Col>

          {/* 聯絡資訊 */}
          <Col xs={24} sm={12} lg={6}>
            <div className="footer-section">
              <Title level={5} className="section-title">聯絡資訊</Title>
              <div className="contact-info">
                <div className="contact-item">
                  <PhoneOutlined className="contact-icon" />
                  <Text>客服專線：0800-123-456</Text>
                </div>
                <div className="contact-item">
                  <MailOutlined className="contact-icon" />
                  <Text>Email：service@mickeyshop.com</Text>
                </div>
                <div className="contact-item">
                  <EnvironmentOutlined className="contact-icon" />
                  <Text>地址：台北市信義區信義路五段7號</Text>
                </div>
              </div>
              <div className="business-hours">
                <Text strong>營業時間</Text>
                <br />
                <Text>週一至週五：09:00-18:00</Text>
                <br />
                <Text>週六至週日：10:00-17:00</Text>
              </div>
            </div>
          </Col>
        </Row>

        <Divider />

        {/* 版權資訊 */}
        <div className="footer-bottom">
          <Row justify="space-between" align="middle">
            <Col xs={24} sm={12}>
              <Text className="copyright">
                © {currentYear} MickeyShop Beauty. 版權所有
              </Text>
            </Col>
            <Col xs={24} sm={12}>
              <div className="footer-policies">
                <Space split={<Divider type="vertical" />}>
                  <Link to="/privacy-policy">隱私權政策</Link>
                  <Link to="/terms-of-service">服務條款</Link>
                  <Link to="/sitemap">網站地圖</Link>
                </Space>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </AntFooter>
  )
}

export default Footer