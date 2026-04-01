/**
 * 密码生成器测试
 */
import { describe, it, expect } from 'vitest'
import { generatePassword, evaluatePasswordStrength, generateIV } from '../password-generator'

describe('密码生成器', () => {
  describe('generatePassword', () => {
    it('应该生成指定长度的密码', () => {
      const password8 = generatePassword(8)
      const password16 = generatePassword(16)
      const password32 = generatePassword(32)

      expect(password8).toHaveLength(8)
      expect(password16).toHaveLength(16)
      expect(password32).toHaveLength(32)
    })

    it('默认长度应该是 16 位', () => {
      const password = generatePassword()
      expect(password).toHaveLength(16)
    })

    it('应该只包含指定的大写字母', () => {
      const password = generatePassword(20, {
        uppercase: true,
        lowercase: false,
        numbers: false,
        symbols: false,
      })

      expect(/^[A-Z]+$/.test(password)).toBe(true)
    })

    it('应该只包含指定的小写字母', () => {
      const password = generatePassword(20, {
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
      })

      expect(/^[a-z]+$/.test(password)).toBe(true)
    })

    it('应该只包含指定的数字', () => {
      const password = generatePassword(20, {
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false,
      })

      expect(/^[0-9]+$/.test(password)).toBe(true)
    })

    it('应该只包含指定的特殊字符', () => {
      const password = generatePassword(20, {
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: true,
      })

      expect(/^[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/.test(password)).toBe(true)
    })

    it('如果没有指定任何字符类型，默认应该包含小写字母', () => {
      const password = generatePassword(10, {
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
      })

      expect(/^[a-z]+$/.test(password)).toBe(true)
    })

    it('每次调用应该生成不同的密码', () => {
      const password1 = generatePassword()
      const password2 = generatePassword()

      expect(password1).not.toBe(password2)
    })
  })

  describe('evaluatePasswordStrength', () => {
    it('应该识别弱密码', () => {
      expect(evaluatePasswordStrength('abc')).toBe('weak')
      expect(evaluatePasswordStrength('12345678')).toBe('weak')
      expect(evaluatePasswordStrength('abcdefgh')).toBe('weak')
    })

    it('应该识别中等强度密码', () => {
      expect(evaluatePasswordStrength('Password1')).toBe('medium')
      expect(evaluatePasswordStrength('abc123DEF')).toBe('medium')
      expect(evaluatePasswordStrength('MyP@ssw0rd')).toBe('medium')
    })

    it('应该识别强密码', () => {
      expect(evaluatePasswordStrength('MyStr0ng!P@ssw0rd')).toBe('strong')
      expect(evaluatePasswordStrength('abc123!@#DEF456$%^')).toBe('strong')
      expect(evaluatePasswordStrength('Complex#P@ss1')).toBe('strong')
    })
  })

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
})
