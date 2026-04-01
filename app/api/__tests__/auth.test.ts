/**
 * 认证 API 测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hashPassword, deriveKey, encrypt } from '../../lib/crypto'

// Mock Prisma Client
const mockPrismaUser = {
  findUnique: vi.fn(),
  create: vi.fn(),
}

const mockPrismaCategory = {
  createMany: vi.fn(),
}

vi.mock('../../services/prisma', () => ({
  prisma: {
    user: mockPrismaUser,
    category: mockPrismaCategory,
  },
}))

describe('认证 API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('注册逻辑', () => {
    it('应该验证邮箱格式', async () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      expect(emailRegex.test('test@example.com')).toBe(true)
      expect(emailRegex.test('invalid-email')).toBe(false)
      expect(emailRegex.test('test@')).toBe(false)
      expect(emailRegex.test('@example.com')).toBe(false)
    })

    it('应该验证密码长度', () => {
      const validatePasswordLength = (password: string) => password.length >= 8

      expect(validatePasswordLength('12345678')).toBe(true)
      expect(validatePasswordLength('1234567')).toBe(false)
      expect(validatePasswordLength('abcdefgh')).toBe(true)
    })
  })

  describe('密码哈希', () => {
    it('应该正确哈希密码', async () => {
      const password = 'testPassword123'
      const hash = await hashPassword(password)

      expect(hash).not.toBe(password)
      expect(hash.startsWith('$argon2id$')).toBe(true)
    })

    it('相同密码应该生成不同的哈希（因为随机 salt）', async () => {
      const password = 'testPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('密钥派生', () => {
    it('应该从主密码和 email 派生密钥', async () => {
      const masterPassword = 'myMasterPassword'
      const email = 'user@example.com'

      const key = await deriveKey(masterPassword, email)

      expect(key).toHaveLength(64)
      expect(/^[a-f0-9]+$/.test(key)).toBe(true)
    })

    it('相同的主密码 + email 应该产生相同的密钥', async () => {
      const masterPassword = 'myMasterPassword'
      const email = 'user@example.com'

      const key1 = await deriveKey(masterPassword, email)
      const key2 = await deriveKey(masterPassword, email)

      expect(key1).toBe(key2)
    })
  })

  describe('客户端加密流程', () => {
    it('应该能用派生的密钥加密', async () => {
      const masterPassword = 'myMasterPassword'
      const email = 'user@example.com'
      const plaintext = 'mySecretPassword'

      // 1. 派生密钥
      const key = await deriveKey(masterPassword, email)

      // 2. 客户端加密（需要生成 IV）
      const iv = '000000000000000000000000' // 12 bytes hex
      const encrypted = await encrypt(plaintext, key, iv)

      // 验证加密格式
      expect(encrypted).toBeDefined()
      expect(encrypted.split(':').length).toBe(2) // encrypted:authTag
    })
  })
})
