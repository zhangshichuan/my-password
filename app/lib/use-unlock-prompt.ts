'use client'

import { useEffect, useState } from 'react'
import { useMasterKey } from './use-master-key'

/**
 * 页面级解锁提示 hook。
 * 适合“这个页面本身就依赖主密钥”的场景，例如新增和编辑密码页面。
 */
export function useUnlockPrompt(enabled: boolean) {
  const { masterKey, setMasterKey } = useMasterKey()
  const [isOpen, setIsOpen] = useState(false)

  // 页面进入可用状态后，如果仍未解锁，就自动弹出解锁框。
  useEffect(() => {
    if (!enabled || masterKey || isOpen) {
      return
    }

    const timer = window.setTimeout(() => {
      setIsOpen(true)
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [enabled, isOpen, masterKey])

  function openUnlock() {
    setIsOpen(true)
  }

  function closeUnlock() {
    setIsOpen(false)
  }

  // 解锁成功后写入统一的主密钥仓库。
  function handleUnlockSuccess(key: CryptoKey) {
    setMasterKey(key)
    setIsOpen(false)
  }

  return {
    masterKey,
    isUnlockOpen: isOpen,
    openUnlock,
    closeUnlock,
    handleUnlockSuccess,
  }
}
