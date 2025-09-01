/**
 * DOM 工具函數
 */

// 檢查元素是否在視窗中
export const isElementInViewport = (element: Element): boolean => {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

// 滾動到元素
export const scrollToElement = (
  element: Element,
  options: {
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
    inline?: ScrollLogicalPosition
    offset?: number
  } = {}
): void => {
  const { behavior = 'smooth', block = 'start', inline = 'nearest', offset = 0 } = options
  
  if (offset !== 0) {
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset - offset
    window.scrollTo({
      top: elementTop,
      behavior
    })
  } else {
    element.scrollIntoView({
      behavior,
      block,
      inline
    })
  }
}

// 獲取元素的絕對位置
export const getElementOffset = (element: Element): { top: number; left: number } => {
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset
  }
}

// 檢查元素是否有指定的 class
export const hasClass = (element: Element, className: string): boolean => {
  return element.classList.contains(className)
}

// 添加 class
export const addClass = (element: Element, className: string): void => {
  element.classList.add(className)
}

// 移除 class
export const removeClass = (element: Element, className: string): void => {
  element.classList.remove(className)
}

// 切換 class
export const toggleClass = (element: Element, className: string): void => {
  element.classList.toggle(className)
}

// 獲取元素的樣式
export const getStyle = (element: Element, property: string): string => {
  return window.getComputedStyle(element).getPropertyValue(property)
}

// 設置元素的樣式
export const setStyle = (element: HTMLElement, styles: Record<string, string>): void => {
  Object.entries(styles).forEach(([property, value]) => {
    element.style.setProperty(property, value)
  })
}

// 獲取元素的尺寸
export const getElementSize = (element: Element): { width: number; height: number } => {
  const rect = element.getBoundingClientRect()
  return {
    width: rect.width,
    height: rect.height
  }
}

// 檢查是否支持指定的 CSS 屬性
export const supportsCSSProperty = (property: string): boolean => {
  return property in document.documentElement.style
}

// 創建元素
export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attributes?: Record<string, string>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName)
  
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })
  }
  
  if (children) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child))
      } else {
        element.appendChild(child)
      }
    })
  }
  
  return element
}

// 移除元素
export const removeElement = (element: Element): void => {
  if (element.parentNode) {
    element.parentNode.removeChild(element)
  }
}

// 複製元素
export const cloneElement = (element: Element, deep = true): Element => {
  return element.cloneNode(deep) as Element
}

// 查找父元素
export const findParent = (
  element: Element,
  selector: string
): Element | null => {
  let parent = element.parentElement
  
  while (parent) {
    if (parent.matches(selector)) {
      return parent
    }
    parent = parent.parentElement
  }
  
  return null
}

// 查找子元素
export const findChildren = (
  element: Element,
  selector: string
): Element[] => {
  return Array.from(element.querySelectorAll(selector))
}

// 獲取元素的文本內容
export const getTextContent = (element: Element): string => {
  return element.textContent || ''
}

// 設置元素的文本內容
export const setTextContent = (element: Element, text: string): void => {
  element.textContent = text
}

// 獲取元素的 HTML 內容
export const getInnerHTML = (element: Element): string => {
  return element.innerHTML
}

// 設置元素的 HTML 內容
export const setInnerHTML = (element: Element, html: string): void => {
  element.innerHTML = html
}

// 添加事件監聽器
export const addEventListener = <K extends keyof HTMLElementEventMap>(
  element: Element,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void => {
  element.addEventListener(type, listener as EventListener, options)
}

// 移除事件監聽器
export const removeEventListener = <K extends keyof HTMLElementEventMap>(
  element: Element,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | EventListenerOptions
): void => {
  element.removeEventListener(type, listener as EventListener, options)
}

// 觸發事件
export const dispatchEvent = (
  element: Element,
  eventType: string,
  detail?: any
): void => {
  const event = new CustomEvent(eventType, { detail })
  element.dispatchEvent(event)
}

// 檢查元素是否可見
export const isVisible = (element: HTMLElement): boolean => {
  return element.offsetWidth > 0 && element.offsetHeight > 0
}

// 獲取滾動位置
export const getScrollPosition = (): { x: number; y: number } => {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  }
}

// 設置滾動位置
export const setScrollPosition = (x: number, y: number): void => {
  window.scrollTo(x, y)
}