'use client'

import MasterPasswordModal from '@/app/components/master-password-modal'
import PasswordCard from '@/app/components/password-card'
import { deletePassword, getCategories, getPasswords } from '@/app/lib/api'
import type { Category, Password } from '@/app/lib/types'
import { getMasterKey, setMasterKey } from '@/app/lib/vault-session'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function VaultPage() {
  const router = useRouter()
  const [passwords, setPasswords] = useState<Password[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [masterKey, setMasterKeyState] = useState<string | null>(null)

  // 初始化加载 masterKey
  useEffect(() => {
    setMasterKeyState(getMasterKey())
  }, [])

  // 加载分类
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  // 加载密码（加密状态）
  const loadPasswords = useCallback(async () => {
    setLoading(true)
    try {
      const pws = await getPasswords(selectedCategory || undefined)
      setPasswords(pws)
    } catch (err) {
      console.error('加载密码失败', err)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    loadPasswords()
  }, [loadPasswords])

  // 删除密码
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('确定要删除这条密码吗?')) return
    try {
      await deletePassword(id)
      setPasswords((prev) => prev.filter((p) => p.id !== id))
    } catch {
      alert('删除失败')
    }
  }, [])

  // 编辑密码
  const handleEdit = useCallback(
    (password: Password) => {
      router.push(`/vault/passwords/${password.id}`)
    },
    [router],
  )

  // 添加密码 - 如果未解锁先解锁
  const handleAddPassword = useCallback(() => {
    if (getMasterKey()) {
      router.push('/vault/passwords/add')
    } else {
      setShowUnlockModal(true)
    }
  }, [router])

  // 解锁成功
  const handleUnlockSuccess = useCallback((key: string) => {
    setMasterKey(key)
    setMasterKeyState(key)
    setShowUnlockModal(false)
  }, [])

  // 过滤密码
  const filteredPasswords = passwords.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* 搜索和过滤 */}
      <div className="flex gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索密码..."
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="">全部分类</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddPassword}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          添加密码
        </button>
      </div>

      {/* 密码列表 */}
      {loading ? (
        <p className="text-center text-zinc-500">加载中...</p>
      ) : filteredPasswords.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 py-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500">暂无密码</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPasswords.map((password) => (
            <PasswordCard key={password.id} password={password} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* 解锁弹窗 */}
      <MasterPasswordModal
        isOpen={showUnlockModal}
        onSuccess={handleUnlockSuccess}
        onClose={() => setShowUnlockModal(false)}
        existingPasswords={passwords}
      />
    </div>
  )
}
