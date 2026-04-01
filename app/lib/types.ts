/**
 * 类型定义
 */

// 用户
export interface User {
  id: string
  email: string
}

// 分类
export interface Category {
  id: string
  name: string
  type: 'website' | 'app' | 'doorlock' | 'card' | 'other'
  userId: string
  createdAt: Date
  updatedAt: Date
}

// 密码条目
export interface Password {
  id: string
  username: string
  encryptedSecret: string
  iv: string
  notes?: string
  categoryId: string
  userId: string
  createdAt: Date
  updatedAt: Date
  category?: Category
}

// 解密的密码
export interface DecryptedPassword extends Omit<Password, 'encryptedSecret' | 'iv'> {
  secret: string
}

// API 响应
export interface ApiResponse<T> {
  data?: T
  error?: string
}

// 认证
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  userId: string
}

export interface RegisterRequest {
  email: string
  loginPassword: string
}

export interface RegisterResponse {
  message: string
  userId: string
}

// JWT Payload
export interface JWTPayload {
  userId: string
  email: string
  exp?: number
}
