# GSAP動畫系統設計

## 核心動畫效果

### 0. 節慶動畫系統
#### 節慶動畫類型
支援四種節慶動畫類型，每種都有獨特的視覺效果：

```js
// 節慶動畫管理器
class FestivalAnimationManager {
  constructor() {
    this.activeAnimations = new Map()
    this.backgroundConfigs = new Map()
    this.currentFestivalType = null
  }
  
  // 播放節慶動畫
  playFestivalAnimation(type, config) {
    // 停止當前動畫
    this.stopAllAnimations()
    
    switch (type) {
      case 'traditional':
        this.playTraditionalAnimation(config)
        break
      case 'promotional':
        this.playPromotionalAnimation(config)
        break
      case 'flash_sale':
        this.playFlashSaleAnimation(config)
        break
      case 'member_exclusive':
        this.playMemberExclusiveAnimation(config)
        break
    }
    
    this.currentFestivalType = type
    console.log(`🎭 播放節慶動畫: ${type}`)
  }
  
  // 傳統節日動畫（已存在）
  playTraditionalAnimation(config) {
    // 保持現有的傳統節日動畫邏輯
    this.activeAnimations.set('traditional', 'existing-animation')
  }
  
  // 促銷活動動畫
  playPromotionalAnimation(config) {
    const tl = gsap.timeline({ repeat: -1 })
    
    // 動態背景效果
    this.setDynamicBackground(config)
    
    // 促銷標籤脈衝效果
    tl.to('.promotional-badge', {
      scale: 1.1,
      duration: 1,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1
    })
    
    // 價格閃爍效果
    tl.to('.promotional-price', {
      opacity: 0.7,
      duration: 0.5,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1
    }, 0)
    
    this.activeAnimations.set('promotional', tl)
  }
  
  // 快閃搶購動畫
  playFlashSaleAnimation(config) {
    const tl = gsap.timeline({ repeat: -1 })
    
    // 動態背景效果
    this.setDynamicBackground(config)
    
    // 緊急感紅色脈衝
    tl.to('.flash-sale-indicator', {
      backgroundColor: '#ff4757',
      scale: 1.05,
      duration: 0.3,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1
    })
    
    // 倒數計時器跳動
    tl.to('.countdown-timer', {
      scale: 1.02,
      duration: 1,
      ease: 'bounce.out',
      repeat: -1
    }, 0)
    
    // 庫存數量警示動畫
    tl.to('.stock-warning', {
      color: '#ff6b7a',
      fontWeight: 'bold',
      duration: 0.8,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1
    }, 0.2)
    
    this.activeAnimations.set('flash_sale', tl)
  }
  
  // 會員專屬動畫
  playMemberExclusiveAnimation(config) {
    const tl = gsap.timeline({ repeat: -1 })
    
    // 動態背景效果
    this.setDynamicBackground(config)
    
    // VIP金色光暈效果
    tl.to('.vip-badge', {
      boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
      scale: 1.02,
      duration: 2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    })
    
    // 專屬標籤漸變效果
    tl.to('.exclusive-label', {
      background: 'linear-gradient(45deg, #ffd700, #ffed4e, #ffd700)',
      backgroundSize: '200% 200%',
      backgroundPosition: '100% 0%',
      duration: 3,
      ease: 'none',
      repeat: -1
    }, 0)
    
    this.activeAnimations.set('member_exclusive', tl)
  }
  
  // 設定動態背景
  setDynamicBackground(config) {
    if (!config || !config.length) return
    
    const currentDate = new Date()
    const activeBackground = config.find(bg => {
      const start = new Date(bg.dateRange.start)
      const end = new Date(bg.dateRange.end)
      return currentDate >= start && currentDate <= end
    })
    
    if (activeBackground) {
      this.applyDynamicBackground(activeBackground)
      this.backgroundConfigs.set('active', activeBackground)
    }
  }
  
  // 套用動態背景
  applyDynamicBackground(backgroundConfig) {
    const backgroundElement = document.querySelector('.festival-dynamic-background') || 
      this.createBackgroundElement()
    
    switch (backgroundConfig.backgroundType) {
      case 'image':
        backgroundElement.style.backgroundImage = `url(${backgroundConfig.backgroundUrl})`
        break
      case 'video':
        this.setVideoBackground(backgroundElement, backgroundConfig)
        break
      case 'animation':
        this.setAnimatedBackground(backgroundElement, backgroundConfig)
        break
    }
    
    // 設定透明度和層級
    gsap.to(backgroundElement, {
      opacity: backgroundConfig.opacity,
      zIndex: backgroundConfig.zIndex,
      duration: 1,
      ease: 'power2.out'
    })
  }
  
  // 建立背景元素
  createBackgroundElement() {
    const element = document.createElement('div')
    element.className = 'festival-dynamic-background'
    element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      pointer-events: none;
      opacity: 0;
    `
    document.body.appendChild(element)
    return element
  }
  
  // 設定影片背景
  setVideoBackground(element, config) {
    element.innerHTML = `
      <video autoplay muted loop style="width: 100%; height: 100%; object-fit: cover;">
        <source src="${config.backgroundUrl}" type="video/mp4">
      </video>
    `
  }
  
  // 設定動畫背景
  setAnimatedBackground(element, config) {
    // 使用 GSAP 創建程序化動畫背景
    const { duration, loop, autoplay } = config.animationSettings || {}
    
    if (autoplay) {
      const tl = gsap.timeline({ 
        repeat: loop ? -1 : 0,
        duration: duration || 10
      })
      
      // 自訂動畫效果
      tl.to(element, {
        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)',
        backgroundSize: '400% 400%',
        backgroundPosition: '0% 50%',
        duration: duration || 10,
        ease: 'none',
        repeat: -1,
        yoyo: true
      })
      
      this.activeAnimations.set('background', tl)
    }
  }
  
  // 停止所有動畫
  stopAllAnimations() {
    this.activeAnimations.forEach((animation, key) => {
      if (animation && typeof animation.kill === 'function') {
        animation.kill()
      }
    })
    this.activeAnimations.clear()
    
    // 移除動態背景
    const backgroundElement = document.querySelector('.festival-dynamic-background')
    if (backgroundElement) {
      gsap.to(backgroundElement, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => backgroundElement.remove()
      })
    }
    
    this.currentFestivalType = null
    console.log('🎭 所有節慶動畫已停止')
  }
  
  // 獲取當前動畫狀態
  getCurrentStatus() {
    return {
      activeType: this.currentFestivalType,
      animationCount: this.activeAnimations.size,
      hasBackground: this.backgroundConfigs.has('active')
    }
  }
}

