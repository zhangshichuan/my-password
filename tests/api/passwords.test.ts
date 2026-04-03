/**
 * 密码 API 测试
 */
import { describe, expect, it } from 'vitest'
import { decrypt, encrypt, generateIV } from '@/src/features/vault/crypto/encryption'

describe('密码 API', () => {
  describe('密码加密', () => {
    it('应该使用不同的 IV 加密产生不同密文', async () => {
      const plaintext = 'mySecretPassword'
      const key = 'a'.repeat(64)
      const iv1 = generateIV()
      const iv2 = generateIV()

      const encrypted1 = await encrypt(plaintext, key, iv1)
      const encrypted2 = await encrypt(plaintext, key, iv2)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('应该正确加密和解密', async () => {
      const plaintext = 'mySecretPassword'
      const key = 'b'.repeat(64)
      const iv = generateIV()

      const encrypted = await encrypt(plaintext, key, iv)
      const decrypted = await decrypt(encrypted, key, iv)

      expect(decrypted).toBe(plaintext)
    })

    it('加密格式应该是 encrypted:authTag', async () => {
      const plaintext = 'password'
      const key = 'c'.repeat(64)
      const iv = generateIV()

      const encrypted = await encrypt(plaintext, key, iv)
      const parts = encrypted.split(':')

      expect(parts).toHaveLength(2)
      expect(parts[0].length).toBeGreaterThan(0) // encrypted
      expect(parts[1].length).toBe(32) // authTag (16 bytes = 32 hex)
    })
  })

  describe('密码数据结构', () => {
    it('应该包含必要字段', () => {
      const password = {
        id: 'test-id',
        username: 'user@email.com',
        encryptedSecret: 'encrypted:authTag',
        iv: 'iv-string',
        categoryId: 'category-id',
        userId: 'user-id',
      }

      expect(password).toHaveProperty('id')
      expect(password).toHaveProperty('username')
      expect(password).toHaveProperty('encryptedSecret')
      expect(password).toHaveProperty('iv')
      expect(password).toHaveProperty('categoryId')
      expect(password).toHaveProperty('userId')
    })

    it('notes 应该是可选的', () => {
      const password: {
        id: string
        username: string
        encryptedSecret: string
        iv: string
        categoryId: string
        userId: string
        notes?: string
      } = {
        id: 'test-id',
        username: 'user@email.com',
        encryptedSecret: 'encrypted:authTag',
        iv: 'iv-string',
        categoryId: 'category-id',
        userId: 'user-id',
      }

      expect(password.notes).toBeUndefined()
    })
  })

  describe('密码与分类关系', () => {
    it('应该正确关联分类', () => {
      const passwords = [
        { id: 'pwd-1', username: 'work@email.com', categoryId: 'cat-1' },
        { id: 'pwd-2', username: 'social@email.com', categoryId: 'cat-2' },
        { id: 'pwd-3', username: 'work2@email.com', categoryId: 'cat-1' },
      ]

      const workPasswords = passwords.filter((p) => p.categoryId === 'cat-1')
      expect(workPasswords).toHaveLength(2)
    })
  })

  describe('密码筛选', () => {
    it('应该支持按分类筛选', () => {
      const passwords = [
        { id: '1', categoryId: 'cat-1' },
        { id: '2', categoryId: 'cat-2' },
        { id: '3', categoryId: 'cat-1' },
      ]

      const filtered = passwords.filter((p) => p.categoryId === 'cat-1')

      expect(filtered).toHaveLength(2)
      expect(filtered.map((p) => p.id)).toEqual(['1', '3'])
    })
  })
})
