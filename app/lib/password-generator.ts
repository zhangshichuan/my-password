/**
 * 密码生成器
 * 使用 Web Crypto API 生成安全随机密码
 */

/**
 * 生成随机密码
 * @param length 密码长度，默认 16 位
 * @param options 生成选项
 * @returns 生成的密码
 */
export function generatePassword(
  length: number = 16,
  options: {
    uppercase?: boolean
    lowercase?: boolean
    numbers?: boolean
    symbols?: boolean
  } = {},
): string {
  const { uppercase = true, lowercase = true, numbers = true, symbols = true } = options

  let chars = ''

  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
  if (numbers) chars += '0123456789'
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

  // 确保至少有一种字符类型
  if (chars.length === 0) {
    chars = 'abcdefghijklmnopqrstuvwxyz'
  }

  // 使用 crypto.getRandomValues 生成密码
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)

  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length]
  }

  return password
}

/**
 * 评估密码强度
 * @param password 密码
 * @returns 强度等级: 'weak' | 'medium' | 'strong'
 */
export function evaluatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0

  // 长度评分
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  // 字符类型评分
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  // 评估
  if (score >= 6) return 'strong'
  if (score >= 4) return 'medium'
  return 'weak'
}

/**
 * 生成随机 IV (初始化向量)
 * @returns 24 字符的十六进制字符串
 */
export function generateIV(): string {
  const iv = new Uint8Array(12)
  crypto.getRandomValues(iv)
  return Array.from(iv)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
