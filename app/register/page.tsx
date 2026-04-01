'use client'

import { isAuthenticated, login, register } from '@/app/lib/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 已登录则跳转到 vault
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/vault')
    }
  }, [router])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      // 校验登录密码
      if (loginPassword.length < 8) {
        setError('登录密码至少8位')
        return
      }

      // 校验确认密码
      if (loginPassword !== confirmPassword) {
        setError('两次输入的登录密码不一致')
        return
      }

      setLoading(true)

      try {
        await register({ email, loginPassword })
        // 注册后自动登录
        await login({ email, password: loginPassword })
        router.push('/vault')
      } catch (err) {
        setError(err instanceof Error ? err.message : '注册失败')
      } finally {
        setLoading(false)
      }
    },
    [email, loginPassword, confirmPassword, router],
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
        <h1 className="mb-6 text-2xl font-semibold">注册</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="loginPassword" className="mb-1 block text-sm font-medium">
              登录密码
            </label>
            <input
              id="loginPassword"
              type="text"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="至少8位"
              required
              minLength={8}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
              确认登录密码
            </label>
            <input
              id="confirmPassword"
              type="text"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入登录密码"
              required
              minLength={8}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email || !loginPassword || !confirmPassword}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          已有账号?{' '}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
            登录
          </Link>
        </p>
      </div>
    </div>
  )
}
