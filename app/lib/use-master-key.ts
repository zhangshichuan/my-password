'use client'

import { useSyncExternalStore } from 'react'
import { clearMasterKey, getMasterKey, setMasterKey, subscribeToMasterKey } from './master-key'

/**
 * 主密钥状态 hook
 * 对外屏蔽底层内存仓库，让组件通过统一接口读写解锁状态。
 */
export function useMasterKey() {
  const masterKey = useSyncExternalStore(subscribeToMasterKey, getMasterKey, () => null)

  return {
    masterKey,
    hasMasterKey: masterKey !== null,
    setMasterKey,
    clearMasterKey,
  }
}
