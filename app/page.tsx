'use client'

import { isAuthenticated } from '@/app/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace(isAuthenticated() ? '/vault' : '/login')
  }, [router])

  return <div className="flex min-h-dvh items-center justify-center text-zinc-500">加载中...</div>
}
