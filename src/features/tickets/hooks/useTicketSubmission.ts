import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Ticket, CreateTicketRequest, CreateTicketFormData } from '@/types';


interface UseTicketSubmissionArgs {
  create: (
    payload: CreateTicketRequest
  ) => Promise<{ meta: { requestStatus: string }; payload: Ticket } | any>;
  form: CreateTicketFormData;
  validateForm: () => boolean;
  clearDraft: () => void;
  isAnyUploading: boolean;
  hasUploadErrors: boolean;
  uploadedFiles: { blobPath: string }[];
  handleFileSelect: (files: File[]) => void;
}

export function useTicketSubmission({
  create,
  form,
  validateForm,
  clearDraft,
  isAnyUploading,
  hasUploadErrors,
  uploadedFiles,
  handleFileSelect,
}: UseTicketSubmissionArgs) {
  const navigate = useNavigate();

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    handleFileSelect(files);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt.files.length) {
      handleFileSelect(Array.from(dt.files));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    if (isAnyUploading) {
      toast.error('Please wait for all files to finish uploading.');
      return;
    }

    if (hasUploadErrors) {
      toast.error('Remove failed uploads before submitting.');
      return;
    }

    const attachmentUrls = uploadedFiles.map((f: any) => f.blobPath).filter(Boolean);

    const result = (await create({
      title: form.title.trim(),
      description: form.description.trim(),
      product: form.product,
      environment: form.environment,
      area_of_concern: form.area_of_concern ? Number(form.area_of_concern) : undefined,
      source: form.source,
      attachments: attachmentUrls,
    })) as { meta?: { requestStatus?: string }; payload?: Ticket };
 
    if (result?.meta?.requestStatus === 'fulfilled' && result.payload) {
      clearDraft();
      const ticket = result.payload;
      toast.success('Ticket created successfully!');
      navigate(`/tickets/${ticket.ticket_id}`);
    }
  }

  return { handleFileInputChange, handleDrop, handleSubmit };
}
