/**
 * 密码强度评估规则。
 * 这里仅包含纯业务规则，便于单元测试和后续策略扩展。
 */

export type PasswordStrength = 'weak' | 'medium' | 'strong'

/**
 * 评估密码强度。
 * @param password 待评估密码
 * @returns 强度等级
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score >= 6) return 'strong'
  if (score >= 4) return 'medium'
  return 'weak'
}
