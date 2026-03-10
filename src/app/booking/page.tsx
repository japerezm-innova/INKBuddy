import type { Metadata } from 'next'
import { BookingWizard } from '@/features/booking/components'

export const metadata: Metadata = {
  title: 'Reservar cita | INKBuddy',
  description: 'Agenda tu sesion de tatuaje de forma facil y rapida.',
}

export default function BookingPage() {
  return (
    <div className="min-h-screen gradient-warm relative overflow-hidden">
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="gradient-blob-1 animate-blob absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="gradient-blob-2 animate-blob-slow absolute bottom-0 -left-20 w-80 h-80 rounded-full pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="gradient-blob-3 animate-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
      />

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-gradient">INKBuddy</span>
          </h1>
          <p className="text-gray-600 mt-2 text-sm">
            Reserva tu sesion de tatuaje
          </p>
        </header>

        {/* Wizard */}
        <BookingWizard />

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Tu informacion es privada y no sera compartida con terceros.
          </p>
        </footer>
      </main>
    </div>
  )
}
