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
 */

// ============ 加密解密区域 ============

/**
 * AES-256-GCM 参数
 */
const AES_KEY_LENGTH = 32 // 256 bits
const AES_IV_LENGTH = 12 // 96 bits for GCM
const AES_TAG_LENGTH = 16 // 128 bits
const PBKDF2_ITERATIONS = 100000

type EncryptionKey = CryptoKey | string

// 获取 crypto 实例（兼容不同环境）
const getCrypto = (): Crypto => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto
  }
  throw new Error('Web Crypto API is not available')
}

/**
 * 从主密码派生加密密钥
 * 使用 email 作为固定盐，确保相同密码 + 相同 email = 相同密钥
 * @param masterPassword 主密码
 * @param email 邮箱（作为盐）
 * @returns 派生的加密密钥
 */
export async function deriveKey(masterPassword: string, email: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const crypto = getCrypto()

  // 导入密码作为原始 key material
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(masterPassword), 'PBKDF2', false, [
    'deriveKey',
  ])

  // 直接返回不可导出的 CryptoKey，只在内存中使用。
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(email), // 使用 email 作为盐
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH * 8 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * 生成随机 IV
 * @returns 24 字符的随机 IV (hex)
 */
export function generateIV(): string {
  const iv = new Uint8Array(AES_IV_LENGTH)
  getCrypto().getRandomValues(iv)
  return arrayBufferToHex(iv)
}

/**
 * 加密数据
 * @param plaintext 明文
 * @param key 加密密钥
 * @param iv 初始向量 (hex)
 * @returns 加密后的数据 (hex) - 格式: 密文:authTag
 */
export async function encrypt(plaintext: string, key: EncryptionKey, iv: string): Promise<string> {
  const encoder = new TextEncoder()
  const ivBuffer = hexToArrayBuffer(iv)
  const crypto = getCrypto()
  const cryptoKey = await resolveCryptoKey(key, 'encrypt')

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
 * @param key 加密密钥
 * @param iv 初始向量 (hex)
 * @returns 解密后的明文
 */
export async function decrypt(encryptedData: string, key: EncryptionKey, iv: string): Promise<string> {
  const decoder = new TextDecoder()
  const ivBuffer = hexToArrayBuffer(iv)
  const crypto = getCrypto()

  const [ciphertextHex, authTagHex] = encryptedData.split(':')
  const ciphertext = hexToArrayBuffer(ciphertextHex)
  const authTag = hexToArrayBuffer(authTagHex)

  // 合并 ciphertext + authTag（AES-GCM 解密需要）
  const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength)
  combined.set(new Uint8Array(ciphertext), 0)
  combined.set(new Uint8Array(authTag), ciphertext.byteLength)

  const cryptoKey = await resolveCryptoKey(key, 'decrypt')

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

export async function resolveMasterKey(
  masterPassword: string,
  email: string,
  existingPassword?: {
    encryptedData: string
    iv: string
  },
): Promise<CryptoKey> {
  // 首次设置主密码时，没有历史密文可验证，只做最基本的长度校验。
  if (masterPassword.length < 8) {
    throw new Error('主密码至少8位')
  }

  const key = await deriveKey(masterPassword, email)

  if (!existingPassword) {
    return key
  }

  // 已有密码时，用一条历史密文验证主密码是否正确。
  try {
    await decrypt(existingPassword.encryptedData, key, existingPassword.iv)
    return key
  } catch {
    throw new Error('主密码错误')
  }
}

/**
 * 加密密码并返回加密结果
 * @param plaintext 明文密码
 * @param key 加密密钥
 * @returns 加密后的数据和 IV
 */
export async function encryptSecret(plaintext: string, key: EncryptionKey): Promise<{ encrypted: string; iv: string }> {
  const iv = generateIV()
  const encrypted = await encrypt(plaintext, key, iv)
  return { encrypted, iv }
}

/**
 * 解密密码
 * @param encryptedData 加密数据
 * @param key 加密密钥
 * @param iv 初始向量
 * @returns 解密后的明文密码
 */
export async function decryptSecret(encryptedData: string, key: EncryptionKey, iv: string): Promise<string> {
  return decrypt(encryptedData, key, iv)
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

async function resolveCryptoKey(key: EncryptionKey, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  if (typeof key !== 'string') {
    return key
  }

  // 保留对旧 hex key 的兼容能力，便于测试和渐进迁移。
  return getCrypto().subtle.importKey('raw', hexToArrayBuffer(key), 'AES-GCM', false, [usage])
}