// 全域節慶動畫管理器實例
window.festivalAnimationManager = new FestivalAnimationManager()
```

### 1. 玻璃態懸停效果

#### 實現原理
當滑鼠懸停在任意物件上時，其他區域變成玻璃態（模糊+透明度降低），突出懸停物件。

#### 技術實現
```js
// 玻璃態懸停系統
class GlassmorphismHover {
  constructor() {
    this.activeElement = null
    this.initHoverSystem()
  }
  
  initHoverSystem() {
    // 為所有互動元素添加懸停監聽
    const interactiveElements = document.querySelectorAll(`
      .product-card, 
      .nav-item, 
      .button, 
      .filter-option,
      .brand-card,
      .category-card
    `)
    
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', (e) => this.onHover(e.target))
      element.addEventListener('mouseleave', () => this.onLeave())
    })
  }
  
  onHover(targetElement) {
    this.activeElement = targetElement
    
    // 創建玻璃態遮罩
    const overlay = document.createElement('div')
    overlay.className = 'glassmorphism-overlay'
    document.body.appendChild(overlay)
    
    // GSAP動畫：其他區域變模糊
    gsap.to(overlay, {
      opacity: 1,
      backdropFilter: 'blur(8px)',
      duration: 0.3,
      ease: 'power2.out'
    })
    
    // 懸停元素突出顯示
    gsap.to(targetElement, {
      scale: 1.05,
      zIndex: 1000,
      boxShadow: '0 20px 40px rgba(166, 101, 86, 0.3)',
      duration: 0.3,
      ease: 'power2.out'
    })
  }
  
  onLeave() {
    const overlay = document.querySelector('.glassmorphism-overlay')
    
    // 移除玻璃態效果
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: () => overlay?.remove()
    })
    
    // 恢復懸停元素
    if (this.activeElement) {
      gsap.to(this.activeElement, {
        scale: 1,
        zIndex: 'auto',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        duration: 0.3,
        ease: 'power2.out'
      })
    }
    
    this.activeElement = null
  }
}
```

#### CSS配置
```scss
// 玻璃態遮罩樣式
.glassmorphism-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(242, 232, 223, 0.3);
  backdrop-filter: blur(0px);
  opacity: 0;
  pointer-events: none;
  z-index: 999;
  transition: all 0.3s ease;
}

[data-theme="dark"] .glassmorphism-overlay {
  background: rgba(26, 20, 16, 0.3);
}
```

### 2. 品牌名稱載入動畫

#### 可配置的品牌載入動畫
```js
// 品牌載入動畫系統
class BrandLoadingAnimation {
  constructor() {
    this.brandName = '' // 從後台API獲取
    this.container = null
    this.isLoading = true
  }
  
  async init() {
    // 從後台獲取品牌名稱
    this.brandName = await this.fetchBrandName()
    this.createLoadingScreen()
    this.startAnimation()
  }
  
  async fetchBrandName() {
    try {
      const response = await fetch('/api/settings/brand-name')
      const data = await response.json()
      return data.brandName || 'MickeyShop Beauty'
    } catch {
      return 'MickeyShop Beauty'
    }
  }
  
  createLoadingScreen() {
    this.container = document.createElement('div')
    this.container.className = 'brand-loading-screen'
    this.container.innerHTML = `
      <div class="brand-loading-content">
        <svg class="brand-curves" viewBox="0 0 400 200">
          <!-- 裝飾性曲線路徑 -->
          <path class="curve-1" d="M50,100 Q200,50 350,100" stroke="var(--bg-selected)" fill="none" stroke-width="2"/>
          <path class="curve-2" d="M50,120 Q200,70 350,120" stroke="var(--bg-hover)" fill="none" stroke-width="1.5"/>
          <path class="curve-3" d="M50,80 Q200,30 350,80" stroke="var(--bg-component)" fill="none" stroke-width="1"/>
        </svg>
        <div class="brand-text">${this.brandName}</div>
        <div class="loading-progress">
          <div class="progress-bar"></div>
        </div>
      </div>
    `
    document.body.appendChild(this.container)
  }
  
