import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { ticketService } from '../services/ticketService'

export interface AreaOfConcern {
  area_id: number
  name: string
}

export function useAreasOfConcern() {
  const [areas, setAreas] = useState<AreaOfConcern[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ticketService.getAreasOfConcern()
      .then(setAreas)
      .catch(() => toast.error('Failed to load areas of concern'))
      .finally(() => setIsLoading(false))
  }, [])

  return { areas, isLoading }
}
