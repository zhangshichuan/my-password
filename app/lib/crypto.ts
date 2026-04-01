/**
 * 加密工具库
 * 基于 PBKDF2 密钥派生 + AES-256-GCM 加密
 *
 * 注意：
 * - hashPassword, verifyPassword: 仅服务端使用 (argon2)
 * - deriveKey, encrypt, decrypt: 仅客户端使用 (Web Crypto API)
 */

/**
 * AES-256-GCM 参数
 */
const AES_KEY_LENGTH = 32 // 256 bits
const AES_IV_LENGTH = 12 // 96 bits for GCM
const AES_TAG_LENGTH = 16 // 128 bits
const PBKDF2_ITERATIONS = 100000

/**
 * 使用 Argon2id 哈希登录密码（仅服务端）
 * @param password 登录密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  const argon2 = await import('argon2')

  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  })
}

/**
 * 验证登录密码（仅服务端）
 * @param password 输入的密码
 * @param hashedPassword 数据库中存储的哈希
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const argon2 = await import('argon2')

  try {
    return await argon2.verify(hashedPassword, password)
  } catch {
    return false
  }
}

/**
 * 使用 PBKDF2 从主密码派生加密密钥（仅客户端）
 * 使用 email 作为固定盐，确保相同密码 + 相同 email = 相同密钥
 * @param password 主密码
 * @param salt 固定盐（使用 email）
 * @returns 派生的加密密钥 (hex)
 */
export async function deriveKey(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()

  // 导入密码作为原始 key material
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'])

  // 派生 AES-GCM 密钥
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH * 8 },
    true,
    ['encrypt', 'decrypt'],
  )

  // 导出为原始字节
  const exported = await crypto.subtle.exportKey('raw', key)
  return Array.from(new Uint8Array(exported))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 生成随机 IV（客户端）
 * @returns 24 字符的随机 IV (hex)
 */
export function generateIV(): string {
  const iv = new Uint8Array(AES_IV_LENGTH)
  crypto.getRandomValues(iv)
  return Array.from(iv)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 加密数据（仅客户端）
 * @param plaintext 明文
 * @param key 加密密钥 (hex)
 * @param iv 初始向量 (hex)
 * @returns 加密后的数据 (hex)
 */
export async function encrypt(plaintext: string, key: string, iv: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyBuffer = Buffer.from(key, 'hex')
  const ivBuffer = Buffer.from(iv, 'hex')

  const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, 'AES-GCM', false, ['encrypt'])

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBuffer }, cryptoKey, encoder.encode(plaintext))

  // AES-GCM 结果包含密文 + auth tag (16 bytes)
  const result = new Uint8Array(encrypted)
  const ciphertext = result.slice(0, result.length - AES_TAG_LENGTH)
  const authTag = result.slice(result.length - AES_TAG_LENGTH)

  return `${Buffer.from(ciphertext).toString('hex')}:${Buffer.from(authTag).toString('hex')}`
}

/**
 * 解密数据（仅客户端）
 * @param encryptedData 加密数据 (格式: 密文:authTag)
 * @param key 加密密钥 (hex)
 * @param iv 初始向量 (hex)
 * @returns 解密后的明文
 */
export async function decrypt(encryptedData: string, key: string, iv: string): Promise<string> {
  const decoder = new TextDecoder()
  const keyBuffer = Buffer.from(key, 'hex')
  const ivBuffer = Buffer.from(iv, 'hex')

  const [ciphertextHex, authTagHex] = encryptedData.split(':')
  const ciphertext = Buffer.from(ciphertextHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  // 合并 ciphertext + authTag（AES-GCM 解密需要）
  const combined = Buffer.concat([ciphertext, authTag])

  const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, 'AES-GCM', false, ['decrypt'])

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuffer }, cryptoKey, combined)

  return decoder.decode(decrypted)
}

/**
 * 加密接口返回类型
 */
export interface EncryptedData {
  encrypted: string
  iv: string
}

/**
 * 加密并返回 IV（仅客户端）
 */
export async function encryptWithIV(plaintext: string, key: string): Promise<EncryptedData> {
  const iv = generateIV()
  const encrypted = await encrypt(plaintext, key, iv)
  return { encrypted, iv }
}