  startAnimation() {
    const tl = gsap.timeline({ repeat: -1 })
    
    // 曲線繪製動畫
    tl.fromTo('.curve-1, .curve-2, .curve-3', 
      { strokeDasharray: '1000', strokeDashoffset: '1000' },
      { 
        strokeDashoffset: '0', 
        duration: 2, 
        ease: 'power2.inOut',
        stagger: 0.3 
      }
    )
    
    // 品牌名稱打字機效果
    .call(() => this.typewriterEffect(), null, '-=1')
    
    // 暫停後重複
    .to({}, { duration: 1 })
    .call(() => this.resetAnimation())
    
    // 載入進度條 (可選)
    gsap.to('.progress-bar', {
      width: '100%',
      duration: 3,
      ease: 'power2.out'
    })
  }
  
  typewriterEffect() {
    const textElement = document.querySelector('.brand-text')
    textElement.innerHTML = ''
    
    const chars = this.brandName.split('')
    
    chars.forEach((char, index) => {
      const span = document.createElement('span')
      span.textContent = char === ' ' ? '\u00A0' : char
      span.style.opacity = '0'
      textElement.appendChild(span)
      
      gsap.to(span, {
        opacity: 1,
        duration: 0.05,
        delay: index * 0.1
      })
    })
  }
  
  resetAnimation() {
    // 重置曲線
    gsap.set('.curve-1, .curve-2, .curve-3', {
      strokeDashoffset: '1000'
    })
    
    // 清空文字
    document.querySelector('.brand-text').innerHTML = ''
  }
  
  hide() {
    return gsap.to(this.container, {
      opacity: 0,
      scale: 1.1,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        this.container.remove()
        this.isLoading = false
      }
    })
  }
}
```

#### CSS樣式
```scss
// 品牌載入畫面
.brand-loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--bg-page);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.brand-loading-content {
  text-align: center;
  max-width: 400px;
}

.brand-curves {
  width: 100%;
  height: 200px;
  margin-bottom: 2rem;
}

.brand-text {
  font-family: var(--font-en);
  font-size: 2.5rem;
  font-weight: 300;
  color: var(--text-primary);
  margin-bottom: 2rem;
  min-height: 3rem; // 保持高度一致
}

.loading-progress {
  width: 200px;
  height: 2px;
  background: var(--bg-component);
  border-radius: 1px;
  margin: 0 auto;
  overflow: hidden;
}

.progress-bar {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, var(--bg-selected), var(--bg-hover));
  border-radius: 1px;
}
```

### 3. 彈出頁面動畫系統

#### Modal彈出動畫
```js
// Modal動畫系統
class ModalAnimations {
  static show(modalElement, animationType = 'scale') {
    const animations = {
      scale: () => gsap.fromTo(modalElement, 
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
      ),
      
      slideUp: () => gsap.fromTo(modalElement,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.5, ease: 'power3.out' }
      ),
      
      fadeSlide: () => gsap.fromTo(modalElement,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      ),
      
      elastic: () => gsap.fromTo(modalElement,
        { scale: 0.3, rotation: -10, opacity: 0 },
        { 
          scale: 1, 
          rotation: 0, 
          opacity: 1, 
          duration: 0.6, 
          ease: 'elastic.out(1, 0.75)' 
        }
      )
    }
    
    // 背景遮罩動畫
    const backdrop = modalElement.querySelector('.modal-backdrop')
    if (backdrop) {
      gsap.fromTo(backdrop, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      )
    }
    
    return animations[animationType]?.() || animations.scale()
  }
  
  static hide(modalElement, animationType = 'scale') {
    const animations = {
      scale: () => gsap.to(modalElement, 
        { scale: 0.9, opacity: 0, duration: 0.3, ease: 'power2.in' }
      ),
      
      slideDown: () => gsap.to(modalElement,
        { y: '100%', opacity: 0, duration: 0.4, ease: 'power3.in' }
      ),
      
      fadeSlide: () => gsap.to(modalElement,
        { y: -20, opacity: 0, duration: 0.3, ease: 'power2.in' }
      )
    }
    
    return animations[animationType]?.() || animations.scale()
  }
}
```

## 完整動畫場景應用

### 4. 頁面載入動畫
```js
// 商品列表進入動畫
const animateProductGrid = () => {
  gsap.from('.product-card', {
    y: 50,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power2.out'
  })
}

