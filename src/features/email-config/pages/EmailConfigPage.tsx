import React, { useState } from 'react';
import {
  Mail,
  Server,
  Lock,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useEmailConfig } from '../hooks/useEmailConfig';

export default function EmailConfigPage() {
  const {
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
  } = useEmailConfig();

  const [showImapPassword, setShowImapPassword] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Email Configuration" subtitle="Configure IMAP and SMTP settings" />
        <LoadingSpinner fullPage text="Loading configuration..." />
      </div>
    );
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
    );
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
      <div
        className={`card p-4 flex items-center gap-3 ${form.is_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
      >
        {form.is_active ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">Email system is active</p>
              <p className="text-xs text-green-700">
                IMAP polling and SMTP notifications are enabled
              </p>
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
            onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, imap_host: e.target.value }))}
                className="input-field"
                placeholder="imap.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Port</label>
              <input
                type="number"
                value={form.imap_port}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, imap_port: parseInt(e.target.value) }))
                }
                className="input-field"
                placeholder="993"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                value={form.imap_user}
                onChange={(e) => setForm((prev) => ({ ...prev, imap_user: e.target.value }))}
                className="input-field"
                placeholder="support@example.com"
              />
              <p className="text-xs text-gray-400 mt-1">
                Email address to monitor for incoming tickets
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Password</label>
              <div className="relative">
                <input
                  type={showImapPassword ? 'text' : 'password'}
                  value={form.imap_password}
                  onChange={(e) => setForm((prev) => ({ ...prev, imap_password: e.target.value }))}
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
              <p className="text-xs text-gray-400 mt-1">
                Generate an app-specific password from your email provider
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mailbox</label>
              <input
                type="text"
                value={form.imap_mailbox}
                onChange={(e) => setForm((prev) => ({ ...prev, imap_mailbox: e.target.value }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, smtp_host: e.target.value }))}
                className="input-field"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
              <input
                type="number"
                value={form.smtp_port}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, smtp_port: parseInt(e.target.value) }))
                }
                className="input-field"
                placeholder="587"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                value={form.smtp_user}
                onChange={(e) => setForm((prev) => ({ ...prev, smtp_user: e.target.value }))}
                className="input-field"
                placeholder="support@example.com"
              />
              <p className="text-xs text-gray-400 mt-1">Email address to send notifications from</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Password</label>
              <div className="relative">
                <input
                  type={showSmtpPassword ? 'text' : 'password'}
                  value={form.smtp_password}
                  onChange={(e) => setForm((prev) => ({ ...prev, smtp_password: e.target.value }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, smtp_from_name: e.target.value }))}
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
          <p className="font-medium">
            Last updated:{' '}
            {config.updated_at ? new Date(config.updated_at).toLocaleString() : 'Never'}
          </p>
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
              <li>
                Use app-specific passwords from your email provider (not your regular password)
              </li>
              <li>For Gmail: Enable 2FA, then generate an app password in Security settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
