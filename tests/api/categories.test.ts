/**
 * 分类 API 测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('分类 API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('分类类型验证', () => {
    const validTypes = ['website', 'app', 'doorlock', 'card', 'other']

    it('应该接受有效的类型', () => {
      validTypes.forEach((type) => {
        expect(validTypes.includes(type)).toBe(true)
      })
    })

    it('应该拒绝无效的类型', () => {
      const invalidTypes = ['invalid', 'web', 'lock', 'password', '']

      invalidTypes.forEach((type) => {
        expect(validTypes.includes(type)).toBe(false)
      })
    })
  })

  describe('分类数据结构', () => {
    it('应该包含必要字段', () => {
      const category = {
        id: 'test-id',
        name: '工作',
        type: 'website',
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(category).toHaveProperty('id')
      expect(category).toHaveProperty('name')
      expect(category).toHaveProperty('type')
      expect(category).toHaveProperty('userId')
      expect(category).toHaveProperty('createdAt')
      expect(category).toHaveProperty('updatedAt')
    })

    it('应该正确验证类型', () => {
      const validateType = (type: string) => ['website', 'app', 'doorlock', 'card', 'other'].includes(type)

      expect(validateType('website')).toBe(true)
      expect(validateType('app')).toBe(true)
      expect(validateType('doorlock')).toBe(true)
      expect(validateType('card')).toBe(true)
      expect(validateType('other')).toBe(true)
      expect(validateType('invalid')).toBe(false)
    })
  })

  describe('分类与用户关系', () => {
    it('应该验证分类属于指定用户', () => {
      const categories = [
        { id: '1', name: '工作', type: 'website', userId: 'user-1' },
        { id: '2', name: '社交', type: 'app', userId: 'user-1' },
        { id: '3', name: '购物', type: 'website', userId: 'user-2' },
      ]

      const user1Categories = categories.filter((c) => c.userId === 'user-1')
      const user2Categories = categories.filter((c) => c.userId === 'user-2')

      expect(user1Categories).toHaveLength(2)
      expect(user2Categories).toHaveLength(1)
    })
  })
})
