'use client'

/**
 * 密码卡片组件
 * 这里只保留展示结构，交互状态全部委托给 usePasswordCardState。
 */
import type { Password } from '@/src/shared/types'
import MasterPasswordModal from '@/src/features/vault/components/master-password-modal'
import { usePasswordCardState } from '@/src/features/vault/hooks/use-password-card-state'

// 组件属性接口
interface PasswordCardProps {
  password: Password // 密码数据
  onEdit: (password: Password) => void // 编辑回调
  onDelete: (id: string) => void // 删除回调
}

/**
 * 密码卡片组件
 * 展示密码信息，支持显示/隐藏密码、复制、编辑、删除操作
 */
export default function PasswordCard({ password, onEdit, onDelete }: PasswordCardProps) {
  const {
    busy,
    copied,
    decryptedSecret,
    handleCopy,
    handleReveal,
    handleUnlockClose,
    handleUnlockSuccess,
    isUnlockOpen,
    showSecret,
  } = usePasswordCardState(password)

  // 分类类型只影响视觉图标，不参与任何业务逻辑。
  const getCategoryIcon = (type?: string) => {
    switch (type) {
      case 'website':
        return '🌐'
      case 'app':
        return '📱'
      case 'doorlock':
        return '🔐'
      case 'card':
        return '💳'
      default:
        return '📝'
    }
  }

  return (
    <>
      {/* 密码卡片主体 */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        {/* 顶部：分类图标、名称、操作按钮 */}
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getCategoryIcon(password.category?.type)}</span>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{password.username}</h3>
              {password.category && <p className="text-xs text-zinc-500">{password.category.name}</p>}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(password)}
              className="rounded px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              编辑
            </button>
            <button
              onClick={() => onDelete(password.id)}
              className="rounded px-2 py-1 text-xs text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              删除
            </button>
          </div>
        </div>

        {/* 备注 */}
        {password.notes && <p className="mb-3 text-sm text-zinc-500">{password.notes}</p>}

        {/* 密码显示区域 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded bg-zinc-100 px-3 py-2 font-mono text-sm dark:bg-zinc-800">
            {decryptedSecret ? (showSecret ? decryptedSecret : '••••••••') : '••••••••'}
          </div>
          <button onClick={handleReveal} className="rounded px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
            {busy ? '处理中...' : showSecret ? '隐藏' : '显示'}
          </button>
          <button
            onClick={handleCopy}
            disabled={busy}
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {busy ? '处理中...' : copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      {/* 主密码解锁弹窗 */}
      <MasterPasswordModal
        isOpen={isUnlockOpen}
        onSuccess={handleUnlockSuccess}
        onClose={handleUnlockClose}
        existingPasswords={[password]}
      />
    </>
  )
}
