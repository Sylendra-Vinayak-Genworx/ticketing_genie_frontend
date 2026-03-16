import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { keywordService } from '../services/keywordService'
import type { KeywordRule, CreateKeywordRuleRequest, UpdateKeywordRuleRequest } from '@/types'

export function useKeywords() {
  const [rules, setRules] = useState<KeywordRule[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadRules = useCallback(async (p: number = page) => {
    setIsLoading(true)
    try {
      const data = await keywordService.listRules({ page: p, page_size: 20 })
      setRules(data.items)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load keyword rules')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => { loadRules(page) }, [page])

  const createRule = async (data: CreateKeywordRuleRequest): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await keywordService.createRule(data)
      await loadRules(page)
      return true
    } catch {
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateRule = async (id: number, data: UpdateKeywordRuleRequest): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await keywordService.updateRule(id, data)
      await loadRules(page)
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
      await keywordService.deleteRule(id)
      await loadRules(page)
      return true
    } catch {
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleActive = async (rule: KeywordRule): Promise<void> => {
    try {
      await keywordService.updateRule(rule.keyword_rule_id, { is_active: !rule.is_active })
      setRules(prev => prev.map(r =>
        r.keyword_rule_id === rule.keyword_rule_id ? { ...r, is_active: !r.is_active } : r
      ))
    } catch {
      toast.error('Failed to toggle rule')
    }
  }

  return {
    rules, total, page, setPage,
    isLoading, isSubmitting,
    createRule, updateRule, deleteRule, toggleActive,
    reload: loadRules,
  }
}
