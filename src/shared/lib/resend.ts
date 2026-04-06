import { Resend } from 'resend'

// Singleton client — only instantiated server-side
export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'INKBuddy <noreply@inkbuddy.app>'
