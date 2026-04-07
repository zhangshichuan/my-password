'use client'

import { deletePassword, getCategories, getPasswords } from '@/src/features/vault/api/client'
import { useAsyncStatus } from '@/src/features/vault/hooks/use-async-status'
import { getUiErrorMessage, logUiError } from '@/src/features/vault/utils/ui-feedback'
import type { Category, Password } from '@/src/shared/types'
import { useCallback, useEffect, useState } from 'react'

/**
 * 密码库列表页状态 hook。
 * 负责分类/密码加载、搜索筛选和删除后的本地同步。
 */
export function useVaultPageState() {
  const [passwords, setPasswords] = useState<Password[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [actionError, setActionError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const { error: categoriesError, run: runCategoriesTask } = useAsyncStatus()
  const { error: passwordsError, loading, run: runPasswordsTask } = useAsyncStatus()
  const loadCategories = useCallback(async () => {
    await runCategoriesTask(getCategories, {
      errorMessage: '分类加载失败，筛选暂时不可用。',
      logScope: '加载密码列表分类失败',
      onSuccess: (nextCategories) => {
        setCategories(nextCategories)
      },
    })
  }, [runCategoriesTask])

  const loadPasswords = useCallback(async () => {
    await runPasswordsTask(() => getPasswords(selectedCategory || undefined), {
      errorMessage: '密码列表加载失败，请稍后重试。',
      logScope: '加载密码列表失败',
      onSuccess: (nextPasswords) => {
        setPasswords(nextPasswords)
      },
    })
  }, [runPasswordsTask, selectedCategory])

  // 分类只在页面初始化时加载一次。
  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  // 分类筛选变化时重新请求密码列表，避免前后端筛选逻辑不一致。
  useEffect(() => {
    void loadPasswords()
  }, [loadPasswords])

  // 删除成功后直接从本地列表移除，避免再发一次请求。
  async function handleDelete(id: string) {
    if (!confirm('确定要删除这条密码吗?')) return

    setActionError('')

    try {
      await deletePassword(id)
      setPasswords((prev) => prev.filter((password) => password.id !== id))
    } catch (error) {
      logUiError('删除密码失败', error)
      setActionError(getUiErrorMessage(error, '删除失败，请稍后重试。'))
    }
  }

  function retryPasswords() {
    void loadPasswords()
  }

  // 搜索是纯前端过滤，不影响服务端查询条件。
  const filteredPasswords = passwords.filter((password) => {
    const matchesSearch =
      !searchQuery ||
      password.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.notes?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !selectedCategory || password.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  return {
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
  }
}
