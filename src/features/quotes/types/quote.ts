export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface Quote {
  id: string
  studio_id: string
  created_by: string | null
  client_id: string | null
  client_name: string
  client_phone: string | null
  client_email: string | null
  quote_number: string
  title: string
  design_description: string | null
  body_placement: string | null
  style: string | null
  size_cm: string | null
  session_count: number
  design_reference_urls: string[]
  estimated_price: number | null
  deposit_amount: number | null
  price_notes: string | null
  status: QuoteStatus
  valid_until: string | null
  notes: string | null
  whatsapp_reminders_enabled: boolean
  whatsapp_reminder_hours: number[]
  created_at: string
  updated_at: string
}

export interface CreateQuoteInput {
  client_name: string
  client_phone?: string
  client_email?: string
  client_id?: string
  title?: string
  design_description?: string
  body_placement?: string
  style?: string
  size_cm?: string
  session_count?: number
  estimated_price?: number
  deposit_amount?: number
  price_notes?: string
  valid_until?: string
  notes?: string
  whatsapp_reminders_enabled?: boolean
  whatsapp_reminder_hours?: number[]
}

export interface UpdateQuoteInput extends Partial<CreateQuoteInput> {
  status?: QuoteStatus
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
}

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100/80 text-gray-600',
  sent: 'bg-blue-100/80 text-blue-700',
  accepted: 'bg-green-100/80 text-green-700',
  rejected: 'bg-red-100/80 text-red-700',
  expired: 'bg-amber-100/80 text-amber-700',
}

export const TATTOO_STYLES = [
  'Blackwork',
  'Color',
  'Realismo',
  'Geométrico',
  'Japonés',
  'Tradicional',
  'Neo-tradicional',
  'Acuarela',
  'Fineline',
  'Otro',
] as const

export const REMINDER_HOUR_OPTIONS = [
  { value: 72,  label: '72h antes' },
  { value: 48,  label: '48h antes' },
  { value: 24,  label: '24h antes' },
  { value: 12,  label: '12h antes' },
  { value: 2,   label: '2h antes'  },
  { value: 1,   label: '1h antes'  },
] as const
