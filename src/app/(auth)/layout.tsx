export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden gradient-warm">
      {/* Animated blobs */}
      <div className="gradient-blob-1 animate-blob absolute -top-20 -left-20 w-72 h-72 rounded-full" />
      <div className="gradient-blob-2 animate-blob absolute top-1/2 -right-24 w-96 h-96 rounded-full" style={{ animationDelay: '2s' }} />
      <div className="gradient-blob-3 animate-blob absolute -bottom-20 left-1/3 w-80 h-80 rounded-full" style={{ animationDelay: '4s' }} />

      {/* Brand mark */}
      <div className="absolute top-6 left-0 right-0 z-10 flex justify-center md:justify-start md:left-8">
        <img
          src="/logo.png"
          alt="InkBuddy Logo"
          className="h-16 w-auto object-contain hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="mx-4 w-full max-w-md rounded-3xl border border-white/25 bg-white/30 p-8 shadow-glass-lg backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  )
}
