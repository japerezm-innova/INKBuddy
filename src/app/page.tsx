import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen gradient-warm flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated blobs — same as auth layout for continuity */}
      <div className="gradient-blob-1 animate-blob absolute -top-20 -left-20 w-72 h-72 rounded-full" />
      <div className="gradient-blob-2 animate-blob absolute top-1/2 -right-24 w-96 h-96 rounded-full" style={{ animationDelay: '2s' }} />
      <div className="gradient-blob-3 animate-blob absolute -bottom-20 left-1/3 w-80 h-80 rounded-full" style={{ animationDelay: '4s' }} />

      <div className="relative z-10 text-center px-4 flex flex-col items-center">
        <div className="mb-2 drop-shadow-xl">
          <img
            src="/logo.png"
            alt="InkBuddy"
            className="h-32 md:h-48 w-auto object-contain hover:scale-105 transition-transform duration-500"
          />
        </div>
        <span className="mb-6 text-3xl font-bold text-ink-orange tracking-tight">
          INKBuddy
        </span>
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
