/**
 * 用户注册 API
 * POST /api/auth/register
 *
 * 请求体:
 * {
 *   "email": "user@example.com",
 *   "loginPassword": "xxx"
 * }
 *
 * 注意:
 * - 主密码由用户本地保管，不发送到服务器
 * - 客户端校验：主密码 ≠ 登录密码（应在调用此 API 前完成）
 * - 金库解锁：客户端用主密码 Argon2 派生 Ke 解密数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/services/prisma'
import { hashPassword } from '@/app/services/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, loginPassword } = body

    // 基础校验
    if (!email || !loginPassword) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

    // 检查邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    // 检查密码长度
    if (loginPassword.length < 8) {
      return NextResponse.json({ error: '登录密码长度不能少于 8 位' }, { status: 400 })
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 })
    }

    // 创建用户（登录密码哈希）
    const passwordHash = await hashPassword(loginPassword)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    })

    // 创建默认分类
    const defaultCategories = [
      { name: '工作', type: 'website', userId: user.id },
      { name: '社交', type: 'app', userId: user.id },
      { name: '家门', type: 'doorlock', userId: user.id },
    ]

    await prisma.category.createMany({
      data: defaultCategories,
    })

    return NextResponse.json(
      {
        message: '注册成功',
        userId: user.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('注册错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
