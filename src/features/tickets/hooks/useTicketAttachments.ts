import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { UploadedFile } from '../types'
import { ticketService } from '../services/ticketService'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB } from '../utils/constants'

export function useTicketAttachments() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleFileSelect = useCallback(async (files: File[]) => {
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported image type (JPEG, PNG, GIF, WEBP).`)
        continue
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB} MB size limit.`)
        continue
      }

      const placeholder: UploadedFile = { file, blobPath: '', uploading: true }
      setUploadedFiles(prev => [...prev, placeholder])

      try {
        const result = await ticketService.uploadAttachment(file)
        setUploadedFiles(prev =>
          prev.map(f =>
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
  }, [])

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const isAnyUploading = uploadedFiles.some(f => f.uploading)
  const hasUploadErrors = uploadedFiles.some(f => f.error)

  return {
    uploadedFiles,
    handleFileSelect,
    removeFile,
    isAnyUploading,
    hasUploadErrors,
  }
}
