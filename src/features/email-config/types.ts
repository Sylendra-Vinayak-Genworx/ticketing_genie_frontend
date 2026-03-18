export interface EmailConfig {
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

export interface EmailConfigForm {
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

export const EMPTY_EMAIL_FORM: EmailConfigForm = {
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
}
