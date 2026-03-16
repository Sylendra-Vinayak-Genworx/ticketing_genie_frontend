import { useState, useCallback, useEffect } from 'react'
import { slaService } from '../services/slaService'
import type { SLA } from '@/types'

export function useSLA() {
  const [slas, setSlas] = useState<SLA[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    setError(null)
    try {
      const data = await slaService.listSLAs({ page: 1, page_size: 100 })
      setSlas(data.items)
      setTotal(data.total)
    } catch {
      setIsError(true)
      setError('Failed to load SLA configurations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return { slas, total, isLoading, isError, error, refetch }
}
