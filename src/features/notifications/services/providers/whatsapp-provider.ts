import type { Notification, NotificationProvider } from '../../types/notification'

export const whatsappProvider: NotificationProvider = {
  channel: 'whatsapp',

  async send(notification: Notification) {
    // TODO: Implement WhatsApp Business API integration
    void notification
    return { success: false, error: 'WhatsApp integration not yet configured' }
  },
}
