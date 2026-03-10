import type { Notification, NotificationProvider } from '../../types/notification'

export const whatsappProvider: NotificationProvider = {
  channel: 'whatsapp',

  async send(notification: Notification) {
    // TODO: Implement WhatsApp Business API integration
    console.log(
      '[WHATSAPP] Integration not configured. Would send:',
      notification.template,
      '| recipient:',
      notification.recipient_id
    )
    return { success: false, error: 'WhatsApp integration not yet configured' }
  },
}
