'use client'

/**
 * 页面头部组件
 * 包含导航菜单和用户退出功能
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logout } from '@/src/features/auth'
import { useMasterKey } from '@/src/features/vault/hooks/use-master-key'
import type { JWTPayload } from '@/src/shared/types'

// 组件属性接口
interface HeaderProps {
  user: JWTPayload | null // 当前用户信息
}

/**
 * 页面头部组件
 * 显示 Logo、导航链接、用户邮箱和退出按钮
 */
export default function Header({ user }: HeaderProps) {
  const router = useRouter()
  const { clearMasterKey } = useMasterKey()

  /**
   * 处理退出登录
   * 清除 token 并跳转到登录页
   */
  const handleLogout = () => {
    clearMasterKey()
    logout()
    router.push('/login')
  }

  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        {/* 左侧：Logo 和导航 */}
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
        {/* 右侧：用户信息和退出按钮 */}
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
