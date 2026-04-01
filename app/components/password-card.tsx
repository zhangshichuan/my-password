'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Password } from '@/app/lib/types'
import { decryptSecret } from '@/app/lib/vault'
import { getMasterKey, setMasterKey } from '@/app/lib/vault-session'
import MasterPasswordModal from './master-password-modal'

interface PasswordCardProps {
  password: Password
  onEdit: (password: Password) => void
  onDelete: (id: string) => void
}

export default function PasswordCard({ password, onEdit, onDelete }: PasswordCardProps) {
  const [showSecret, setShowSecret] = useState(false)
  const [decryptedSecret, setDecryptedSecret] = useState<string | null>(null)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [copied, setCopied] = useState(false)

  // 如果有 masterKey，解密密码
  useEffect(() => {
    const key = getMasterKey()
    if (key && !decryptedSecret) {
      decryptSecret(password.encryptedSecret, key, password.iv).then(setDecryptedSecret).catch(console.error)
    }
  }, [password, decryptedSecret])

  const handleReveal = useCallback(() => {
    const key = getMasterKey()
    if (key && decryptedSecret) {
      setShowSecret(!showSecret)
    } else {
      setShowUnlockModal(true)
    }
  }, [decryptedSecret, showSecret])

  const handleCopy = useCallback(async () => {
    const key = getMasterKey()
    if (key && decryptedSecret) {
      await navigator.clipboard.writeText(decryptedSecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setShowUnlockModal(true)
    }
  }, [decryptedSecret])

  const handleUnlockSuccess = useCallback(
    async (key: string) => {
      setMasterKey(key)
      setShowUnlockModal(false)
      // 解密这条密码
      try {
        const secret = await decryptSecret(password.encryptedSecret, key, password.iv)
        setDecryptedSecret(secret)
      } catch {
        console.error('解密失败')
      }
    },
    [password],
  )

  const getCategoryIcon = (type?: string) => {
    switch (type) {
      case 'website':
        return '🌐'
      case 'app':
        return '📱'
      case 'doorlock':
        return '🔐'
      case 'card':
        return '💳'
      default:
        return '📝'
    }
  }

  return (
    <>
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getCategoryIcon(password.category?.type)}</span>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{password.username}</h3>
              {password.category && <p className="text-xs text-zinc-500">{password.category.name}</p>}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(password)}
              className="rounded px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              编辑
            </button>
            <button
              onClick={() => onDelete(password.id)}
              className="rounded px-2 py-1 text-xs text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              删除
            </button>
          </div>
        </div>

        {password.notes && <p className="mb-3 text-sm text-zinc-500">{password.notes}</p>}

        <div className="flex items-center gap-2">
          <div className="flex-1 rounded bg-zinc-100 px-3 py-2 font-mono text-sm dark:bg-zinc-800">
            {decryptedSecret ? (showSecret ? decryptedSecret : '••••••••') : '••••••••'}
          </div>
          <button onClick={handleReveal} className="rounded px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
            {showSecret ? '隐藏' : '显示'}
          </button>
          <button
            onClick={handleCopy}
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      <MasterPasswordModal
        isOpen={showUnlockModal}
        onSuccess={handleUnlockSuccess}
        onClose={() => setShowUnlockModal(false)}
      />
    </>
  )
}
