import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Lock, Paperclip, X, CheckCircle } from 'lucide-react'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { useAreasOfConcern } from '@/features/tickets/hooks/useAreasOfConcern'
import { PageHeader } from '@/components/common/PageHeader'
import toast from 'react-hot-toast'
import type { Environment, Ticket } from '@/types'

import { SimilarTicketsPanel } from '@/features/tickets/components/SimilarTicketsPanel'
import { useCreateTicketForm } from '@/features/tickets/hooks/useCreateTicketForm'
import { useTicketAttachments } from '@/features/tickets/hooks/useTicketAttachments'
import { useSimilarTicketsSearch } from '@/features/tickets/hooks/useSimilarTicketsSearch'
import { useTicketSubmission } from '@/features/tickets/hooks/useTicketSubmission'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB } from '@/features/tickets/utils/constants'

export default function CreateTicketPage() {
  const navigate = useNavigate()
  const { create, isSubmitting } = useTickets()
  const { areas, isLoading: areasLoading } = useAreasOfConcern()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { form, errors, setFormField: set, validateForm, clearDraft } = useCreateTicketForm()
  
  const { 
    uploadedFiles, 
    handleFileSelect, 
    removeFile, 
    isAnyUploading, 
    hasUploadErrors 
  } = useTicketAttachments()

  const {
    similarTickets,
    loadingSimilar,
    solutionFound,
    handleSolutionFound,
  } = useSimilarTicketsSearch(form.title, form.description)

  const { handleFileInputChange, handleDrop, handleSubmit } = useTicketSubmission({
    create,
    form,
    validateForm,
    clearDraft,
    isAnyUploading,
    hasUploadErrors,
    uploadedFiles,
    handleFileSelect,
  })

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
            </select>
          </div>

          {/* Area of Concern */}
          <div>
            <label htmlFor="area_of_concern" className="block text-sm font-medium text-gray-700 mb-1">
              Issue Type<span className="text-red-500">*</span>
            </label>
            <select
              id="area_of_concern"
              value={form.area_of_concern}
              onChange={e => set('area_of_concern', e.target.value)}
              disabled={areasLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select an issue type </option>
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
                JPEG, PNG, GIF, WEBP • Max {MAX_FILE_SIZE_MB}MB each
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_FILE_TYPES.join(',')}
                onChange={handleFileInputChange}
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