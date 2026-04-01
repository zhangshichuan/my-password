/**
 * 分类管理 API
 * GET /api/categories - 获取所有分类
 * POST /api/categories - 创建分类
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/services/prisma'
import { jwtVerify } from 'jose'

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

// 获取所有分类
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('获取分类错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 创建分类
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type } = body

    if (!name || !type) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

    // 验证 type
    const validTypes = ['website', 'app', 'doorlock', 'card', 'other']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: '无效的类型' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        userId,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('创建分类错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
