'use client'

import { deletePassword, getCategories, getPasswords } from '@/app/lib/api'
import type { Category, Password } from '@/app/lib/types'
import { useEffect, useState } from 'react'

/**
 * 密码库列表页状态 hook。
 * 负责分类/密码加载、搜索筛选和删除后的本地同步。
 */
export function useVaultPageState() {
  const [passwords, setPasswords] = useState<Password[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // 分类只在页面初始化时加载一次。
  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      try {
        const nextCategories = await getCategories()
        if (!cancelled) {
          setCategories(nextCategories)
        }
      } catch (error) {
        console.error('加载分类失败', error)
      }
    }

    loadCategories()

    return () => {
      cancelled = true
    }
  }, [])

  // 分类筛选变化时重新请求密码列表，避免前后端筛选逻辑不一致。
  useEffect(() => {
    let cancelled = false

    async function loadPasswords() {
      setLoading(true)

      try {
        const nextPasswords = await getPasswords(selectedCategory || undefined)
        if (!cancelled) {
          setPasswords(nextPasswords)
        }
      } catch (error) {
        console.error('加载密码失败', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPasswords()

    return () => {
      cancelled = true
    }
  }, [selectedCategory])

  // 删除成功后直接从本地列表移除，避免再发一次请求。
  async function handleDelete(id: string) {
    if (!confirm('确定要删除这条密码吗?')) return

    try {
      await deletePassword(id)
      setPasswords((prev) => prev.filter((password) => password.id !== id))
    } catch {
      alert('删除失败')
    }
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
    categories,
    filteredPasswords,
    handleDelete,
    loading,
    passwords,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
  }
}
