/**
 * 单个密码操作 API
 * GET /api/passwords/[id] - 获取单个密码
 * PUT /api/passwords/[id] - 更新密码
 * DELETE /api/passwords/[id] - 删除密码
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/src/server/db/prisma'
import { validatePasswordUpdateInput } from '../validation'

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

// 获取单个密码
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { id } = await params

    const password = await prisma.password.findFirst({
      where: { id, userId },
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

    if (!password) {
      return NextResponse.json({ error: '密码不存在' }, { status: 404 })
    }

    return NextResponse.json(password)
  } catch (error) {
    console.error('获取密码错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 更新密码
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { username, encryptedSecret, iv, notes, categoryId } = body

    const validationError = validatePasswordUpdateInput({ username, encryptedSecret, iv, categoryId })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // 检查密码是否存在且属于当前用户
    const existingPassword = await prisma.password.findFirst({
      where: { id, userId },
    })

    if (!existingPassword) {
      return NextResponse.json({ error: '密码不存在' }, { status: 404 })
    }

    // 如果更改分类，验证新分类属于当前用户
    const normalizedCategoryId = typeof categoryId === 'string' ? categoryId.trim() : undefined

    if (normalizedCategoryId && normalizedCategoryId !== existingPassword.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: normalizedCategoryId, userId },
      })
      if (!category) {
        return NextResponse.json({ error: '分类不存在' }, { status: 404 })
      }
    }

    const password = await prisma.password.update({
      where: { id },
      data: {
        ...(username !== undefined && { username: username.trim() }),
        ...(encryptedSecret !== undefined && { encryptedSecret }),
        ...(iv !== undefined && { iv }),
        ...(notes !== undefined && { notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null }),
        ...(normalizedCategoryId && { categoryId: normalizedCategoryId }),
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

    return NextResponse.json(password)
  } catch (error) {
    console.error('更新密码错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 删除密码
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { id } = await params

    // 检查密码是否存在且属于当前用户
    const existingPassword = await prisma.password.findFirst({
      where: { id, userId },
    })

    if (!existingPassword) {
      return NextResponse.json({ error: '密码不存在' }, { status: 404 })
    }

    await prisma.password.delete({
      where: { id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除密码错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
