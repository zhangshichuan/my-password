'use client'

import MasterPasswordModal from '@/src/features/vault/components/master-password-modal'
import PasswordForm from '@/src/features/vault/components/password-form'
import VaultFeedback from '@/src/features/vault/components/vault-feedback'
import { createPassword, getCategories, getPasswords } from '@/src/features/vault/api/client'
import { useAsyncStatus } from '@/src/features/vault/hooks/use-async-status'
import { useUnlockPrompt } from '@/src/features/vault/hooks/use-unlock-prompt'
import type { Category, Password } from '@/src/shared/types'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AddPasswordPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [existingPasswords, setExistingPasswords] = useState<Password[]>([])
  const { error: pageError, loading: pageLoading, run: runPageTask } = useAsyncStatus(true)
  const unlockPrompt = useUnlockPrompt(!pageLoading && !pageError)

  useEffect(() => {
    void runPageTask(async () => Promise.all([getCategories(), getPasswords()]), {
      errorMessage: '添加页数据加载失败，请稍后重试。',
      logScope: '加载添加页数据失败',
      onSuccess: ([nextCategories, nextPasswords]) => {
        setCategories(nextCategories)
        setExistingPasswords(nextPasswords)
      },
    })
  }, [runPageTask])

  function handleRetry() {
    void runPageTask(async () => Promise.all([getCategories(), getPasswords()]), {
      errorMessage: '添加页数据加载失败，请稍后重试。',
      logScope: '重新加载添加页数据失败',
      onSuccess: ([nextCategories, nextPasswords]) => {
        setCategories(nextCategories)
        setExistingPasswords(nextPasswords)
      },
    })
  }

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

  if (pageLoading) {
    return (
      <div className="mx-auto max-w-md py-12">
        <VaultFeedback title="正在准备添加页" description="分类和已有密码正在加载，请稍候。" />
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="mx-auto max-w-md py-12">
        <VaultFeedback
          variant="error"
          title="无法打开添加页"
          description={pageError}
          action={
            <button
              onClick={handleRetry}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              重新加载
            </button>
          }
        />
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-md py-12">
        <VaultFeedback
          title="还没有可用分类"
          description="请先创建分类，再保存新的密码。"
          action={
            <button
              onClick={() => router.push('/vault/categories')}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              去添加分类
            </button>
          }
        />
      </div>
    )
  }

  if (!unlockPrompt.masterKey) {
    const isFirstTime = existingPasswords.length === 0

    return (
      <>
        <div className="mx-auto max-w-md py-12">
          <VaultFeedback
            title={isFirstTime ? '请先设置主密码' : '请先输入主密码'}
            description={isFirstTime ? '首次保存密码前，需要先建立主密码。' : '解锁后才能继续加密并保存密码。'}
            action={
              <button
                onClick={unlockPrompt.openUnlock}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isFirstTime ? '设置主密码' : '输入主密码'}
              </button>
            }
          />
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
