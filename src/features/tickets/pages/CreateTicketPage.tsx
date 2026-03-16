import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Paperclip, ChevronLeft, Lock } from 'lucide-react'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { useAreasOfConcern } from '@/features/tickets/hooks/useAreasOfConcern'
import { PageHeader } from '@/components/common/PageHeader'
import { createTicketThunk } from '@/features/tickets/slices/ticketsSlice'
import toast from 'react-hot-toast'
import type { Environment } from '@/types'

interface FormData {
  title: string
  description: string
  product: string
  environment: Environment
  area_of_concern: string
  source: 'UI' | 'EMAIL'
}

interface FormErrors {
  title?: string
  description?: string
}

export default function CreateTicketPage() {
  const navigate = useNavigate()
  const { create, isSubmitting } = useTickets()
  const { areas, isLoading: areasLoading } = useAreasOfConcern()

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    product: 'bookmyticket',
    environment: 'PROD',
    area_of_concern: '',
    source: 'UI',               // fixed default — always Manual Assign for portal
  })
  const [errors, setErrors] = useState<FormErrors>({})

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key as keyof FormErrors]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.title.trim() || form.title.length < 3)
      e.title = 'Title must be at least 3 characters'
    if (!form.description.trim() || form.description.length < 10)
      e.description = 'Description must be at least 10 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const result = await create({
      title: form.title.trim(),
      description: form.description.trim(),
      product: form.product,
      environment: form.environment,
      area_of_concern: form.area_of_concern ? Number(form.area_of_concern) : undefined,
      source: form.source,
    })

    if (createTicketThunk.fulfilled.match(result as any)) {
      const ticket = (result as any).payload
      toast.success('Ticket created successfully!')
      navigate(`/tickets/${ticket.ticket_id}`)
    } else {
      toast.error((result as any).payload || 'Failed to create ticket')
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Create New Ticket"
        subtitle="Fill in the details below to submit a support ticket"
        actions={
          <button onClick={() => navigate(-1)} className="btn-ghost">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      <form onSubmit={handleSubmit} noValidate className="card p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Brief description of the issue…"
            className={`input-field ${errors.title ? 'input-error' : ''}`}
            maxLength={500}
          />
          <div className="flex justify-between mt-1">
            {errors.title ? <p className="text-xs text-red-600">{errors.title}</p> : <span />}
            <span className="text-xs text-gray-400">{form.title.length}/500</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe the issue in detail. Include steps to reproduce, expected behavior, actual behavior…"
            rows={6}
            className={`input-field resize-y ${errors.description ? 'input-error' : ''}`}
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
        </div>

        {/* Product + Source — two fixed read-only fields side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product
            </label>
            <div className="input-field bg-gray-50 text-gray-500 flex items-center justify-between cursor-not-allowed select-none">
              <span>bookmyticket</span>
              <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Source
            </label>
            <div className="input-field bg-gray-50 text-gray-500 flex items-center justify-between cursor-not-allowed select-none">
              <span>Manual Assign</span>
              <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Portal-submitted tickets</p>
          </div>
        </div>

        {/* Area of Concern */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Type</label>
          <select
            value={form.area_of_concern}
            onChange={(e) => set('area_of_concern', e.target.value)}
            className="input-field"
            disabled={areasLoading}
          >
            <option value="">{areasLoading ? 'Loading…' : 'Select the issue type…'}</option>
            {areas.map(a => <option key={a.area_id} value={a.area_id}>{a.name}</option>)}
          </select>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachments</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
            <Paperclip className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Drag & drop files here, or{' '}
              <span className="text-blue-600 font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF, logs up to 10MB</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary px-6">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}