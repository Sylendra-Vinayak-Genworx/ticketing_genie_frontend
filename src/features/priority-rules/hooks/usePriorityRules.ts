import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { priorityRuleService } from '../services/priorityRuleService'
import type { PriorityRule, CreatePriorityRuleRequest, UpdatePriorityRuleRequest } from '../types'

export function usePriorityRules() {
  const [rules, setRules] = useState<PriorityRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadRules = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await priorityRuleService.listRules()
      setRules(data)
    } catch {
      toast.error('Failed to load priority rules')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadRules() }, [loadRules])

  const createRule = async (data: CreatePriorityRuleRequest): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await priorityRuleService.createRule(data)
      await loadRules()
      return true
    } catch {
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateRule = async (id: number, data: UpdatePriorityRuleRequest): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await priorityRuleService.updateRule(id, data)
      await loadRules()
      return true
    } catch {
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteRule = async (id: number): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await priorityRuleService.deleteRule(id)
      await loadRules()
      return true
    } catch {
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    rules,
    isLoading,
    isSubmitting,
    createRule,
    updateRule,
    deleteRule,
    reload: loadRules,
  }
}
