/**
 * 单个分类操作 API
 * PUT /api/categories/[id] - 更新分类
 * DELETE /api/categories/[id] - 删除分类
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/src/server/db/prisma'

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

// 更新分类
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, type } = body

    // 检查分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    }

    // 验证 type
    if (type) {
      const validTypes = ['website', 'app', 'doorlock', 'card', 'other']
      if (!validTypes.includes(type)) {
        return NextResponse.json({ error: '无效的类型' }, { status: 400 })
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('更新分类错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 删除分类
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { id } = await params

    // 检查分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    }

    // 删除分类（关联的密码会级联删除）
    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除分类错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
