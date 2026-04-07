'use client'

import { createCategory, deleteCategory, getCategories, updateCategory } from '@/src/features/vault/api/client'
import { useAsyncStatus } from '@/src/features/vault/hooks/use-async-status'
import { getUiErrorMessage, logUiError } from '@/src/features/vault/utils/ui-feedback'
import type { Category } from '@/src/shared/types'
import { useCallback, useEffect, useState } from 'react'

/**
 * 分类管理页状态 hook。
 * 统一处理分类列表加载、编辑表单状态和增删改提交流程。
 */
export function useCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<Category['type']>('website')
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const { error: loadingError, loading, run: runLoadTask } = useAsyncStatus(true)
  const { loading: submitting, run: runSubmitTask } = useAsyncStatus(false)

  // 首次进入页面时加载所有分类。
  const loadCategories = useCallback(async () => {
    await runLoadTask(getCategories, {
      errorMessage: '分类列表加载失败，请稍后重试。',
      logScope: '加载分类页失败',
      onSuccess: (nextCategories) => {
        setCategories(nextCategories)
      },
    })
  }, [runLoadTask])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  // 新增和编辑共用一套表单提交流程。
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setActionError('')

    if (!name.trim()) {
      setError('请输入分类名称')
      return
    }

    const result = await runSubmitTask(
      async () => {
        if (editingCategory) {
          await updateCategory(editingCategory.id, { name: name.trim(), type })
          return 'updated' as const
        }

        await createCategory({ name: name.trim(), type })
        return 'created' as const
      },
      {
        errorMessage: '保存分类失败，请稍后重试。',
        logScope: '保存分类失败',
        onError: (err) => {
          setError(getUiErrorMessage(err, '保存分类失败，请稍后重试。'))
        },
      },
    )

    if (!result) {
      return
    }

    setEditingCategory(null)
    setName('')
    setType('website')
    setShowForm(false)
    await loadCategories()
  }

  // 把当前分类带入表单，切换到编辑模式。
  function handleEdit(category: Category) {
    setEditingCategory(category)
    setName(category.name)
    setType(category.type)
    setShowForm(true)
  }

  // 删除成功后重新拉取分类列表，保持页面状态简单。
  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个分类吗？')) return

    setActionError('')

    try {
      await deleteCategory(id)
      await loadCategories()
    } catch (error) {
      logUiError('删除分类失败', error)
      setActionError(getUiErrorMessage(error, '删除分类失败，请稍后重试。'))
    }
  }

  // 关闭表单时恢复到“新增默认值”状态。
  function handleCancel() {
    setShowForm(false)
    setEditingCategory(null)
    setName('')
    setType('website')
    setError('')
  }

  function openCreateForm() {
    setShowForm(true)
  }

  return {
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
    retryLoad: loadCategories,
    setName,
    setType,
    showForm,
    submitting,
    type,
  }
}
