# SEO策略與實現

## 現有問題分析

### 分散且不完整的SEO實現
- **國際化文檔**：僅有基本的SEOHead組件和結構化資料
- **路由文檔**：提到SEO友好但實現不明確
- **網域配置**：僅提及robots.txt和sitemap配置
- **缺少**：完整的SEO策略、技術SEO、內容優化、性能SEO

## 完整SEO策略架構

### 1. 技術SEO基礎設施

#### 核心Meta標籤系統
```jsx
// components/SEO/BaseSEO.jsx
import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/components/LocaleProvider'
import { useSEOConfig } from '@/hooks/useSEOConfig'

export const BaseSEO = ({ 
  title, 
  description, 
  keywords = [],
  image,
  url,
  type = 'website',
  article,
  product,
  noindex = false,
  nofollow = false
}) => {
  const { t } = useTranslation('seo')
  const { locale } = useLocale()
  const seoConfig = useSEOConfig()
  
  // 標題優化
  const siteTitle = t('site.title', 'MickeyShop Beauty')
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle
  const titleLength = fullTitle.length
  
  // 描述優化
  const metaDescription = description || t(`site.description.${type}`, t('site.description.default'))
  const descriptionLength = metaDescription.length
  
  // URL處理
  const currentUrl = url ? `${seoConfig.baseUrl}/${locale}${url}` : `${seoConfig.baseUrl}/${locale}`
  const canonicalUrl = seoConfig.getCanonicalUrl(url, locale)
  
  // 圖片處理
  const ogImage = image || seoConfig.getDefaultImage(type)
  const imageAlt = t(`image.alt.${type}`, title || siteTitle)
  
  return (
    <Helmet>
      {/* 基本Meta標籤 */}
      <html lang={locale} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      
      {/* Robots控制 */}
      <meta name="robots" content={`${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:locale" content={locale.replace('-', '_')} />
      <meta property="og:site_name" content={siteTitle} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && <meta property="og:image:alt" content={imageAlt} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {/* 語言替代 */}
      <link rel="alternate" hrefLang="zh-TW" href={`${seoConfig.baseUrl}/zh-TW${url || ''}`} />
      <link rel="alternate" hrefLang="en" href={`${seoConfig.baseUrl}/en${url || ''}`} />
      <link rel="alternate" hrefLang="x-default" href={`${seoConfig.baseUrl}/zh-TW${url || ''}`} />
      
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* 文章特定Meta */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          <meta property="article:modified_time" content={article.modifiedTime} />
          <meta property="article:author" content={article.author} />
          {article.tags?.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* 商品特定Meta */}
      {product && (
        <>
          <meta property="product:price:amount" content={product.price} />
          <meta property="product:price:currency" content={product.currency} />
          <meta property="product:availability" content={product.availability} />
          <meta property="product:brand" content={product.brand} />
          <meta property="product:category" content={product.category} />
        </>
      )}
      
      {/* SEO警告（開發環境） */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {titleLength > 60 && <meta name="seo-warning" content={`Title too long: ${titleLength} chars`} />}
          {descriptionLength > 160 && <meta name="seo-warning" content={`Description too long: ${descriptionLength} chars`} />}
        </>
      )}
    </Helmet>
  )
}
```

#### SEO配置Hook
```js
// hooks/useSEOConfig.js
import { useLocale } from '@/components/LocaleProvider'
import { useDomainConfig } from '@/hooks/useDomainConfig'

export const useSEOConfig = () => {
  const { locale } = useLocale()
  const domainConfig = useDomainConfig()
  
  const baseUrl = domainConfig.domain
  const cdnUrl = domainConfig.cdn.url
  
  const getCanonicalUrl = (path = '', targetLocale = locale) => {
    return `${baseUrl}/${targetLocale}${path}`
  }
  
  const getDefaultImage = (type) => {
    const imageMap = {
      'website': '/images/og-default.jpg',
      'product': '/images/og-product.jpg',
      'article': '/images/og-article.jpg',
      'profile': '/images/og-profile.jpg'
    }
    return `${cdnUrl}${imageMap[type] || imageMap.website}`
  }
  
  const getStructuredDataContext = () => {
    return {
      '@context': 'https://schema.org',
      '@graph': []
    }
  }
  
  return {
    baseUrl,
    cdnUrl,
    locale,
    getCanonicalUrl,
    getDefaultImage,
    getStructuredDataContext
  }
}
```

### 2. 結構化資料系統

#### 統一結構化資料管理器
```js
// utils/structured-data.js
export class StructuredDataManager {
  constructor(seoConfig) {
    this.config = seoConfig
    this.schemas = new Map()
  }
  
