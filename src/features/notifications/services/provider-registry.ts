import type {
  NotificationChannel,
  NotificationProvider,
  Notification,
} from '../types/notification'
import { emailProvider } from './providers/email-provider'
import { whatsappProvider } from './providers/whatsapp-provider'
import { inAppProvider } from './providers/in-app-provider'

// Provider Registry (Strategy Pattern)
const PROVIDERS: Record<string, NotificationProvider> = {
  email: emailProvider,
  whatsapp: whatsappProvider,
  in_app: inAppProvider,
}

export function getProviderForChannel(channel: NotificationChannel): NotificationProvider {
  const provider = PROVIDERS[channel]

  if (!provider) {
    // Fallback: log-only provider for unimplemented channels (e.g. push)
    return {
      channel,
      async send(notification: Notification) {
        // Provider not implemented — silently return error
        return { success: false, error: `Provider for channel '${channel}' not implemented` }
      },
    }
  }

  return provider
}
