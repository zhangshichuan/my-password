'use client'

import { login } from '@/app/lib/auth'
import { useAuthRedirect } from '@/app/lib/use-auth-redirect'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * 登录页状态和提交流程。
 * 页面组件只负责渲染表单，这里负责提交、错误和跳转。
 */
export function useLoginPage() {
  const router = useRouter()
  useAuthRedirect()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      router.push('/vault')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return {
    email,
    error,
    handleSubmit,
    loading,
    password,
    setEmail,
    setPassword,
  }
}
