'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getUiErrorMessage, logUiError } from '@/src/features/vault/utils/ui-feedback'

interface AsyncTaskOptions<TResult> {
  errorMessage?: string
  logScope: string
  onError?: (error: unknown) => void
  onSuccess?: (result: TResult) => void
}

/**
 * 统一处理页面级异步状态。
 * 负责 loading/error、异常日志，以及卸载后的安全 setState。
 */
export function useAsyncStatus(initialLoading = false) {
  const [loading, setLoadingState] = useState(initialLoading)
  const [error, setErrorState] = useState('')
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  const safely = useCallback((update: () => void) => {
    if (mountedRef.current) {
      update()
    }
  }, [])

  const setLoading = useCallback(
    (nextLoading: boolean) => {
      safely(() => {
        setLoadingState(nextLoading)
      })
    },
    [safely],
  )

  const setError = useCallback(
    (nextError: string) => {
      safely(() => {
        setErrorState(nextError)
      })
    },
    [safely],
  )

  const clearError = useCallback(() => {
    setError('')
  }, [setError])

  const run = useCallback(
    async <TResult>(task: () => Promise<TResult>, options: AsyncTaskOptions<TResult>): Promise<TResult | null> => {
      setLoading(true)
      clearError()

      try {
        const result = await task()
        safely(() => {
          options.onSuccess?.(result)
        })
        return result
      } catch (error) {
        logUiError(options.logScope, error)
        safely(() => {
          if (options.errorMessage) {
            setErrorState(getUiErrorMessage(error, options.errorMessage))
          }
          options.onError?.(error)
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [clearError, safely, setLoading],
  )

  return useMemo(
    () => ({
      clearError,
      error,
      loading,
      run,
      setError,
      setLoading,
    }),
    [clearError, error, loading, run, setError, setLoading],
  )
}
