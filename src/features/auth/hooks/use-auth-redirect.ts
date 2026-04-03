'use client'

import { isAuthenticated } from '@/src/features/auth/model/auth-storage'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * 认证页重定向 hook。
 * 已登录用户访问登录/注册页时，直接跳回金库页面。
 */
export function useAuthRedirect(destination: string = '/vault') {
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated()) {
      router.push(destination)
    }
  }, [destination, router])
}