// 頁面轉換動畫
const pageTransition = (newPage) => {
  const tl = gsap.timeline()
  
  return tl
    .to('.page-content', { 
      opacity: 0, 
      y: -20, 
      duration: 0.3 
    })
    .call(() => newPage.render())
    .from('.page-content', { 
      opacity: 0, 
      y: 20, 
      duration: 0.4 
    })
}
```

### 5. 購物流程動畫
```js
// 加入購物車飛行動畫
const addToCartAnimation = (productElement, cartIcon) => {
  const productClone = productElement.cloneNode(true)
  productClone.className = 'flying-product'
  document.body.appendChild(productClone)
  
  const tl = gsap.timeline()
  
  return tl
    .set(productClone, {
      position: 'fixed',
      top: productElement.getBoundingClientRect().top,
      left: productElement.getBoundingClientRect().left,
      width: productElement.offsetWidth,
      height: productElement.offsetHeight,
      zIndex: 1001
    })
    .to(productClone, {
      x: cartIcon.getBoundingClientRect().left - productElement.getBoundingClientRect().left,
      y: cartIcon.getBoundingClientRect().top - productElement.getBoundingClientRect().top,
      scale: 0.3,
      rotation: 360,
      duration: 0.8,
      ease: 'power2.out'
    })
    .to(cartIcon, {
      scale: 1.2,
      duration: 0.2,
      ease: 'back.out(1.7)'
    }, '-=0.2')
    .to(cartIcon, {
      scale: 1,
      duration: 0.2
    })
    .call(() => productClone.remove())
}

// 購物車數量更新
const updateCartCount = (countElement, newCount) => {
  gsap.from(countElement, {
    scale: 1.5,
    color: '#A66556',
    duration: 0.4,
    ease: 'back.out(1.7)',
    onComplete: () => {
      countElement.textContent = newCount
    }
  })
}
```

### 6. 滾動觸發動畫
```js
// ScrollTrigger設定
gsap.registerPlugin(ScrollTrigger)

// 商品進入視窗動畫
ScrollTrigger.batch('.product-card', {
  onEnter: elements => {
    gsap.from(elements, {
      y: 50,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out'
    })
  }
})

// 價格數字滾動
const animatePrice = (priceElement, targetPrice) => {
  gsap.to({ value: 0 }, {
    value: targetPrice,
    duration: 1.5,
    ease: 'power2.out',
    onUpdate: function() {
      priceElement.textContent = `NT$${Math.round(this.targets()[0].value)}`
    }
  })
}
```

### 7. 搜尋與篩選動畫
```js
// 搜尋建議下拉動畫
const showSearchSuggestions = (suggestionsElement) => {
  gsap.fromTo(suggestionsElement, 
    { 
      height: 0, 
      opacity: 0, 
      y: -10 
    },
    { 
      height: 'auto', 
      opacity: 1, 
      y: 0,
      duration: 0.3,
      ease: 'power2.out'
    }
  )
}

// 篩選結果更新動畫
const updateFilterResults = (resultsContainer) => {
  const tl = gsap.timeline()
  
  return tl
    .to('.product-grid', {
      opacity: 0.5,
      scale: 0.95,
      duration: 0.2
    })
    .call(() => {
      // 更新結果內容
    })
    .to('.product-grid', {
      opacity: 1,
      scale: 1,
      duration: 0.3
    })
}
```

### 8. 通知與反饋動畫
```js
// 成功/錯誤通知
const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.textContent = message
  
  document.body.appendChild(notification)
  
  const tl = gsap.timeline()
  
  return tl
    .fromTo(notification, 
      { x: '100%', opacity: 0 },
      { x: '0%', opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
    )
    .to(notification, {
      x: '100%',
      opacity: 0,
      duration: 0.3,
      delay: 3,
      ease: 'power2.in',
      onComplete: () => notification.remove()
    })
}
```

## 特殊節慶動畫系統（互動載入）

### 節慶動畫管理器
```js
class SeasonalAnimations {
  constructor() {
    this.currentSeason = null
    this.activeEffects = new Map()
    this.config = {
      enabled: true,
      intensity: 'medium', // low, medium, high
      autoDetect: true
    }
  }
  
  // 根據日期自動檢測節慶
  detectSeason() {
    const now = new Date()
    const month = now.getMonth() + 1
    const date = now.getDate()
    
    // 農曆新年期間 (1/15 - 3/15)
    if ((month === 1 && date >= 15) || (month === 2) || (month === 3 && date <= 15)) {
      return 'lunarnewyear'
    }
    // 情人節期間 (2/1 - 2/14)
    if (month === 2 && date <= 14) return 'valentine'
    // 母親節期間 (5/1 - 5/15)
    if (month === 5 && date <= 15) return 'mothersday'
    // 端午節期間 (5/15 - 6/15)
    if ((month === 5 && date >= 15) || (month === 6 && date <= 15)) {
      return 'dragonboat'
    }
    // 父親節期間 (8/1 - 8/31)
    if (month === 8) return 'fathersday'
    // 中秋節期間 (9/1 - 10/15)
    if (month === 9 || (month === 10 && date <= 15)) {
      return 'midautumn'
    }
    // 萬聖節期間 (10/15 - 10/31)
    if (month === 10 && date >= 15) return 'halloween'
    // 聖誕節期間 (12/1 - 12/31)
    if (month === 12) return 'christmas'
    
    return null
  }
}
```

### 農曆新年動畫組合
```js
// 紅包雨效果
class LunarNewYearRedPacketsEffect {
  constructor() {
    this.packets = []
    this.container = null
  }
  
