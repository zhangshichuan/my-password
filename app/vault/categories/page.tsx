'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/app/lib/api'
import type { Category } from '@/app/lib/types'

const CATEGORY_TYPES = [
  { value: 'website', label: '🌐 网站' },
  { value: 'app', label: '📱 应用' },
  { value: 'doorlock', label: '🔐 门锁' },
  { value: 'card', label: '💳 银行卡' },
  { value: 'other', label: '📝 其他' },
] as const

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<Category['type']>('website')
  const [error, setError] = useState('')

  const loadCategories = useCallback(async () => {
    try {
      const cats = await getCategories()
      setCategories(cats)
    } catch (err) {
      console.error('加载分类失败', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      if (!name.trim()) {
        setError('请输入分类名称')
        return
      }

      try {
        if (editingCategory) {
          await updateCategory(editingCategory.id, { name: name.trim(), type })
          setEditingCategory(null)
        } else {
          await createCategory({ name: name.trim(), type })
        }
        setName('')
        setType('website')
        setShowForm(false)
        await loadCategories()
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存失败')
      }
    },
    [editingCategory, name, type, loadCategories],
  )

  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category)
    setName(category.name)
    setType(category.type)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('确定要删除这个分类吗？')) return
      try {
        await deleteCategory(id)
        await loadCategories()
      } catch {
        alert('删除失败')
      }
    },
    [loadCategories],
  )

  const handleCancel = useCallback(() => {
    setShowForm(false)
    setEditingCategory(null)
    setName('')
    setType('website')
    setError('')
  }, [])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">分类管理</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            添加分类
          </button>
        )}
      </div>

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
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                保存
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-center text-zinc-500">加载中...</p>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 py-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500">暂无分类</p>
        </div>
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
