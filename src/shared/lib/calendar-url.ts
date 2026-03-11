import type { Appointment } from '@/features/appointments/types/appointment'

function toGCalDateTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
}

export function buildGoogleCalendarUrl(appointment: Appointment): string {
  const clientName = appointment.client?.full_name ?? appointment.client_name ?? 'Cliente'
  const serviceName = appointment.service?.name ?? 'Tatuaje'
  const text = encodeURIComponent(`${serviceName} - ${clientName}`)
  const dates = `${toGCalDateTime(appointment.starts_at)}/${toGCalDateTime(appointment.ends_at)}`

  const detailParts = [
    appointment.body_placement ? `Zona: ${appointment.body_placement}` : '',
    appointment.notes ? `Notas: ${appointment.notes}` : '',
    `Artista: ${appointment.artist?.full_name ?? 'No asignado'}`,
  ].filter(Boolean)

  const details = encodeURIComponent(detailParts.join('\n'))

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`
}
