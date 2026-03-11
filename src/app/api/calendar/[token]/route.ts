import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// iCal helpers
// ---------------------------------------------------------------------------

function toICalDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  chunks.push(line.slice(0, 75))
  let pos = 75
  while (pos < line.length) {
    chunks.push(' ' + line.slice(pos, pos + 74))
    pos += 74
  }
  return chunks.join('\r\n')
}

function buildVEvent(appt: {
  id: string
  starts_at: string
  ends_at: string
  status: string
  client_name: string | null
  notes: string | null
  body_placement: string | null
  service_name: string | null
  artist_name: string | null
}): string {
  const statusMap: Record<string, string> = {
    confirmed: 'CONFIRMED',
    in_progress: 'CONFIRMED',
    completed: 'CONFIRMED',
    pending: 'TENTATIVE',
  }
  const icalStatus = statusMap[appt.status] ?? 'TENTATIVE'

  const client = appt.client_name ?? 'Cliente'
  const service = appt.service_name ?? 'Cita'
  const summary = `${service} — ${client}`

  const descParts: string[] = []
  if (appt.artist_name) descParts.push(`Artista: ${appt.artist_name}`)
  if (appt.body_placement) descParts.push(`Zona: ${appt.body_placement}`)
  if (appt.notes) descParts.push(`Notas: ${appt.notes}`)
  const description = descParts.join('\n')

  const now = toICalDate(new Date().toISOString())

  const lines = [
    'BEGIN:VEVENT',
    `UID:${appt.id}@inkbuddy.app`,
    `DTSTAMP:${now}`,
    `DTSTART:${toICalDate(appt.starts_at)}`,
    `DTEND:${toICalDate(appt.ends_at)}`,
    foldLine(`SUMMARY:${escapeText(summary)}`),
    `STATUS:${icalStatus}`,
  ]

  if (description) {
    lines.push(foldLine(`DESCRIPTION:${escapeText(description)}`))
  }

  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

interface CalendarFeedData {
  studio_name: string
  studio_timezone: string
  appointments: Array<{
    id: string
    starts_at: string
    ends_at: string
    status: string
    client_name: string | null
    notes: string | null
    body_placement: string | null
    service_name: string | null
    artist_name: string | null
  }>
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Basic token validation (UUID format)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!token || !uuidRegex.test(token)) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Use anon client — the RPC function uses SECURITY DEFINER
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.rpc('get_calendar_feed', {
    p_token: token,
  })

  if (error || !data) {
    return new NextResponse('Not found', { status: 404 })
  }

  const feed = data as CalendarFeedData

  // Build iCal string
  const vEvents = feed.appointments.map(buildVEvent).join('\r\n')

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//INKBuddy//Tattoo Studio//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldLine(`X-WR-CALNAME:INKBuddy — ${escapeText(feed.studio_name)}`),
    `X-WR-TIMEZONE:${feed.studio_timezone}`,
    foldLine(
      `X-WR-CALDESC:Citas del estudio ${escapeText(feed.studio_name)}`
    ),
    vEvents,
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  return new NextResponse(ical, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
