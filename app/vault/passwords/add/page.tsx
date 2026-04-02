'use client'

import MasterPasswordModal from '@/app/components/master-password-modal'
import PasswordForm from '@/app/components/password-form'
import { createPassword, getCategories, getPasswords } from '@/app/lib/api'
import type { Category, Password } from '@/app/lib/types'
import { useUnlockPrompt } from '@/app/lib/use-unlock-prompt'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AddPasswordPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [existingPasswords, setExistingPasswords] = useState<Password[]>([])
  const unlockPrompt = useUnlockPrompt(!loading)

  useEffect(() => {
    let cancelled = false

    async function loadPageData() {
      setLoading(true)

      try {
        const [nextCategories, nextPasswords] = await Promise.all([getCategories(), getPasswords()])

        if (!cancelled) {
          setCategories(nextCategories)
          setExistingPasswords(nextPasswords)
        }
      } catch (error) {
        console.error('加载添加页数据失败', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPageData()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(data: {
    username: string
    encryptedSecret: string
    iv: string
    notes: string
    categoryId: string
  }) {
    await createPassword(data)
    router.push('/vault')
  }

  function handleCancel() {
    router.push('/vault')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-zinc-500">加载中...</p>
      </div>
    )
  }

  if (!unlockPrompt.masterKey) {
    const isFirstTime = existingPasswords.length === 0

    return (
      <>
        <div className="mx-auto max-w-md py-12 text-center">
          <p className="text-zinc-500">{isFirstTime ? '请先设置主密码' : '请先输入主密码'}</p>
          <button
            onClick={unlockPrompt.openUnlock}
            className="mt-2 text-sm text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-400"
          >
            {isFirstTime ? '设置主密码' : '输入主密码'}
          </button>
        </div>
        <MasterPasswordModal
          isOpen={unlockPrompt.isUnlockOpen}
          onSuccess={unlockPrompt.handleUnlockSuccess}
          onClose={unlockPrompt.closeUnlock}
          existingPasswords={existingPasswords}
        />
      </>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-semibold">添加密码</h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow dark:border-zinc-700 dark:bg-zinc-900">
        <PasswordForm
          categories={categories}
          masterKey={unlockPrompt.masterKey}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
