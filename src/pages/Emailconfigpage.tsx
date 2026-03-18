import React, { useEffect, useState } from 'react'
import { Mail, Server, Lock, Save, TestTube2, Loader2, CheckCircle, XCircle, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { ticketingApi } from '@/lib/axios'

interface EmailConfig {
  config_id: number
  imap_host: string
  imap_port: number
  imap_user: string
  imap_mailbox: string
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_from_name: string
  is_active: boolean
  created_at: string
  updated_at: string
  updated_by: string | null
}

interface EmailConfigForm {
  imap_host: string
  imap_port: number
  imap_user: string
  imap_password: string
  imap_mailbox: string
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password: string
  smtp_from_name: string
  is_active: boolean
}

export default function EmailConfigPage() {
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  
  const [form, setForm] = useState<EmailConfigForm>({
    imap_host: '',
    imap_port: 993,
    imap_user: '',
    imap_password: '',
    imap_mailbox: 'INBOX',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_from_name: 'Support Team',
    is_active: true,
  })

  const [showImapPassword, setShowImapPassword] = useState(false)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  async function loadConfig() {
    setLoading(true)
    try {
      const res = await ticketingApi.get<EmailConfig>('/admin/email-config')
      setConfig(res.data)
      
      // Populate form (passwords will be empty)
      setForm({
        imap_host: res.data.imap_host,
        imap_port: res.data.imap_port,
        imap_user: res.data.imap_user,
        imap_password: '', // Never returned from API
        imap_mailbox: res.data.imap_mailbox,
        smtp_host: res.data.smtp_host,
        smtp_port: res.data.smtp_port,
        smtp_user: res.data.smtp_user,
        smtp_password: '', // Never returned from API
        smtp_from_name: res.data.smtp_from_name,
        is_active: res.data.is_active,
      })
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error('Email configuration not initialized. Please initialize first.')
      } else {
        toast.error('Failed to load email configuration')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Only send fields that have values (don't overwrite passwords with empty strings)
      const payload: any = {}
      
      if (form.imap_host) payload.imap_host = form.imap_host
      if (form.imap_port) payload.imap_port = form.imap_port
      if (form.imap_user) payload.imap_user = form.imap_user
      if (form.imap_password) payload.imap_password = form.imap_password
      if (form.imap_mailbox) payload.imap_mailbox = form.imap_mailbox
      
      if (form.smtp_host) payload.smtp_host = form.smtp_host
      if (form.smtp_port) payload.smtp_port = form.smtp_port
      if (form.smtp_user) payload.smtp_user = form.smtp_user
      if (form.smtp_password) payload.smtp_password = form.smtp_password
      if (form.smtp_from_name) payload.smtp_from_name = form.smtp_from_name
      
      payload.is_active = form.is_active

      const res = await ticketingApi.patch<EmailConfig>('/admin/email-config', payload)
      setConfig(res.data)
      
      // Clear password fields after successful save
      setForm(prev => ({
        ...prev,
        imap_password: '',
        smtp_password: '',
      }))
      
      toast.success('Email configuration updated successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update email configuration')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    if (!testEmail) {
      toast.error('Please enter a test email address')
      return
    }

    setTesting(true)
    try {
      await ticketingApi.post('/admin/email-config/test', { test_email: testEmail })
      toast.success(`Test email sent to ${testEmail}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send test email')
    } finally {
      setTesting(false)
    }
  }

  async function handleInitialize() {
    if (!confirm('Initialize email configuration from environment variables?')) return
    
    setLoading(true)
    try {
      const res = await ticketingApi.post<EmailConfig>('/admin/email-config/initialize')
      setConfig(res.data)
      toast.success('Email configuration initialized')
      loadConfig()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to initialize email configuration')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Email Configuration" subtitle="Configure IMAP and SMTP settings" />
        <LoadingSpinner fullPage text="Loading configuration..." />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="space-y-5">
        <PageHeader title="Email Configuration" subtitle="Configure IMAP and SMTP settings" />
        <div className="card p-8 text-center">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Configuration Found</h3>
          <p className="text-gray-500 mb-6">Initialize email configuration to get started</p>
          <button onClick={handleInitialize} className="btn-primary">
            <RefreshCw className="w-4 h-4" />
            Initialize Configuration
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Email Configuration"
        subtitle="Configure support email and app password for IMAP/SMTP"
        actions={
          <button onClick={loadConfig} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {/* Status Banner */}
      <div className={`card p-4 flex items-center gap-3 ${form.is_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        {form.is_active ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">Email system is active</p>
              <p className="text-xs text-green-700">IMAP polling and SMTP notifications are enabled</p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Email system is disabled</p>
              <p className="text-xs text-red-700">Email ingestion and notifications are paused</p>
            </div>
          </>
        )}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Enable</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* IMAP Configuration */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">IMAP Configuration</h3>
              <p className="text-xs text-gray-500">Inbound email ingestion</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Host</label>
              <input
                type="text"
                value={form.imap_host}
                onChange={(e) => setForm(prev => ({ ...prev, imap_host: e.target.value }))}
                className="input-field"
                placeholder="imap.gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Port</label>
              <input
                type="number"
                value={form.imap_port}
                onChange={(e) => setForm(prev => ({ ...prev, imap_port: parseInt(e.target.value) }))}
                className="input-field"
                placeholder="993"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                value={form.imap_user}
                onChange={(e) => setForm(prev => ({ ...prev, imap_user: e.target.value }))}
                className="input-field"
                placeholder="support@example.com"
              />
              <p className="text-xs text-gray-400 mt-1">Email address to monitor for incoming tickets</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Password</label>
              <div className="relative">
                <input
                  type={showImapPassword ? "text" : "password"}
                  value={form.imap_password}
                  onChange={(e) => setForm(prev => ({ ...prev, imap_password: e.target.value }))}
                  className="input-field pr-10"
                  placeholder="Leave empty to keep current password"
                />
                <button
                  type="button"
                  onClick={() => setShowImapPassword(!showImapPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                >
                  {showImapPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Generate an app-specific password from your email provider</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mailbox</label>
              <input
                type="text"
                value={form.imap_mailbox}
                onChange={(e) => setForm(prev => ({ ...prev, imap_mailbox: e.target.value }))}
                className="input-field"
                placeholder="INBOX"
              />
            </div>
          </div>
        </div>

        {/* SMTP Configuration */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 bg-purple-50 border-b border-purple-100 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">SMTP Configuration</h3>
              <p className="text-xs text-gray-500">Outbound email notifications</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
              <input
                type="text"
                value={form.smtp_host}
                onChange={(e) => setForm(prev => ({ ...prev, smtp_host: e.target.value }))}
                className="input-field"
                placeholder="smtp.gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
              <input
                type="number"
                value={form.smtp_port}
                onChange={(e) => setForm(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                className="input-field"
                placeholder="587"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                value={form.smtp_user}
                onChange={(e) => setForm(prev => ({ ...prev, smtp_user: e.target.value }))}
                className="input-field"
                placeholder="support@example.com"
              />
              <p className="text-xs text-gray-400 mt-1">Email address to send notifications from</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Password</label>
              <div className="relative">
                <input
                  type={showSmtpPassword ? "text" : "password"}
                  value={form.smtp_password}
                  onChange={(e) => setForm(prev => ({ ...prev, smtp_password: e.target.value }))}
                  className="input-field pr-10"
                  placeholder="Leave empty to keep current password"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                >
                  {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
              <input
                type="text"
                value={form.smtp_from_name}
                onChange={(e) => setForm(prev => ({ ...prev, smtp_from_name: e.target.value }))}
                className="input-field"
                placeholder="Support Team"
              />
              <p className="text-xs text-gray-400 mt-1">Display name for outgoing emails</p>
            </div>
          </div>
        </div>
      </div>


      {/* Save Button */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="text-sm text-gray-600">
          <p className="font-medium">Last updated: {config.updated_at ? new Date(config.updated_at).toLocaleString() : 'Never'}</p>
          {config.updated_by && <p className="text-xs text-gray-400">By: {config.updated_by}</p>}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configuration
        </button>
      </div>

      {/* Help Text */}
      <div className="card p-5 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-2">Security Notes</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Use app-specific passwords from your email provider (not your regular password)</li>
              <li>For Gmail: Enable 2FA, then generate an app password in Security settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}