'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPassword, getCategories } from '@/app/lib/api'
import { getMasterKey } from '@/app/lib/vault-session'
import PasswordForm from '@/app/components/password-form'
import type { Category } from '@/app/lib/types'

export default function AddPasswordPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = useCallback(
    async (data: { username: string; encryptedSecret: string; iv: string; notes: string; categoryId: string }) => {
      await createPassword(data)
      router.push('/vault')
    },
    [router],
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

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-semibold">添加密码</h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow dark:border-zinc-700 dark:bg-zinc-900">
        <PasswordForm categories={categories} masterKey={masterKey} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  )
}
