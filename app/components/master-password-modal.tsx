'use client'

/**
 * 主密码解锁弹窗组件
 * 用户输入主密码以解锁金库，验证通过后返回派生密钥
 */
import { getCurrentUser } from '@/app/lib/auth'
import { deriveKey, verifyMasterPassword } from '@/app/lib/vault'
import { useCallback, useState } from 'react'
import { Password } from '../lib/types'

// 组件属性接口
interface MasterPasswordModalProps {
  email?: string // 邮箱（可选，默认从当前用户获取）
  isOpen: boolean // 是否显示
  onSuccess: (key: string) => void // 验证成功回调，返回派生密钥
  onClose: () => void // 关闭弹窗回调
  existingPasswords?: Password[] // 已有的加密密码（用于验证）
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
  const [success, setSuccess] = useState(false) // 成功提示

  // 获取 email：优先使用 props，否则从当前用户获取
  const email = emailProp || getCurrentUser()?.email || ''

  // 是否首次设置主密码（没有任何密码数据）
  const isFirstTime = existingPasswords.length === 0

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
        // 首次设置主密码：校验长度后派生密钥（还没有数据可以验证）
        if (isFirstTime) {
          if (password.length < 8) {
            setError('主密码至少8位')
            setLoading(false)
            return
          }
          const key = await deriveKey(password, email)
          setSuccess(true)
          setTimeout(() => {
            onSuccess(key)
            setPassword('')
            setSuccess(false)
          }, 800)
          setLoading(false)
          return
        }

        // 有已存在的密码数据：用已有数据验证主密码
        const firstPassword = existingPasswords[0]
        const isValid = await verifyMasterPassword(password, email, firstPassword.encryptedSecret, firstPassword.iv)

        if (!isValid) {
          setError('主密码错误')
          setLoading(false)
          return
        }

        // 验证成功，派生密钥并返回
        const key = await deriveKey(password, email)
        setSuccess(true)
        setTimeout(() => {
          onSuccess(key)
          setPassword('')
          setSuccess(false)
        }, 800)
        setLoading(false)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '主密码错误')
      } finally {
        setLoading(false)
      }
    },
    [password, email, existingPasswords, onSuccess, isFirstTime],
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">{isFirstTime ? '设置主密码' : '输入主密码'}</h2>

        {/* 首次设置主密码警告 */}
        {isFirstTime && (
          <div className="mb-4 rounded-lg border border-2 border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <p className="mb-2 text-sm font-bold text-red-600 dark:text-red-400">主密码非常重要！</p>
            <div className="rounded bg-red-100 p-3 text-xs text-red-700 dark:bg-red-900 dark:text-red-300">
              <p className="mb-1 font-bold">丢失将永久无法查看已有密码数据！</p>
              <p>主密码用于加密您的密码数据。服务器无法恢复此密码，请务必记到本子上！</p>
            </div>
          </div>
        )}

        {!isFirstTime && <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">请输入您的主密码以解锁金库</p>}

        {/* 主密码输入表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isFirstTime ? '主密码（至少8位）' : '主密码'}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              autoFocus
            />
          </div>

          {/* 错误提示 */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* 成功提示 */}
          {success && <p className="text-sm text-green-500">{isFirstTime ? '设置成功！' : '解锁成功！'}</p>}

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
              {loading ? '验证中...' : isFirstTime ? '设置' : '解锁'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
