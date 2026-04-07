'use client'

import MasterPasswordModal from '@/src/features/vault/components/master-password-modal'
import PasswordCard from '@/src/features/vault/components/password-card'
import VaultFeedback from '@/src/features/vault/components/vault-feedback'
import { useUnlockAction } from '@/src/features/vault/hooks/use-unlock-action'
import { useVaultPageState } from '@/src/features/vault/hooks/use-vault-page-state'
import type { Password } from '@/src/shared/types'
import { useRouter } from 'next/navigation'

export default function VaultPage() {
  const router = useRouter()
  const {
    actionError,
    categories,
    categoriesError,
    filteredPasswords,
    handleDelete,
    loading,
    passwords,
    passwordsError,
    retryPasswords,
    searchQuery,
    selectedCategory,
    setActionError,
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
      {categoriesError && <VaultFeedback variant="error" title="分类筛选暂时不可用" description={categoriesError} />}

      {actionError && (
        <VaultFeedback
          variant="error"
          title="操作未完成"
          description={actionError}
          action={
            <button
              onClick={() => setActionError('')}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              知道了
            </button>
          }
        />
      )}

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
        <VaultFeedback title="正在加载密码列表" description="您的密码数据马上就绪。" />
      ) : passwordsError ? (
        <VaultFeedback
          variant="error"
          title="密码列表加载失败"
          description={passwordsError}
          action={
            <button
              onClick={retryPasswords}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              重新加载
            </button>
          }
        />
      ) : filteredPasswords.length === 0 ? (
        <VaultFeedback
          title={passwords.length === 0 ? '还没有保存的密码' : '没有匹配的结果'}
          description={
            passwords.length === 0 ? '先添加一条密码，列表会显示在这里。' : '试试更换关键词，或者切换分类筛选条件。'
          }
        />
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