  // 網站基本資訊
  generateWebsiteSchema() {
    return {
      '@type': 'WebSite',
      '@id': `${this.config.baseUrl}#website`,
      'name': 'MickeyShop Beauty',
      'description': '專業美容用品、保養品、美髮用品電商平台',
      'url': this.config.baseUrl,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': `${this.config.baseUrl}/${this.config.locale}/search/{search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      },
      'sameAs': [
        'https://www.facebook.com/mickeyshopbeauty',
        'https://www.instagram.com/mickeyshopbeauty',
        'https://line.me/ti/p/@mickeyshop'
      ]
    }
  }
  
  // 組織資訊
  generateOrganizationSchema() {
    return {
      '@type': 'Organization',
      '@id': `${this.config.baseUrl}#organization`,
      'name': 'MickeyShop Beauty',
      'url': this.config.baseUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': `${this.config.cdnUrl}/images/logo-512.png`,
        'width': 512,
        'height': 512
      },
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+886-2-XXXX-XXXX',
        'contactType': 'customer service',
        'availableLanguage': ['Chinese', 'English']
      },
      'address': {
        '@type': 'PostalAddress',
        'addressCountry': 'TW',
        'addressLocality': '台北市',
        'addressRegion': '台北市'
      }
    }
  }
  
  // 商品Schema
  generateProductSchema(product) {
    const { locale } = this.config
    
    return {
      '@type': 'Product',
      '@id': `${this.config.baseUrl}/${locale}/product/${product.slug}#product`,
      'name': product.name[locale] || product.name['zh-TW'],
      'description': product.description[locale] || product.description['zh-TW'],
      'image': product.images?.map(img => `${this.config.cdnUrl}${img}`),
      'brand': {
        '@type': 'Brand',
        'name': product.brand
      },
      'category': product.categories?.join(', '),
      'sku': product.sku,
      'mpn': product.mpn,
      'gtin': product.gtin,
      'offers': {
        '@type': 'Offer',
        'price': product.prices[locale === 'en' ? 'USD' : 'TWD'],
        'priceCurrency': locale === 'en' ? 'USD' : 'TWD',
        'availability': product.inStock ? 
          'https://schema.org/InStock' : 
          'https://schema.org/OutOfStock',
        'url': `${this.config.baseUrl}/${locale}/product/${product.slug}`,
        'seller': {
          '@id': `${this.config.baseUrl}#organization`
        },
        'priceValidUntil': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      'aggregateRating': product.rating ? {
        '@type': 'AggregateRating',
        'ratingValue': product.rating.average,
        'reviewCount': product.rating.count,
        'bestRating': 5,
        'worstRating': 1
      } : undefined,
      'review': product.reviews?.map(review => ({
        '@type': 'Review',
        'author': {
          '@type': 'Person',
          'name': review.authorName
        },
        'datePublished': review.date,
        'reviewBody': review.content,
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': review.rating,
          'bestRating': 5,
          'worstRating': 1
        }
      }))
    }
  }
  
  // 麵包屑Schema
  generateBreadcrumbSchema(breadcrumbs) {
    return {
      '@type': 'BreadcrumbList',
      '@id': `${this.config.baseUrl}${this.config.currentPath}#breadcrumbs`,
      'itemListElement': breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': `${this.config.baseUrl}/${this.config.locale}${item.path}`
      }))
    }
  }
  
  // 文章Schema
  generateArticleSchema(article) {
    return {
      '@type': 'Article',
      '@id': `${this.config.baseUrl}${article.path}#article`,
      'headline': article.title,
      'description': article.excerpt,
      'image': article.featuredImage ? `${this.config.cdnUrl}${article.featuredImage}` : undefined,
      'datePublished': article.publishedAt,
      'dateModified': article.updatedAt,
      'author': {
        '@type': 'Person',
        'name': article.author.name,
        'url': `${this.config.baseUrl}/author/${article.author.slug}`
      },
      'publisher': {
        '@id': `${this.config.baseUrl}#organization`
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `${this.config.baseUrl}${article.path}`
      }
    }
  }
  
  // FAQ Schema
  generateFAQSchema(faqs) {
    return {
      '@type': 'FAQPage',
      '@id': `${this.config.baseUrl}${this.config.currentPath}#faqs`,
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    }
  }
  
  // 本地商業Schema（如果有實體店面）
  generateLocalBusinessSchema() {
    return {
      '@type': 'Store',
      '@id': `${this.config.baseUrl}#store`,
      'name': 'MickeyShop Beauty',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': '台北市信義區信義路五段7號',
        'addressLocality': '台北市',
        'addressRegion': '台北市',
        'postalCode': '110',
        'addressCountry': 'TW'
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': '25.033964',
        'longitude': '121.564468'
      },
      'telephone': '+886-2-XXXX-XXXX',
      'openingHours': 'Mo-Su 10:00-22:00',
      'paymentAccepted': 'Credit Card, Cash, Line Pay'
    }
  }
  
  // 生成完整的結構化資料
  generateFullSchema(data) {
    const schemas = [this.generateWebsiteSchema(), this.generateOrganizationSchema()]
    
    if (data.product) {
      schemas.push(this.generateProductSchema(data.product))
    }
    
    if (data.breadcrumbs) {
      schemas.push(this.generateBreadcrumbSchema(data.breadcrumbs))
    }
    
    if (data.article) {
      schemas.push(this.generateArticleSchema(data.article))
    }
    
    if (data.faqs) {
      schemas.push(this.generateFAQSchema(data.faqs))
    }
    
    return {
      '@context': 'https://schema.org',
      '@graph': schemas
    }
  }
}
```

### 3. 頁面專用SEO組件

#### 商品頁SEO
```jsx
// components/SEO/ProductSEO.jsx
import React from 'react'
import { BaseSEO } from './BaseSEO'
import { StructuredData } from './StructuredData'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/components/LocaleProvider'

