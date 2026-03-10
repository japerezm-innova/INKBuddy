import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-cream px-6">
      <div className="text-center">
        <div className="text-6xl font-bold text-ink-orange mb-2">404</div>
        <h2 className="text-xl font-bold text-ink-dark mb-2">
          Pagina no encontrada
        </h2>
        <p className="text-ink-dark/60 mb-6 max-w-sm">
          La pagina que buscas no existe o fue movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-ink-orange text-white rounded-2xl font-medium hover:bg-ink-orange/90 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
