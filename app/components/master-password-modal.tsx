'use client'

/**
 * 主密码解锁弹窗组件
 * 用户输入主密码以解锁金库，验证通过后返回派生密钥
 */
import { useState, useCallback } from 'react'
import { verifyMasterPassword, deriveKey } from '@/app/lib/vault'
import { getCurrentUser } from '@/app/lib/auth'

// 组件属性接口
interface MasterPasswordModalProps {
  email?: string // 邮箱（可选，默认从当前用户获取）
  isOpen: boolean // 是否显示
  onSuccess: (key: string) => void // 验证成功回调，返回派生密钥
  onClose: () => void // 关闭弹窗回调
  existingPasswords?: { encryptedSecret: string; iv: string }[] // 已有的加密密码（用于验证）
}

/**
 * 主密码解锁弹窗
 * 输入主密码后尝试验证，验证成功则派生密钥并通过回调返回
 */
export default function MasterPasswordModal({
  email: emailProp,
  isOpen,
  onSuccess,
  onClose,
  existingPasswords = [],
}: MasterPasswordModalProps) {
  const [password, setPassword] = useState('') // 主密码输入
  const [error, setError] = useState('') // 错误信息
  const [loading, setLoading] = useState(false) // 验证中状态

  // 获取 email：优先使用 props，否则从当前用户获取
  const email = emailProp || getCurrentUser()?.email || ''

  /**
   * 处理表单提交
   * 验证主密码，验证通过则派生密钥并回调
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      setLoading(true)

      try {
        // 优先用已存在的密码数据验证
        if (existingPasswords.length > 0) {
          const firstPassword = existingPasswords[0]
          const isValid = await verifyMasterPassword(password, email, firstPassword.encryptedSecret, firstPassword.iv)

          if (!isValid) {
            setError('主密码错误')
            setLoading(false)
            return
          }
        } else {
          // 没有密码时，用派生密钥验证（只能验证格式，不能验证正确性）
          await deriveKey(password, email)
        }

        // 验证成功，派生密钥并返回
        const key = await deriveKey(password, email)
        onSuccess(key)
        setPassword('')
      } catch {
        setError('主密码错误')
      } finally {
        setLoading(false)
      }
    },
    [password, email, existingPasswords, onSuccess],
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">输入主密码</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">请输入您的主密码以解锁金库</p>

        {/* 主密码输入表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="主密码"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              autoFocus
            />
          </div>

          {/* 错误提示 */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? '验证中...' : '解锁'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
