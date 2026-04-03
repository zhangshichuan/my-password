'use client'

import { login, register } from '@/src/features/auth/api/client'
import { useAuthRedirect } from '@/src/features/auth/hooks/use-auth-redirect'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * 注册页状态和提交流程。
 * 包含登录密码长度校验、确认密码校验和注册后自动登录。
 */
export function useRegisterPage() {
  const router = useRouter()
  useAuthRedirect()

  const [email, setEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (loginPassword.length < 8) {
      setError('登录密码至少8位')
      return
    }

    if (loginPassword !== confirmPassword) {
      setError('两次输入的登录密码不一致')
      return
    }

    setLoading(true)

    try {
      await register({ email, loginPassword })
      await login({ email, password: loginPassword })
      router.push('/vault')
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return {
    confirmPassword,
    email,
    error,
    handleSubmit,
    loading,
    loginPassword,
    setConfirmPassword,
    setEmail,
    setLoginPassword,
  }
}
