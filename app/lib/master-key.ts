/**
 * 主密钥内存仓库
 * 只在当前标签页的 JS 内存中持有 CryptoKey，不落盘、不进 storage。
 */
let masterKey: CryptoKey | null = null
let expiryAt = 0
let clearTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()

const TIMEOUT_MS = 10 * 60 * 1000

function clearScheduledTimer() {
  if (clearTimer) {
    clearTimeout(clearTimer)
    clearTimer = null
  }
}

// 通知 useSyncExternalStore 订阅者更新主密钥状态。
function notifyListeners() {
  for (const listener of listeners) {
    listener()
  }
}

// 根据当前过期时间重新安排自动锁定。
function scheduleClear() {
  clearScheduledTimer()

  const remaining = expiryAt - Date.now()
  if (remaining <= 0) {
    clearMasterKey()
    return
  }

  clearTimer = setTimeout(() => {
    clearMasterKey()
  }, remaining)
}

// 读取当前主密钥；如果已过期则在读取时顺便清除。
export function getMasterKey(): CryptoKey | null {
  if (!masterKey) {
    return null
  }

  if (Date.now() >= expiryAt) {
    clearMasterKey()
    return null
  }

  return masterKey
}

// 写入新的主密钥并刷新 10 分钟有效期。
export function setMasterKey(key: CryptoKey): void {
  masterKey = key
  expiryAt = Date.now() + TIMEOUT_MS
  scheduleClear()
  notifyListeners()
}

// 主动锁定金库，同时清空内存和定时器。
export function clearMasterKey(): void {
  masterKey = null
  expiryAt = 0
  clearScheduledTimer()
  notifyListeners()
}

// 提供给 React 外部 store 订阅机制使用。
export function subscribeToMasterKey(listener: () => void): () => void {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
