'use client'

/**
 * 密码表单组件
 * 用于添加/编辑密码，包含密码生成器
 */
import { encryptSecret } from '@/src/features/vault/crypto/encryption'
import type { Category, Password } from '@/src/shared/types'
import { useEffect, useState } from 'react'
import PasswordGenerator from '@/src/features/vault/components/password-generator'

// 组件属性接口
interface PasswordFormProps {
  categories: Category[] // 分类列表
  password?: Password | null // 要编辑的密码（编辑模式）
  masterKey: CryptoKey // 主密码密钥
  onSubmit: (data: {
    username: string
    encryptedSecret: string
    iv: string
    notes: string
    categoryId: string
  }) => Promise<void> // 提交回调
  onCancel: () => void // 取消回调
}

/**
 * 密码表单组件
 * 支持添加和编辑密码，编辑时自动解密显示
 */
export default function PasswordForm({ categories, password, masterKey, onSubmit, onCancel }: PasswordFormProps) {
  const [username, setUsername] = useState(password?.username || '')
  const [secret, setSecret] = useState(password?.encryptedSecret || '')
  const [notes, setNotes] = useState(password?.notes || '')
  const [categoryId, setCategoryId] = useState(password?.categoryId || categories[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (password) {
      setUsername(password.username)
      setSecret(password.encryptedSecret || '')
      setNotes(password.notes || '')
      setCategoryId(password.categoryId)
      return
    }

    if (categories.length > 0) {
      setCategoryId((current) => current || categories[0].id)
    }
  }, [categories, password])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('请输入用户名/网站')
      return
    }

    if (!secret.trim()) {
      setError('请输入密码')
      return
    }

    if (!categoryId) {
      setError('请选择分类')
      return
    }

    setLoading(true)

    try {
      const { encrypted, iv } = await encryptSecret(secret, masterKey)

      await onSubmit({
        username: username.trim(),
        encryptedSecret: encrypted,
        iv,
        notes: notes.trim(),
        categoryId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  function handlePasswordGenerated(password: string) {
    setSecret(password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 用户名/网站输入 */}
      <div>
        <label className="mb-1 block text-sm font-medium">用户名/网站</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="例: example.com 或 App Name"
          required
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>

      {/* 密码输入和生成器 */}
      <div>
        <label className="mb-1 block text-sm font-medium">密码</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="输入密码"
            required
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 font-mono dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        {/* 密码生成器 */}
        <div className="mt-2">
          <PasswordGenerator onPasswordGenerated={handlePasswordGenerated} />
        </div>
      </div>

      {/* 分类选择 */}
      <div>
        <label className="mb-1 block text-sm font-medium">分类</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* 备注输入 */}
      <div>
        <label className="mb-1 block text-sm font-medium">备注</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="可选备注"
          rows={3}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>

      {/* 错误提示 */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}
