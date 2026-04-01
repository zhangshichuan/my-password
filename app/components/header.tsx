'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logout } from '@/app/lib/auth'
import type { JWTPayload } from '@/app/lib/types'

interface HeaderProps {
  user: JWTPayload | null
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold">
            <Link href="/vault" className="text-zinc-900 dark:text-zinc-100">
              密码管理器
            </Link>
          </h1>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/vault"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              密码列表
            </Link>
            <Link
              href="/vault/categories"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              分类管理
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            退出
          </button>
        </div>
      </div>
    </header>
  )
}
