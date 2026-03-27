import { useEffect, useState } from 'react';
import { emailConfigService } from '../services/emailConfigService';
import type { EmailConfig, EmailConfigForm } from '../types';
import { EMPTY_EMAIL_FORM } from '../types';
import toast from 'react-hot-toast';

export function useEmailConfig() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState<EmailConfigForm>(EMPTY_EMAIL_FORM);

  async function loadConfig() {
    setLoading(true);
    try {
      const data = await emailConfigService.getConfig();
      setConfig(data);
      setForm({
        imap_host: data.imap_host,
        imap_port: data.imap_port,
        imap_user: data.imap_user,
        imap_password: '',
        imap_mailbox: data.imap_mailbox,
        smtp_host: data.smtp_host,
        smtp_port: data.smtp_port,
        smtp_user: data.smtp_user,
        smtp_password: '',
        smtp_from_name: data.smtp_from_name,
        is_active: data.is_active,
      });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error.response?.status === 404) {
        toast.error('Email configuration not initialized. Please initialize first.');
      } else {
        toast.error('Failed to load email configuration');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Partial<EmailConfigForm> = {};

      if (form.imap_host) payload.imap_host = form.imap_host;
      if (form.imap_port) payload.imap_port = form.imap_port;
      if (form.imap_user) payload.imap_user = form.imap_user;
      if (form.imap_password) payload.imap_password = form.imap_password;
      if (form.imap_mailbox) payload.imap_mailbox = form.imap_mailbox;

      if (form.smtp_host) payload.smtp_host = form.smtp_host;
      if (form.smtp_port) payload.smtp_port = form.smtp_port;
      if (form.smtp_user) payload.smtp_user = form.smtp_user;
      if (form.smtp_password) payload.smtp_password = form.smtp_password;
      if (form.smtp_from_name) payload.smtp_from_name = form.smtp_from_name;

      payload.is_active = form.is_active;

      const updated = await emailConfigService.updateConfig(payload);
      setConfig(updated);
      setForm((prev) => ({ ...prev, imap_password: '', smtp_password: '' }));
      toast.success('Email configuration updated successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Failed to update email configuration');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(testEmail: string) {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }
    setTesting(true);
    try {
      await emailConfigService.sendTestEmail(testEmail);
      toast.success(`Test email sent to ${testEmail}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  }

  async function handleInitialize() {
    if (!confirm('Initialize email configuration from environment variables?')) return;
    setLoading(true);
    try {
      await emailConfigService.initialize();
      toast.success('Email configuration initialized');
      loadConfig();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Failed to initialize email configuration');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    form,
    setForm,
    loading,
    saving,
    testing,
    loadConfig,
    handleSave,
    handleTest,
    handleInitialize,
  };
}
