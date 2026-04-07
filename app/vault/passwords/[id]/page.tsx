'use client'

import MasterPasswordModal from '@/src/features/vault/components/master-password-modal'
import PasswordForm from '@/src/features/vault/components/password-form'
import VaultFeedback from '@/src/features/vault/components/vault-feedback'
import { getCategories, getPassword, updatePassword } from '@/src/features/vault/api/client'
import { decryptSecret } from '@/src/features/vault/crypto/encryption'
import { useAsyncStatus } from '@/src/features/vault/hooks/use-async-status'
import { useUnlockPrompt } from '@/src/features/vault/hooks/use-unlock-prompt'
import type { Category, Password } from '@/src/shared/types'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function EditPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [categories, setCategories] = useState<Category[]>([])
  const [encryptedPassword, setEncryptedPassword] = useState<Password | null>(null)
  const [password, setPassword] = useState<Password | null>(null)
  const {
    error: pageError,
    loading: pageLoading,
    run: runPageTask,
    setError: setPageError,
    setLoading: setPageLoading,
  } = useAsyncStatus(true)
  const {
    clearError: clearDecryptError,
    error: decryptError,
    loading: decryptLoading,
    run: runDecryptTask,
  } = useAsyncStatus(false)
  const unlockPrompt = useUnlockPrompt(!pageLoading && !pageError && encryptedPassword !== null)

  useEffect(() => {
    if (!id) {
      setPageError('密码 ID 无效，请返回列表后重试。')
      setPageLoading(false)
      return
    }

    void runPageTask(async () => Promise.all([getCategories(), getPassword(id)]), {
      errorMessage: '密码详情加载失败，请稍后重试。',
      logScope: '加载密码详情失败',
      onSuccess: ([nextCategories, nextPassword]) => {
        setCategories(nextCategories)
        setEncryptedPassword(nextPassword)
      },
    })
  }, [id, runPageTask, setPageError, setPageLoading])

  useEffect(() => {
    const currentEncryptedPassword = encryptedPassword
    const currentMasterKey = unlockPrompt.masterKey

    if (!currentEncryptedPassword || !currentMasterKey) {
      clearDecryptError()
      return
    }

    void runDecryptTask(
      async () =>
        decryptSecret(currentEncryptedPassword.encryptedSecret, currentMasterKey, currentEncryptedPassword.iv),
      {
        errorMessage: '主密码不正确，或该条密码数据已损坏。',
        logScope: '解密密码详情失败',
        onSuccess: (secret) => {
          setPassword({ ...currentEncryptedPassword, encryptedSecret: secret })
        },
      },
    )
  }, [clearDecryptError, encryptedPassword, runDecryptTask, unlockPrompt.masterKey])

  const resolvedPassword = useMemo(() => {
    if (!password || password.id !== encryptedPassword?.id || !unlockPrompt.masterKey) {
      return null
    }

    return password
  }, [encryptedPassword?.id, password, unlockPrompt.masterKey])

  function handleRetry() {
    if (!id) {
      return
    }

    void runPageTask(async () => Promise.all([getCategories(), getPassword(id)]), {
      errorMessage: '密码详情加载失败，请稍后重试。',
      logScope: '重新加载密码详情失败',
      onSuccess: ([nextCategories, nextPassword]) => {
        setCategories(nextCategories)
        setEncryptedPassword(nextPassword)
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

  if (pageLoading) {
    return (
      <div className="mx-auto max-w-md py-12">
        <VaultFeedback title="正在准备编辑页" description="密码详情和分类数据正在加载，请稍候。" />
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="mx-auto max-w-md py-12">
        <VaultFeedback
          variant="error"
          title="无法打开编辑页"
          description={pageError}
          action={
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                重新加载
              </button>
              <button
                onClick={() => router.push('/vault')}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                返回列表
              </button>
            </div>
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
          description="请先创建分类，再继续编辑密码。"
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
    return (
      <>
        <div className="mx-auto max-w-md py-12">
          <VaultFeedback
            title="请先输入主密码"
            description="解锁后才能解密并编辑这条密码。"
            action={
              <button
                onClick={unlockPrompt.openUnlock}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                输入主密码
              </button>
            }
          />
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
        {decryptError ? (
          <VaultFeedback
            variant="error"
            title="暂时无法解密这条密码"
            description={decryptError}
            action={
              <button
                onClick={unlockPrompt.openUnlock}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                重新输入主密码
              </button>
            }
          />
        ) : decryptLoading || !resolvedPassword ? (
          <VaultFeedback title="正在解密密码" description="确认主密码后，会自动填充表单内容。" />
        ) : (
          <PasswordForm
            categories={categories}
            password={resolvedPassword}
            masterKey={unlockPrompt.masterKey}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  )
}
