/**
 * 认证工具函数
 * 客户端使用
 */
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, JWTPayload } from './types'

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

  // 检查 token 是否过期
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
 * API 请求封装
 */
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(error.error || '请求失败')
  }

  return response.json()
}

/**
 * 登录
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  // 保存 token 和用户信息
  setToken(response.token)

  // 解码 JWT 获取用户信息
  const payload = decodeJWT(response.token)
  if (payload) {
    setCurrentUser(payload)
  }

  return response
}

/**
 * 注册
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 登出
 */
export function logout(): void {
  removeToken()
}

/**
 * 解码 JWT
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const [, payload] = token.split('.')
    const decoded = atob(payload)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}