  generateRedPackets() {
    const packetCount = 12
    const packetEmojis = ['🧧', '🎊', '🎉']
    
    for (let i = 0; i < packetCount; i++) {
      const packet = document.createElement('div')
      packet.innerHTML = packetEmojis[Math.floor(Math.random() * packetEmojis.length)]
      
      this.container.appendChild(packet)
      this.animateRedPacket(packet)
    }
  }
  
  animateRedPacket(packet) {
    const tl = gsap.timeline({ repeat: -1 })
    
    tl.to(packet, {
      y: window.innerHeight + 100,
      x: `+=${Math.random() * 100 - 50}`,
      rotation: Math.random() * 360,
      duration: Math.random() * 3 + 4,
      ease: 'power1.out'
    })
  }
}

// 煙火綻放效果  
class LunarNewYearFireworksEffect {
  createFirework() {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#45b7d1']
    const x = Math.random() * this.canvas.width
    const y = Math.random() * this.canvas.height * 0.5
    
    // Canvas煙火爆炸效果
    const particles = 20
    for (let i = 0; i < particles; i++) {
      const angle = (Math.PI * 2 / particles) * i
      
      gsap.to({ x: x, y: y, opacity: 1 }, {
        x: x + Math.cos(angle) * 100,
        y: y + Math.sin(angle) * 100,
        opacity: 0,
        duration: 1.5,
        ease: 'power2.out'
      })
    }
  }
}
```

### 中秋節動畫組合
```js
// 月亮升起效果
class MidAutumnMoonEffect {
  animateMoon() {
    // 月亮從底部升起
    gsap.to(this.moon, {
      bottom: '100px',
      duration: 3,
      ease: 'power2.out',
      onComplete: () => {
        // 月亮輕微搖擺
        gsap.to(this.moon, {
          rotation: 5,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut'
        })
      }
    })
  }
}

// 桂花飄落效果
class MidAutumnOsmantheusEffect {
  generateOsmantheus() {
    const petalCount = 25
    const colors = ['#ffeb3b', '#ffc107', '#ff9800']
    
    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement('div')
      petal.style.cssText = `
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        opacity: 0.7;
        box-shadow: 0 0 3px currentColor;
      `
      
      this.container.appendChild(petal)
      this.animatePetal(petal)
    }
  }
}
```

### 端午節動畫組合
```js
// 龍舟賽跑效果
class DragonBoatRaceEffect {
  animateBoat(boat, index) {
    gsap.to(boat, {
      x: window.innerWidth + 100,
      duration: 8 + Math.random() * 4,
      repeat: -1,
      ease: 'none',
      delay: index * 2
    })
    
    // 船隻上下輕微搖擺
    gsap.to(boat, {
      y: 5,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut'
    })
  }
}

// 粽子飄香效果
class DragonBoatZongziEffect {
  animateZongzi(zongzi) {
    // 粽子輕柔搖擺
    gsap.to(zongzi, {
      x: `+=${Math.random() * 50 - 25}`,
      y: `+=${Math.random() * 30 - 15}`,
      rotation: Math.random() * 15 - 7.5,
      duration: Math.random() * 3 + 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut'
    })
  }
}
```

### 節慶動畫統一控制器
```js
class SeasonalAnimationController {
  constructor() {
    this.activeAnimations = new Map()
    this.config = {
      lunarnewyear: { enabled: true, intensity: 'high' },  // 農曆新年
      valentine: { enabled: true, intensity: 'low' },      // 情人節
      mothersday: { enabled: true, intensity: 'low' },     // 母親節
      dragonboat: { enabled: true, intensity: 'medium' },  // 端午節
      fathersday: { enabled: true, intensity: 'low' },     // 父親節
      midautumn: { enabled: true, intensity: 'medium' },   // 中秋節
      halloween: { enabled: true, intensity: 'medium' },   // 萬聖節
      christmas: { enabled: true, intensity: 'medium' }    // 聖誕節
    }
  }
  
  async loadSeasonalAnimation(season) {
    // 清除現有動畫
    this.clearAllAnimations()
    
    if (!this.config[season]?.enabled) return
    
    // 動態載入對應動畫
    const animations = {
      lunarnewyear: [LunarNewYearRedPacketsEffect, LunarNewYearFireworksEffect],
      valentine: [ValentineHeartsEffect],
      mothersday: [MothersDayPetalsEffect],
      dragonboat: [DragonBoatRaceEffect, DragonBoatZongziEffect],
      fathersday: [FathersDayTieEffect],
      midautumn: [MidAutumnMoonEffect, MidAutumnOsmantheusEffect],
      halloween: [HalloweenGhostEffect],
      christmas: [ChristmasSnowEffect]
    }
    
    const AnimationClasses = animations[season]
    if (AnimationClasses) {
      AnimationClasses.forEach(AnimationClass => {
        const animation = new AnimationClass()
        animation.init()
        this.activeAnimations.set(season + '_' + AnimationClass.name, animation)
      })
    }
  }
}
```

## 商業促銷動畫系統（互動載入）

### 限時搶購動畫
```js
class FlashSaleCountdown {
  constructor(targetDate, elementId) {
    this.targetDate = new Date(targetDate)
    this.element = document.getElementById(elementId)
    this.interval = null
  }
  
