/**
 * 密码加密解密工具测试
 */
import { describe, it, expect } from 'vitest'
import { generateIV, encrypt, decrypt, deriveKey } from '../password'
import { hashPassword, verifyPassword } from '../../services/auth'

describe('密码加密解密工具', () => {
  describe('generateIV', () => {
    it('应该生成 24 字符的十六进制 IV', () => {
      const iv = generateIV()
      expect(iv).toHaveLength(24)
      expect(/^[a-f0-9]+$/.test(iv)).toBe(true)
    })

    it('每次调用应该生成不同的 IV', () => {
      const iv1 = generateIV()
      const iv2 = generateIV()
      expect(iv1).not.toBe(iv2)
    })
  })

  describe('encrypt & decrypt', () => {
    it('应该正确加密和解密数据', async () => {
      const plaintext = 'my-secret-password'
      const key = 'a'.repeat(64) // 32 bytes hex = 256 bits
      const iv = generateIV()

      const encrypted = await encrypt(plaintext, key, iv)
      const decrypted = await decrypt(encrypted, key, iv)

      expect(decrypted).toBe(plaintext)
    })

    it('相同明文不同 IV 应该产生不同密文', async () => {
      const plaintext = 'same-password'
      const key = 'b'.repeat(64)
      const iv1 = generateIV()
      const iv2 = generateIV()

      const encrypted1 = await encrypt(plaintext, key, iv1)
      const encrypted2 = await encrypt(plaintext, key, iv2)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('解密时使用错误的 IV 应该失败', async () => {
      const plaintext = 'secret'
      const key = 'c'.repeat(64)
      const iv = generateIV()
      const wrongIv = generateIV()

      const encrypted = await encrypt(plaintext, key, iv)

      await expect(decrypt(encrypted, key, wrongIv)).rejects.toThrow()
    })

    it('解密时使用错误的 key 应该失败', async () => {
      const plaintext = 'secret'
      const key1 = 'd'.repeat(64)
      const key2 = 'e'.repeat(64)
      const iv = generateIV()

      const encrypted = await encrypt(plaintext, key1, iv)

      await expect(decrypt(encrypted, key2, iv)).rejects.toThrow()
    })
  })

  describe('deriveKey', () => {
    it('应该从主密码和 email 派生密钥', async () => {
      const password = 'my-master-password'
      const email = 'user@example.com'

      const key = await deriveKey(password, email)

      // 密钥应该是 64 字符的十六进制 (32 bytes)
      expect(key).toHaveLength(64)
      expect(/^[a-f0-9]+$/.test(key)).toBe(true)
    })

    it('相同密码 + 相同 email 应该产生相同的密钥', async () => {
      const password = 'my-master-password'
      const email = 'user@example.com'

      const key1 = await deriveKey(password, email)
      const key2 = await deriveKey(password, email)

      // 相同的输入应该产生相同的密钥
      expect(key1).toBe(key2)
    })

    it('不同 email 应该产生不同的密钥', async () => {
      const password = 'same-password'
      const email1 = 'user1@example.com'
      const email2 = 'user2@example.com'

      const key1 = await deriveKey(password, email1)
      const key2 = await deriveKey(password, email2)

      expect(key1).not.toBe(key2)
    })

    it('不同密码应该产生不同的密钥', async () => {
      const password1 = 'password-one'
      const password2 = 'password-two'
      const email = 'user@example.com'

      const key1 = await deriveKey(password1, email)
      const key2 = await deriveKey(password2, email)

      expect(key1).not.toBe(key2)
    })
  })

  describe('hashPassword & verifyPassword (服务端)', () => {
    it('应该正确哈希和验证密码', async () => {
      const password = 'testPassword123'
      const hash = await hashPassword(password)

      expect(hash).not.toBe(password)
      expect(hash.startsWith('$argon2id$')).toBe(true)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('相同密码应该生成不同的哈希（因为随机 salt）', async () => {
      const password = 'testPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('错误密码应该验证失败', async () => {
      const password = 'correctPassword'
      const wrongPassword = 'wrongPassword'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })
})
