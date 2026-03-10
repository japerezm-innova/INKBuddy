export type NotificationChannel = 'email' | 'whatsapp' | 'push' | 'in_app'
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered'
export type RecipientType = 'client' | 'artist' | 'owner'

export type NotificationTemplate =
  | 'booking_confirmation'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'stock_alert'
  | 'new_booking_request'
  | 'task_assigned'

export interface Notification {
  id: string
  studio_id: string
  recipient_type: RecipientType
  recipient_id: string
  channel: NotificationChannel
  template: NotificationTemplate
  payload: Record<string, unknown>
  status: NotificationStatus
  scheduled_for: string | null
  sent_at: string | null
  error_message: string | null
  created_at: string
}

export interface CreateNotificationInput {
  recipient_type: RecipientType
  recipient_id: string
  channel: NotificationChannel
  template: NotificationTemplate
  payload: Record<string, unknown>
  scheduled_for?: string
}

export interface NotificationProvider {
  channel: NotificationChannel
  send(notification: Notification): Promise<{ success: boolean; error?: string }>
}

export interface SendResult {
  success: boolean
  error?: string
}