  updateCountdown() {
    const now = new Date().getTime()
    const distance = this.targetDate - now
    
    if (distance < 0) {
      this.onCountdownEnd()
      return
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24))
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)
    
    this.animateNumberChange('days', days)
    this.animateNumberChange('hours', hours)
    this.animateNumberChange('minutes', minutes)
    this.animateNumberChange('seconds', seconds)
    
    // 緊急感動畫
    if (hours === 0 && minutes < 10) {
      this.addUrgencyEffects()
    }
  }
  
  animateNumberChange(id, newValue) {
    const element = document.getElementById(id)
    const currentValue = parseInt(element.textContent)
    
    if (currentValue !== newValue) {
      gsap.to(element, {
        scale: 1.2,
        color: '#ff4757',
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          element.textContent = String(newValue).padStart(2, '0')
        }
      })
    }
  }
}

// 搶購進度條動畫
class SaleProgressAnimation {
  constructor(sold, total, elementId) {
    this.sold = sold
    this.total = total
    this.element = document.getElementById(elementId)
    this.percentage = (sold / total) * 100
  }
  
  animateProgress() {
    const progressFill = this.element.querySelector('.progress-bar-fill')
    const fire = this.element.querySelector('.progress-fire')
    
    // 進度條填充動畫
    gsap.to(progressFill, {
      width: `${this.percentage}%`,
      duration: 2,
      ease: 'power2.out'
    })
    
    // 火焰跟隨進度條移動
    gsap.to(fire, {
      left: `${this.percentage}%`,
      duration: 2,
      ease: 'power2.out',
      delay: 0.5
    })
    
    // 高售出率時的特殊效果
    if (this.percentage > 80) {
      this.addHotSaleEffects()
    }
  }
}
```

### 優惠券動畫
```js
class CouponRainEffect {
  constructor() {
    this.coupons = []
    this.container = null
    this.isActive = false
  }
  
  startCouponRain(duration = 10000) {
    if (this.isActive) return
    
    this.isActive = true
    const interval = setInterval(() => {
      this.dropCoupon()
    }, 500)
    
    setTimeout(() => {
      clearInterval(interval)
      this.isActive = false
      this.cleanup()
    }, duration)
  }
  
  collectCoupon(couponElement, discount) {
    // 收集動畫
    gsap.to(couponElement, {
      scale: 1.5,
      rotation: 0,
      duration: 0.2,
      ease: 'back.out(1.7)',
      onComplete: () => {
        gsap.to(couponElement, {
          y: -100,
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            couponElement.remove()
            this.showCollectionSuccess(discount)
          }
        })
      }
    })
  }
}
```

### 新品發佈動畫
```js
class NewProductBadgeAnimation {
  constructor(productElement) {
    this.productElement = productElement
    this.badge = null
  }
  
  animateBadge() {
    // 徽章入場動畫
    gsap.from(this.badge, {
      scale: 0,
      rotation: -180,
      duration: 0.8,
      ease: 'back.out(1.7)'
    })
    
    // 閃光效果
    gsap.to('.badge-shine', {
      x: '100px',
      opacity: 0,
      duration: 1.5,
      repeat: -1,
      repeatDelay: 3,
      ease: 'power2.out'
    })
    
    // 輕微搖擺
    gsap.to(this.badge, {
      rotation: 5,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'power1.inOut'
    })
  }
}
```

## 個性化動畫系統（互動載入）

### 用戶生日慶祝動畫
```js
class BirthdayAnimation {
  constructor(userName) {
    this.userName = userName
    this.container = null
    this.isActive = false
  }
  
  shouldShowBirthdayAnimation() {
    // 檢查今天是否為用戶生日
    const today = new Date()
    const userBirthday = this.getUserBirthday()
    
    if (!userBirthday) return false
    
    return (
      today.getMonth() === userBirthday.getMonth() &&
      today.getDate() === userBirthday.getDate()
    )
  }
  
  startCelebration() {
    this.isActive = true
    
    // 創建生日卡片
    const birthdayCard = document.createElement('div')
    birthdayCard.innerHTML = `
      <div class="birthday-content">
        <div class="birthday-cake">🎂</div>
        <h2>生日快樂！</h2>
        <p>親愛的 ${this.userName}</p>
        <div class="birthday-gift">
          <p>🎁 專屬生日禮物</p>
          <div class="gift-coupon">
            <span>生日專享 20% 折扣</span>
          </div>
        </div>
      </div>
      <div class="confetti-container"></div>
    `
    
    this.container.appendChild(birthdayCard)
    this.animateBirthdayCard(birthdayCard)
    this.createConfetti()
    this.createBalloons()
  }
}
```

### 購物里程碑動畫
```js
class ShoppingMilestoneAnimation {
  constructor() {
    this.milestones = [
      { amount: 1000, title: '初級會員', reward: '5%折扣' },
      { amount: 5000, title: '銀級會員', reward: '10%折扣' },
      { amount: 10000, title: '金級會員', reward: '15%折扣' },
      { amount: 25000, title: '鑽石會員', reward: '20%折扣' }
    ]
  }
  
