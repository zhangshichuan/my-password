/**
 * API 客户端
 */
import type { Category, Password } from './types'
import { getToken } from './auth'

const API_BASE = '/api'

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

export async function getCategories(): Promise<Category[]> {
  return request<Category[]>('/categories')
}

export async function createCategory(data: { name: string; type: string }): Promise<Category> {
  return request<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCategory(id: string, data: { name?: string; type?: string }): Promise<Category> {
  return request<Category>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCategory(id: string): Promise<void> {
  await request(`/categories/${id}`, { method: 'DELETE' })
}

// ============ 密码 API ============

export async function getPasswords(categoryId?: string): Promise<Password[]> {
  const endpoint = categoryId ? `/passwords?categoryId=${categoryId}` : '/passwords'
  return request<Password[]>(endpoint)
}

export async function getPassword(id: string): Promise<Password> {
  return request<Password>(`/passwords/${id}`)
}

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

export async function deletePassword(id: string): Promise<void> {
  await request(`/passwords/${id}`, { method: 'DELETE' })
}