export const ProductSEO = ({ product, breadcrumbs }) => {
  const { t } = useTranslation(['seo', 'products'])
  const { locale } = useLocale()
  
  const productName = product.name[locale] || product.name['zh-TW']
  const productDesc = product.description[locale] || product.description['zh-TW']
  
  // 生成SEO標題
  const title = t('product.title', {
    productName,
    brandName: product.brand,
    categoryName: product.category
  })
  
  // 生成Meta描述
  const description = t('product.description', {
    productName,
    brandName: product.brand,
    price: product.prices[locale === 'en' ? 'USD' : 'TWD'],
    currency: locale === 'en' ? 'USD' : 'TWD'
  })
  
  // 關鍵字生成
  const keywords = [
    productName,
    product.brand,
    product.category,
    ...product.tags || [],
    t('common.keywords.beauty'),
    t('common.keywords.skincare')
  ]
  
  return (
    <>
      <BaseSEO
        title={title}
        description={description}
        keywords={keywords}
        image={product.featuredImage}
        url={`/product/${product.slug}`}
        type="product"
        product={{
          price: product.prices[locale === 'en' ? 'USD' : 'TWD'],
          currency: locale === 'en' ? 'USD' : 'TWD',
          availability: product.inStock ? 'in stock' : 'out of stock',
          brand: product.brand,
          category: product.category
        }}
      />
      
      <StructuredData
        data={{
          product,
          breadcrumbs
        }}
      />
    </>
  )
}
```

#### 分類頁SEO
```jsx
// components/SEO/CategorySEO.jsx
import React from 'react'
import { BaseSEO } from './BaseSEO'
import { StructuredData } from './StructuredData'
import { useTranslation } from 'react-i18next'