  checkMilestone(totalSpent) {
    const achievedMilestone = this.milestones.find(m => 
      totalSpent >= m.amount && !this.hasShownMilestone(m.amount)
    )
    
    if (achievedMilestone) {
      this.showMilestoneAnimation(achievedMilestone)
      this.markMilestoneShown(achievedMilestone.amount)
    }
  }
  
  showMilestoneAnimation(milestone) {
    const overlay = document.createElement('div')
    overlay.innerHTML = `
      <div class="milestone-content">
        <div class="achievement-card">
          <div class="achievement-icon">🏆</div>
          <h2>恭喜達成</h2>
          <div class="milestone-title">${milestone.title}</div>
          <div class="milestone-amount">消費滿 NT$${milestone.amount.toLocaleString()}</div>
          <div class="milestone-reward">
            <p>🎁 獲得獎勵：${milestone.reward}</p>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(overlay)
    this.animateMilestone(overlay, milestone)
  }
}
```

### VIP升級動畫
```js
class VIPUpgradeAnimation {
  createUpgradeEffect() {
    const overlay = document.createElement('div')
    overlay.innerHTML = `
      <div class="upgrade-content">
        <div class="golden-particles"></div>
        <div class="upgrade-card">
          <div class="vip-crown">👑</div>
          <h2>恭喜升級！</h2>
          <div class="new-level">${this.newLevel} 會員</div>
          <div class="benefits">
            <p>🎉 享受更多專屬優惠</p>
            <p>🚚 免費配送服務</p>
            <p>⭐ 優先客服支援</p>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(overlay)
    this.animateUpgrade(overlay)
  }
}
```

### 個性化推薦動畫
```js
class PersonalizedRecommendationAnimation {
  createRecommendationSlider() {
    const container = document.getElementById('personalized-recommendations')
    
    container.innerHTML = `
      <div class="recommendation-header">
        <div class="personal-touch">
          <span class="user-avatar">👤</span>
          <h3>${this.userName} 專屬推薦</h3>
        </div>
        <div class="ai-indicator">
          <span class="ai-icon">🤖</span>
          <span>AI 智能分析</span>
        </div>
      </div>
      <div class="recommendation-slider">
        ${this.recommendations.map((item, index) => `
          <div class="recommendation-card" data-index="${index}">
            <div class="card-glow"></div>
            <div class="product-image">
              <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="product-info">
              <h4>${item.name}</h4>
              <div class="recommendation-reason">
                <span class="reason-icon">💡</span>
                <span>${item.reason}</span>
              </div>
              <div class="price">${item.price}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }
}
```

### 用戶偏好追蹤動畫
```js
class UserPreferenceAnimation {
  updatePreference(category, value) {
    this.preferences[category] = Math.min(this.maxPreference, 
      this.preferences[category] + value
    )
    
    this.showPreferenceUpdate(category, value)
    this.updatePreferenceBar(category)
  }
  
