'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, isAuthenticated } from '@/app/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      setLoading(true)

      try {
        await login({ email, password })
        router.push('/vault')
      } catch (err) {
        setError(err instanceof Error ? err.message : '登录失败')
      } finally {
        setLoading(false)
      }
    },
    [email, password, router],
  )

  return (
    <div className="flex items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Logo 和标题 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">MyPassword</h1>
          <p className="mt-2 text-sm text-zinc-500">您的私人密码管理器</p>
        </div>

        {/* 登录表单 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">登录账号</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 transition-colors focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                登录密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入登录密码"
                required
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 transition-colors focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            还没有账号?{' '}
            <Link href="/register" className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
