/**
 * 密码加密解密工具
 * 基于 PBKDF2 密钥派生 + AES-256-GCM 加密
 *
 * ====== 加密解密区域 ======
 * - deriveKey: PBKDF2 密钥派生
 * - generateIV: 生成随机 IV
 * - encrypt/decrypt: AES-256-GCM 加解密
 * - encryptSecret/decryptSecret: 密码专用加解密
 * - verifyMasterPassword: 验证主密码
 *
 * ====== 密码生成区域 ======
 * - generatePassword: 生成随机密码
 * - evaluatePasswordStrength: 评估密码强度
 */

// ============ 加密解密区域 ============

/**
 * AES-256-GCM 参数
 */
const AES_KEY_LENGTH = 32 // 256 bits
const AES_IV_LENGTH = 12 // 96 bits for GCM
const AES_TAG_LENGTH = 16 // 128 bits
const PBKDF2_ITERATIONS = 100000

/**
 * 从主密码派生加密密钥
 * 使用 email 作为固定盐，确保相同密码 + 相同 email = 相同密钥
 * @param masterPassword 主密码
 * @param email 邮箱（作为盐）
 * @returns 派生的加密密钥 (hex)
 */
export async function deriveKey(masterPassword: string, email: string): Promise<string> {
  const encoder = new TextEncoder()

  // 导入密码作为原始 key material
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(masterPassword), 'PBKDF2', false, [
    'deriveKey',
  ])

  // 派生 AES-GCM 密钥
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(email), // 使用 email 作为盐
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH * 8 },
    true,
    ['encrypt', 'decrypt'],
  )

  // 导出为原始字节并转为 hex
  const exported = await crypto.subtle.exportKey('raw', key)
  return arrayBufferToHex(exported)
}

/**
 * 生成随机 IV
 * @returns 24 字符的随机 IV (hex)
 */
export function generateIV(): string {
  const iv = new Uint8Array(AES_IV_LENGTH)
  crypto.getRandomValues(iv)
  return arrayBufferToHex(iv)
}

/**
 * 加密数据
 * @param plaintext 明文
 * @param key 加密密钥 (hex)
 * @param iv 初始向量 (hex)
 * @returns 加密后的数据 (hex) - 格式: 密文:authTag
 */
export async function encrypt(plaintext: string, key: string, iv: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyBuffer = hexToArrayBuffer(key)
  const ivBuffer = hexToArrayBuffer(iv)

  const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, 'AES-GCM', false, ['encrypt'])

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBuffer }, cryptoKey, encoder.encode(plaintext))

  // AES-GCM 结果包含密文 + auth tag (16 bytes)
  const result = new Uint8Array(encrypted)
  const ciphertext = result.slice(0, result.length - AES_TAG_LENGTH)
  const authTag = result.slice(result.length - AES_TAG_LENGTH)

  return `${arrayBufferToHex(ciphertext)}:${arrayBufferToHex(authTag)}`
}

/**
 * 解密数据
 * @param encryptedData 加密数据 (格式: 密文:authTag)
 * @param key 加密密钥 (hex)
 * @param iv 初始向量 (hex)
 * @returns 解密后的明文
 */
export async function decrypt(encryptedData: string, key: string, iv: string): Promise<string> {
  const decoder = new TextDecoder()
  const keyBuffer = hexToArrayBuffer(key)
  const ivBuffer = hexToArrayBuffer(iv)

  const [ciphertextHex, authTagHex] = encryptedData.split(':')
  const ciphertext = hexToArrayBuffer(ciphertextHex)
  const authTag = hexToArrayBuffer(authTagHex)

  // 合并 ciphertext + authTag（AES-GCM 解密需要）
  const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength)
  combined.set(new Uint8Array(ciphertext), 0)
  combined.set(new Uint8Array(authTag), ciphertext.byteLength)

  const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, 'AES-GCM', false, ['decrypt'])

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuffer }, cryptoKey, combined)

  return decoder.decode(decrypted)
}

/**
 * 验证主密码是否正确
 * 尝试用派生的密钥解密一条数据，如果成功说明主密码正确
 * @param masterPassword 主密码
 * @param email 邮箱
 * @param encryptedData 加密数据
 * @param iv 初始向量
 * @returns 是否正确
 */
export async function verifyMasterPassword(
  masterPassword: string,
  email: string,
  encryptedData: string,
  iv: string,
): Promise<boolean> {
  try {
    const key = await deriveKey(masterPassword, email)
    await decrypt(encryptedData, key, iv)
    return true
  } catch {
    return false
  }
}

/**
 * 加密密码并返回加密结果
 * @param plaintext 明文密码
 * @param key 加密密钥 (hex)
 * @returns 加密后的数据和 IV
 */
export async function encryptSecret(plaintext: string, key: string): Promise<{ encrypted: string; iv: string }> {
  const iv = generateIV()
  const encrypted = await encrypt(plaintext, key, iv)
  return { encrypted, iv }
}

/**
 * 解密密码
 * @param encryptedData 加密数据
 * @param key 加密密钥 (hex)
 * @param iv 初始向量
 * @returns 解密后的明文密码
 */
export async function decryptSecret(encryptedData: string, key: string, iv: string): Promise<string> {
  return decrypt(encryptedData, key, iv)
}

// ============ 密码生成区域 ============

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

// ============ 辅助函数 ============

/**
 * ArrayBuffer 转 hex 字符串
 */
function arrayBufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * hex 字符串转 ArrayBuffer
 */
function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes.buffer as ArrayBuffer
}
