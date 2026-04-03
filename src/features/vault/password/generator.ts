/**
 * 密码生成规则。
 * 只负责纯函数式密码生成，不依赖 React 或页面状态。
 */

interface GeneratePasswordOptions {
  uppercase?: boolean
  lowercase?: boolean
  numbers?: boolean
  symbols?: boolean
}

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto
  }

  throw new Error('Web Crypto API is not available')
}

/**
 * 生成随机密码。
 * @param length 密码长度
 * @param options 字符类型开关
 * @returns 生成后的密码
 */
export function generatePassword(length: number = 16, options: GeneratePasswordOptions = {}): string {
  const { uppercase = true, lowercase = true, numbers = true, symbols = true } = options

  let chars = ''

  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
  if (numbers) chars += '0123456789'
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (chars.length === 0) {
    chars = 'abcdefghijklmnopqrstuvwxyz'
  }

  const randomValues = new Uint32Array(length)
  getCrypto().getRandomValues(randomValues)

  let password = ''
  for (let index = 0; index < length; index++) {
    password += chars[randomValues[index] % chars.length]
  }

  return password
}
