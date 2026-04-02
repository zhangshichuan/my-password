'use client'

import { useEffect, useState } from 'react'
import type { Password } from '@/app/lib/types'
import { useUnlockAction } from '@/app/lib/use-unlock-action'
import { useMasterKey } from '@/app/lib/use-master-key'
import { decryptSecret } from '@/app/lib/vault'

type PendingAction = 'reveal' | 'copy' | null

/**
 * 单个密码卡片的交互状态。
 * 管理解密缓存、显示/隐藏、复制反馈，以及解锁后继续执行动作。
 */
export function usePasswordCardState(password: Password) {
  const { masterKey } = useMasterKey()
  const [showSecret, setShowSecret] = useState(false)
  const [decryptedSecret, setDecryptedSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [activeAction, setActiveAction] = useState<PendingAction>(null)

  // 列表项切换后，重置上一条密码留下的本地展示状态。
  useEffect(() => {
    setShowSecret(false)
    setDecryptedSecret(null)
    setCopied(false)
    setBusy(false)
    setActiveAction(null)
  }, [password.encryptedSecret, password.id, password.iv])

  // 优先复用已经解密过的结果，避免重复调用 Web Crypto。
  async function resolveSecret(keyOverride?: CryptoKey) {
    if (decryptedSecret) {
      return decryptedSecret
    }

    const key = keyOverride || masterKey
    if (!key) {
      return null
    }

    const secret = await decryptSecret(password.encryptedSecret, key, password.iv)
    setDecryptedSecret(secret)
    return secret
  }

  // 复制成功提示独立抽成一个小函数，避免 reveal/copy 两处重复。
  function markCopied() {
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  // reveal/copy 两个动作共用一套“解锁后继续执行”的流程。
  const unlockAction = useUnlockAction(async (key: CryptoKey, action: Exclude<PendingAction, null>) => {
    const secret = await resolveSecret(key)
    if (!secret) return

    if (action === 'reveal') {
      setShowSecret(true)
      return
    }

    await navigator.clipboard.writeText(secret)
    markCopied()
  })

  async function handleReveal() {
    if (showSecret) {
      setShowSecret(false)
      return
    }

    setBusy(true)

    try {
      const secret = await resolveSecret()

      if (!secret) {
        setActiveAction('reveal')
        await unlockAction.run('reveal')
        return
      }

      setShowSecret(true)
    } catch {
      console.error('解密失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleCopy() {
    setBusy(true)

    try {
      const secret = await resolveSecret()

      if (!secret) {
        setActiveAction('copy')
        await unlockAction.run('copy')
        return
      }

      await navigator.clipboard.writeText(secret)
      markCopied()
    } catch {
      console.error('复制失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleUnlockSuccess(key: CryptoKey) {
    await unlockAction.handleUnlockSuccess(key)
    setActiveAction(null)
  }

  function handleUnlockClose() {
    unlockAction.closeUnlock()
    setActiveAction(null)
  }

  return {
    activeAction,
    busy,
    copied,
    decryptedSecret,
    handleCopy,
    handleReveal,
    handleUnlockClose,
    handleUnlockSuccess,
    isUnlockOpen: unlockAction.isUnlockOpen,
    showSecret,
  }
}