export const CategorySEO = ({ category, products, pagination, breadcrumbs }) => {
  const { t } = useTranslation(['seo', 'categories'])
  
  const title = pagination.page > 1 ?
    t('category.title_with_page', { categoryName: category.name, page: pagination.page }) :
    t('category.title', { categoryName: category.name })
  
  const description = t('category.description', {
    categoryName: category.name,
    productCount: products.length,
    totalCount: pagination.total
  })
  
  const keywords = [
    category.name,
    t('common.keywords.category'),
    ...category.tags || []
  ]
  
  return (
    <>
      <BaseSEO
        title={title}
        description={description}
        keywords={keywords}
        image={category.image}
        url={`/products/${category.slug}${pagination.page > 1 ? `?page=${pagination.page}` : ''}`}
        type="website"
        noindex={pagination.page > 1} // 分頁頁面不索引
      />
      
      <StructuredData
        data={{
          breadcrumbs,
          productList: {
            products: products.slice(0, 20), // 只包含前20個商品
            category: category.name
          }
        }}
      />
    </>
  )
}
```

### 4. 技術SEO優化

#### 自動Sitemap生成
```js
// utils/sitemap-generator.js
export class SitemapGenerator {
  constructor(config) {
    this.config = config
  }
  
  async generateSitemap() {
    const urls = []
    
    // 靜態頁面
    const staticPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/about', priority: 0.8, changefreq: 'monthly' },
      { path: '/contact', priority: 0.7, changefreq: 'monthly' }
    ]
    
    // 商品頁面
    const products = await this.getProducts()
    const productUrls = products.map(product => ({
      path: `/product/${product.slug}`,
      priority: 0.9,
      changefreq: 'weekly',
      lastmod: product.updatedAt
    }))
    
    // 分類頁面
    const categories = await this.getCategories()
    const categoryUrls = categories.map(category => ({
      path: `/products/${category.slug}`,
      priority: 0.8,
      changefreq: 'weekly',
      lastmod: category.updatedAt
    }))
    
    // 合併所有URL
    urls.push(...staticPages, ...productUrls, ...categoryUrls)
    
    // 生成多語言Sitemap
    return this.generateMultilingualSitemap(urls)
  }
  
  generateMultilingualSitemap(urls) {
    const locales = ['zh-TW', 'en']
    const sitemapUrls = []
    
    urls.forEach(urlData => {
      locales.forEach(locale => {
        const url = {
          loc: `${this.config.baseUrl}/${locale}${urlData.path}`,
          lastmod: urlData.lastmod || new Date().toISOString(),
          changefreq: urlData.changefreq,
          priority: urlData.priority,
          // 語言替代
          links: locales.map(altLocale => ({
            rel: 'alternate',
            hreflang: altLocale,
            href: `${this.config.baseUrl}/${altLocale}${urlData.path}`
          }))
        }
        sitemapUrls.push(url)
      })
    })
    
    return this.formatSitemap(sitemapUrls)
  }
  
  formatSitemap(urls) {
    const urlElements = urls.map(url => {
      const links = url.links.map(link => 
        `<xhtml:link rel="${link.rel}" hreflang="${link.hreflang}" href="${link.href}"/>`
      ).join('\n    ')
      
      return `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
    ${links}
  </url>`
    }).join('\n')
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlElements}
</urlset>`
  }
}
```

#### Robots.txt動態生成
```js
// utils/robots-generator.js
export class RobotsGenerator {
  constructor(config) {
    this.config = config
  }
  
  generateRobotsTxt() {
    const isProduction = this.config.environment === 'production'
    
    if (!isProduction) {
      // 開發/測試環境禁止索引
      return `User-agent: *
Disallow: /

# Development environment - no indexing allowed`
    }
    
    // 生產環境設定
    return `User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /user/
Disallow: /_next/
Disallow: /static/

# Allow important pages
Allow: /zh-TW/
Allow: /en/
Allow: /zh-TW/product/
Allow: /en/product/
Allow: /zh-TW/products/
Allow: /en/products/

# Sitemap location
Sitemap: ${this.config.baseUrl}/sitemap.xml
Sitemap: ${this.config.baseUrl}/sitemap-products.xml
Sitemap: ${this.config.baseUrl}/sitemap-categories.xml

# Crawl-delay for non-Google bots
User-agent: *
Crawl-delay: 1

# Special rules for specific bots
User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 1`
  }
}
```

### 5. 性能SEO優化

#### 圖片SEO優化
```jsx
// components/SEO/OptimizedImage.jsx
import React from 'react'
import { useInView } from 'react-intersection-observer'

