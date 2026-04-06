import type { Appointment } from '@/features/appointments/types/appointment'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return ''
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount)
}

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 560px;
  margin: 0 auto;
  background: #fff;
  color: #1a1a2e;
`

// ---------------------------------------------------------------------------
// Owner notification email
// ---------------------------------------------------------------------------

export function buildOwnerNotificationEmail(
  appointment: Appointment & {
    artist?: { id: string; full_name: string | null } | null
    service?: { id: string; name: string; duration_minutes: number } | null
  },
  studioName: string
): { subject: string; html: string } {
  const clientName = appointment.client_name ?? 'Cliente sin nombre'
  const dateStr = formatDate(appointment.starts_at)
  const startTime = formatTime(appointment.starts_at)
  const endTime = formatTime(appointment.ends_at)
  const artistName = appointment.artist?.full_name ?? 'Sin asignar'
  const serviceName = appointment.service?.name ?? 'Sesión de tatuaje'

  const subject = `Nueva cita: ${clientName} - ${dateStr}`

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:20px;background:#f5f5f5;">
<div style="${BASE_STYLES}padding:32px;border-radius:16px;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#f7931e);padding:12px 24px;border-radius:100px;">
      <span style="color:white;font-weight:700;font-size:18px;">INKBuddy</span>
    </div>
  </div>

  <h1 style="font-size:20px;font-weight:700;margin:0 0 4px 0;color:#1a1a2e;">
    🗓️ Nueva cita agendada
  </h1>
  <p style="color:#666;font-size:14px;margin:0 0 24px 0;">${studioName}</p>

  <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin-bottom:20px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;width:40%;">Cliente</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;">${clientName}</td>
      </tr>
      ${appointment.client_phone ? `
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Teléfono</td>
        <td style="padding:8px 0;font-size:13px;">${appointment.client_phone}</td>
      </tr>` : ''}
      ${appointment.client_email ? `
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Email</td>
        <td style="padding:8px 0;font-size:13px;">${appointment.client_email}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #eee;">Servicio</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;border-top:1px solid #eee;">${serviceName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Fecha</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Hora</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;">${startTime} – ${endTime}</td>
      </tr>
      ${appointment.price ? `
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Precio</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;">${formatCurrency(appointment.price)}</td>
      </tr>` : ''}
      ${appointment.deposit ? `
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Depósito</td>
        <td style="padding:8px 0;font-size:13px;">${formatCurrency(appointment.deposit)}</td>
      </tr>` : ''}
      ${appointment.body_placement ? `
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Zona</td>
        <td style="padding:8px 0;font-size:13px;">${appointment.body_placement}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Artista</td>
        <td style="padding:8px 0;font-size:13px;">${artistName}</td>
      </tr>
    </table>
    ${appointment.notes ? `
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #eee;">
      <p style="color:#888;font-size:12px;margin:0 0 4px 0;">Notas</p>
      <p style="font-size:13px;margin:0;color:#444;">${appointment.notes}</p>
    </div>` : ''}
  </div>

  <p style="color:#999;font-size:11px;text-align:center;margin:0;">
    Este mensaje fue generado automáticamente por INKBuddy.
  </p>
</div>
</body>
</html>`

  return { subject, html }
}

// ---------------------------------------------------------------------------
// Client confirmation email
// ---------------------------------------------------------------------------

export function buildClientConfirmationEmail(
  appointment: Appointment & {
    artist?: { id: string; full_name: string | null } | null
    service?: { id: string; name: string; duration_minutes: number } | null
  },
  studioName: string,
  googleCalendarUrl: string
): { subject: string; html: string } {
  const clientName = appointment.client_name ?? 'Cliente'
  const dateStr = formatDate(appointment.starts_at)
  const startTime = formatTime(appointment.starts_at)
  const endTime = formatTime(appointment.ends_at)
  const artistName = appointment.artist?.full_name ?? 'Tu artista'
  const serviceName = appointment.service?.name ?? 'Sesión de tatuaje'

  const subject = `Tu cita en ${studioName} está confirmada ✓`

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:20px;background:#f5f5f5;">
<div style="${BASE_STYLES}padding:32px;border-radius:16px;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#f7931e);padding:12px 24px;border-radius:100px;">
      <span style="color:white;font-weight:700;font-size:18px;">INKBuddy</span>
    </div>
  </div>

  <h1 style="font-size:20px;font-weight:700;margin:0 0 4px 0;color:#1a1a2e;">
    ✅ Cita confirmada
  </h1>
  <p style="color:#666;font-size:14px;margin:0 0 24px 0;">
    Hola ${clientName}, tu cita en <strong>${studioName}</strong> ha sido agendada.
  </p>

  <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin-bottom:24px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;width:40%;">Estudio</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;">${studioName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Servicio</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;">${serviceName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Artista</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;">${artistName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Fecha</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Hora</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;">${startTime} – ${endTime}</td>
      </tr>
      ${appointment.price ? `
      <tr>
        <td style="padding:8px 0;color:#888;font-size:13px;">Precio</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;">${formatCurrency(appointment.price)}</td>
      </tr>` : ''}
    </table>
  </div>

  <div style="text-align:center;margin-bottom:24px;">
    <a href="${googleCalendarUrl}" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#f7931e);color:white;text-decoration:none;padding:14px 32px;border-radius:100px;font-weight:700;font-size:15px;">
      📅 Agregar a Google Calendar
    </a>
  </div>

  <p style="color:#999;font-size:11px;text-align:center;margin:0;">
    Este mensaje fue generado automáticamente por INKBuddy. Si tienes preguntas, contacta directamente a ${studioName}.
  </p>
</div>
</body>
</html>`

  return { subject, html }
}
