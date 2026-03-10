import type { Notification, NotificationProvider } from '../../types/notification'

export const emailProvider: NotificationProvider = {
  channel: 'email',

  async send(notification: Notification) {
    // TODO: Implement with Supabase Edge Function or Resend
    console.log(
      '[EMAIL] Would send:',
      notification.template,
      'to:',
      notification.recipient_id,
      '| payload:',
      notification.payload
    )
    return { success: true }
  },
}
