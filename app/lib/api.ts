/**
 * API 客户端
 * 封装所有与后端通信的请求方法
 * 自动携带 JWT token，自动处理错误响应
 */
import type { Category, Password } from './types'
import { getToken } from './auth'

// API 基础路径
const API_BASE = '/api'

/**
 * 通用请求封装
 * @param endpoint API 端点路径
 * @param options fetch 选项
 * @returns 解析后的 JSON 响应
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(error.error || '请求失败')
  }

  return response.json()
}

// ============ 分类 API ============

/**
 * 获取当前用户的所有分类
 */
export async function getCategories(): Promise<Category[]> {
  return request<Category[]>('/categories')
}

/**
 * 创建新分类
 * @param data 分类名称和类型
 */
export async function createCategory(data: { name: string; type: string }): Promise<Category> {
  return request<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 更新分类信息
 * @param id 分类 ID
 * @param data 要更新的字段
 */
export async function updateCategory(id: string, data: { name?: string; type?: string }): Promise<Category> {
  return request<Category>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * 删除分类
 * @param id 分类 ID
 */
export async function deleteCategory(id: string): Promise<void> {
  await request(`/categories/${id}`, { method: 'DELETE' })
}

// ============ 密码 API ============

/**
 * 获取密码列表
 * @param categoryId 可选，按分类筛选
 */
export async function getPasswords(categoryId?: string): Promise<Password[]> {
  const endpoint = categoryId ? `/passwords?categoryId=${categoryId}` : '/passwords'
  return request<Password[]>(endpoint)
}

/**
 * 获取单个密码详情
 * @param id 密码 ID
 */
export async function getPassword(id: string): Promise<Password> {
  return request<Password>(`/passwords/${id}`)
}

/**
 * 创建新密码
 * @param data 密码信息（加密后的密文）
 */
export async function createPassword(data: {
  username: string
  encryptedSecret: string
  iv: string
  notes?: string
  categoryId: string
}): Promise<Password> {
  return request<Password>('/passwords', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 更新密码信息
 * @param id 密码 ID
 * @param data 要更新的字段
 */
export async function updatePassword(
  id: string,
  data: {
    username?: string
    encryptedSecret?: string
    iv?: string
    notes?: string
    categoryId?: string
  },
): Promise<Password> {
  return request<Password>(`/passwords/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * 删除密码
 * @param id 密码 ID
 */
export async function deletePassword(id: string): Promise<void> {
  await request(`/passwords/${id}`, { method: 'DELETE' })
}
