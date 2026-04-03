/**
 * 用户登录 API
 * POST /api/auth/login
 *
 * 请求体:
 * {
 *   "email": "user@example.com",
 *   "password": "xxx"
 * }
 *
 * 返回:
 * {
 *   "token": "jwt-token"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { verifyPassword } from '@/src/server/auth/password-hasher'
import { prisma } from '@/src/server/db/prisma'

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 基础校验
    if (!email || !password) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }

    // 验证登录密码
    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }

    // 生成 JWT
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    return NextResponse.json({
      token,
      userId: user.id,
    })
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
