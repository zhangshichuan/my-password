'use client'

import { useState } from 'react'
import { useMasterKey } from './use-master-key'

/**
 * 先解锁、后执行动作的通用 hook。
 * 如果当前没有主密钥，就先弹窗；解锁成功后继续执行原动作。
 */
export function useUnlockAction<TArgs extends unknown[]>(
  action: (key: CryptoKey, ...args: TArgs) => void | Promise<void>,
) {
  const { masterKey, setMasterKey } = useMasterKey()
  const [isUnlockOpen, setIsUnlockOpen] = useState(false)
  const [pendingArgs, setPendingArgs] = useState<TArgs | null>(null)

  // 有主密钥时直接执行；没有则先记录参数，等待解锁。
  async function run(...args: TArgs) {
    if (!masterKey) {
      setPendingArgs(args)
      setIsUnlockOpen(true)
      return
    }

    await action(masterKey, ...args)
  }

  // 解锁成功后补执行之前被挂起的动作。
  async function handleUnlockSuccess(key: CryptoKey) {
    setMasterKey(key)
    setIsUnlockOpen(false)

    if (!pendingArgs) {
      return
    }

    const args = pendingArgs
    setPendingArgs(null)
    await action(key, ...args)
  }

  // 用户取消解锁时，丢弃本次待执行动作。
  function closeUnlock() {
    setIsUnlockOpen(false)
    setPendingArgs(null)
  }

  return {
    isUnlockOpen,
    run,
    closeUnlock,
    handleUnlockSuccess,
  }
}
