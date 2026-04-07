import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// Default to Resend's test sender until a custom domain is verified
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'INKBuddy <onboarding@resend.dev>'
