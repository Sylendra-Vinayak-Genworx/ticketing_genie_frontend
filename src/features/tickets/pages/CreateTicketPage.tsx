import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Lock, Paperclip, X, CheckCircle } from 'lucide-react'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { useAreasOfConcern } from '@/features/tickets/hooks/useAreasOfConcern'
import { PageHeader } from '@/components/common/PageHeader'
import { createTicketThunk } from '@/features/tickets/slices/ticketsSlice'
import { ticketService } from '@/features/tickets/services/ticketService'
import toast from 'react-hot-toast'
import type { Environment, Ticket } from '@/types'

// NEW: Import similarity search
import { similarityService, SimilarTicket } from '@/features/tickets/services/similarityService'
import { SimilarTicketsPanel } from '@/components/common/SimilarTicketsPanel'
import debounce from 'lodash/debounce'

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

  // NEW: Similarity search state
  const [similarTickets, setSimilarTickets] = useState<SimilarTicket[]>([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [solutionFound, setSolutionFound] = useState(false)

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

  // NEW: Debounced similarity search
  const searchSimilarTickets = useCallback(
    debounce(async (searchText: string) => {
      if (searchText.trim().length < 10) {
        setSimilarTickets([])
        return
      }

      setLoadingSimilar(true)
      try {
        const response = await similarityService.searchSimilar(searchText, 5, 0.3)
        setSimilarTickets(response.similar_tickets)
        
        if (response.found_count > 0) {
          console.log(`✓ Found ${response.found_count} similar tickets`)
        }
      } catch (error) {
        console.error('Similarity search failed:', error)
        setSimilarTickets([])
      } finally {
        setLoadingSimilar(false)
      }
    }, 1000),
    []
  )

  // NEW: Trigger search when form changes
  useEffect(() => {
    const combinedText = `${form.title} ${form.description}`.trim()
    if (combinedText.length >= 10) {
      searchSimilarTickets(combinedText)
    } else {
      setSimilarTickets([])
    }
  }, [form.title, form.description, searchSimilarTickets])

  // NEW: Handle when user finds solution
  const handleSolutionFound = () => {
    setSolutionFound(true)
    toast.success('Great! The solution helped. No need to create a ticket. 🎉', {
      duration: 4000,
    })
    setTimeout(() => {
      navigate('/tickets')
    }, 2000)
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

    // FIX: Properly type check the Redux action result
    // The result is a Redux action with meta and payload
    if (result && 'meta' in result && result.meta.requestStatus === 'fulfilled') {
      const ticket = result.payload as Ticket
      toast.success('Ticket created successfully!')
      navigate(`/tickets/${ticket.ticket_id}`)
    }
  }

  const isAnyUploading = uploadedFiles.some(f => f.uploading)

  return (
    <div>
      <PageHeader
        title="Create New Ticket"
      />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief description of the issue"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={6}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Provide detailed information about the issue..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* NEW: Similar Tickets Panel */}
          {!solutionFound && (
            <SimilarTicketsPanel
              similarTickets={similarTickets}
              isLoading={loadingSimilar}
              onSolutionFound={handleSolutionFound}
            />
          )}

          {/* NEW: Solution Found Message */}
          {solutionFound && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-green-900">
                    Solution Found!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    We're glad the solution helped. No need to create a ticket. Redirecting...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Product */}
          <div>
            <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              id="product"
              value={form.product}
              onChange={e => set('product', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="bookmyticket">BookMyTicket</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Environment */}
          <div>
            <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">
              Environment <span className="text-red-500">*</span>
            </label>
            <select
              id="environment"
              value={form.environment}
              onChange={e => set('environment', e.target.value as Environment)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="PROD">Production</option>
              <option value="STAGE">Staging</option>
              <option value="DEV">Development</option>
            </select>
          </div>

          {/* Area of Concern */}
          <div>
            <label htmlFor="area_of_concern" className="block text-sm font-medium text-gray-700 mb-1">
              Area of Concern
            </label>
            <select
              id="area_of_concern"
              value={form.area_of_concern}
              onChange={e => set('area_of_concern', e.target.value)}
              disabled={areasLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select an area (optional)</option>
              {areas.map(area => (
                <option key={area.area_id} value={area.area_id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Optional)
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag & drop images here, or click to select
              </p>
              <p className="text-xs text-gray-500 mb-3">
                JPEG, PNG, GIF, WEBP • Max {MAX_SIZE_MB}MB each
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Select Files
              </button>
            </div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {f.file.name}
                    </span>
                    {f.uploading && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                    )}
                    {!f.uploading && !f.error && (
                      <span className="text-xs text-green-600 mr-2">✓</span>
                    )}
                    {f.error && (
                      <span className="text-xs text-red-600 mr-2">✗ Failed</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="px-6 py-2 text-gray-700 hover:text-gray-900"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isAnyUploading || solutionFound}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : solutionFound ? (
                'Solution Found - No Ticket Needed'
              ) : (
                'Create Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}