  showPreferenceUpdate(category, value) {
    const notification = document.createElement('div')
    notification.innerHTML = `
      <div class="preference-content">
        <span class="category-icon">${this.getCategoryIcon(category)}</span>
        <span class="update-text">對 ${this.getCategoryName(category)} 的興趣 +${value}</span>
        <div class="sparkle-effect">✨</div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // 入場動畫
    gsap.from(notification, {
      x: 100,
      opacity: 0,
      duration: 0.5,
      ease: 'back.out(1.7)'
    })
  }
}
```

### 季節性個人化動畫
```js
class SeasonalPersonalizationAnimation {
  showSeasonalRecommendation() {
    const recommendations = this.getSeasonalRecommendations()
    
    const modal = document.createElement('div')
    modal.innerHTML = `
      <div class="seasonal-content">
        <div class="season-background">${this.getSeasonEmoji()}</div>
        <h2>${this.getSeasonName()} 專屬保養建議</h2>
        <div class="skin-analysis">
          <p>根據您的 <strong>${this.userSkinType}</strong> 膚質</p>
        </div>
        <div class="seasonal-products">
          ${recommendations.map(product => `
            <div class="seasonal-product">
              <img src="${product.image}" alt="${product.name}">
              <h4>${product.name}</h4>
              <p class="seasonal-reason">${product.seasonalReason}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    this.animateSeasonalModal(modal)
  }
}
```

## 統一動畫載入系統

### 動畫載入策略標準
**立即載入** (頁面載入時):
- 品牌載入打字機動畫
- 頁面轉場動畫
- 導航過渡效果

**動態載入** (頁面載入完成後):
- 動態背景動畫 (節慶特效)

**互動後載入** (用戶首次互動觸發):
- 玻璃態懸停效果
- 商品卡片動畫
- 購物車飛行動畫
- 搜尋與篩選動畫
- 通知反饋動畫
- 滾動觸發動畫

### 統一動畫管理器
```js
// 統一動畫載入管理器
class AnimationManager {
  constructor() {
    this.loadedAnimations = new Set()
    this.userInteracted = false
    this.init()
  }
  
  async init() {
    console.log('🎬 啟動統一動畫系統')
    
    // 立即載入: 品牌載入動畫
    await this.loadCriticalAnimations()
    
    // 設定用戶互動監聽
    this.setupUserInteractionListener()
    
    // 頁面載入完成後載入動態背景
    window.addEventListener('load', () => {
      this.loadDynamicBackgrounds()
    })
  }
  
  async loadCriticalAnimations() {
    console.log('⚡ 載入關鍵動畫...')
    
    // 1. 品牌載入動畫 (必須立即可用)
    const brandLoading = new BrandLoadingAnimation()
    await brandLoading.init()
    this.loadedAnimations.add('brand-loading')
    
    // 2. 頁面轉場動畫 (立即可用)
    this.initPageTransitions()
    this.loadedAnimations.add('page-transitions')
    
    // 3. 導航過渡效果 (立即可用)
    this.initNavigationTransitions()
    this.loadedAnimations.add('navigation-transitions')
    
    console.log('✨ 關鍵動畫載入完成')
  }
  
  loadDynamicBackgrounds() {
    console.log('🎨 載入動態背景...')
    
    // 動態背景動畫 (頁面載入後立即可用)
    import('./animations/dynamicBackgrounds.js').then(module => {
      const backgroundAnimations = new module.DynamicBackgroundAnimations()
      backgroundAnimations.init()
      this.loadedAnimations.add('dynamic-backgrounds')
      console.log('🌟 動態背景載入完成')
    }).catch(err => {
      console.warn('⚠️ 動態背景載入失敗:', err)
    })
  }
  
  setupUserInteractionListener() {
    // 監聽第一次用戶互動
    const firstInteractionHandler = () => {
      if (!this.userInteracted) {
        this.userInteracted = true
        this.loadInteractionAnimations()
        
        // 移除監聽器，只觸發一次
        document.removeEventListener('click', firstInteractionHandler)
        document.removeEventListener('touchstart', firstInteractionHandler)
        document.removeEventListener('mousemove', firstInteractionHandler)
        document.removeEventListener('scroll', firstInteractionHandler)
      }
    }
    
    // 多種互動方式監聽
    document.addEventListener('click', firstInteractionHandler, { passive: true })
    document.addEventListener('touchstart', firstInteractionHandler, { passive: true })
    document.addEventListener('mousemove', firstInteractionHandler, { passive: true })
    document.addEventListener('scroll', firstInteractionHandler, { passive: true })
  }
  
  async loadInteractionAnimations() {
    console.log('🎯 用戶已互動，載入互動動畫...')
    
    // 用戶互動後才載入的動畫
    const animationsToLoad = [
      { name: 'glassmorphism-hover', module: './animations/glassmorphismHover.js' },
      { name: 'product-cards', module: './animations/productCards.js' },
      { name: 'cart-animations', module: './animations/cartAnimations.js' },
      { name: 'search-filter', module: './animations/searchFilter.js' },
      { name: 'notifications', module: './animations/notifications.js' },
      { name: 'scroll-triggers', module: './animations/scrollTriggers.js' }
    ]
    
    // 並行載入以提高性能
    const loadPromises = animationsToLoad.map(async ({ name, module }) => {
      try {
        const animationModule = await import(module)
        const AnimationClass = animationModule.default
        const animation = new AnimationClass()
        await animation.init()
        this.loadedAnimations.add(name)
        console.log(`✅ 動畫已載入: ${name}`)
      } catch (error) {
        // 使用統一錯誤處理系統
        const { useErrorHandler } = await import('@/stores/error-handler')
        useErrorHandler.getState().handleError(error, {
          type: 'animation-load',
          animationName: name,
          retryCallback: () => this.loadAnimation(name)
        })
      }
    })
    
    await Promise.allSettled(loadPromises)
    console.log('🎉 所有互動動畫載入完成')
  }
  
  initPageTransitions() {
    // 頁面轉場動畫 (立即可用)
    const pageTransition = {
      enter: (element) => {
        return gsap.from(element, {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power2.out'
        })
      },
      
      leave: (element) => {
        return gsap.to(element, {
          opacity: 0,
          y: -20,
          duration: 0.4,
          ease: 'power2.in'
        })
      }
    }
    
    // 綁定路由轉場
    this.bindRouteTransitions(pageTransition)
  }
  
  initNavigationTransitions() {
    // 導航過渡動畫 (立即可用)
    const navItems = document.querySelectorAll('.nav-item, .button, .nav-link')
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        gsap.to(item, {
          scale: 0.95,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut'
        })
      })
    })
  }
  
  bindRouteTransitions(pageTransition) {
    // 這裡實現頁面路由轉場的綁定
    // 與 React Router 或 Vue Router 整合
  }
  
  // 檢查動畫是否已載入
  isAnimationLoaded(name) {
    return this.loadedAnimations.has(name)
  }
  
  // 獲取動畫載入狀態
  getLoadingStatus() {
    return {
      userInteracted: this.userInteracted,
      loadedAnimations: Array.from(this.loadedAnimations),
      totalLoaded: this.loadedAnimations.size
    }
  }
}

// 啟動統一動畫管理器
document.addEventListener('DOMContentLoaded', () => {
  const animationManager = new AnimationManager()
  
  // 全域暴露用於調試
  window.animationManager = animationManager
})
```