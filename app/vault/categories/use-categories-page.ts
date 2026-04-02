'use client'

import { createCategory, deleteCategory, getCategories, updateCategory } from '@/app/lib/api'
import type { Category } from '@/app/lib/types'
import { useEffect, useState } from 'react'

/**
 * 分类管理页状态 hook。
 * 统一处理分类列表加载、编辑表单状态和增删改提交流程。
 */
export function useCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<Category['type']>('website')
  const [error, setError] = useState('')

  // 首次进入页面时加载所有分类。
  async function loadCategories() {
    try {
      const nextCategories = await getCategories()
      setCategories(nextCategories)
    } catch (err) {
      console.error('加载分类失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // 新增和编辑共用一套表单提交流程。
  async function handleSubmit(e: React.FormEvent) {
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

    try {
      await deleteCategory(id)
      await loadCategories()
    } catch {
      alert('删除失败')
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
    categories,
    editingCategory,
    error,
    handleCancel,
    handleDelete,
    handleEdit,
    handleSubmit,
    loading,
    name,
    openCreateForm,
    setName,
    setType,
    showForm,
    type,
  }
}
