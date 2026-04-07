'use client'

import VaultFeedback from '@/src/features/vault/components/vault-feedback'
import { useCategoriesPage } from '@/src/features/vault/hooks/use-categories-page'
import type { Category } from '@/src/shared/types'

const CATEGORY_TYPES = [
  { value: 'website', label: '🌐 网站' },
  { value: 'app', label: '📱 应用' },
  { value: 'doorlock', label: '🔐 门锁' },
  { value: 'card', label: '💳 银行卡' },
  { value: 'other', label: '📝 其他' },
] as const

export default function CategoriesPage() {
  const {
    actionError,
    categories,
    editingCategory,
    error,
    handleCancel,
    handleDelete,
    handleEdit,
    handleSubmit,
    loading,
    loadingError,
    name,
    openCreateForm,
    retryLoad,
    setName,
    setType,
    showForm,
    submitting,
    type,
  } = useCategoriesPage()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">分类管理</h1>
        {!showForm && (
          <button
            onClick={openCreateForm}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            添加分类
          </button>
        )}
      </div>

      {actionError && <VaultFeedback variant="error" title="操作未完成" description={actionError} />}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
        >
          <h2 className="mb-4 font-medium">{editingCategory ? '编辑分类' : '添加分类'}</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="分类名称"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">类型</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Category['type'])}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              >
                {CATEGORY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <VaultFeedback title="正在加载分类" description="分类列表马上就绪。" />
      ) : loadingError ? (
        <VaultFeedback
          variant="error"
          title="分类列表加载失败"
          description={loadingError}
          action={
            <button
              onClick={retryLoad}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              重新加载
            </button>
          }
        />
      ) : categories.length === 0 ? (
        <VaultFeedback title="还没有分类" description="先创建一个分类，后续添加密码时就可以直接选择。" />
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{CATEGORY_TYPES.find((t) => t.value === category.type)?.label || '📝'}</span>
                <span className="font-medium">{category.name}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="rounded px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="rounded px-3 py-1 text-sm text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
