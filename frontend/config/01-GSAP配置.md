# GSAP配置與動畫系統

## GSAP插件按需載入

### 支援插件列表
- ScrollSmoother
- SplitText  
- Flip
- CSSRule
- Draggable
- DrawSVG
- MotionPath
- Physics2D
- ScrambleText
- ScrollTo

### 插件載入器
```js
// utils/gsap-loader.js
import { gsap } from 'gsap'

export const loadGSAPPlugins = async (plugins) => {
  const pluginMap = {
    'ScrollSmoother': () => import('gsap/ScrollSmoother'),
    'SplitText': () => import('gsap/SplitText'),
    'Flip': () => import('gsap/Flip'),
    'CSSRule': () => import('gsap/CSSRulePlugin'),
    'Draggable': () => import('gsap/Draggable'),
    'DrawSVG': () => import('gsap/DrawSVGPlugin'),
    'MotionPath': () => import('gsap/MotionPathPlugin'),
    'Physics2D': () => import('gsap/Physics2DPlugin'),
    'ScrambleText': () => import('gsap/ScrambleTextPlugin'),
    'ScrollTo': () => import('gsap/ScrollToPlugin')
  }
  
  const loadPromises = plugins.map(plugin => pluginMap[plugin]?.())
  await Promise.all(loadPromises.filter(Boolean))
  
  return gsap
}
```

### 頁面級插件載入
```js
// pages/ProductDetailPage.jsx
import { useEffect } from 'react'
import { loadGSAPPlugins } from '@/utils/gsap-loader'

const ProductDetailPage = () => {
  useEffect(() => {
    const initAnimations = async () => {
      const gsap = await loadGSAPPlugins(['SplitText', 'ScrollSmoother'])
      
      // 產品標題文字動畫
      const title = document.querySelector('.product-title')
      const splitText = new SplitText(title, { type: 'chars' })
      
      gsap.from(splitText.chars, {
        duration: 0.8,
        opacity: 0,
        y: 50,
        stagger: 0.03
      })
    }
    
    initAnimations()
  }, [])
  
  return <div>...</div>
}
```

## 動畫系統架構

### SCSS動畫類別
```
styles/animations/
├── base.module.scss         # 基礎動畫設定
├── entrance.module.scss     # 入場動畫
├── exit.module.scss         # 退場動畫  
├── hover.module.scss        # 懸停動畫
├── loading.module.scss      # 載入動畫
└── scroll.module.scss       # 滾動動畫
```

### base.module.scss
```scss
:root {
  --duration-fast: 0.15s;
  --duration-normal: 0.3s;
  --duration-slow: 0.5s;
  --easing-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.gsapReady {
  visibility: hidden;
  opacity: 0;
}

.gsapVisible {
  visibility: visible;
  opacity: 1;
}
```

### entrance.module.scss
```scss
.fadeIn {
  animation: fadeIn var(--duration-normal) var(--easing-smooth);
}

.slideInUp {
  animation: slideInUp var(--duration-normal) var(--easing-smooth);
}

.scaleIn {
  animation: scaleIn var(--duration-normal) var(--easing-bounce);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from { 
    opacity: 0; 
    transform: translateY(30px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## 動畫Hook封裝

### useGSAP Hook
```js
// hooks/useGSAP.js
import { useEffect, useRef } from 'react'
import { loadGSAPPlugins } from '@/utils/gsap-loader'

export const useGSAP = (animation, dependencies = [], plugins = []) => {
  const elementRef = useRef(null)
  const timelineRef = useRef(null)
  
  useEffect(() => {
    const initAnimation = async () => {
      const gsap = await loadGSAPPlugins(plugins)
      
      if (elementRef.current) {
        timelineRef.current = animation(gsap, elementRef.current)
      }
    }
    
    initAnimation()
    
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
    }
  }, dependencies)
  
  return elementRef
}
```

### 使用範例
```js
// components/ProductCard.jsx
const ProductCard = ({ product }) => {
  const cardRef = useGSAP((gsap, element) => {
    return gsap.timeline()
      .from(element, {
        duration: 0.6,
        y: 30,
        opacity: 0,
        ease: "power2.out"
      })
      .from(element.querySelector('.product-image'), {
        duration: 0.8,
        scale: 1.1,
        ease: "power2.out"
      }, "-=0.4")
  }, [product.id], ['ScrollSmoother'])
  
  return (
    <div ref={cardRef} className="product-card">
      <img className="product-image" src={product.image} />
      <h3>{product.name}</h3>
    </div>
  )
}
```

## 預設動畫模板

### 商品展示動畫
```js
// animations/product-animations.js
export const productCardAnimation = (gsap, element) => {
  const tl = gsap.timeline({ paused: true })
  
  tl.from(element, {
    duration: 0.6,
    y: 50,
    opacity: 0,
    ease: "power3.out"
  })
  .from(element.querySelector('.product-image'), {
    duration: 1,
    scale: 1.2,
    ease: "power2.out"
  }, "-=0.4")
  .from(element.querySelectorAll('.product-info > *'), {
    duration: 0.4,
    y: 20,
    opacity: 0,
    stagger: 0.1,
    ease: "power2.out"
  }, "-=0.2")
  
  return tl
}

export const productGalleryAnimation = (gsap, element) => {
  return gsap.from(element.querySelectorAll('.gallery-item'), {
    duration: 0.8,
    scale: 0.8,
    opacity: 0,
    stagger: {
      amount: 0.6,
      grid: "auto",
      from: "center"
    },
    ease: "power2.out"
  })
}
```

### 購物車動畫
```js
// animations/cart-animations.js
export const addToCartAnimation = (gsap, button, cartIcon) => {
  const tl = gsap.timeline()
  
  // 按鈕反饋
  tl.to(button, {
    duration: 0.1,
    scale: 0.95,
    ease: "power2.in"
  })
  .to(button, {
    duration: 0.2,
    scale: 1,
    ease: "power2.out"
  })
  
  // 購物車圖標動畫
  .to(cartIcon, {
    duration: 0.3,
    scale: 1.2,
    ease: "back.out(1.7)"
  }, "-=0.1")
  .to(cartIcon, {
    duration: 0.2,
    scale: 1,
    ease: "power2.out"
  })
  
  return tl
}
```

## 性能優化設定

### GPU加速
```scss
.gpu-accelerated {
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
}
```

### 動畫管理器
```js
// utils/animation-manager.js
class AnimationManager {
  constructor() {
    this.activeAnimations = new Set()
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  
  register(animation) {
    if (this.isReducedMotion) return null
    
    this.activeAnimations.add(animation)
    return animation
  }
  
  cleanup() {
    this.activeAnimations.forEach(animation => {
      if (animation && animation.kill) {
        animation.kill()
      }
    })
    this.activeAnimations.clear()
  }
  
  pause() {
    this.activeAnimations.forEach(animation => {
      if (animation && animation.pause) {
        animation.pause()
      }
    })
  }
  
  resume() {
    this.activeAnimations.forEach(animation => {
      if (animation && animation.resume) {
        animation.resume()
      }
    })
  }
}

export const animationManager = new AnimationManager()
```

## 無障礙設計考量

### 動畫偏好檢測
```js
// utils/motion-preferences.js
export const respectsReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const createAccessibleAnimation = (animation) => {
  if (respectsReducedMotion()) {
    return () => {} // 返回空函數
  }
  return animation
}
```