export const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false,
  loading = 'lazy',
  className,
  ...props 
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  })
  
  const shouldLoad = priority || inView
  
  // 生成響應式圖片URL
  const generateSrcSet = (baseSrc) => {
    const sizes = [320, 640, 768, 1024, 1280, 1920]
    return sizes.map(size => 
      `${baseSrc}?w=${size}&q=80 ${size}w`
    ).join(', ')
  }
  
  // 生成WebP格式
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
  const webpSrcSet = generateSrcSet(webpSrc)
  const fallbackSrcSet = generateSrcSet(src)
  
  return (
    <div ref={ref} className={className}>
      {shouldLoad && (
        <picture>
          {/* WebP格式優先 */}
          <source
            type="image/webp"
            srcSet={webpSrcSet}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* 備用格式 */}
          <img
            src={src}
            srcSet={fallbackSrcSet}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            decoding="async"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            {...props}
          />
        </picture>
      )}
    </div>
  )
}
```

### 6. SEO分析與監控

#### SEO健康檢查Hook
```js
// hooks/useSEOHealth.js
import { useEffect, useState } from 'react'

export const useSEOHealth = () => {
  const [healthData, setHealthData] = useState({
    score: 0,
    issues: [],
    recommendations: []
  })
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      checkSEOHealth()
    }
  }, [])
  
  const checkSEOHealth = () => {
    const issues = []
    const recommendations = []
    let score = 100
    
    // 檢查標題長度
    const title = document.title
    if (title.length > 60) {
      issues.push('標題超過60字符，可能在搜索結果中被截斷')
      score -= 10
    } else if (title.length < 30) {
      recommendations.push('考慮使用更詳細的標題（30-60字符）')
      score -= 5
    }
    
    // 檢查Meta描述
    const metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      issues.push('缺少Meta描述')
      score -= 15
    } else if (metaDesc.content.length > 160) {
      issues.push('Meta描述超過160字符')
      score -= 10
    }
    
    // 檢查H1標籤
    const h1Tags = document.querySelectorAll('h1')
    if (h1Tags.length === 0) {
      issues.push('頁面缺少H1標籤')
      score -= 15
    } else if (h1Tags.length > 1) {
      issues.push('頁面有多個H1標籤')
      score -= 10
    }
    
    // 檢查Alt屬性
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])')
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length}個圖片缺少Alt屬性`)
      score -= Math.min(imagesWithoutAlt.length * 2, 20)
    }
    
    // 檢查內部連結
    const internalLinks = document.querySelectorAll('a[href^="/"]')
    if (internalLinks.length < 3) {
      recommendations.push('增加內部連結有助於SEO')
    }
    
    // 檢查結構化資料
    const structuredData = document.querySelector('script[type="application/ld+json"]')
    if (!structuredData) {
      recommendations.push('添加結構化資料可提升搜索結果顯示')
      score -= 10
    }
    
    setHealthData({ score, issues, recommendations })
  }
  
  return healthData
}
```

## 實施策略

### 1. 階段性實施計劃

#### 第一階段：基礎建設（Week 1-2）
- 實施BaseSEO組件
- 建立StructuredDataManager
- 配置基本的Meta標籤系統

#### 第二階段：頁面優化（Week 3-4）
- 實施各頁面專用SEO組件
- 優化商品頁和分類頁SEO
- 建立Sitemap和Robots.txt生成

#### 第三階段：技術優化（Week 5-6）
- 圖片SEO優化
- 性能優化
- SEO健康檢查系統

#### 第四階段：監控與優化（Week 7-8）
- SEO分析工具整合
- A/B測試標題和描述
- 持續優化和監控

### 2. 與現有系統整合

#### 國際化系統整合
- 復用現有的SEOHead組件作為基礎
- 整合多語言結構化資料
- 支援語言切換時的SEO優化

#### 狀態管理整合
- SEO數據納入統一狀態管理
- 動態SEO數據更新
- SEO健康狀況監控

#### 錯誤處理整合
- SEO組件錯誤使用統一錯誤處理系統
- 結構化資料驗證錯誤處理
- SEO警告和建議系統

### 3. 效果監控指標

#### 技術指標
- Core Web Vitals分數
- 頁面載入速度
- 圖片優化率

#### SEO指標  
- 搜索引擎索引頁面數
- 關鍵字排名
- 點擊率(CTR)
- 結構化資料覆蓋率

#### 業務指標
- 有機流量增長
- 轉換率提升
- 用戶停留時間

這個完整的SEO策略解決了現有文檔中提及但實現不明確的問題，提供了從技術SEO到內容優化的全面解決方案。