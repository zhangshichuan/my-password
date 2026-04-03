/**
 * 认证接口客户端。
 * 负责登录、注册等前后端通信流程。
 */

import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@/src/shared/types'
import { requestJson } from '@/src/shared/api/http-client'
import { decodeJWT, setCurrentUser, setToken } from '@/src/features/auth/model/auth-storage'

/**
 * 登录并把登录态写入客户端存储。
 * @param data 登录请求参数
 * @returns 登录响应
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await requestJson<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  setToken(response.token)

  const payload = decodeJWT(response.token)
  if (payload) {
    setCurrentUser(payload)
  }

  return response
}

/**
 * 注册新用户。
 * @param data 注册请求参数
 * @returns 注册响应
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return requestJson<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
