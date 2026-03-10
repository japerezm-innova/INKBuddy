'use client'

import Link from 'next/link'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="text-center">
        <div className="text-5xl mb-4">:(</div>
        <h2 className="text-xl font-bold text-ink-dark mb-2">
          Algo salio mal
        </h2>
        <p className="text-ink-dark/60 mb-6 max-w-sm">
          Ocurrio un error cargando esta pagina. Puedes intentar de nuevo o
          volver al inicio.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-ink-orange text-white rounded-2xl font-medium hover:bg-ink-orange/90 transition-colors"
          >
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-white/50 text-ink-dark rounded-2xl font-medium hover:bg-white/70 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
