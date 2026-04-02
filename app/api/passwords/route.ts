/**
 * 密码管理 API
 * GET /api/passwords - 获取所有密码
 * POST /api/passwords - 创建密码
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/services/prisma'
import { jwtVerify } from 'jose'
import { validatePasswordCreateInput } from './validation'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production')

// 辅助函数：验证 JWT 并获取用户 ID
async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.userId as string
  } catch {
    return null
  }
}

// 获取所有密码
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 支持按分类筛选
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    const passwords = await prisma.password.findMany({
      where: {
        userId,
        ...(categoryId && { categoryId }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(passwords)
  } catch (error) {
    console.error('获取密码错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 创建密码
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { username, encryptedSecret, iv, notes, categoryId } = body

    if (!username || !encryptedSecret || !iv || !categoryId) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

    const validationError = validatePasswordCreateInput({ username, encryptedSecret, iv, categoryId })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // 验证分类属于当前用户
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    })

    if (!category) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    }

    const password = await prisma.password.create({
      data: {
        username: username.trim(),
        encryptedSecret,
        iv,
        notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
        categoryId: categoryId.trim(),
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    return NextResponse.json(password, { status: 201 })
  } catch (error) {
    console.error('创建密码错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
