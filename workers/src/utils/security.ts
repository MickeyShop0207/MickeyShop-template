/**
 * 安全工具集
 * 提供密碼加密、驗證和其他安全相關功能
 */

// 密碼強度檢查結果
export interface PasswordStrengthResult {
  isStrong: boolean
  score: number // 0-100
  issues: string[]
  suggestions: string[]
}

// 密碼策略配置
export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
  preventUserInfo: boolean
}

// 默認密碼策略
const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true
}

// 常見弱密碼列表（簡化版）
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  '111111', '1234567', 'admin', 'welcome', 'login', 'guest',
  '12345678', 'qwerty123', '123123', 'password1', 'letmein'
]

/**
 * 生成密碼哈希
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  // 生成隨機 salt（如果沒有提供）
  if (!salt) {
    salt = await generateSalt()
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  
  // 使用多次哈希增強安全性
  let hash = data
  for (let i = 0; i < 10000; i++) {
    hash = new Uint8Array(await crypto.subtle.digest('SHA-256', hash))
  }
  
  // 返回 salt + hash 的組合
  const hashArray = Array.from(hash)
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `${salt}:${hashHex}`
}

/**
 * 驗證密碼
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const [salt, expectedHash] = hashedPassword.split(':')
    if (!salt || !expectedHash) {
      return false
    }

    const actualHashed = await hashPassword(password, salt)
    const [, actualHash] = actualHashed.split(':')
    
    return actualHash === expectedHash
  } catch {
    return false
  }
}

/**
 * 生成隨機 salt
 */
export async function generateSalt(): Promise<string> {
  const saltArray = new Uint8Array(32)
  crypto.getRandomValues(saltArray)
  return Array.from(saltArray, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 檢查密碼強度
 */
export function checkPasswordStrength(
  password: string, 
  userInfo?: { email?: string; firstName?: string; lastName?: string; username?: string },
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordStrengthResult {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 0

  // 長度檢查
  if (password.length < policy.minLength) {
    issues.push(`密碼長度不足 ${policy.minLength} 個字符`)
    suggestions.push(`至少需要 ${policy.minLength} 個字符`)
  } else {
    score += 20
  }

  // 大寫字母檢查
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    issues.push('缺少大寫字母')
    suggestions.push('添加至少一個大寫字母')
  } else if (/[A-Z]/.test(password)) {
    score += 15
  }

  // 小寫字母檢查
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    issues.push('缺少小寫字母')
    suggestions.push('添加至少一個小寫字母')
  } else if (/[a-z]/.test(password)) {
    score += 15
  }

  // 數字檢查
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    issues.push('缺少數字')
    suggestions.push('添加至少一個數字')
  } else if (/[0-9]/.test(password)) {
    score += 15
  }

  // 特殊字符檢查
  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('缺少特殊字符')
    suggestions.push('添加至少一個特殊字符 (!@#$%^&*等)')
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 15
  }

  // 常見密碼檢查
  if (policy.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase()
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
      issues.push('使用了常見的弱密碼')
      suggestions.push('避免使用常見密碼，創建更獨特的密碼')
      score -= 30
    }
  }

  // 用戶信息檢查
  if (policy.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase()
    const userInfoValues = [
      userInfo.email?.split('@')[0],
      userInfo.firstName,
      userInfo.lastName,
      userInfo.username
    ].filter(Boolean).map(val => val?.toLowerCase())

    for (const info of userInfoValues) {
      if (info && lowerPassword.includes(info)) {
        issues.push('密碼包含個人信息')
        suggestions.push('避免在密碼中使用姓名、郵箱等個人信息')
        score -= 20
        break
      }
    }
  }

  // 複雜性獎勵
  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10
  if (/[A-Z].*[A-Z]/.test(password)) score += 5 // 多個大寫
  if (/[0-9].*[0-9]/.test(password)) score += 5 // 多個數字
  if (/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 5 // 多個特殊字符

  // 重複字符懲罰
  if (/(.)\1{2,}/.test(password)) {
    issues.push('包含重複字符')
    suggestions.push('避免連續重複的字符')
    score -= 10
  }

  // 連續字符懲罰
  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    issues.push('包含連續字符序列')
    suggestions.push('避免使用連續的字符序列')
    score -= 10
  }

  // 確保分數在合理範圍內
  score = Math.max(0, Math.min(100, score))

  return {
    isStrong: issues.length === 0 && score >= 70,
    score,
    issues,
    suggestions
  }
}

/**
 * 生成安全的隨機密碼
 */
export function generateSecurePassword(
  length: number = 16,
  includeUppercase: boolean = true,
  includeLowercase: boolean = true,
  includeNumbers: boolean = true,
  includeSpecialChars: boolean = true
): string {
  let charset = ''
  
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (includeNumbers) charset += '0123456789'
  if (includeSpecialChars) charset += '!@#$%^&*(),.?":{}|<>'

  if (!charset) {
    throw new Error('至少需要選擇一種字符類型')
  }

  const password = Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => charset[x % charset.length])
    .join('')

  return password
}

/**
 * 生成重設令牌
 */
export function generateResetToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 生成安全的會話 ID
 */
export function generateSessionId(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 清理和驗證電子郵件
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null
  
  const cleaned = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  return emailRegex.test(cleaned) ? cleaned : null
}

/**
 * 驗證並清理用戶名
 */
export function sanitizeUsername(username: string): string | null {
  if (!username || typeof username !== 'string') return null
  
  const cleaned = username.trim()
  
  // 用戶名規則：3-20 字符，只允許字母、數字和下劃線
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  
  return usernameRegex.test(cleaned) ? cleaned : null
}

/**
 * 防 XSS 的基本清理
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/[<>'"&]/g, char => {
      switch (char) {
        case '<': return '&lt;'
        case '>': return '&gt;'
        case '"': return '&quot;'
        case "'": return '&#x27;'
        case '&': return '&amp;'
        default: return char
      }
    })
    .trim()
}

/**
 * 速率限制鍵生成
 */
export function generateRateLimitKey(
  prefix: string, 
  identifier: string, 
  action?: string
): string {
  const parts = [prefix, identifier]
  if (action) parts.push(action)
  return parts.join(':')
}

/**
 * 生成 CSRF 令牌
 */
export function generateCSRFToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

/**
 * IP 地址驗證和清理
 */
export function sanitizeIPAddress(ip: string): string | null {
  if (!ip || typeof ip !== 'string') return null
  
  const cleaned = ip.trim()
  
  // IPv4 正則
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  
  // IPv6 正則（簡化）
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  if (ipv4Regex.test(cleaned) || ipv6Regex.test(cleaned)) {
    return cleaned
  }
  
  return null
}

/**
 * 計算字符串的哈希值（用於緩存鍵等）
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}