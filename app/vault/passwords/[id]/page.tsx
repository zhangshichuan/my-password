'use client'

import MasterPasswordModal from '@/app/components/master-password-modal'
import PasswordForm from '@/app/components/password-form'
import { getCategories, getPassword, updatePassword } from '@/app/lib/api'
import { decryptSecret } from '@/app/lib/vault'
import type { Category, Password } from '@/app/lib/types'
import { useUnlockPrompt } from '@/app/lib/use-unlock-prompt'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function EditPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [categories, setCategories] = useState<Category[]>([])
  const [encryptedPassword, setEncryptedPassword] = useState<Password | null>(null)
  const [password, setPassword] = useState<Password | null>(null)
  const [loading, setLoading] = useState(true)
  const unlockPrompt = useUnlockPrompt(!loading && encryptedPassword !== null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadPageData() {
      setLoading(true)

      try {
        const [nextCategories, pw] = await Promise.all([getCategories(), getPassword(id)])

        if (!cancelled) {
          setCategories(nextCategories)
          setEncryptedPassword(pw)
        }
      } catch (err) {
        console.error('加载密码失败', err)
        if (!cancelled) {
          alert('加载密码失败')
          router.push('/vault')
        }
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
  }, [id, router])

  useEffect(() => {
    const currentEncryptedPassword = encryptedPassword
    const currentMasterKey = unlockPrompt.masterKey

    if (!currentEncryptedPassword || !currentMasterKey) {
      setPassword(null)
      return
    }

    const passwordToDecrypt = currentEncryptedPassword
    const decryptingKey = currentMasterKey

    let cancelled = false

    async function decryptPassword() {
      try {
        const secret = await decryptSecret(passwordToDecrypt.encryptedSecret, decryptingKey, passwordToDecrypt.iv)

        if (!cancelled) {
          setPassword({ ...passwordToDecrypt, encryptedSecret: secret })
        }
      } catch (err) {
        console.error('解密密码失败', err)
        if (!cancelled) {
          alert('主密码错误或密码数据损坏')
          setPassword(null)
        }
      }
    }

    decryptPassword()

    return () => {
      cancelled = true
    }
  }, [encryptedPassword, unlockPrompt.masterKey])

  async function handleSubmit(data: {
    username: string
    encryptedSecret: string
    iv: string
    notes: string
    categoryId: string
  }) {
    await updatePassword(id, {
      username: data.username,
      encryptedSecret: data.encryptedSecret,
      iv: data.iv,
      notes: data.notes,
      categoryId: data.categoryId,
    })
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
    return (
      <>
        <div className="mx-auto max-w-md py-12 text-center">
          <p className="text-zinc-500">请先输入主密码</p>
          <button
            onClick={unlockPrompt.openUnlock}
            className="mt-2 text-sm text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-400"
          >
            输入主密码
          </button>
        </div>
        <MasterPasswordModal
          isOpen={unlockPrompt.isUnlockOpen}
          onSuccess={unlockPrompt.handleUnlockSuccess}
          onClose={unlockPrompt.closeUnlock}
          existingPasswords={encryptedPassword ? [encryptedPassword] : []}
        />
      </>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-semibold">编辑密码</h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow dark:border-zinc-700 dark:bg-zinc-900">
        {password ? (
          <PasswordForm
            categories={categories}
            password={password}
            masterKey={unlockPrompt.masterKey}
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
