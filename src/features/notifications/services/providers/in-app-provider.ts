import type { Notification, NotificationProvider } from '../../types/notification'

export const inAppProvider: NotificationProvider = {
  channel: 'in_app',

  async send(_notification: Notification) {
    // In-app notifications are delivered by reading from the DB.
    // The record is already inserted before this provider is called,
    // so no additional transport is needed here.
    return { success: true }
  },
}
