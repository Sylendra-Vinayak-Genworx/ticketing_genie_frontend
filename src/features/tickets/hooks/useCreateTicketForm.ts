import { useState, useEffect, useCallback } from 'react'
import type { CreateTicketFormData, CreateTicketFormErrors } from '../types'

const LOCAL_STORAGE_KEY = 'create_ticket_draft'

export function useCreateTicketForm() {
  const [form, setForm] = useState<CreateTicketFormData>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved ticket draft', e)
      }
    }
    return {
      title: '',
      description: '',
      product: 'bookmyticket',
      environment: 'PROD',
      area_of_concern: '',
      source: 'UI',
    }
  })

  const [errors, setErrors] = useState<CreateTicketFormErrors>({})

  // Auto-save effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(form))
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [form])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }, [])

  const setFormField = useCallback(<K extends keyof CreateTicketFormData>(key: K, value: CreateTicketFormData[K]) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => {
      if (e[key as keyof CreateTicketFormErrors]) {
        return { ...e, [key]: undefined }
      }
      return e
    })
  }, [])

  const validateForm = useCallback((): boolean => {
    const e: CreateTicketFormErrors = {}
    if (!form.title.trim() || form.title.length < 3)
      e.title = 'Title must be at least 3 characters'
    if (!form.description.trim() || form.description.length < 10)
      e.description = 'Description must be at least 10 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [form])

  return {
    form,
    errors,
    setFormField,
    validateForm,
    clearDraft,
  }
}
