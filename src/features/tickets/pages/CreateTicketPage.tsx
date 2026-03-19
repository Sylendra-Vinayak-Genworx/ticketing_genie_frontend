import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Lock, Paperclip, X } from 'lucide-react'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { useAreasOfConcern } from '@/features/tickets/hooks/useAreasOfConcern'
import { PageHeader } from '@/components/common/PageHeader'
import { createTicketThunk } from '@/features/tickets/slices/ticketsSlice'
import { ticketService } from '@/features/tickets/services/ticketService'
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

interface UploadedFile {
  file: File
  blobPath: string   // raw GCS object path — sent to backend in attachments[]
  uploading: boolean
  error?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_MB = 10

export default function CreateTicketPage() {
  const navigate = useNavigate()
  const { create, isSubmitting } = useTickets()
  const { areas, isLoading: areasLoading } = useAreasOfConcern()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    product: 'bookmyticket',
    environment: 'PROD',
    area_of_concern: '',
    source: 'UI',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

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

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // Reset input so the same file can be re-selected after removal
    e.target.value = ''

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported image type (JPEG, PNG, GIF, WEBP).`)
        continue
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the ${MAX_SIZE_MB} MB size limit.`)
        continue
      }

      // Add a placeholder row while uploading
      const placeholder: UploadedFile = { file, blobPath: '', uploading: true }
      setUploadedFiles(prev => [...prev, placeholder])

      try {
        const result = await ticketService.uploadAttachment(file)
        setUploadedFiles(prev =>
          prev.map(f =>
            // Store blob_path — NOT file_url (which is a signed URL and too long for the DB)
            f.file === file ? { file, blobPath: result.blob_path, uploading: false } : f
          )
        )
      } catch {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.file === file
              ? { file, blobPath: '', uploading: false, error: 'Upload failed' }
              : f
          )
        )
        toast.error(`Failed to upload "${file.name}". Please try again.`)
      }
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const dt = e.dataTransfer
    if (dt.files.length) {
      const fakeEvent = { target: { files: dt.files, value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(fakeEvent)
    }
  }

  function removeFile(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const pendingUploads = uploadedFiles.filter(f => f.uploading)
    if (pendingUploads.length > 0) {
      toast.error('Please wait for all files to finish uploading.')
      return
    }

    const failedUploads = uploadedFiles.filter(f => f.error)
    if (failedUploads.length > 0) {
      toast.error('Remove failed uploads before submitting.')
      return
    }

    // Send blob_path (raw GCS object path) — backend strips and signs on read
    const attachmentUrls = uploadedFiles.map(f => f.blobPath).filter(Boolean)

    const result = await create({
      title: form.title.trim(),
      description: form.description.trim(),
      product: form.product,
      environment: form.environment,
      area_of_concern: form.area_of_concern ? Number(form.area_of_concern) : undefined,
      source: form.source,
      attachments: attachmentUrls,
    })

    if (createTicketThunk.fulfilled.match(result as any)) {
      const ticket = (result as any).payload
      toast.success('Ticket created successfully!')
      navigate(`/tickets/${ticket.ticket_id}`)
    } else {
      toast.error((result as any).payload || 'Failed to create ticket')
    }
  }

  const isAnyUploading = uploadedFiles.some(f => f.uploading)

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

        {/* Product + Source */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product</label>
            <div className="input-field bg-gray-50 text-gray-500 flex items-center justify-between cursor-not-allowed select-none">
              <span>bookmyticket</span>
              <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Attachments
            <span className="text-xs text-gray-400 font-normal ml-2">(JPEG, PNG, GIF, WEBP — max {MAX_SIZE_MB} MB each)</span>
          </label>

          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Paperclip className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Drag & drop images here, or{' '}
              <span className="text-blue-600 font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WEBP — up to 10 MB each</p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Uploaded file list */}
          {uploadedFiles.length > 0 && (
            <ul className="mt-3 space-y-2">
              {uploadedFiles.map((f, i) => (
                <li
                  key={i}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm
                    ${f.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate text-gray-700">{f.file.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      ({(f.file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f.uploading && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    )}
                    {!f.uploading && !f.error && (
                      <span className="text-xs text-green-600 font-medium">Uploaded</span>
                    )}
                    {f.error && (
                      <span className="text-xs text-red-600 font-medium">{f.error}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isAnyUploading}
            className="btn-primary px-6 disabled:opacity-60"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : isAnyUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading files…</>
            ) : (
              'Submit Ticket'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}