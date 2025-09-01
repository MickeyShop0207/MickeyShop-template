/**
 * 驗證工具函數
 */

// Email 驗證
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 電話號碼驗證
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+?886-?|0)?[0-9]{8,10}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// 密碼強度驗證
export const validatePassword = (password: string) => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('密碼長度至少需要 8 個字符')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密碼需包含至少一個小寫字母')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密碼需包含至少一個大寫字母')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('密碼需包含至少一個數字')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// URL 驗證（使用 url.ts 中的實現）

// 身分證號碼驗證 (台灣)
export const isValidTaiwanId = (id: string): boolean => {
  if (!/^[A-Z][12][0-9]{8}$/.test(id)) {
    return false
  }
  
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1]
  const letterValue = id.charCodeAt(0) - 65 + 10
  const numbers = [Math.floor(letterValue / 10), letterValue % 10, ...id.slice(1).split('').map(Number)]
  
  const sum = numbers.reduce((acc, num, index) => acc + num * weights[index], 0)
  return sum % 10 === 0
}

// 信用卡號碼驗證 (Luhn 演算法)
export const isValidCreditCard = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '')
  
  if (!/^\d+$/.test(cleaned)) {
    return false
  }
  
  let sum = 0
  let alternate = false
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let n = parseInt(cleaned.charAt(i), 10)
    
    if (alternate) {
      n *= 2
      if (n > 9) {
        n = (n % 10) + 1
      }
    }
    
    sum += n
    alternate = !alternate
  }
  
  return sum % 10 === 0
}

// 郵遞區號驗證 (台灣)
export const isValidPostalCode = (code: string): boolean => {
  return /^\d{3}$/.test(code)
}