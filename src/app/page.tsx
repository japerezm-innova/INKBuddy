import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen gradient-warm flex flex-col items-center justify-center relative overflow-hidden">
      {/* Blobs */}
      <div className="gradient-blob-1 animate-blob absolute -top-20 -right-20 w-96 h-96 rounded-full" />
      <div className="gradient-blob-2 animate-blob-slow absolute bottom-0 -left-20 w-80 h-80 rounded-full" />

      <div className="relative z-10 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-4">
          <span className="text-gradient">INKBuddy</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Tu asistente inteligente para gestionar tu estudio de tatuaje
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 rounded-2xl gradient-accent text-white font-semibold shadow-warm hover:shadow-warm-lg transition-all duration-300"
          >
            Iniciar Sesion
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 rounded-2xl bg-white/30 backdrop-blur-md border border-white/25 text-gray-700 font-semibold hover:bg-white/40 transition-all duration-300"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  )
}
