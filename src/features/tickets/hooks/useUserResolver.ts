import { useState, useCallback } from 'react'
import { userService } from '@/features/users/services/userService'

/**
 * Maintains a cache of userId → display name.
 * Call `resolve(ids)` with any array of IDs to trigger async fetches
 * for any that aren't already cached.
 */
export function useUserResolver() {
  const [cache, setCache] = useState<Record<string, string>>({})

  const resolve = useCallback((ids: (string | null | undefined)[]) => {
    const filteredIds = ids.filter((id): id is string => !!id)
    const missing = filteredIds.filter(id => !cache[id])
    if (missing.length === 0) return

    missing.forEach(id => {
      userService.getUserById(id)
        .then(u => setCache(c => ({ ...c, [id]: u.full_name || u.email })))
        .catch(() => setCache(c => ({ ...c, [id]: id.slice(0, 8) + '…' })))
    })
  }, [cache])

  return { cache, resolve }
}
