'use client'

import MasterPasswordModal from '@/app/components/master-password-modal'
import PasswordCard from '@/app/components/password-card'
import type { Password } from '@/app/lib/types'
import { useUnlockAction } from '@/app/lib/use-unlock-action'
import { useRouter } from 'next/navigation'
import { useVaultPageState } from './use-vault-page-state'

export default function VaultPage() {
  const router = useRouter()
  const {
    categories,
    filteredPasswords,
    handleDelete,
    loading,
    passwords,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
  } = useVaultPageState()

  const addPasswordAction = useUnlockAction(async () => {
    router.push('/vault/passwords/add')
  })

  function handleEdit(password: Password) {
    router.push(`/vault/passwords/${password.id}`)
  }

  function handleAddPassword() {
    void addPasswordAction.run()
  }

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
        isOpen={addPasswordAction.isUnlockOpen}
        onSuccess={addPasswordAction.handleUnlockSuccess}
        onClose={addPasswordAction.closeUnlock}
        existingPasswords={passwords}
      />
    </div>
  )
}
