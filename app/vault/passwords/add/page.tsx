'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPassword, getCategories, getPasswords } from '@/app/lib/api'
import { getMasterKey, setMasterKey } from '@/app/lib/vault-session'
import PasswordForm from '@/app/components/password-form'
import MasterPasswordModal from '@/app/components/master-password-modal'
import type { Category, Password } from '@/app/lib/types'

export default function AddPasswordPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showMasterPasswordModal, setShowMasterPasswordModal] = useState(false)
  const [existingPasswords, setExistingPasswords] = useState<Password[]>([])

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false))

    // 获取已有密码数量，判断是否首次设置
    getPasswords()
      .then(setExistingPasswords)
      .catch(console.error)
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

  // 主密码设置/验证成功
  const handleMasterPasswordSuccess = useCallback(
    (key: string) => {
      setMasterKey(key)
      setShowMasterPasswordModal(false)
    },
    [],
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-zinc-500">加载中...</p>
      </div>
    )
  }

  const masterKey = getMasterKey()

  // 没有 masterKey，先弹出主密码设置/验证框
  if (!masterKey) {
    return (
      <>
        <div className="mx-auto max-w-md py-12 text-center">
          <p className="text-zinc-500">请先设置主密码</p>
          <button
            onClick={() => setShowMasterPasswordModal(true)}
            className="mt-2 text-sm text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-400"
          >
            设置主密码
          </button>
        </div>
        <MasterPasswordModal
          isOpen={showMasterPasswordModal}
          onSuccess={handleMasterPasswordSuccess}
          onClose={() => setShowMasterPasswordModal(false)}
          existingPasswords={existingPasswords}
        />
      </>
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
