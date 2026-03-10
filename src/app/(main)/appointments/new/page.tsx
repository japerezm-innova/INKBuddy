import { GlassCard } from '@/shared/components'
import { AppointmentForm } from '@/features/appointments/components'

export const metadata = {
  title: 'Nueva Cita | INKBuddy',
  description: 'Crear una nueva cita en el estudio',
}

export default function NewAppointmentPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-dark mb-6">Nueva Cita</h1>
      <GlassCard padding="p-6">
        <AppointmentForm />
      </GlassCard>
    </div>
  )
}
