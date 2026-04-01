/**
 * 金库会话管理
 * 统一管理 masterKey 的存取
 * masterKey 会在 10 分钟后自动清除
 */

const SESSION_KEY = 'masterKey'
const TIMEOUT_KEY = 'masterKey_timeout'
const TIMEOUT_MS = 10 * 60 * 1000 // 10 分钟

/**
 * 检查并清除过期的 masterKey
 */
function checkExpiry(): void {
  if (typeof window === 'undefined') return
  const expiry = sessionStorage.getItem(TIMEOUT_KEY)
  if (expiry && Date.now() > parseInt(expiry, 10)) {
    clearMasterKey()
  }
}

/**
 * 获取当前 masterKey
 */
export function getMasterKey(): string | null {
  if (typeof window === 'undefined') return null
  checkExpiry()
  return sessionStorage.getItem(SESSION_KEY)
}

/**
 * 设置 masterKey（10 分钟后自动过期）
 */
export function setMasterKey(key: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SESSION_KEY, key)
  sessionStorage.setItem(TIMEOUT_KEY, (Date.now() + TIMEOUT_MS).toString())
}

/**
 * 移除 masterKey（锁定）
 */
export function clearMasterKey(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(SESSION_KEY)
}

/**
 * 是否已解锁
 */
export function hasMasterKey(): boolean {
  return getMasterKey() !== null
}
