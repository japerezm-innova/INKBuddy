import type { Metadata } from 'next'
import { PublicPortfolioContent } from './public-portfolio-content'

export const metadata: Metadata = {
  title: 'Portafolio | INKBuddy',
  description: 'Explora nuestra galeria de trabajos de tatuaje.',
}

export default function PublicPortfolioPage() {
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
        className="gradient-blob-3 animate-blob absolute top-1/2 left-1/4 w-64 h-64 rounded-full pointer-events-none"
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold">
            <span className="text-gradient">INKBuddy</span>
          </h1>
          <p className="text-gray-600 mt-2">Nuestro Portafolio</p>
        </header>

        <PublicPortfolioContent />

        {/* Footer CTA */}
        <footer className="mt-12 text-center">
          <a
            href="/booking"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-sm font-semibold gradient-accent text-white shadow-warm hover:shadow-warm-lg hover:scale-[1.02] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50"
          >
            Reservar una cita
          </a>
          <p className="mt-4 text-xs text-gray-400">
            Todos los disenos son originales. Reserva tu sesion hoy.
          </p>
        </footer>
      </main>
    </div>
  )
}
