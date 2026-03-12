import { notFound } from 'next/navigation'
import { GlassCard } from '@/shared/components'
import { AppointmentForm } from '@/features/appointments/components'
import { getAppointmentById } from '@/features/appointments/services/appointment-service'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Editar Cita | INKBuddy',
}

export default async function EditAppointmentPage({ params }: Props) {
  const { id } = await params
  const { data: appointment, error } = await getAppointmentById(id)

  if (error || !appointment) notFound()

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-dark mb-6">Editar Cita</h1>
      <GlassCard padding="p-6">
        <AppointmentForm appointment={appointment} />
      </GlassCard>
    </div>
  )
}
