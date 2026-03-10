import { CalendarView } from '@/features/appointments/components'

export const metadata = {
  title: 'Agenda | INKBuddy',
  description: 'Gestion de citas del estudio de tatuaje',
}

export default function AppointmentsPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-ink-dark mb-6">Agenda</h1>
      <CalendarView />
    </div>
  )
}
