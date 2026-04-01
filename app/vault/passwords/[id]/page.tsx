'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getPassword, updatePassword, getCategories } from '@/app/lib/api'
import { decryptSecret } from '@/app/lib/vault'
import { getMasterKey } from '@/app/lib/vault-session'
import PasswordForm from '@/app/components/password-form'
import type { Category, Password } from '@/app/lib/types'

export default function EditPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [categories, setCategories] = useState<Category[]>([])
  const [password, setPassword] = useState<Password | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载分类
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // 加载密码
  useEffect(() => {
    const masterKey = getMasterKey()
    if (!id || !masterKey) return

    const loadPassword = async () => {
      try {
        const pw = await getPassword(id)
        // 解密密码
        const secret = await decryptSecret(pw.encryptedSecret, masterKey, pw.iv)
        setPassword({ ...pw, encryptedSecret: secret } as Password & { secret: string })
      } catch (err) {
        console.error('加载密码失败', err)
        alert('加载密码失败')
        router.push('/vault')
      }
    }

    loadPassword()
  }, [id, router])

  const handleSubmit = useCallback(
    async (data: { username: string; encryptedSecret: string; iv: string; notes: string; categoryId: string }) => {
      await updatePassword(id, {
        username: data.username,
        encryptedSecret: data.encryptedSecret,
        iv: data.iv,
        notes: data.notes,
        categoryId: data.categoryId,
      })
      router.push('/vault')
    },
    [id, router],
  )

  const handleCancel = useCallback(() => {
    router.push('/vault')
  }, [router])

  if (loading) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-zinc-500">加载中...</p>
      </div>
    )
  }

  const masterKey = getMasterKey()

  if (!masterKey) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-zinc-500">请先在密码列表解锁主密码</p>
        <button
          onClick={() => router.push('/vault')}
          className="mt-2 text-sm text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-400"
        >
          返回密码列表
        </button>
      </div>
    )
  }

  // 密码解密后直接使用 encryptedSecret 字段（此时已是明文）
  const passwordForForm = password ? { ...password } : null

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-semibold">编辑密码</h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow dark:border-zinc-700 dark:bg-zinc-900">
        {passwordForForm ? (
          <PasswordForm
            categories={categories}
            password={passwordForForm}
            masterKey={masterKey}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        ) : (
          <p className="text-center text-zinc-500">加载中...</p>
        )}
      </div>
    </div>
  )
}
