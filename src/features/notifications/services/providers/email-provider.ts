import type { Notification, NotificationProvider } from '../../types/notification'

export const emailProvider: NotificationProvider = {
  channel: 'email',

  async send(notification: Notification) {
    // TODO: Implement with Supabase Edge Function or Resend
    void notification
    return { success: true }
  },
}
