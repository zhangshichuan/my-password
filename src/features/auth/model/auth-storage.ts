/**
 * 认证工具函数
 * 客户端使用
 */
import type { JWTPayload } from '@/src/shared/types'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

/**
 * 获取 token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 设置 token
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 移除 token
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * 获取当前用户
 */
export function getCurrentUser(): JWTPayload | null {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem(USER_KEY)
  if (!user) return null
  try {
    return JSON.parse(user)
  } catch {
    return null
  }
}

/**
 * 设置当前用户
 */
export function setCurrentUser(user: JWTPayload): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  const token = getToken()
  if (!token) return false

  // 登录态判断完全基于本地 token + 本地缓存的 payload。
  const user = getCurrentUser()
  if (!user) return false

  // JWT exp 是秒级时间戳
  if (user.exp && user.exp * 1000 < Date.now()) {
    removeToken()
    return false
  }

  return true
}

/**
 * 登出
 */
export function logout(): void {
  removeToken()
}

/**
 * 解码 JWT。
 * 暴露给认证 API 客户端复用，避免重复解析逻辑。
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    // JWT 使用 base64url，需要先转换成 atob 可识别的普通 base64。
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}
