import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'in-v3.mailjet.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const FROM_EMAIL = process.env.SMTP_FROM ?? 'INKBuddy <noreply@InkBuddy.com>'

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[INKBuddy] SMTP credentials not set — skipping email')
    return { success: false, error: 'SMTP not configured' }
  }

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    console.log('[INKBuddy] Email sent:', info.messageId, 'to:', params.to)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[INKBuddy] Email failed:', message)
    return { success: false, error: message }
  }
}
