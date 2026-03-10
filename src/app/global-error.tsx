'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-[#FFF5EE]">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Algo salio mal
          </h1>
          <p className="text-gray-600 mb-6">
            Ocurrio un error inesperado. Por favor intenta de nuevo.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#FF6B35] text-white rounded-2xl font-medium hover:bg-[#e55a2a] transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  )
}
