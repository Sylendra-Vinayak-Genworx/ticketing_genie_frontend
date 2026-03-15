import { useState, useCallback, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'
import type { DashboardData } from '@/types'

interface UseAnalyticsParams {
  date_from?: string
  date_to?: string
  product?: string
  enabled?: boolean
}

export function useAnalytics(params?: UseAnalyticsParams) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (params?.enabled === false) return
    setIsLoading(true)
    setIsError(false)
    setError(null)
    try {
      const queryParams: Record<string, any> = {}
      if (params?.date_from) queryParams.date_from = params.date_from
      if (params?.date_to)   queryParams.date_to   = params.date_to
      if (params?.product)   queryParams.product   = params.product
      setData(await analyticsService.getDashboard(queryParams))
    } catch {
      setIsError(true)
      setError('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }, [params?.date_from, params?.date_to, params?.product, params?.enabled])

  useEffect(() => { refetch() }, [refetch])

  return { data, isLoading, isError, error, refetch }
}
